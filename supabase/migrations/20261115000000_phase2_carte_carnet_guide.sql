-- =====================================================================
-- VICE ATLAS — Migration phase 2 : carte, carnet de progression, guide
-- ---------------------------------------------------------------------
-- Contenu public : lecture du contenu « published » pour tout le monde,
-- écriture réservée aux modérateurs et administrateurs.
-- Données joueur : privées, chaque joueur ne voit et ne modifie que les siennes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.progress_category as enum ('mission', 'activite', 'decouverte');

-- ---------------------------------------------------------------------
-- Rôles (utilisateur, modérateur, administrateur)
-- ---------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.app_role not null default 'user',
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null
);
comment on table public.user_roles is 'Rôle applicatif de chaque compte. Absence de ligne = utilisateur.';

alter table public.user_roles enable row level security;

-- Fonctions d'autorisation (schéma privé, non exposé par l'API)
create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.role from public.user_roles r where r.user_id = auth.uid()),
    'user'::public.app_role
  );
$$;

create or replace function private.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and private.current_app_role() in ('moderator'::public.app_role, 'admin'::public.app_role);
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and private.current_app_role() = 'admin'::public.app_role;
$$;

grant usage on schema private to anon, authenticated;
revoke all on function private.current_app_role(), private.is_editor(), private.is_admin() from public;
grant execute on function private.current_app_role(), private.is_editor(), private.is_admin() to anon, authenticated;

create policy "user_roles: lire son rôle ou tout lire si admin"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "user_roles: gestion réservée aux admins"
  on public.user_roles for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- Carte
-- ---------------------------------------------------------------------
create table public.map_categories (
  id         text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label      text not null check (char_length(label) between 2 and 60),
  color      text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0
);

create table public.places (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name        text not null check (char_length(name) between 2 and 80),
  category_id text not null references public.map_categories (id) on update cascade on delete restrict,
  x           numeric(7, 2) not null check (x between 0 and 2000),
  y           numeric(7, 2) not null check (y between 0 and 1500),
  district    text not null check (char_length(district) between 2 and 60),
  description text not null check (char_length(description) between 10 and 600),
  tags        text[] not null default '{}' check (cardinality(tags) <= 8),
  status      public.content_status not null default 'draft',
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on column public.places.x is 'Unités de carte, origine en bas à gauche (0 à 2000).';
comment on column public.places.y is 'Unités de carte, origine en bas à gauche (0 à 1500).';
comment on column public.places.is_demo is 'Donnée de démonstration : jamais présentée comme officielle.';

create index places_category_idx on public.places (category_id);
create index places_published_idx on public.places (status) where status = 'published';
create trigger places_updated_at before update on public.places
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Guide
-- ---------------------------------------------------------------------
create table public.guide_categories (
  id         text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label      text not null check (char_length(label) between 2 and 60),
  sort_order integer not null default 0
);

create table public.guides (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title        text not null check (char_length(title) between 5 and 120),
  category_id  text not null references public.guide_categories (id) on update cascade on delete restrict,
  summary      text not null check (char_length(summary) between 20 and 280),
  intro        text not null check (char_length(intro) between 20 and 2000),
  steps        jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 40),
  sources      jsonb not null default '[]' check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 20),
  cover        jsonb check (cover is null or jsonb_typeof(cover) = 'object'),
  status       public.content_status not null default 'draft',
  is_demo      boolean not null default false,
  published_at timestamptz,
  created_by   uuid references auth.users (id) on delete set null,
  updated_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint guides_published_has_date check (status <> 'published' or published_at is not null)
);
create index guides_category_idx on public.guides (category_id);
create index guides_published_idx on public.guides (updated_at desc) where status = 'published';
create trigger guides_updated_at before update on public.guides
  for each row execute function private.set_updated_at();

create table public.guide_places (
  guide_id uuid not null references public.guides (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  position smallint not null default 0,
  primary key (guide_id, place_id)
);
create index guide_places_place_idx on public.guide_places (place_id);

-- ---------------------------------------------------------------------
-- Carnet : catalogue (public) + données joueur (privées)
-- ---------------------------------------------------------------------
create table public.progress_items (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  category   public.progress_category not null,
  title      text not null check (char_length(title) between 3 and 120),
  place_id   uuid references public.places (id) on delete set null,
  sort_order integer not null default 0,
  status     public.content_status not null default 'draft',
  is_demo    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index progress_items_category_idx on public.progress_items (category, sort_order);
create trigger progress_items_updated_at before update on public.progress_items
  for each row execute function private.set_updated_at();

create table public.user_place_marks (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id    uuid not null references public.places (id) on delete cascade,
  is_favorite boolean not null default false,
  visited_at  timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, place_id)
);
create trigger user_place_marks_updated_at before update on public.user_place_marks
  for each row execute function private.set_updated_at();

create table public.user_progress (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id      uuid not null references public.progress_items (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table public.user_objectives (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 3 and 120),
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_objectives_user_idx on public.user_objectives (user_id, created_at);
create trigger user_objectives_updated_at before update on public.user_objectives
  for each row execute function private.set_updated_at();

-- Anti-spam : 100 objectifs maximum par joueur
create or replace function private.limit_user_objectives()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('user_objectives:' || new.user_id::text));
  if (select count(*) from public.user_objectives o where o.user_id = new.user_id) >= 100 then
    raise exception 'Limite de 100 objectifs atteinte' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger user_objectives_limit before insert on public.user_objectives
  for each row execute function private.limit_user_objectives();

create table public.user_guide_favorites (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  guide_id   uuid not null references public.guides (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

create table public.user_guide_steps (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  guide_id     uuid not null references public.guides (id) on delete cascade,
  step_index   smallint not null check (step_index between 0 and 39),
  completed_at timestamptz not null default now(),
  primary key (user_id, guide_id, step_index)
);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.map_categories      enable row level security;
alter table public.places              enable row level security;
alter table public.guide_categories    enable row level security;
alter table public.guides              enable row level security;
alter table public.guide_places        enable row level security;
alter table public.progress_items      enable row level security;
alter table public.user_place_marks    enable row level security;
alter table public.user_progress       enable row level security;
alter table public.user_objectives     enable row level security;
alter table public.user_guide_favorites enable row level security;
alter table public.user_guide_steps    enable row level security;

-- Référentiels : lecture publique, écriture admin
create policy "map_categories: lecture publique" on public.map_categories for select to anon, authenticated using (true);
create policy "map_categories: écriture admin" on public.map_categories for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "guide_categories: lecture publique" on public.guide_categories for select to anon, authenticated using (true);
create policy "guide_categories: écriture admin" on public.guide_categories for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Contenu : publié pour tous, tout pour l'équipe ; suppression réservée aux admins
create policy "places: lecture du publié" on public.places for select to anon, authenticated
  using (status = 'published' or (select private.is_editor()));
create policy "places: création équipe" on public.places for insert to authenticated
  with check ((select private.is_editor()));
create policy "places: modification équipe" on public.places for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "places: suppression admin" on public.places for delete to authenticated
  using ((select private.is_admin()));

create policy "guides: lecture du publié" on public.guides for select to anon, authenticated
  using (status = 'published' or (select private.is_editor()));
create policy "guides: création équipe" on public.guides for insert to authenticated
  with check ((select private.is_editor()));
create policy "guides: modification équipe" on public.guides for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "guides: suppression admin" on public.guides for delete to authenticated
  using ((select private.is_admin()));

create policy "guide_places: lecture si guide visible" on public.guide_places for select to anon, authenticated
  using (exists (select 1 from public.guides g where g.id = guide_id));
create policy "guide_places: écriture équipe" on public.guide_places for all to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));

create policy "progress_items: lecture du publié" on public.progress_items for select to anon, authenticated
  using (status = 'published' or (select private.is_editor()));
create policy "progress_items: écriture équipe" on public.progress_items for all to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));

-- Données joueur : strictement privées
create policy "user_place_marks: propriétaire" on public.user_place_marks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_progress: propriétaire" on public.user_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_objectives: propriétaire" on public.user_objectives for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_guide_favorites: propriétaire" on public.user_guide_favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_guide_steps: propriétaire" on public.user_guide_steps for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Enregistrement atomique d'un guide (création ou mise à jour + lieux liés)
-- Appelée par l'administration via supabase.rpc('save_guide', { payload }).
-- ---------------------------------------------------------------------
create or replace function public.save_guide(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id     uuid := nullif(payload ->> 'id', '')::uuid;
  v_status public.content_status := coalesce(payload ->> 'status', 'draft')::public.content_status;
  v_slugs  text[] := coalesce(array(select jsonb_array_elements_text(coalesce(payload -> 'place_slugs', '[]'::jsonb))), '{}');
  v_found  integer;
begin
  if not private.is_editor() then
    raise exception 'Accès refusé : réservé aux modérateurs et administrateurs' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.guides (slug, title, category_id, summary, intro, steps, sources, cover, status,
                               published_at, created_by, updated_by)
    values (payload ->> 'slug', payload ->> 'title', payload ->> 'category_id', payload ->> 'summary',
            payload ->> 'intro', payload -> 'steps', coalesce(payload -> 'sources', '[]'::jsonb),
            nullif(payload -> 'cover', 'null'::jsonb), v_status,
            case when v_status = 'published' then now() end, auth.uid(), auth.uid())
    returning id into v_id;
  else
    update public.guides g
       set slug = payload ->> 'slug',
           title = payload ->> 'title',
           category_id = payload ->> 'category_id',
           summary = payload ->> 'summary',
           intro = payload ->> 'intro',
           steps = payload -> 'steps',
           sources = coalesce(payload -> 'sources', '[]'::jsonb),
           cover = nullif(payload -> 'cover', 'null'::jsonb),
           status = v_status,
           published_at = case when v_status = 'published' then coalesce(g.published_at, now()) else g.published_at end,
           updated_by = auth.uid()
     where g.id = v_id;
    get diagnostics v_found = row_count;
    if v_found = 0 then
      raise exception 'Guide introuvable' using errcode = 'P0002';
    end if;
  end if;

  -- Lieux liés : remplacés en bloc, dans l'ordre fourni
  if (select count(*) from public.places p where p.slug = any (v_slugs)) <> cardinality(v_slugs) then
    raise exception 'Un ou plusieurs lieux liés sont introuvables' using errcode = '23503';
  end if;
  delete from public.guide_places gp where gp.guide_id = v_id;
  insert into public.guide_places (guide_id, place_id, position)
  select v_id, p.id, s.ord - 1
    from unnest(v_slugs) with ordinality as s (slug, ord)
    join public.places p on p.slug = s.slug;

  return v_id;
end;
$$;

revoke all on function public.save_guide(jsonb) from public, anon;
grant execute on function public.save_guide(jsonb) to authenticated;

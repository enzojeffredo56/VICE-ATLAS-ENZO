-- =====================================================================
-- VICE ATLAS — Migration phase 4 : comptes et profils
-- ---------------------------------------------------------------------
-- * Un profil par compte, créé automatiquement à l'inscription.
-- * Pseudo unique (insensible à la casse), bio facultative, avatar.
-- * Profil PRIVÉ par défaut : le joueur choisit ce qu'il rend public.
-- * Code de parrainage personnel ; le parrain est fixé à l'inscription
--   et ne peut plus être modifié ensuite (droits par colonne).
-- * Synchronisation des données du carnet entre appareils (sync_user_data).
-- =====================================================================

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       extensions.citext not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_url     text check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500)),
  bio            text check (bio is null or char_length(bio) <= 280),
  is_public      boolean not null default false,
  show_progress  boolean not null default false,
  referral_code  text not null unique check (referral_code ~ '^[A-Z0-9]{8}$'),
  referred_by    uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint profiles_no_self_referral check (referred_by is null or referred_by <> id)
);
comment on column public.profiles.is_public is 'Profil visible des autres joueurs (privé par défaut).';
comment on column public.profiles.show_progress is 'Montrer la progression du carnet sur le profil public.';
comment on column public.profiles.referred_by is 'Parrain, fixé à l''inscription uniquement.';

create index profiles_referred_by_idx on public.profiles (referred_by);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: lecture (publics, le sien, équipe)"
  on public.profiles for select to anon, authenticated
  using (is_public or id = (select auth.uid()) or (select private.is_editor()));
create policy "profiles: modification de son propre profil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Droits par colonne : un joueur ne peut modifier QUE ces champs.
-- (création par le déclencheur d'inscription, parrain et code non modifiables)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (username, avatar_url, bio, is_public, show_progress) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Création du profil à l'inscription
-- ---------------------------------------------------------------------
create or replace function private.new_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_code text;
begin
  loop
    -- Alphabet sans caractères ambigus (pas de 0/O ni 1/I)
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
      into v_code
      from generate_series(1, 8);
    exit when not exists (select 1 from public.profiles p where p.referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wanted   text := new.raw_user_meta_data ->> 'username';
  v_username text;
  v_referrer uuid;
begin
  -- Pseudo demandé s'il est valide et libre, sinon pseudo provisoire modifiable plus tard
  if v_wanted ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles p where lower(p.username::text) = lower(v_wanted)) then
    v_username := v_wanted;
  else
    loop
      v_username := 'joueur_' || lower(substr(private.new_referral_code(), 1, 8));
      exit when not exists (select 1 from public.profiles p where lower(p.username::text) = v_username);
    end loop;
  end if;

  -- Parrain : uniquement via un code valide, jamais soi-même
  select p.id into v_referrer
    from public.profiles p
   where p.referral_code = upper(nullif(btrim(new.raw_user_meta_data ->> 'referral_code'), ''));

  insert into public.profiles (id, username, referral_code, referred_by)
  values (new.id, v_username, private.new_referral_code(), nullif(v_referrer, new.id));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Vérification du pseudo pendant l'inscription (sans exposer la table)
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles p where lower(p.username::text) = lower(p_username));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Synchronisation des données joueur (carnet, favoris, guides)
-- Format identique au stockage local du navigateur.
--   mode 'merge'   : première connexion sur un appareil → union des deux
--   mode 'replace' : l'appareil envoie son état complet → il remplace
--   mode 'pull'    : lecture seule
-- Renvoie l'état final, au même format.
-- ---------------------------------------------------------------------
create or replace function public.sync_user_data(payload jsonb, mode text default 'pull')
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if mode not in ('merge', 'replace', 'pull') then
    raise exception 'Mode de synchronisation inconnu' using errcode = '22023';
  end if;
  if mode <> 'pull' and jsonb_typeof(payload) <> 'object' then
    raise exception 'Données invalides' using errcode = '22023';
  end if;

  if mode = 'replace' then
    delete from public.user_place_marks where user_id = v_uid;
    delete from public.user_progress where user_id = v_uid;
    delete from public.user_objectives where user_id = v_uid;
    delete from public.user_guide_favorites where user_id = v_uid;
    delete from public.user_guide_steps where user_id = v_uid;
  end if;

  if mode in ('merge', 'replace') then
    -- Lieux : favori = OU logique ; visite = date la plus ancienne
    insert into public.user_place_marks (user_id, place_id, is_favorite, visited_at)
    select v_uid, p.id, coalesce((e.value ->> 'favorite')::boolean, false), (e.value ->> 'visitedAt')::timestamptz
      from jsonb_each(coalesce(payload -> 'places', '{}')) e
      join public.places p on p.slug = e.key
     where coalesce((e.value ->> 'favorite')::boolean, false) or e.value ? 'visitedAt'
    on conflict (user_id, place_id) do update
      set is_favorite = public.user_place_marks.is_favorite or excluded.is_favorite,
          visited_at = least(public.user_place_marks.visited_at, excluded.visited_at);

    insert into public.user_progress (user_id, item_id, completed_at)
    select v_uid, i.id, (e.value #>> '{}')::timestamptz
      from jsonb_each(coalesce(payload -> 'progress', '{}')) e
      join public.progress_items i on i.slug = e.key
    on conflict (user_id, item_id) do update set completed_at = least(public.user_progress.completed_at, excluded.completed_at);

    insert into public.user_objectives (id, user_id, title, done, created_at)
    select case when o ->> 'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                then (o ->> 'id')::uuid else gen_random_uuid() end,
           v_uid, btrim(o ->> 'title'), coalesce((o ->> 'done')::boolean, false),
           coalesce((o ->> 'createdAt')::timestamptz, now())
      from jsonb_array_elements(coalesce(payload -> 'objectives', '[]')) o
     where char_length(btrim(o ->> 'title')) between 3 and 120
    on conflict (id) do update set title = excluded.title, done = excluded.done
     where public.user_objectives.user_id = v_uid;

    insert into public.user_guide_favorites (user_id, guide_id)
    select v_uid, g.id
      from jsonb_array_elements_text(coalesce(payload -> 'guideFavorites', '[]')) s
      join public.guides g on g.slug = s
    on conflict do nothing;

    insert into public.user_guide_steps (user_id, guide_id, step_index)
    select v_uid, g.id, (st #>> '{}')::smallint
      from jsonb_each(coalesce(payload -> 'guideSteps', '{}')) e
      join public.guides g on g.slug = e.key
      cross join lateral jsonb_array_elements(e.value) st
     where (st #>> '{}')::int between 0 and 39
    on conflict do nothing;
  end if;

  select jsonb_build_object(
    'version', 1,
    'places', coalesce((select jsonb_object_agg(p.slug, jsonb_strip_nulls(jsonb_build_object(
                  'favorite', case when m.is_favorite then true end,
                  'visitedAt', to_char(m.visited_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))))
                from public.user_place_marks m join public.places p on p.id = m.place_id
               where m.user_id = v_uid), '{}'),
    'progress', coalesce((select jsonb_object_agg(i.slug, to_char(u.completed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
                from public.user_progress u join public.progress_items i on i.id = u.item_id
               where u.user_id = v_uid), '{}'),
    'objectives', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'title', o.title, 'done', o.done,
                  'createdAt', to_char(o.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) order by o.created_at)
                from public.user_objectives o where o.user_id = v_uid), '[]'),
    'guideFavorites', coalesce((select jsonb_agg(g.slug order by g.slug)
                from public.user_guide_favorites f join public.guides g on g.id = f.guide_id
               where f.user_id = v_uid), '[]'),
    'guideSteps', coalesce((select jsonb_object_agg(x.slug, x.steps) from (
                  select g.slug, jsonb_agg(s.step_index order by s.step_index) as steps
                    from public.user_guide_steps s join public.guides g on g.id = s.guide_id
                   where s.user_id = v_uid group by g.slug) x), '{}'),
    'updatedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.sync_user_data(jsonb, text) from public, anon;
grant execute on function public.sync_user_data(jsonb, text) to authenticated;

-- ---------------------------------------------------------------------
-- Avatars (Supabase Storage) — appliqué seulement si le schéma storage existe
-- Dossier personnel : avatars/<id du compte>/…, 1 Mo maximum, images uniquement.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
    on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

    execute $p$create policy "avatars: lecture publique" on storage.objects for select
      using (bucket_id = 'avatars')$p$;
    execute $p$create policy "avatars: envoi dans son dossier" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "avatars: remplacement dans son dossier" on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "avatars: suppression dans son dossier" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
end;
$$;

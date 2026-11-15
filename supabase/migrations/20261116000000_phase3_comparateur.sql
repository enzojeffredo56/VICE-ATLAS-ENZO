-- =====================================================================
-- VICE ATLAS — Migration phase 3 : comparateur Miami (plans faits maison)
-- Lieux réels placés sur le plan schématique + rapprochements jeu ↔ Miami,
-- chacun avec ses sources et son statut de vérification.
-- =====================================================================

create type public.verification_status as enum ('demo', 'a_verifier', 'probable', 'verifie');

create table public.miami_spots (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name         text not null check (char_length(name) between 2 and 120),
  neighborhood text not null check (char_length(neighborhood) between 2 and 80),
  x            numeric(7, 2) not null check (x between 0 and 2000),
  y            numeric(7, 2) not null check (y between 0 and 1500),
  description  text not null check (char_length(description) between 10 and 600),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.miami_spots is 'Lieux réels placés sur le plan schématique de Miami (dessiné par VICE ATLAS).';
create trigger miami_spots_updated_at before update on public.miami_spots
  for each row execute function private.set_updated_at();

create table public.place_correspondences (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid not null references public.places (id) on delete cascade,
  miami_spot_id uuid not null references public.miami_spots (id) on delete cascade,
  summary       text not null check (char_length(summary) between 10 and 600),
  status        public.verification_status not null default 'a_verifier',
  sources       jsonb not null default '[]' check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 10),
  publication   public.content_status not null default 'draft',
  is_demo       boolean not null default false,
  verified_by   uuid references auth.users (id) on delete set null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (place_id, miami_spot_id),
  -- « Vérifié » exige une date de vérification et au moins une source
  constraint correspondences_verified_needs_proof check (
    status <> 'verifie' or (verified_at is not null and jsonb_array_length(sources) > 0)
  )
);
create index place_correspondences_place_idx on public.place_correspondences (place_id);
create index place_correspondences_spot_idx on public.place_correspondences (miami_spot_id);
create trigger place_correspondences_updated_at before update on public.place_correspondences
  for each row execute function private.set_updated_at();

alter table public.miami_spots enable row level security;
alter table public.place_correspondences enable row level security;

create policy "miami_spots: lecture publique" on public.miami_spots for select to anon, authenticated using (true);
create policy "miami_spots: écriture équipe" on public.miami_spots for all to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));

create policy "correspondences: lecture du publié" on public.place_correspondences for select to anon, authenticated
  using (publication = 'published' or (select private.is_editor()));
create policy "correspondences: création équipe" on public.place_correspondences for insert to authenticated
  with check ((select private.is_editor()));
create policy "correspondences: modification équipe" on public.place_correspondences for update to authenticated
  using ((select private.is_editor())) with check ((select private.is_editor()));
create policy "correspondences: suppression admin" on public.place_correspondences for delete to authenticated
  using ((select private.is_admin()));

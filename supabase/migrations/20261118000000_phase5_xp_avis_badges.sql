-- =====================================================================
-- VICE ATLAS — Migration phase 5 : XP, niveaux, badges, avis, notifications
-- ---------------------------------------------------------------------
-- Règles clés :
--  * Les XP ne sont JAMAIS écrits par le navigateur : uniquement par des
--    fonctions serveur, inscrits dans un registre (xp_events).
--  * Une même récompense ne peut être donnée deux fois (index unique).
--  * Une annulation est un mouvement négatif justifié, jamais une suppression.
--  * Avis : +20 XP après approbation, QUELLE QUE SOIT LA NOTE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Limitation des requêtes (anti-spam) — réutilisée par toutes les phases
-- ---------------------------------------------------------------------
create table private.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);

create or replace function private.check_rate_limit(p_key text, p_max integer, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window)) * extract(epoch from p_window));
  v_hits integer;
begin
  insert into private.rate_limits (key, window_start, hits) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = private.rate_limits.hits + 1
  returning hits into v_hits;
  if v_hits > p_max then
    raise exception 'Trop de tentatives, réessaie un peu plus tard' using errcode = 'P0429';
  end if;
  -- Ménage occasionnel des fenêtres expirées
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------
create table public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind ~ '^[a-z_]{2,40}$'),
  title      text not null check (char_length(title) between 2 and 120),
  body       text check (body is null or char_length(body) <= 500),
  link       text check (link is null or link ~ '^/[A-Za-z0-9/_?=&#%.-]*$'),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notifications: lire les siennes" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications: marquer les siennes comme lues" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;
grant delete on public.notifications to authenticated;
create policy "notifications: supprimer les siennes" on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link);
$$;

-- ---------------------------------------------------------------------
-- Registre des XP
-- ---------------------------------------------------------------------
create type public.xp_reason as enum (
  'profile_completed', 'review_approved', 'discovery_approved', 'stunt_participation',
  'stunt_first', 'stunt_second', 'stunt_third', 'weekly_challenge', 'admin_adjustment', 'reversal'
);

create table public.xp_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  amount      integer not null check (amount <> 0 and amount between -10000 and 10000),
  reason      public.xp_reason not null,
  source_key  text not null check (char_length(source_key) between 1 and 200),
  note        text check (note is null or char_length(note) <= 500),
  reverses_id bigint unique references public.xp_events (id),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint xp_reversal_shape check ((reason = 'reversal') = (reverses_id is not null)),
  constraint xp_manual_needs_note check (reason not in ('reversal', 'admin_adjustment') or char_length(note) >= 10)
);
comment on table public.xp_events is 'Registre des XP : une ligne par mouvement, jamais modifiée ni supprimée.';
-- Anti-doublon : une seule récompense par (joueur, motif, source)
create unique index xp_events_once on public.xp_events (user_id, reason, source_key)
  where reason not in ('reversal', 'admin_adjustment');
create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

alter table public.xp_events enable row level security;
create policy "xp_events: voir les siens ou tout voir (équipe)" on public.xp_events for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_editor()));
revoke insert, update, delete on public.xp_events from anon, authenticated;

-- Empêche toute modification du registre (la suppression n'est possible qu'en cascade,
-- quand un compte est supprimé à la demande du joueur ; aucun client n'a le droit DELETE)
create or replace function private.xp_events_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'Le registre des XP ne se modifie pas : passe par une annulation justifiée' using errcode = '42501';
end $$;
create trigger xp_events_no_update before update on public.xp_events
  for each row execute function private.xp_events_immutable();

-- Seuils de niveaux (cahier des charges)
create or replace function public.level_for_xp(p_xp integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select count(*)::integer from unnest(array[0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500]) t where t <= greatest(p_xp, 0);
$$;

create or replace function private.user_xp(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::integer from public.xp_events where user_id = p_user;
$$;

-- Attribution idempotente. Renvoie l'id du mouvement, ou null si déjà attribué.
create or replace function private.grant_xp(p_user uuid, p_amount integer, p_reason public.xp_reason, p_source text, p_note text default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  insert into public.xp_events (user_id, amount, reason, source_key, note, created_by)
  values (p_user, p_amount, p_reason, p_source, p_note, auth.uid())
  on conflict (user_id, reason, source_key) where reason not in ('reversal', 'admin_adjustment') do nothing
  returning id into v_id;
  if v_id is not null then
    perform private.notify(p_user, 'xp', '+' || p_amount || ' XP', p_note, '/profil#progression');
  end if;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------
create table public.badges (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  description text not null,
  sort_order  integer not null default 0
);
insert into public.badges (id, name, description, sort_order) values
  ('premier-avis', 'Premier avis', 'A donné son avis sur VICE ATLAS.', 1),
  ('premier-stunt', 'Premier Stunt', 'Première participation validée à STUNT ARENA.', 2),
  ('champion-du-spot', 'Champion du spot', 'A remporté un concours STUNT ARENA.', 3),
  ('legende-du-stunt', 'Légende du Stunt', 'A remporté trois concours STUNT ARENA.', 4),
  ('explorateur', 'Explorateur', 'A visité 10 lieux de la carte.', 5),
  ('grand-explorateur', 'Grand explorateur', 'A visité tous les lieux de la carte (au moins 15).', 6),
  ('contributeur', 'Contributeur', 'Première découverte approuvée par la communauté.', 7),
  ('expert-communautaire', 'Expert communautaire', 'Dix découvertes approuvées.', 8)
on conflict (id) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

create table public.user_badges (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge_id   text not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  source_key text,
  primary key (user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
create policy "badges: lecture publique" on public.badges for select to anon, authenticated using (true);
create policy "user_badges: les siens, ceux des profils publics, ou l'équipe" on public.user_badges for select to anon, authenticated
  using (user_id = (select auth.uid()) or (select private.is_editor())
         or exists (select 1 from public.profiles p where p.id = user_id and p.is_public));
revoke insert, update, delete on public.badges, public.user_badges from anon, authenticated;

create or replace function private.award_badge(p_user uuid, p_badge text, p_source text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new boolean;
begin
  insert into public.user_badges (user_id, badge_id, source_key) values (p_user, p_badge, p_source)
  on conflict do nothing;
  get diagnostics v_new = row_count;
  if v_new then
    perform private.notify(p_user, 'badge', 'Nouveau badge : ' || (select b.name from public.badges b where b.id = p_badge),
                           null, '/profil#badges');
  end if;
  return v_new;
end;
$$;

-- Badges d'exploration : déclenchés quand un joueur marque des lieux visités
create or replace function private.check_exploration_badges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visited integer;
  v_total integer;
begin
  if new.visited_at is null then
    return new;
  end if;
  select count(*) into v_visited from public.user_place_marks m
    join public.places p on p.id = m.place_id and p.status = 'published'
   where m.user_id = new.user_id and m.visited_at is not null;
  select count(*) into v_total from public.places where status = 'published';
  if v_visited >= 10 then
    perform private.award_badge(new.user_id, 'explorateur', 'carte');
  end if;
  if v_total >= 15 and v_visited >= v_total then
    perform private.award_badge(new.user_id, 'grand-explorateur', 'carte');
  end if;
  return new;
end;
$$;
create trigger user_place_marks_badges after insert or update of visited_at on public.user_place_marks
  for each row execute function private.check_exploration_badges();

-- ---------------------------------------------------------------------
-- Profil complété : +30 XP une seule fois
-- ---------------------------------------------------------------------
create or replace function public.claim_profile_completion()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  p public.profiles;
  v_event bigint;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  select * into p from public.profiles where id = v_uid;
  if p.username::text like 'joueur\_%' or p.avatar_url is null or coalesce(btrim(p.bio), '') = '' then
    return jsonb_build_object('complete', false, 'granted', false);
  end if;
  v_event := private.grant_xp(v_uid, 30, 'profile_completed', 'profil', 'Profil complété');
  return jsonb_build_object('complete', true, 'granted', v_event is not null);
end;
$$;
revoke all on function public.claim_profile_completion() from public, anon;
grant execute on function public.claim_profile_completion() to authenticated;

-- ---------------------------------------------------------------------
-- Avis sur VICE ATLAS (et non sur les lieux du jeu)
-- ---------------------------------------------------------------------
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique default auth.uid() references public.profiles (id) on delete cascade,
  rating          smallint not null check (rating between 1 and 5),
  comment         text not null check (char_length(btrim(comment)) between 30 and 1000),
  status          public.moderation_status not null default 'pending',
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  moderated_by    uuid references auth.users (id) on delete set null,
  moderated_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.reviews is 'Un seul avis par joueur, sur la plateforme VICE ATLAS.';
create index reviews_status_idx on public.reviews (status, updated_at desc);

alter table public.reviews enable row level security;
create policy "reviews: approuvés pour tous, le sien, tout pour l'équipe" on public.reviews for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select private.is_editor()));
create policy "reviews: déposer le sien" on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "reviews: modifier le sien" on public.reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.reviews from anon, authenticated;
grant insert (rating, comment) on public.reviews to authenticated;
grant update (rating, comment) on public.reviews to authenticated;

-- Toute création ou modification par le joueur repasse en modération + anti-spam
create or replace function private.reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not private.is_editor() then
    perform private.check_rate_limit('review:' || auth.uid(), 5, interval '1 hour');
    new.status := 'pending';
    new.moderation_note := null;
    new.moderated_by := null;
    new.moderated_at := null;
  end if;
  new.comment := btrim(new.comment);
  new.updated_at := now();
  return new;
end;
$$;
create trigger reviews_before_write before insert or update on public.reviews
  for each row execute function private.reviews_before_write();

-- Modération : ne JAMAIS rejeter un avis parce que la note est basse.
create or replace function public.moderate_review(p_review uuid, p_decision public.moderation_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reviews;
begin
  if not private.is_editor() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_decision = 'pending' then
    raise exception 'Décision invalide' using errcode = '22023';
  end if;
  if p_decision = 'rejected' and char_length(coalesce(btrim(p_note), '')) < 10 then
    raise exception 'Un refus doit être motivé (10 caractères minimum)' using errcode = '22023';
  end if;
  update public.reviews
     set status = p_decision, moderation_note = nullif(btrim(p_note), ''), moderated_by = auth.uid(), moderated_at = now()
   where id = p_review
  returning * into r;
  if r.id is null then
    raise exception 'Avis introuvable' using errcode = 'P0002';
  end if;
  if p_decision = 'approved' then
    -- Même récompense quelle que soit la note ; une seule fois par joueur
    perform private.grant_xp(r.user_id, 20, 'review_approved', 'avis', 'Avis VICE ATLAS approuvé');
    perform private.award_badge(r.user_id, 'premier-avis', 'avis');
  else
    perform private.notify(r.user_id, 'review_rejected', 'Ton avis n''a pas été publié', p_note, '/avis');
  end if;
end;
$$;
revoke all on function public.moderate_review(uuid, public.moderation_status, text) from public, anon;
grant execute on function public.moderate_review(uuid, public.moderation_status, text) to authenticated;

-- Statistiques publiques des avis approuvés
create or replace function public.review_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'count', count(*),
    'average', coalesce(round(avg(rating)::numeric, 2), 0),
    'distribution', jsonb_build_object(
      '1', count(*) filter (where rating = 1), '2', count(*) filter (where rating = 2),
      '3', count(*) filter (where rating = 3), '4', count(*) filter (where rating = 4),
      '5', count(*) filter (where rating = 5)))
  from public.reviews where status = 'approved';
$$;
grant execute on function public.review_stats() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Corrections d'XP par l'administration (toujours justifiées et tracées)
-- ---------------------------------------------------------------------
create or replace function public.admin_reverse_xp(p_event bigint, p_justification text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.xp_events;
  v_id bigint;
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  select * into e from public.xp_events where id = p_event;
  if e.id is null then
    raise exception 'Mouvement introuvable' using errcode = 'P0002';
  end if;
  if e.reason = 'reversal' then
    raise exception 'Une annulation ne s''annule pas' using errcode = '22023';
  end if;
  insert into public.xp_events (user_id, amount, reason, source_key, note, reverses_id, created_by)
  values (e.user_id, -e.amount, 'reversal', 'annulation:' || e.id, p_justification, e.id, auth.uid())
  returning id into v_id;
  perform private.notify(e.user_id, 'xp', (-e.amount) || ' XP (correction)', p_justification, '/profil#progression');
  return v_id;
end;
$$;

create or replace function public.admin_adjust_xp(p_user uuid, p_amount integer, p_justification text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  insert into public.xp_events (user_id, amount, reason, source_key, note, created_by)
  values (p_user, p_amount, 'admin_adjustment', 'ajustement:' || gen_random_uuid(), p_justification, auth.uid())
  returning id into v_id;
  perform private.notify(p_user, 'xp', p_amount || ' XP (ajustement)', p_justification, '/profil#progression');
  return v_id;
end;
$$;
revoke all on function public.admin_reverse_xp(bigint, text), public.admin_adjust_xp(uuid, integer, text) from public, anon;
grant execute on function public.admin_reverse_xp(bigint, text), public.admin_adjust_xp(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------
-- Progression lisible (profil privé ou public)
-- ---------------------------------------------------------------------
create or replace function public.player_progression(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  v_xp integer;
  v_self boolean := p_user = auth.uid();
begin
  select * into p from public.profiles where id = p_user;
  if p.id is null or not (v_self or p.is_public or private.is_editor()) then
    return null;
  end if;
  v_xp := private.user_xp(p_user);
  return jsonb_build_object(
    'xp', v_xp,
    'level', public.level_for_xp(v_xp),
    'badges', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'awardedAt', ub.awarded_at) order by b.sort_order)
                          from public.user_badges ub join public.badges b on b.id = ub.badge_id where ub.user_id = p_user), '[]'),
    'progress', case when v_self or p.show_progress then (
       select jsonb_build_object(
         'visited', (select count(*) from public.user_place_marks m where m.user_id = p_user and m.visited_at is not null),
         'places', (select count(*) from public.places where status = 'published'),
         'done', (select count(*) from public.user_progress u where u.user_id = p_user),
         'items', (select count(*) from public.progress_items where status = 'published'))
    ) end
  );
end;
$$;
grant execute on function public.player_progression(uuid) to anon, authenticated;

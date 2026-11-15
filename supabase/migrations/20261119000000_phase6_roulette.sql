-- =====================================================================
-- VICE ATLAS — Migration phase 6 : GTA Roulette, salons, défi de la semaine
-- ---------------------------------------------------------------------
--  * Le tirage est fait par la BASE (spin_room) : tous les membres d'un
--    salon reçoivent exactement le même défi, impossible à truquer.
--  * Les défis personnalisés sont validés et ne rapportent JAMAIS d'XP.
--  * Seul le défi hebdomadaire, prouvé par une vidéo et validé par un
--    modérateur, rapporte +100 XP (une fois par semaine).
-- =====================================================================

create type public.challenge_difficulty as enum ('facile', 'moyenne', 'difficile');

-- Liens vidéo autorisés (YouTube, Twitch clips, Streamable) — réutilisé par STUNT ARENA
create or replace function private.is_allowed_video_url(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select char_length(p_url) <= 300 and p_url ~ ('^https://('
    || '(www\.|m\.)?youtube\.com/watch\?v=[A-Za-z0-9_-]{11}'
    || '|(www\.)?youtube\.com/shorts/[A-Za-z0-9_-]{11}'
    || '|youtu\.be/[A-Za-z0-9_-]{11}'
    || '|clips\.twitch\.tv/[A-Za-z0-9_-]{3,100}'
    || '|(www\.)?twitch\.tv/[A-Za-z0-9_]{3,25}/clip/[A-Za-z0-9_-]{3,100}'
    || '|(www\.)?streamable\.com/[a-z0-9]{3,12}'
    || ')([?&#][A-Za-z0-9_=&.%-]*)?$');
$$;

-- Validation commune des défis personnalisés
create or replace function private.validate_challenge_text(p_title text, p_description text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_all text := lower(coalesce(p_title, '') || ' ' || coalesce(p_description, ''));
begin
  if char_length(btrim(p_title)) not between 10 and 140 then
    raise exception 'Le défi doit faire entre 10 et 140 caractères' using errcode = '23514';
  end if;
  if char_length(coalesce(p_description, '')) > 400 then
    raise exception 'Description trop longue (400 caractères maximum)' using errcode = '23514';
  end if;
  if v_all ~ '(https?://|www\.|\.(com|fr|net|org|gg|io)\b)' then
    raise exception 'Pas de liens dans un défi' using errcode = '23514';
  end if;
  if v_all ~ '(\m(argent réel|carte bancaire|mot de passe|triche|cheat|hack|glitch d.argent|mod menu)\M)' then
    raise exception 'Ce défi enfreint les règles (triche, argent réel ou données personnelles)' using errcode = '23514';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Salons
-- ---------------------------------------------------------------------
create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name       text not null check (char_length(btrim(name)) between 3 and 40),
  host_id    uuid not null references public.profiles (id) on delete cascade,
  is_open    boolean not null default true,
  created_at timestamptz not null default now(),
  closed_at  timestamptz
);
create table public.room_members (
  room_id   uuid not null references public.rooms (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index room_members_user_idx on public.room_members (user_id);

create or replace function private.is_room_member(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.room_members m where m.room_id = p_room and m.user_id = auth.uid());
$$;
grant execute on function private.is_room_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Défis
-- ---------------------------------------------------------------------
create table public.challenges (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null check (char_length(btrim(title)) between 10 and 140),
  description text check (description is null or char_length(description) <= 400),
  category    text not null check (category in ('conduite', 'exploration', 'cascade', 'style', 'photo')),
  difficulty  public.challenge_difficulty not null,
  is_custom   boolean not null default true,
  room_id     uuid references public.rooms (id) on delete cascade,
  status      public.moderation_status not null default 'pending',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
comment on table public.challenges is 'Défis officiels (is_custom = false) et personnalisés (publics modérés ou réservés à un salon).';
create index challenges_pick_idx on public.challenges (status, difficulty, category);
create index challenges_room_idx on public.challenges (room_id);

create table public.room_spins (
  id           bigint generated always as identity primary key,
  room_id      uuid not null references public.rooms (id) on delete cascade,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  spun_by      uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index room_spins_room_idx on public.room_spins (room_id, created_at desc);
create index room_spins_user_idx on public.room_spins (spun_by, created_at desc);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.challenges enable row level security;
alter table public.room_spins enable row level security;
revoke insert, update, delete on public.rooms, public.room_members, public.challenges, public.room_spins from anon, authenticated;

create policy "rooms: membres" on public.rooms for select to authenticated using ((select private.is_room_member(id)));
create policy "room_members: membres du même salon" on public.room_members for select to authenticated
  using ((select private.is_room_member(room_id)));
create policy "room_spins: membres du salon" on public.room_spins for select to authenticated
  using ((select private.is_room_member(room_id)));
create policy "challenges: publics approuvés, ceux de mes salons, les miens, l'équipe" on public.challenges for select to anon, authenticated
  using ((status = 'approved' and room_id is null)
         or (room_id is not null and (select private.is_room_member(room_id)))
         or created_by = (select auth.uid())
         or (select private.is_editor()));

-- Création d'un salon (l'hôte en devient membre)
create or replace function public.create_room(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_room uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('room-create:' || v_uid, 10, interval '1 hour');
  loop
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') into v_code
      from generate_series(1, 6);
    exit when not exists (select 1 from public.rooms r where r.code = v_code);
  end loop;
  insert into public.rooms (code, name, host_id) values (v_code, btrim(p_name), v_uid) returning id into v_room;
  insert into public.room_members (room_id, user_id) values (v_room, v_uid);
  return v_code;
end;
$$;

-- Rejoindre par code (12 joueurs maximum)
create or replace function public.join_room(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  r public.rooms;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('room-join:' || v_uid, 30, interval '1 hour');
  select * into r from public.rooms where code = upper(btrim(p_code));
  if r.id is null or not r.is_open then
    raise exception 'Salon introuvable ou fermé' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.room_members where room_id = r.id and user_id = v_uid) then
    if (select count(*) from public.room_members where room_id = r.id) >= 12 then
      raise exception 'Salon complet (12 joueurs)' using errcode = 'P0001';
    end if;
    insert into public.room_members (room_id, user_id) values (r.id, v_uid);
  end if;
  return r.id;
end;
$$;

create or replace function public.leave_room(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
begin
  select * into r from public.rooms where code = upper(btrim(p_code));
  if r.id is null then
    return;
  end if;
  delete from public.room_members where room_id = r.id and user_id = auth.uid();
  -- L'hôte qui part ferme le salon s'il reste seul ; sinon on transmet l'hôte
  if r.host_id = auth.uid() then
    update public.rooms
       set host_id = coalesce((select user_id from public.room_members where room_id = r.id order by joined_at limit 1), host_id),
           is_open = exists (select 1 from public.room_members where room_id = r.id),
           closed_at = case when exists (select 1 from public.room_members where room_id = r.id) then null else now() end
     where id = r.id;
  end if;
end;
$$;

-- Tirage : choisi par la base, identique pour tout le salon
create or replace function public.spin_room(p_code text, p_difficulty public.challenge_difficulty default null, p_categories text[] default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rooms;
  c public.challenges;
  v_spin bigint;
begin
  select * into r from public.rooms where code = upper(btrim(p_code));
  if r.id is null or not exists (select 1 from public.room_members where room_id = r.id and user_id = auth.uid()) then
    raise exception 'Tu ne fais pas partie de ce salon' using errcode = '42501';
  end if;
  if not r.is_open then
    raise exception 'Ce salon est fermé' using errcode = 'P0001';
  end if;
  -- Un tirage toutes les 4 secondes maximum par salon
  perform private.check_rate_limit('room-spin:' || r.id, 1, interval '4 seconds');

  select * into c from public.challenges ch
   where ch.status = 'approved'
     and (ch.room_id is null or ch.room_id = r.id)
     and (p_difficulty is null or ch.difficulty = p_difficulty)
     and (p_categories is null or cardinality(p_categories) = 0 or ch.category = any (p_categories))
   order by random()
   limit 1;
  if c.id is null then
    raise exception 'Aucun défi ne correspond à ces filtres' using errcode = 'P0002';
  end if;
  insert into public.room_spins (room_id, challenge_id, spun_by) values (r.id, c.id, auth.uid()) returning id into v_spin;
  return jsonb_build_object('spinId', v_spin, 'challengeId', c.id, 'title', c.title, 'category', c.category,
                            'difficulty', c.difficulty, 'isCustom', c.is_custom);
end;
$$;

-- Défi personnalisé : réservé au salon (publié aussitôt) ou proposé à tous (modéré)
create or replace function public.propose_challenge(p_title text, p_description text, p_category text,
                                                    p_difficulty public.challenge_difficulty, p_room_code text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room uuid;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('challenge-propose:' || v_uid, 20, interval '1 day');
  perform private.validate_challenge_text(p_title, p_description);
  if p_room_code is not null then
    select id into v_room from public.rooms where code = upper(btrim(p_room_code));
    if v_room is null or not exists (select 1 from public.room_members where room_id = v_room and user_id = v_uid) then
      raise exception 'Tu ne fais pas partie de ce salon' using errcode = '42501';
    end if;
  end if;
  insert into public.challenges (title, description, category, difficulty, is_custom, room_id, status, created_by)
  values (btrim(p_title), nullif(btrim(p_description), ''), p_category, p_difficulty, true, v_room,
          (case when v_room is null then 'pending' else 'approved' end)::public.moderation_status, v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.moderate_challenge(p_challenge uuid, p_decision public.moderation_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_editor() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.challenges set status = p_decision where id = p_challenge and room_id is null;
end;
$$;

revoke all on function public.create_room(text), public.join_room(text), public.leave_room(text),
  public.spin_room(text, public.challenge_difficulty, text[]),
  public.propose_challenge(text, text, text, public.challenge_difficulty, text),
  public.moderate_challenge(uuid, public.moderation_status) from public, anon;
grant execute on function public.create_room(text), public.join_room(text), public.leave_room(text),
  public.spin_room(text, public.challenge_difficulty, text[]),
  public.propose_challenge(text, text, text, public.challenge_difficulty, text),
  public.moderate_challenge(uuid, public.moderation_status) to authenticated;

-- ---------------------------------------------------------------------
-- Défi de la semaine (seul défi rapportant des XP : +100, avec preuve)
-- Semaine du lundi 00:00 au dimanche 23:59, heure de Paris (Europe/Paris).
-- ---------------------------------------------------------------------
create table public.weekly_challenges (
  id           uuid primary key default gen_random_uuid(),
  week_start   date not null unique check (extract(isodow from week_start) = 1),
  challenge_id uuid not null references public.challenges (id) on delete restrict,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  check (ends_at > starts_at)
);
create table public.weekly_submissions (
  id              uuid primary key default gen_random_uuid(),
  weekly_id       uuid not null references public.weekly_challenges (id) on delete cascade,
  user_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  proof_url       text not null check (private.is_allowed_video_url(proof_url)),
  status          public.moderation_status not null default 'pending',
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  moderated_by    uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (weekly_id, user_id)
);
alter table public.weekly_challenges enable row level security;
alter table public.weekly_submissions enable row level security;
revoke insert, update, delete on public.weekly_challenges, public.weekly_submissions from anon, authenticated;
create policy "weekly_challenges: lecture publique" on public.weekly_challenges for select to anon, authenticated using (true);
create policy "weekly_submissions: les siennes ou l'équipe" on public.weekly_submissions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_editor()));

-- Crée le défi de la semaine s'il manque (idempotent, appelé par la tâche planifiée)
create or replace function public.ensure_weekly_challenge(p_day date default (now() at time zone 'Europe/Paris')::date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week date := p_day - (extract(isodow from p_day)::int - 1);
  v_id uuid;
begin
  select id into v_id from public.weekly_challenges where week_start = v_week;
  if v_id is not null then
    return v_id;
  end if;
  insert into public.weekly_challenges (week_start, challenge_id, starts_at, ends_at)
  select v_week, c.id,
         (v_week::timestamp) at time zone 'Europe/Paris',
         ((v_week + 7)::timestamp) at time zone 'Europe/Paris' - interval '1 second'
    from public.challenges c
   where c.status = 'approved' and not c.is_custom and c.difficulty <> 'facile'
     and c.id not in (select challenge_id from public.weekly_challenges where week_start > v_week - 70)
   order by md5(v_week::text || c.id::text)
   limit 1
  on conflict (week_start) do nothing
  returning id into v_id;
  return coalesce(v_id, (select id from public.weekly_challenges where week_start = v_week));
end;
$$;
revoke all on function public.ensure_weekly_challenge(date) from public, anon, authenticated;

create or replace function public.submit_weekly_proof(p_url text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  w public.weekly_challenges;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('weekly-submit:' || auth.uid(), 10, interval '1 day');
  select * into w from public.weekly_challenges where now() between starts_at and ends_at;
  if w.id is null then
    raise exception 'Aucun défi de la semaine en cours' using errcode = 'P0002';
  end if;
  if not private.is_allowed_video_url(p_url) then
    raise exception 'Lien vidéo non autorisé' using errcode = '23514';
  end if;
  insert into public.weekly_submissions (weekly_id, user_id, proof_url) values (w.id, auth.uid(), p_url)
  on conflict (weekly_id, user_id) do update set proof_url = excluded.proof_url, status = 'pending', moderation_note = null
   where public.weekly_submissions.status <> 'approved'
  returning id into v_id;
  if v_id is null then
    raise exception 'Ta preuve de cette semaine est déjà validée' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;

create or replace function public.moderate_weekly_submission(p_submission uuid, p_decision public.moderation_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.weekly_submissions;
  w public.weekly_challenges;
begin
  if not private.is_editor() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_decision = 'rejected' and char_length(coalesce(btrim(p_note), '')) < 10 then
    raise exception 'Un refus doit être motivé (10 caractères minimum)' using errcode = '22023';
  end if;
  update public.weekly_submissions set status = p_decision, moderation_note = nullif(btrim(p_note), ''), moderated_by = auth.uid()
   where id = p_submission returning * into s;
  if s.id is null then
    raise exception 'Preuve introuvable' using errcode = 'P0002';
  end if;
  select * into w from public.weekly_challenges where id = s.weekly_id;
  if p_decision = 'approved' then
    perform private.grant_xp(s.user_id, 100, 'weekly_challenge', 'semaine:' || w.week_start, 'Défi de la semaine validé');
  else
    perform private.notify(s.user_id, 'weekly_rejected', 'Preuve du défi non validée', p_note, '/roulette#defi-semaine');
  end if;
end;
$$;
revoke all on function public.submit_weekly_proof(text), public.moderate_weekly_submission(uuid, public.moderation_status, text) from public, anon;
grant execute on function public.submit_weekly_proof(text), public.moderate_weekly_submission(uuid, public.moderation_status, text) to authenticated;

-- Temps réel : diffusion des tirages aux membres du salon (si Supabase Realtime est présent)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.room_spins, public.room_members';
  end if;
end;
$$;

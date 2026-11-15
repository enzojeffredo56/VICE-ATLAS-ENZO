-- =====================================================================
-- VICE ATLAS — Migration phase 7 : STUNT ARENA
-- ---------------------------------------------------------------------
-- Calendrier hebdomadaire, fuseau Europe/Paris, un concours par spot :
--   participations : lundi 00:00 → vendredi 23:59:59
--   votes          : samedi 00:00 → dimanche 23:59:59
--   résultats      : confirmés ensuite par un modérateur
-- Règles :
--   * une participation active par joueur et par concours ;
--   * un vote par joueur et par concours, modifiable jusqu'à la clôture ;
--   * pas de vote pour sa propre vidéo ; votes de comptes très récents
--     signalés « suspects » et exclus jusqu'à vérification ;
--   * compteurs de votes cachés pendant le vote ;
--   * égalité : même place partagée (classement « 1, 1, 3 ») ;
--   * XP et badges attribués de façon idempotente après confirmation.
-- =====================================================================

create table public.stunt_competitions (
  id                   uuid primary key default gen_random_uuid(),
  place_id             uuid not null references public.places (id) on delete restrict,
  week_start           date not null check (extract(isodow from week_start) = 1),
  submissions_open_at  timestamptz not null,
  submissions_close_at timestamptz not null,
  voting_close_at      timestamptz not null,
  confirmed_at         timestamptz,
  confirmed_by         uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  unique (place_id, week_start),
  check (submissions_open_at < submissions_close_at and submissions_close_at < voting_close_at)
);
create index stunt_competitions_week_idx on public.stunt_competitions (week_start desc);

-- Phase d'un concours à un instant donné
create or replace function public.competition_phase(c public.stunt_competitions, p_at timestamptz default now())
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when c.confirmed_at is not null then 'resultats'
    when p_at < c.submissions_open_at then 'a-venir'
    when p_at < c.submissions_close_at then 'participations'
    when p_at < c.voting_close_at then 'votes'
    else 'verification'
  end;
$$;

-- Crée les concours de la semaine en cours ET de la suivante pour chaque spot publié (idempotent)
create or replace function public.ensure_weekly_competitions(p_day date default (now() at time zone 'Europe/Paris')::date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week date := p_day - (extract(isodow from p_day)::int - 1);
  v_count integer := 0;
  v_n integer;
  w date;
begin
  foreach w in array array[v_week, v_week + 7] loop
    insert into public.stunt_competitions (place_id, week_start, submissions_open_at, submissions_close_at, voting_close_at)
    select p.id, w,
           (w::timestamp) at time zone 'Europe/Paris',
           ((w + 5)::timestamp) at time zone 'Europe/Paris',
           ((w + 7)::timestamp) at time zone 'Europe/Paris'
      from public.places p
     where p.category_id = 'stunt' and p.status = 'published'
    on conflict (place_id, week_start) do nothing;
    get diagnostics v_n = row_count;
    v_count := v_count + v_n;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.ensure_weekly_competitions(date) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Participations
-- ---------------------------------------------------------------------
create table public.stunt_entries (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references public.stunt_competitions (id) on delete cascade,
  user_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title           text not null check (char_length(btrim(title)) between 3 and 80),
  video_url       text not null check (private.is_allowed_video_url(video_url)),
  status          public.moderation_status not null default 'pending',
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  moderated_by    uuid references auth.users (id) on delete set null,
  moderated_at    timestamptz,
  withdrawn_at    timestamptz,
  created_at      timestamptz not null default now()
);
-- Une seule participation active par joueur et par concours
create unique index stunt_entries_one_active on public.stunt_entries (competition_id, user_id)
  where withdrawn_at is null and status <> 'rejected';
create index stunt_entries_competition_idx on public.stunt_entries (competition_id, status);
create index stunt_entries_user_idx on public.stunt_entries (user_id, created_at desc);

create table public.stunt_votes (
  competition_id uuid not null references public.stunt_competitions (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  entry_id       uuid not null references public.stunt_entries (id) on delete cascade,
  is_suspect     boolean not null default false,
  voided         boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (competition_id, user_id)
);
create index stunt_votes_entry_idx on public.stunt_votes (entry_id);

create table public.competition_results (
  competition_id uuid not null references public.stunt_competitions (id) on delete cascade,
  entry_id       uuid not null references public.stunt_entries (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  rank           integer not null check (rank >= 1),
  votes          integer not null check (votes >= 0),
  primary key (competition_id, entry_id)
);
create index competition_results_user_idx on public.competition_results (user_id, rank);

alter table public.stunt_competitions enable row level security;
alter table public.stunt_entries enable row level security;
alter table public.stunt_votes enable row level security;
alter table public.competition_results enable row level security;
revoke insert, update, delete on public.stunt_competitions, public.stunt_entries, public.stunt_votes, public.competition_results from anon, authenticated;

create policy "competitions: lecture publique" on public.stunt_competitions for select to anon, authenticated using (true);
create policy "entries: approuvées pour tous, les siennes, l'équipe" on public.stunt_entries for select to anon, authenticated
  using ((status = 'approved' and withdrawn_at is null) or user_id = (select auth.uid()) or (select private.is_editor()));
create policy "votes: le sien ou l'équipe" on public.stunt_votes for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_editor()));
create policy "results: lecture publique" on public.competition_results for select to anon, authenticated using (true);

-- Déposer sa vidéo
create or replace function public.submit_stunt_entry(p_competition uuid, p_url text, p_title text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.stunt_competitions;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('stunt-submit:' || auth.uid(), 10, interval '1 hour');
  select * into c from public.stunt_competitions where id = p_competition;
  if c.id is null then
    raise exception 'Concours introuvable' using errcode = 'P0002';
  end if;
  if public.competition_phase(c) <> 'participations' then
    raise exception 'Les participations sont fermées pour ce concours' using errcode = 'P0001';
  end if;
  if not private.is_allowed_video_url(btrim(p_url)) then
    raise exception 'Lien vidéo non autorisé' using errcode = '23514';
  end if;
  insert into public.stunt_entries (competition_id, user_id, title, video_url)
  values (c.id, auth.uid(), btrim(p_title), btrim(p_url))
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'Tu as déjà une participation active pour ce concours' using errcode = '23505';
end;
$$;

-- Retirer sa vidéo (avant la fin des votes)
create or replace function public.withdraw_stunt_entry(p_entry uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.stunt_entries;
  c public.stunt_competitions;
begin
  select * into e from public.stunt_entries where id = p_entry and user_id = auth.uid() and withdrawn_at is null;
  if e.id is null then
    raise exception 'Participation introuvable' using errcode = 'P0002';
  end if;
  select * into c from public.stunt_competitions where id = e.competition_id;
  if public.competition_phase(c) not in ('a-venir', 'participations', 'votes') then
    raise exception 'Les résultats sont en cours : la participation ne peut plus être retirée' using errcode = 'P0001';
  end if;
  update public.stunt_entries set withdrawn_at = now() where id = e.id;
  update public.stunt_votes set voided = true, updated_at = now() where entry_id = e.id;
end;
$$;

-- Modération d'une vidéo : la 1re participation validée de la semaine rapporte +10 XP (une fois)
create or replace function public.moderate_stunt_entry(p_entry uuid, p_decision public.moderation_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.stunt_entries;
  c public.stunt_competitions;
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
  update public.stunt_entries
     set status = p_decision, moderation_note = nullif(btrim(p_note), ''), moderated_by = auth.uid(), moderated_at = now()
   where id = p_entry
  returning * into e;
  if e.id is null then
    raise exception 'Participation introuvable' using errcode = 'P0002';
  end if;
  select * into c from public.stunt_competitions where id = e.competition_id;
  if p_decision = 'approved' then
    perform private.grant_xp(e.user_id, 10, 'stunt_participation', 'stunt-semaine:' || c.week_start, 'Première participation STUNT ARENA de la semaine');
    perform private.award_badge(e.user_id, 'premier-stunt', 'stunt:' || e.id);
    perform private.notify(e.user_id, 'stunt_approved', 'Ta vidéo est en ligne !', e.title, '/stunts/mes-videos');
  else
    update public.stunt_votes set voided = true, updated_at = now() where entry_id = e.id;
    perform private.notify(e.user_id, 'stunt_rejected', 'Ta vidéo n''a pas été validée', p_note, '/stunts/mes-videos');
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Votes
-- ---------------------------------------------------------------------
create or replace function public.cast_stunt_vote(p_entry uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.stunt_entries;
  c public.stunt_competitions;
  v_suspect boolean;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('stunt-vote:' || auth.uid(), 30, interval '1 hour');
  select * into e from public.stunt_entries where id = p_entry and status = 'approved' and withdrawn_at is null;
  if e.id is null then
    raise exception 'Vidéo introuvable' using errcode = 'P0002';
  end if;
  if e.user_id = auth.uid() then
    raise exception 'Tu ne peux pas voter pour ta propre vidéo' using errcode = '42501';
  end if;
  select * into c from public.stunt_competitions where id = e.competition_id;
  if public.competition_phase(c) <> 'votes' then
    raise exception 'Les votes ne sont pas ouverts pour ce concours' using errcode = 'P0001';
  end if;
  -- Compte créé il y a moins de 48 h : vote enregistré mais signalé pour vérification
  select coalesce(p.created_at > now() - interval '48 hours', true) into v_suspect from public.profiles p where p.id = auth.uid();
  insert into public.stunt_votes (competition_id, user_id, entry_id, is_suspect)
  values (c.id, auth.uid(), e.id, v_suspect)
  on conflict (competition_id, user_id) do update
    set entry_id = excluded.entry_id, updated_at = now(), voided = false,
        is_suspect = public.stunt_votes.is_suspect or excluded.is_suspect;
end;
$$;

-- Équipe : valider ou annuler un vote signalé
create or replace function public.review_stunt_vote(p_competition uuid, p_user uuid, p_valid boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_editor() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.stunt_votes set is_suspect = false, voided = not p_valid, updated_at = now()
   where competition_id = p_competition and user_id = p_user;
end;
$$;

-- Classement : votes valides uniquement ; égalité = même place (1, 1, 3)
create or replace function private.compute_ranking(p_competition uuid)
returns table (entry_id uuid, user_id uuid, title text, video_url text, votes integer, rank integer)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.user_id, e.title, e.video_url, count(v.user_id)::integer as votes,
         (rank() over (order by count(v.user_id) desc))::integer
    from public.stunt_entries e
    left join public.stunt_votes v on v.entry_id = e.id and not v.voided and not v.is_suspect
   where e.competition_id = p_competition and e.status = 'approved' and e.withdrawn_at is null
   group by e.id;
$$;

-- Classement public : visible seulement après la fin des votes (l'équipe le voit toujours)
create or replace function public.competition_ranking(p_competition uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.stunt_competitions;
begin
  select * into c from public.stunt_competitions where id = p_competition;
  if c.id is null then
    return null;
  end if;
  if public.competition_phase(c) in ('a-venir', 'participations', 'votes') and not private.is_editor() then
    return null;
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('entryId', r.entry_id, 'title', r.title, 'votes', r.votes, 'rank', r.rank,
                     'player', case when p.is_public then p.username::text end) order by r.rank, r.title)
                     from private.compute_ranking(p_competition) r join public.profiles p on p.id = r.user_id), '[]');
end;
$$;
grant execute on function public.competition_ranking(uuid) to anon, authenticated;

-- Mon vote actuel pour un concours
create or replace function public.my_stunt_vote(p_competition uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select entry_id from public.stunt_votes where competition_id = p_competition and user_id = auth.uid() and not voided;
$$;

-- ---------------------------------------------------------------------
-- Confirmation des résultats (idempotente)
-- ---------------------------------------------------------------------
create or replace function public.confirm_competition_results(p_competition uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.stunt_competitions;
  r record;
  v_reason public.xp_reason;
  v_amount integer;
  v_count integer := 0;
begin
  if not private.is_editor() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  select * into c from public.stunt_competitions where id = p_competition for update;
  if c.id is null then
    raise exception 'Concours introuvable' using errcode = 'P0002';
  end if;
  if c.confirmed_at is not null then
    return 0; -- déjà confirmé : rien ne se passe deux fois
  end if;
  if public.competition_phase(c) <> 'verification' then
    raise exception 'Les votes ne sont pas terminés' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.stunt_votes v where v.competition_id = c.id and v.is_suspect and not v.voided) then
    raise exception 'Des votes signalés doivent d''abord être vérifiés' using errcode = 'P0001';
  end if;

  for r in select * from private.compute_ranking(c.id) loop
    insert into public.competition_results (competition_id, entry_id, user_id, rank, votes)
    values (c.id, r.entry_id, r.user_id, r.rank, r.votes);
    v_count := v_count + 1;
    if r.rank <= 3 and r.votes > 0 then
      v_reason := (array['stunt_first', 'stunt_second', 'stunt_third']::public.xp_reason[])[r.rank];
      v_amount := (array[150, 75, 40])[r.rank];
      perform private.grant_xp(r.user_id, v_amount, v_reason, 'stunt:' || c.id, r.rank || 'e place STUNT ARENA');
      if r.rank = 1 then
        perform private.award_badge(r.user_id, 'champion-du-spot', 'stunt:' || c.id);
        if (select count(*) from public.competition_results cr where cr.user_id = r.user_id and cr.rank = 1) >= 3 then
          perform private.award_badge(r.user_id, 'legende-du-stunt', 'stunt:' || c.id);
        end if;
      end if;
    end if;
  end loop;

  update public.stunt_competitions set confirmed_at = now(), confirmed_by = auth.uid() where id = c.id;
  return v_count;
end;
$$;

revoke all on function public.submit_stunt_entry(uuid, text, text), public.withdraw_stunt_entry(uuid),
  public.moderate_stunt_entry(uuid, public.moderation_status, text), public.cast_stunt_vote(uuid),
  public.review_stunt_vote(uuid, uuid, boolean), public.my_stunt_vote(uuid), public.confirm_competition_results(uuid) from public, anon;
grant execute on function public.submit_stunt_entry(uuid, text, text), public.withdraw_stunt_entry(uuid),
  public.moderate_stunt_entry(uuid, public.moderation_status, text), public.cast_stunt_vote(uuid),
  public.review_stunt_vote(uuid, uuid, boolean), public.my_stunt_vote(uuid), public.confirm_competition_results(uuid) to authenticated;

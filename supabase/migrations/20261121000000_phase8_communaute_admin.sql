-- =====================================================================
-- VICE ATLAS — Migration phase 8 : communauté, classements, administration
-- ---------------------------------------------------------------------
--  * Propositions de lieux (+50 XP si approuvées) et signalements d'erreurs
--  * Classements publics (profils publics uniquement)
--  * Gestion des rôles, badges et statistiques par l'administration
--  * Journal d'audit de toutes les actions sensibles
-- =====================================================================

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------
-- Journal d'audit
-- ---------------------------------------------------------------------
create table public.audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid references auth.users (id) on delete set null,
  action       text not null,
  target_table text not null,
  target_id    text,
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_target_idx on public.audit_log (target_table, target_id);
alter table public.audit_log enable row level security;
create policy "audit_log: lecture admin" on public.audit_log for select to authenticated using ((select private.is_admin()));
revoke insert, update, delete on public.audit_log from anon, authenticated;

-- Déclencheur générique : enregistre qui a fait quoi, avec les colonnes modifiées
create or replace function private.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_changes jsonb;
  v_id text := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'user_id', v_old ->> 'user_id');
begin
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('avant', v_old -> k, 'apres', v_new -> k)) into v_changes
      from jsonb_object_keys(v_new) k
     where v_new -> k is distinct from v_old -> k and k not in ('updated_at');
    if v_changes is null then
      return new;
    end if;
  end if;
  insert into public.audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), lower(tg_op), tg_table_name, v_id,
          case tg_op when 'UPDATE' then v_changes when 'INSERT' then v_new else v_old end);
  return coalesce(new, old);
end;
$$;

create trigger audit_user_roles after insert or update or delete on public.user_roles for each row execute function private.audit();
create trigger audit_places after insert or update or delete on public.places for each row execute function private.audit();
create trigger audit_guides after insert or update or delete on public.guides for each row execute function private.audit();
create trigger audit_reviews_moderation after update of status on public.reviews for each row execute function private.audit();
create trigger audit_stunt_entries_moderation after update of status on public.stunt_entries for each row execute function private.audit();
create trigger audit_stunt_competitions after update of confirmed_at on public.stunt_competitions for each row execute function private.audit();
create trigger audit_user_badges after insert or delete on public.user_badges for each row execute function private.audit();

-- Les corrections d'XP manuelles sont auditées (les gains automatiques restent dans le registre)
create or replace function private.audit_manual_xp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reason in ('reversal', 'admin_adjustment') then
    insert into public.audit_log (actor_id, action, target_table, target_id, details)
    values (auth.uid(), 'insert', 'xp_events', new.user_id::text,
            jsonb_build_object('amount', new.amount, 'reason', new.reason, 'note', new.note, 'reverses', new.reverses_id));
  end if;
  return new;
end;
$$;
create trigger audit_xp_manual after insert on public.xp_events for each row execute function private.audit_manual_xp();

-- ---------------------------------------------------------------------
-- Contributions de la communauté
-- ---------------------------------------------------------------------
create type public.contribution_kind as enum ('place_proposal', 'error_report');

create table public.contributions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind            public.contribution_kind not null,
  title           text not null check (char_length(btrim(title)) between 5 and 120),
  description     text not null check (char_length(btrim(description)) between 20 and 1000),
  place_id        uuid references public.places (id) on delete set null,
  category_id     text references public.map_categories (id),
  x               numeric(7, 2) check (x is null or x between 0 and 2000),
  y               numeric(7, 2) check (y is null or y between 0 and 1500),
  status          public.moderation_status not null default 'pending',
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 500),
  moderated_by    uuid references auth.users (id) on delete set null,
  moderated_at    timestamptz,
  created_place   uuid references public.places (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint contributions_shape check (
    (kind = 'place_proposal' and x is not null and y is not null and category_id is not null)
    or (kind = 'error_report' and place_id is not null))
);
create index contributions_status_idx on public.contributions (status, created_at);
create index contributions_user_idx on public.contributions (user_id, created_at desc);
alter table public.contributions enable row level security;
create policy "contributions: les siennes ou l'équipe" on public.contributions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_editor()));
revoke insert, update, delete on public.contributions from anon, authenticated;
create trigger audit_contributions after update of status on public.contributions for each row execute function private.audit();

create or replace function public.submit_contribution(p_kind public.contribution_kind, p_title text, p_description text,
                                                      p_place_slug text default null, p_category text default null,
                                                      p_x numeric default null, p_y numeric default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_place uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  perform private.check_rate_limit('contribution:' || auth.uid(), 10, interval '1 day');
  if p_place_slug is not null then
    select id into v_place from public.places where slug = p_place_slug and status = 'published';
    if v_place is null then
      raise exception 'Lieu introuvable' using errcode = 'P0002';
    end if;
  end if;
  insert into public.contributions (user_id, kind, title, description, place_id, category_id, x, y)
  values (auth.uid(), p_kind, btrim(p_title), btrim(p_description), v_place, p_category, p_x, p_y)
  returning id into v_id;
  return v_id;
end;
$$;

-- Modération : une découverte approuvée crée un lieu en brouillon et rapporte +50 XP
create or replace function public.moderate_contribution(p_contribution uuid, p_decision public.moderation_status, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.contributions;
  v_place uuid;
  v_slug text;
  v_approved integer;
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
  select * into c from public.contributions where id = p_contribution for update;
  if c.id is null then
    raise exception 'Contribution introuvable' using errcode = 'P0002';
  end if;
  if c.status <> 'pending' then
    return c.created_place; -- déjà traitée : rien n'est refait
  end if;

  if p_decision = 'approved' and c.kind = 'place_proposal' then
    v_slug := left(trim(both '-' from regexp_replace(lower(extensions.unaccent(c.title)), '[^a-z0-9]+', '-', 'g')), 60)
              || '-' || substr(replace(c.id::text, '-', ''), 1, 6);
    insert into public.places (slug, name, category_id, x, y, district, description, status)
    values (v_slug, left(btrim(c.title), 80), c.category_id, c.x, c.y, 'À préciser', left(btrim(c.description), 600), 'draft')
    returning id into v_place;
    perform private.grant_xp(c.user_id, 50, 'discovery_approved', 'contribution:' || c.id, 'Découverte communautaire approuvée');
    select count(*) + 1 into v_approved from public.contributions
     where user_id = c.user_id and kind = 'place_proposal' and status = 'approved';
    perform private.award_badge(c.user_id, 'contributeur', 'contribution:' || c.id);
    if v_approved >= 10 then
      perform private.award_badge(c.user_id, 'expert-communautaire', 'contribution:' || c.id);
    end if;
  end if;

  update public.contributions
     set status = p_decision, moderation_note = nullif(btrim(p_note), ''), moderated_by = auth.uid(), moderated_at = now(),
         created_place = v_place
   where id = c.id;
  perform private.notify(c.user_id, 'contribution',
    case when p_decision = 'approved' then 'Merci ! Ta contribution est acceptée' else 'Ta contribution n''a pas été retenue' end,
    coalesce(p_note, c.title), '/communaute');
  return v_place;
end;
$$;

revoke all on function public.submit_contribution(public.contribution_kind, text, text, text, text, numeric, numeric),
  public.moderate_contribution(uuid, public.moderation_status, text) from public, anon;
grant execute on function public.submit_contribution(public.contribution_kind, text, text, text, text, numeric, numeric),
  public.moderate_contribution(uuid, public.moderation_status, text) to authenticated;

-- ---------------------------------------------------------------------
-- Classements (profils publics uniquement)
-- ---------------------------------------------------------------------
create or replace function public.leaderboard_xp(p_limit integer default 50)
returns table (rank integer, username text, avatar_url text, xp integer, level integer)
language sql
stable
security definer
set search_path = ''
as $$
  select (rank() over (order by t.xp desc))::integer, t.username, t.avatar_url, t.xp, public.level_for_xp(t.xp)
    from (select p.username::text as username, p.avatar_url, coalesce(sum(e.amount), 0)::integer as xp
            from public.profiles p left join public.xp_events e on e.user_id = p.id
           where p.is_public
           group by p.id) t
   where t.xp > 0
   order by t.xp desc, t.username
   limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.leaderboard_stunts(p_limit integer default 50)
returns table (rank integer, username text, avatar_url text, wins integer, podiums integer)
language sql
stable
security definer
set search_path = ''
as $$
  select (rank() over (order by t.wins desc, t.podiums desc))::integer, t.username, t.avatar_url, t.wins, t.podiums
    from (select p.username::text as username, p.avatar_url,
                 count(*) filter (where r.rank = 1)::integer as wins,
                 count(*) filter (where r.rank <= 3)::integer as podiums
            from public.competition_results r
            join public.profiles p on p.id = r.user_id and p.is_public
           where r.votes > 0
           group by p.id) t
   where t.podiums > 0
   order by t.wins desc, t.podiums desc, t.username
   limit least(greatest(p_limit, 1), 100);
$$;
grant execute on function public.leaderboard_xp(integer), public.leaderboard_stunts(integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Administration
-- ---------------------------------------------------------------------
create or replace function public.admin_set_role(p_user uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  -- Toujours garder au moins un administrateur
  if p_role <> 'admin' and exists (select 1 from public.user_roles where user_id = p_user and role = 'admin')
     and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'Impossible de retirer le dernier administrateur' using errcode = 'P0001';
  end if;
  if p_role = 'user' then
    delete from public.user_roles where user_id = p_user;
  else
    insert into public.user_roles (user_id, role, granted_by) values (p_user, p_role, auth.uid())
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by, granted_at = now();
  end if;
end;
$$;

create or replace function public.admin_award_badge(p_user uuid, p_badge text, p_justification text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_justification), '')) < 10 then
    raise exception 'Justification obligatoire (10 caractères minimum)' using errcode = '22023';
  end if;
  return private.award_badge(p_user, p_badge, 'admin:' || p_justification);
end;
$$;

create or replace function public.admin_revoke_badge(p_user uuid, p_badge text, p_justification text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_justification), '')) < 10 then
    raise exception 'Justification obligatoire (10 caractères minimum)' using errcode = '22023';
  end if;
  delete from public.user_badges where user_id = p_user and badge_id = p_badge;
  insert into public.audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), 'revoke', 'user_badges', p_user::text, jsonb_build_object('badge', p_badge, 'justification', p_justification));
end;
$$;

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_editor() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'players', (select count(*) from public.profiles),
    'publicProfiles', (select count(*) from public.profiles where is_public),
    'newPlayers7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'xpDistributed', (select coalesce(sum(amount), 0) from public.xp_events),
    'pendingReviews', (select count(*) from public.reviews where status = 'pending'),
    'pendingEntries', (select count(*) from public.stunt_entries where status = 'pending' and withdrawn_at is null),
    'pendingContributions', (select count(*) from public.contributions where status = 'pending'),
    'pendingChallenges', (select count(*) from public.challenges where status = 'pending' and room_id is null),
    'pendingWeekly', (select count(*) from public.weekly_submissions where status = 'pending'),
    'suspectVotes', (select count(*) from public.stunt_votes where is_suspect and not voided),
    'activeRooms7d', (select count(distinct room_id) from public.room_spins where created_at > now() - interval '7 days'),
    'reviewAverage', (select coalesce(round(avg(rating)::numeric, 2), 0) from public.reviews where status = 'approved')
  );
end;
$$;

revoke all on function public.admin_set_role(uuid, public.app_role), public.admin_award_badge(uuid, text, text),
  public.admin_revoke_badge(uuid, text, text), public.admin_stats() from public, anon;
grant execute on function public.admin_set_role(uuid, public.app_role), public.admin_award_badge(uuid, text, text),
  public.admin_revoke_badge(uuid, text, text), public.admin_stats() to authenticated;

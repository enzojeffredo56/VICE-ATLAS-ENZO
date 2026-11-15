-- =====================================================================
-- Tests — phase 7 (STUNT ARENA)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

-- Comptes : 3 cascadeurs, 3 votants « anciens », 1 compte récent, 1 modérateur
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000701', 'c1@test.local', '{"username":"Cascadeur_1"}'),
  ('00000000-0000-0000-0000-000000000702', 'c2@test.local', '{"username":"Cascadeur_2"}'),
  ('00000000-0000-0000-0000-000000000703', 'c3@test.local', '{"username":"Cascadeur_3"}'),
  ('00000000-0000-0000-0000-000000000711', 'v1@test.local', '{"username":"Votant_1"}'),
  ('00000000-0000-0000-0000-000000000712', 'v2@test.local', '{"username":"Votant_2"}'),
  ('00000000-0000-0000-0000-000000000713', 'v3@test.local', '{"username":"Votant_3"}'),
  ('00000000-0000-0000-0000-000000000719', 'nouveau@test.local', '{"username":"Tout_Nouveau"}'),
  ('00000000-0000-0000-0000-000000000799', 'modo7@test.local', '{"username":"Modo_7"}');
update public.profiles set created_at = now() - interval '30 days'
 where id::text like '00000000-0000-0000-0000-0000000007%' and id <> '00000000-0000-0000-0000-000000000719';
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000799', 'moderator');

-- Calendrier officiel
select test.ok(public.ensure_weekly_competitions('2026-11-18') = 8, '4 spots × 2 semaines créés');
select test.ok(public.ensure_weekly_competitions('2026-11-18') = 0, 'création idempotente');
select test.ok((select submissions_open_at = '2026-11-15 23:00:00+00' and submissions_close_at = '2026-11-20 23:00:00+00'
  and voting_close_at = '2026-11-22 23:00:00+00' from public.stunt_competitions where week_start = '2026-11-16' limit 1),
  'participations lundi→vendredi, votes samedi→dimanche (heure de Paris, UTC+1 en novembre)');
select test.ok((select voting_close_at = '2026-10-25 23:00:00+00' from (
  select ((date '2026-10-26')::timestamp at time zone 'Europe/Paris') as voting_close_at) x), 'changement d''heure géré par le fuseau');

-- Concours de test placés à différentes étapes (en superutilisateur)
insert into public.stunt_competitions (id, place_id, week_start, submissions_open_at, submissions_close_at, voting_close_at)
select '00000000-0000-0000-0000-00000000c001'::uuid, id, '2026-01-12', now() - interval '1 day', now() + interval '1 day', now() + interval '3 days'
  from public.places where slug = 'tremplin-de-la-pointe';
insert into public.stunt_competitions (id, place_id, week_start, submissions_open_at, submissions_close_at, voting_close_at)
select '00000000-0000-0000-0000-00000000c002'::uuid, id, '2026-01-12', now() - interval '6 days', now() - interval '1 day', now() + interval '1 day'
  from public.places where slug = 'rampe-des-docks';

-- ---------- Participations ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000701');
select test.throws($$select public.submit_stunt_entry('00000000-0000-0000-0000-00000000c001', 'https://exemple.com/v.mp4', 'Mon saut')$$,
  '23514', 'lien vidéo non autorisé refusé');
select test.ok(public.submit_stunt_entry('00000000-0000-0000-0000-00000000c001', 'https://youtu.be/aaaaaaaaaaa', 'Saut du quai') is not null,
  'participation déposée');
select test.throws($$select public.submit_stunt_entry('00000000-0000-0000-0000-00000000c001', 'https://youtu.be/bbbbbbbbbbb', 'Deuxième essai')$$,
  '23505', 'une seule participation active par concours');
select test.throws($$select public.submit_stunt_entry('00000000-0000-0000-0000-00000000c002', 'https://youtu.be/ccccccccccc', 'Trop tard')$$,
  'P0001', 'participation refusée pendant les votes');
reset role;

set role anon;
select test.login(null);
select test.ok((select count(*) from public.stunt_entries) = 0, 'une vidéo en attente de modération n''est pas publique');
reset role;

-- Préparer le concours en phase de votes : 3 vidéos approuvées
insert into public.stunt_entries (id, competition_id, user_id, title, video_url, status) values
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000701', 'Vidéo A', 'https://youtu.be/AAAAAAAAAAA', 'pending'),
  ('00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000702', 'Vidéo B', 'https://youtu.be/BBBBBBBBBBB', 'pending'),
  ('00000000-0000-0000-0000-0000000e0003', '00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000703', 'Vidéo C', 'https://youtu.be/CCCCCCCCCCC', 'pending');

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000799');
select public.moderate_stunt_entry('00000000-0000-0000-0000-0000000e0001', 'approved');
select public.moderate_stunt_entry('00000000-0000-0000-0000-0000000e0002', 'approved');
select public.moderate_stunt_entry('00000000-0000-0000-0000-0000000e0003', 'approved');
select public.moderate_stunt_entry((select id from public.stunt_entries where title = 'Saut du quai'), 'approved');
reset role;
select test.ok((select count(*) from public.xp_events where reason = 'stunt_participation' and user_id = '00000000-0000-0000-0000-000000000701') = 1,
  '+10 XP une seule fois pour deux participations validées la même semaine');
select test.ok(exists (select 1 from public.user_badges where user_id = '00000000-0000-0000-0000-000000000701' and badge_id = 'premier-stunt'),
  'badge Premier Stunt');

-- ---------- Votes ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000701');
select test.throws($$select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0001')$$, '42501', 'pas de vote pour sa propre vidéo');
select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0002');
select test.ok(public.competition_ranking('00000000-0000-0000-0000-00000000c002') is null, 'classement caché pendant les votes');
reset role;
set role authenticated; select test.login('00000000-0000-0000-0000-000000000713');
select test.throws($$select public.cast_stunt_vote((select id from public.stunt_entries where title = 'Saut du quai'))$$, 'P0001',
  'vote refusé pendant les participations');
reset role;

set role authenticated; select test.login('00000000-0000-0000-0000-000000000711');
select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0001');
select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0003');  -- change d'avis
reset role;
set role authenticated; select test.login('00000000-0000-0000-0000-000000000712');
select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0001');
reset role;
set role authenticated; select test.login('00000000-0000-0000-0000-000000000713');
select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0003');
reset role;
set role authenticated; select test.login('00000000-0000-0000-0000-000000000719');
select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0002');
reset role;

select test.ok((select count(*) from public.stunt_votes where user_id = '00000000-0000-0000-0000-000000000711') = 1,
  'un seul vote par joueur, le changement remplace le précédent');
select test.ok((select entry_id from public.stunt_votes where user_id = '00000000-0000-0000-0000-000000000711') = '00000000-0000-0000-0000-0000000e0003',
  'le vote modifié est pris en compte');
select test.ok((select is_suspect from public.stunt_votes where user_id = '00000000-0000-0000-0000-000000000719'), 'vote d''un compte de moins de 48 h signalé');

set role authenticated; select test.login('00000000-0000-0000-0000-000000000712');
select test.ok((select count(*) from public.stunt_votes) = 1, 'un joueur ne voit que son propre vote');
reset role;

-- ---------- Clôture et résultats ----------
update public.stunt_competitions set voting_close_at = now() - interval '1 minute', submissions_close_at = now() - interval '2 days'
 where id = '00000000-0000-0000-0000-00000000c002';
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000702');
select test.throws($$select public.cast_stunt_vote('00000000-0000-0000-0000-0000000e0001')$$, 'P0001', 'vote refusé après la clôture');
select test.throws($$select public.confirm_competition_results('00000000-0000-0000-0000-00000000c002')$$, '42501', 'un joueur ne confirme pas les résultats');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000799');
select test.throws($$select public.confirm_competition_results('00000000-0000-0000-0000-00000000c002')$$, 'P0001',
  'confirmation bloquée tant qu''un vote signalé n''est pas vérifié');
select public.review_stunt_vote('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000719', false);
-- Votes valides : A = 1 (v2), B = 1 (c1), C = 2 (v1, v3) → C 1er, A et B 2e ex aequo
select test.ok(public.confirm_competition_results('00000000-0000-0000-0000-00000000c002') = 3, 'résultats confirmés');
select test.ok(public.confirm_competition_results('00000000-0000-0000-0000-00000000c002') = 0, 'confirmation idempotente');
reset role;

select test.ok((select rank from public.competition_results where entry_id = '00000000-0000-0000-0000-0000000e0003') = 1, 'C premier');
select test.ok((select array_agg(rank order by rank) from public.competition_results where entry_id in
  ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-0000000e0002')) = array[2, 2], 'A et B deuxièmes ex aequo');
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000703') = 150 + 10, 'vainqueur : +150 XP (+10 de participation)');
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000701') = 75 + 10 and private.user_xp('00000000-0000-0000-0000-000000000702') = 75 + 10,
  'égalité : chaque deuxième reçoit +75 XP');
select test.ok(exists (select 1 from public.user_badges where user_id = '00000000-0000-0000-0000-000000000703' and badge_id = 'champion-du-spot'),
  'badge Champion du spot');
select test.ok((select count(*) from public.xp_events where reason in ('stunt_first', 'stunt_second', 'stunt_third')) = 3, 'aucune double récompense');

set role anon;
select test.login(null);
select test.ok(jsonb_array_length(public.competition_ranking('00000000-0000-0000-0000-00000000c002')) = 3, 'classement public après confirmation');
select test.ok((public.competition_ranking('00000000-0000-0000-0000-00000000c002') -> 0 ->> 'player') is null,
  'le pseudo d''un profil privé n''apparaît pas au classement');
reset role;

-- Retrait d'une participation : les votes associés sont annulés
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000701');
select public.withdraw_stunt_entry((select id from public.stunt_entries where title = 'Saut du quai'));
select test.ok((select withdrawn_at is not null from public.stunt_entries where title = 'Saut du quai'), 'participation retirée');
select test.ok(public.submit_stunt_entry('00000000-0000-0000-0000-00000000c001', 'https://youtu.be/ddddddddddd', 'Nouvel essai') is not null,
  'après retrait, une nouvelle participation est possible');
reset role;

select 'TOUS LES TESTS SQL DE STUNT ARENA SONT PASSÉS';

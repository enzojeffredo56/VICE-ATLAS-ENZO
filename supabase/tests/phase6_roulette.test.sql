-- =====================================================================
-- Tests — phase 6 (GTA Roulette, salons, défi de la semaine)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000601', 'hote@test.local', '{"username":"Hote_Roulette"}'),
  ('00000000-0000-0000-0000-000000000602', 'ami@test.local', '{"username":"Ami_Roulette"}'),
  ('00000000-0000-0000-0000-000000000603', 'intrus@test.local', '{"username":"Intrus"}'),
  ('00000000-0000-0000-0000-000000000604', 'modo6@test.local', '{"username":"Modo_6"}');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000000604', 'moderator');

select test.ok(private.is_allowed_video_url('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'lien YouTube accepté');
select test.ok(private.is_allowed_video_url('https://youtu.be/dQw4w9WgXcQ?t=12'), 'lien youtu.be accepté');
select test.ok(private.is_allowed_video_url('https://clips.twitch.tv/BelleCascade-abc_123'), 'clip Twitch accepté');
select test.ok(not private.is_allowed_video_url('http://youtube.com/watch?v=dQw4w9WgXcQ'), 'http refusé');
select test.ok(not private.is_allowed_video_url('https://youtube.com.pirate.fr/watch?v=dQw4w9WgXcQ'), 'faux domaine refusé');
select test.ok(not private.is_allowed_video_url('https://exemple.com/video.mp4'), 'site non autorisé refusé');
select test.ok(not private.is_allowed_video_url('javascript:alert(1)'), 'javascript: refusé');

-- ---------- Salon ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000601');
create temp table t_room as select public.create_room('Soirée du vendredi') as code;
grant select on t_room to authenticated;
select test.ok((select code from t_room) ~ '^[A-HJ-NP-Z2-9]{6}$', 'code de salon de 6 caractères sans caractères ambigus');
select test.ok((select count(*) from public.room_members) = 1, 'l''hôte est membre de son salon');
select test.ok((public.spin_room((select code from t_room), 'facile') ->> 'difficulty') = 'facile', 'tirage filtré par difficulté');
select test.throws($$select public.spin_room((select code from t_room))$$, 'P0429', 'un tirage toutes les 4 secondes maximum');
select test.throws($$select public.propose_challenge('Lien interdit : va sur www.exemple.com', null, 'style', 'facile', (select code from t_room))$$,
  '23514', 'pas de lien dans un défi');
select test.throws($$select public.propose_challenge('Utilise un mod menu pour tout gagner', null, 'style', 'facile', (select code from t_room))$$,
  '23514', 'défi de triche refusé');
select test.throws($$select public.propose_challenge('Court', null, 'style', 'facile', (select code from t_room))$$, '23514', 'défi trop court refusé');
select test.ok(public.propose_challenge('Faire tout le trajet en marche arrière', null, 'conduite', 'difficile', (select code from t_room)) is not null,
  'défi personnalisé de salon accepté');
select test.ok((select status from public.challenges where title = 'Faire tout le trajet en marche arrière') = 'approved',
  'un défi de salon est utilisable tout de suite');
select test.ok(public.propose_challenge('Défi proposé à toute la communauté', null, 'photo', 'moyenne') is not null, 'proposition publique');
select test.ok((select status from public.challenges where title = 'Défi proposé à toute la communauté') = 'pending',
  'une proposition publique attend la modération');
select test.throws($$insert into public.room_spins (room_id, challenge_id) select r.id, c.id from public.rooms r, public.challenges c limit 1$$,
  '42501', 'impossible d''insérer un tirage à la main');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000603');
select test.ok((select count(*) from public.rooms) = 0, 'un non-membre ne voit pas le salon');
select test.ok(not exists (select 1 from public.challenges where title = 'Faire tout le trajet en marche arrière'),
  'un non-membre ne voit pas les défis du salon');
select test.ok(not exists (select 1 from public.challenges where title = 'Défi proposé à toute la communauté'),
  'une proposition en attente n''est visible que de son auteur');
select test.throws($$select public.spin_room((select code from t_room))$$, '42501', 'un non-membre ne peut pas tirer');
select test.throws($$select public.join_room('ZZZZZZ')$$, 'P0002', 'code inconnu refusé');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000602');
select test.ok(public.join_room(lower((select code from t_room))) is not null, 'l''ami rejoint avec le code (même en minuscules)');
select test.ok((select count(*) from public.room_spins) = 1, 'l''ami voit le même tirage que l''hôte');
select test.ok((select count(*) from public.room_members) = 2, 'l''ami voit les membres du salon');
reset role;

-- Le salon est limité à 12 joueurs
insert into auth.users (id, email, raw_user_meta_data)
  select ('00000000-0000-0000-0001-' || lpad(g::text, 12, '0'))::uuid, 'm' || g || '@test.local', jsonb_build_object('username', 'membre_' || g)
    from generate_series(1, 11) g;
insert into public.room_members (room_id, user_id)
  select r.id, ('00000000-0000-0000-0001-' || lpad(g::text, 12, '0'))::uuid from public.rooms r, generate_series(1, 10) g;
set role authenticated;
select test.login('00000000-0000-0000-0001-000000000011');
select test.throws($$select public.join_room((select code from t_room))$$, 'P0001', 'salon complet à 12 joueurs');
reset role;

-- L'hôte part : l'hôte est transmis
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000601');
select public.leave_room((select code from t_room));
reset role;
select test.ok((select host_id from public.rooms) <> '00000000-0000-0000-0000-000000000601', 'l''hôte est transmis quand il part');

-- ---------- Défi de la semaine ----------
select test.ok(public.ensure_weekly_challenge(current_date) is not null, 'défi de la semaine créé');
select test.ok(public.ensure_weekly_challenge(current_date) = public.ensure_weekly_challenge(current_date), 'création idempotente');
select test.ok((select extract(isodow from week_start) = 1 from public.weekly_challenges limit 1), 'la semaine commence un lundi');
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000602');
select test.throws($$select public.ensure_weekly_challenge(current_date)$$, '42501', 'un joueur ne crée pas le défi de la semaine');
select test.throws($$select public.submit_weekly_proof('https://exemple.com/triche.mp4')$$, '23514', 'preuve hors plateforme autorisée refusée');
select test.ok(public.submit_weekly_proof('https://youtu.be/dQw4w9WgXcQ') is not null, 'preuve vidéo envoyée');
reset role;
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000604');
select public.moderate_weekly_submission((select id from public.weekly_submissions limit 1), 'approved');
select public.moderate_weekly_submission((select id from public.weekly_submissions limit 1), 'approved');
reset role;
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000602') = 100, 'défi de la semaine validé : +100 XP, une seule fois');
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000602');
select test.throws($$select public.submit_weekly_proof('https://youtu.be/aaaaaaaaaaa')$$, 'P0001', 'une preuve validée ne se remplace pas');
reset role;
select test.ok((select count(*) from public.xp_events where reason = 'weekly_challenge') = 1, 'aucune XP pour les défis entre amis');

select 'TOUS LES TESTS SQL DE LA ROULETTE SONT PASSÉS';

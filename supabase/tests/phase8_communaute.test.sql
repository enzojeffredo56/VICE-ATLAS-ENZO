-- =====================================================================
-- Tests — phase 8 (communauté, classements, administration, audit)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000801', 'explo@test.local', '{"username":"Explo_8"}'),
  ('00000000-0000-0000-0000-000000000802', 'discret@test.local', '{"username":"Discret_8"}'),
  ('00000000-0000-0000-0000-000000000803', 'modo8@test.local', '{"username":"Modo_8"}'),
  ('00000000-0000-0000-0000-000000000804', 'admin8@test.local', '{"username":"Admin_8"}');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000803', 'moderator'), ('00000000-0000-0000-0000-000000000804', 'admin');
update public.profiles set is_public = true where id = '00000000-0000-0000-0000-000000000801';

-- ---------- Contributions ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000801');
select test.throws($$select public.submit_contribution('place_proposal', 'Plage cachée', 'Trop court', null, 'panorama', 10, 10)$$,
  '23514', 'description trop courte refusée');
select test.throws($$select public.submit_contribution('place_proposal', 'Plage cachée du nord', 'Une petite plage cachée derrière les rochers.', null, null, null, null)$$,
  '23514', 'une proposition de lieu exige catégorie et coordonnées');
select test.ok(public.submit_contribution('place_proposal', 'Plage cachée du nord', 'Une petite plage cachée derrière les rochers, idéale au coucher du soleil.', null, 'panorama', 820, 1300) is not null,
  'proposition de lieu envoyée');
select test.ok(public.submit_contribution('error_report', 'Mauvaise position du phare', 'Le phare est un peu trop à l''ouest sur la carte.', 'phare-du-port-neon') is not null,
  'signalement d''erreur envoyé');
select test.throws($$select public.submit_contribution('error_report', 'Lieu inexistant signalé', 'Ce lieu n''existe pas du tout sur la carte.', 'lieu-fantome')$$,
  'P0002', 'signalement sur un lieu inconnu refusé');
select test.throws($$select public.moderate_contribution((select id from public.contributions limit 1), 'approved')$$, '42501', 'un joueur ne modère pas');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000802');
select test.ok((select count(*) from public.contributions) = 0, 'les contributions des autres sont privées');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000803');
select test.ok(public.moderate_contribution((select id from public.contributions where kind = 'place_proposal'), 'approved') is not null,
  'découverte approuvée : un lieu brouillon est créé');
select public.moderate_contribution((select id from public.contributions where kind = 'place_proposal'), 'approved');
select public.moderate_contribution((select id from public.contributions where kind = 'error_report'), 'approved');
reset role;
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000801') = 50, '+50 XP pour la découverte, rien pour le signalement, une seule fois');
select test.ok((select status from public.places where name = 'Plage cachée du nord') = 'draft', 'le lieu proposé reste en brouillon jusqu''à publication');
select test.ok((select slug from public.places where name = 'Plage cachée du nord') like 'plage-cachee-du-nord-%', 'adresse du lieu sans accents');
select test.ok(exists (select 1 from public.user_badges where user_id = '00000000-0000-0000-0000-000000000801' and badge_id = 'contributeur'),
  'badge Contributeur');

-- ---------- Classements ----------
set role anon;
select test.login(null);
select test.ok((select count(*) from public.leaderboard_xp() where username = 'Explo_8') = 1, 'un profil public apparaît au classement');
select test.ok((select count(*) from public.leaderboard_xp() where username = 'Discret_8') = 0, 'un profil privé n''apparaît jamais au classement');
select test.throws($$select public.admin_stats()$$, '42501', 'les statistiques sont réservées à l''équipe');
reset role;

-- ---------- Administration ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000803');
select test.ok((public.admin_stats() ->> 'players')::int > 0, 'le modérateur voit les statistiques');
select test.throws($$select public.admin_set_role('00000000-0000-0000-0000-000000000802', 'admin')$$, '42501', 'un modérateur ne nomme pas d''admin');
select test.ok((select count(*) from public.audit_log) = 0, 'le journal d''audit est réservé aux admins');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000804');
select public.admin_set_role('00000000-0000-0000-0000-000000000802', 'moderator');
select test.ok((select role from public.user_roles where user_id = '00000000-0000-0000-0000-000000000802') = 'moderator', 'l''admin attribue un rôle');
select public.admin_set_role('00000000-0000-0000-0000-000000000802', 'user');
select test.ok(not exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-000000000802'), 'l''admin retire un rôle');
select test.throws($$select public.admin_award_badge('00000000-0000-0000-0000-000000000802', 'explorateur', 'court')$$, '22023', 'badge manuel sans justification refusé');
select test.ok(public.admin_award_badge('00000000-0000-0000-0000-000000000802', 'explorateur', 'Bug de la carte corrigé, visites perdues'), 'badge attribué avec justification');
select public.admin_revoke_badge('00000000-0000-0000-0000-000000000802', 'explorateur', 'Attribué par erreur au mauvais joueur');
select test.ok(not exists (select 1 from public.user_badges where user_id = '00000000-0000-0000-0000-000000000802' and badge_id = 'explorateur'), 'badge retiré');
select test.ok((select count(*) from public.audit_log where target_table = 'user_roles') >= 2, 'changements de rôle audités');
select test.ok(exists (select 1 from public.audit_log where target_table = 'user_badges' and action = 'revoke'), 'retrait de badge audité avec justification');
select test.ok(exists (select 1 from public.audit_log where target_table = 'contributions' and actor_id = '00000000-0000-0000-0000-000000000803'),
  'modération des contributions auditée avec son auteur');
reset role;

-- Il reste toujours au moins un administrateur
delete from public.user_roles where role = 'admin' and user_id <> '00000000-0000-0000-0000-000000000804';
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000804');
select test.throws($$select public.admin_set_role('00000000-0000-0000-0000-000000000804', 'user')$$, 'P0001', 'impossible de retirer le dernier admin');
select public.admin_adjust_xp('00000000-0000-0000-0000-000000000801', 5, 'Geste commercial après un incident');
reset role;
select test.ok(exists (select 1 from public.audit_log where target_table = 'xp_events' and details ->> 'reason' = 'admin_adjustment'), 'ajustement d''XP audité');

select 'TOUS LES TESTS SQL DE LA COMMUNAUTÉ ET DE L''ADMINISTRATION SONT PASSÉS';

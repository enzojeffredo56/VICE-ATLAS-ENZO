-- =====================================================================
-- Tests de permissions — phase 2 (carte, carnet, guide)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

-- Comptes de test (en superutilisateur)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'joueur-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'joueur-b@test.local'),
  ('00000000-0000-0000-0000-0000000000cc', 'moderateur@test.local'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@test.local');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000cc', 'moderator'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin');
-- Un lieu et un guide en brouillon, invisibles du public
insert into public.places (slug, name, category_id, x, y, district, description, status)
values ('lieu-brouillon', 'Lieu brouillon', 'point-interet', 10, 10, 'Test', 'Lieu non publié pour les tests.', 'draft');

-- ---------- Visiteur anonyme ----------
set role anon;
select test.login(null);
select test.ok((select count(*) from public.places) = 19, 'anon voit les 19 lieux publiés');
select test.ok(not exists (select 1 from public.places where slug = 'lieu-brouillon'), 'anon ne voit pas les brouillons');
select test.ok((select count(*) from public.guides) = 5, 'anon voit les 5 guides publiés');
select test.ok((select count(*) from public.progress_items) = 15, 'anon voit le catalogue du carnet');
select test.ok((select count(*) from public.guide_places) > 0, 'anon voit les lieux liés aux guides publiés');
select test.throws($$insert into public.places (slug, name, category_id, x, y, district, description)
  values ('pirate', 'Pirate', 'stunt', 1, 1, 'Test', 'Tentative anonyme.')$$, '42501', 'anon ne peut pas créer de lieu');
select test.throws($$select public.save_guide('{}'::jsonb)$$, '42501', 'anon ne peut pas appeler save_guide');
select test.ok((select count(*) from public.user_objectives) = 0, 'anon ne voit aucun objectif de joueur');
select test.throws($$insert into public.user_objectives (user_id, title)
  values ('00000000-0000-0000-0000-00000000000a', 'Objectif anonyme')$$, '42501', 'anon ne peut pas écrire d''objectif');
reset role;

-- ---------- Joueur A ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-00000000000a');
insert into public.user_place_marks (place_id, is_favorite, visited_at)
  select id, true, now() from public.places where slug = 'rampe-des-docks';
insert into public.user_objectives (title) values ('Visiter tous les panoramas');
insert into public.user_progress (item_id) select id from public.progress_items where slug = 'mission-introduction';
insert into public.user_guide_favorites (guide_id) select id from public.guides where slug = 'tour-de-la-pointe-turquoise';
insert into public.user_guide_steps (guide_id, step_index) select id, 0 from public.guides where slug = 'tour-de-la-pointe-turquoise';
select test.ok((select count(*) from public.user_place_marks) = 1, 'joueur A voit sa marque de lieu');
select test.throws($$insert into public.user_objectives (user_id, title)
  values ('00000000-0000-0000-0000-00000000000b', 'Objectif pour quelqu''un d''autre')$$, '42501',
  'joueur A ne peut pas écrire dans les données de B');
select test.throws($$insert into public.user_objectives (title) values ('ok')$$, '23514', 'objectif de moins de 3 caractères refusé');
select test.throws($$insert into public.user_guide_steps (guide_id, step_index)
  select id, 40 from public.guides limit 1$$, '23514', 'index d''étape hors limites refusé');
select test.throws($$insert into public.user_roles (user_id, role)
  values ('00000000-0000-0000-0000-00000000000a', 'admin')$$, '42501', 'joueur A ne peut pas se nommer admin');
select test.ok((select count(*) from public.user_roles) = 0, 'joueur A (sans rôle) ne voit aucune ligne de rôle');
select test.throws($$select public.save_guide('{"slug":"x"}'::jsonb)$$, '42501', 'un joueur ne peut pas enregistrer de guide');
update public.places set name = 'Piraté' where slug = 'rampe-des-docks';
select test.ok((select name from public.places where slug = 'rampe-des-docks') = 'Rampe des Docks',
  'la modification d''un lieu par un joueur n''a aucun effet');
reset role;

-- ---------- Joueur B : isolation ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-00000000000b');
select test.ok((select count(*) from public.user_place_marks) = 0, 'joueur B ne voit pas les marques de A');
select test.ok((select count(*) from public.user_objectives) = 0, 'joueur B ne voit pas les objectifs de A');
select test.ok((select count(*) from public.user_progress) = 0, 'joueur B ne voit pas la progression de A');
delete from public.user_objectives;
reset role;
select test.ok((select count(*) from public.user_objectives) = 1, 'la suppression par B n''a pas touché les objectifs de A');

-- ---------- Limite anti-spam des objectifs ----------
insert into public.user_objectives (user_id, title)
  select '00000000-0000-0000-0000-00000000000a', 'Objectif ' || g from generate_series(2, 100) g;
set role authenticated;
select test.login('00000000-0000-0000-0000-00000000000a');
select test.throws($$insert into public.user_objectives (title) values ('Un de trop')$$, 'P0001', 'le 101e objectif est refusé');
reset role;

-- ---------- Modérateur ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000cc');
select test.ok(exists (select 1 from public.places where slug = 'lieu-brouillon'), 'le modérateur voit les brouillons');
select test.ok(public.save_guide(jsonb_build_object(
  'slug', 'guide-de-test', 'title', 'Guide de test', 'category_id', 'exploration',
  'summary', 'Un résumé suffisamment long pour le test.', 'intro', 'Une introduction suffisamment longue.',
  'steps', '[{"title":"Étape","body":"Corps de l''étape de test."}]'::jsonb,
  'status', 'draft', 'place_slugs', '["rampe-des-docks","tremplin-de-la-pointe"]'::jsonb)) is not null,
  'le modérateur crée un guide en brouillon');
select test.ok((select count(*) from public.guide_places gp join public.guides g on g.id = gp.guide_id
  where g.slug = 'guide-de-test') = 2, 'les lieux liés sont enregistrés avec le guide');
select test.ok((select published_at is null from public.guides where slug = 'guide-de-test'), 'un brouillon n''a pas de date de publication');
select test.ok(public.save_guide(jsonb_build_object(
  'id', (select id from public.guides where slug = 'guide-de-test'),
  'slug', 'guide-de-test', 'title', 'Guide de test publié', 'category_id', 'exploration',
  'summary', 'Un résumé suffisamment long pour le test.', 'intro', 'Une introduction suffisamment longue.',
  'steps', '[{"title":"Étape","body":"Corps de l''étape de test."}]'::jsonb,
  'status', 'published', 'place_slugs', '["rampe-des-docks"]'::jsonb)) is not null, 'le modérateur publie le guide');
select test.ok((select published_at is not null from public.guides where slug = 'guide-de-test'), 'la publication date le guide');
select test.ok((select count(*) from public.guide_places gp join public.guides g on g.id = gp.guide_id
  where g.slug = 'guide-de-test') = 1, 'les lieux liés sont remplacés en bloc');
select test.throws($$select public.save_guide(jsonb_build_object(
  'slug', 'tour-de-la-pointe-turquoise', 'title', 'Doublon de slug', 'category_id', 'exploration',
  'summary', 'Un résumé suffisamment long pour le test.', 'intro', 'Une introduction suffisamment longue.',
  'steps', '[{"title":"Étape","body":"Corps"}]'::jsonb))$$, '23505', 'un slug déjà utilisé est refusé');
select test.throws($$select public.save_guide(jsonb_build_object(
  'slug', 'guide-lieu-inconnu', 'title', 'Lieu inconnu', 'category_id', 'exploration',
  'summary', 'Un résumé suffisamment long pour le test.', 'intro', 'Une introduction suffisamment longue.',
  'steps', '[{"title":"Étape","body":"Corps"}]'::jsonb, 'place_slugs', '["n-existe-pas"]'::jsonb))$$, '23503',
  'un lieu lié inconnu annule tout l''enregistrement');
select test.ok(not exists (select 1 from public.guides where slug = 'guide-lieu-inconnu'), 'aucun guide partiel n''est créé (transaction)');
delete from public.guides where slug = 'guide-de-test';
select test.ok(exists (select 1 from public.guides where slug = 'guide-de-test'), 'le modérateur ne peut pas supprimer un guide');
reset role;

-- ---------- Administrateur ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-0000000000ad');
delete from public.guides where slug = 'guide-de-test';
select test.ok(not exists (select 1 from public.guides where slug = 'guide-de-test'), 'l''admin peut supprimer un guide');
select test.ok((select count(*) from public.user_roles) = 2, 'l''admin voit tous les rôles');
select test.ok((select count(*) from public.user_objectives) = 0, 'l''admin ne voit pas les objectifs privés des joueurs');
reset role;

select 'TOUS LES TESTS SQL SONT PASSÉS';

-- =====================================================================
-- Tests — phase 4 (comptes, profils, parrainage, synchronisation)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

-- Inscriptions (le déclencheur crée les profils)
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000401', 'parrain@test.local', '{"username":"Neon_Rider"}');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000402', 'filleul@test.local',
   jsonb_build_object('username', 'neon_rider', 'referral_code',
     lower((select referral_code from public.profiles where id = '00000000-0000-0000-0000-000000000401'))));
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000403', 'malin@test.local', '{"username":"x!","referral_code":"INCONNU1"}');

select test.ok((select username::text from public.profiles where id = '00000000-0000-0000-0000-000000000401') = 'Neon_Rider',
  'le pseudo demandé est attribué');
select test.ok((select username::text from public.profiles where id = '00000000-0000-0000-0000-000000000402') like 'joueur_%',
  'un pseudo déjà pris (casse différente) donne un pseudo provisoire');
select test.ok((select username::text from public.profiles where id = '00000000-0000-0000-0000-000000000403') like 'joueur_%',
  'un pseudo invalide donne un pseudo provisoire');
select test.ok((select referred_by from public.profiles where id = '00000000-0000-0000-0000-000000000402')
  = '00000000-0000-0000-0000-000000000401', 'le code de parrainage (même en minuscules) relie le filleul');
select test.ok((select referred_by is null from public.profiles where id = '00000000-0000-0000-0000-000000000403'),
  'un code inconnu n''attribue aucun parrain');
select test.ok((select count(distinct referral_code) from public.profiles) = (select count(*) from public.profiles),
  'chaque joueur a un code de parrainage unique');
select test.throws($$update public.profiles set referred_by = id where id = '00000000-0000-0000-0000-000000000401'$$,
  '23514', 'l''auto-parrainage est impossible même en base');

-- ---------- Visiteur ----------
set role anon;
select test.login(null);
select test.ok((select count(*) from public.profiles) = 0, 'profils privés par défaut : anon ne voit rien');
select test.ok(public.username_available('Libre_123'), 'pseudo libre disponible');
select test.ok(not public.username_available('NEON_RIDER'), 'pseudo pris (insensible à la casse)');
select test.ok(not public.username_available('a b'), 'pseudo invalide refusé');
reset role;

-- ---------- Joueur 401 ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000401');
update public.profiles set bio = 'Fan de cascades', is_public = true where id = auth.uid();
select test.ok((select bio from public.profiles where id = auth.uid()) = 'Fan de cascades', 'le joueur modifie sa bio');
select test.throws($$update public.profiles set referred_by = null where id = auth.uid()$$, '42501',
  'le joueur ne peut pas modifier son parrain');
select test.throws($$update public.profiles set referral_code = 'AAAAAAAA' where id = auth.uid()$$, '42501',
  'le joueur ne peut pas changer son code de parrainage');
update public.profiles set bio = 'Piraté' where id = '00000000-0000-0000-0000-000000000402';
reset role;
select test.ok((select bio is null from public.profiles where id = '00000000-0000-0000-0000-000000000402'),
  'un joueur ne peut pas modifier le profil d''un autre');
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000401');
select test.throws($$update public.profiles set avatar_url = 'http://non-securise.test/a.png' where id = auth.uid()$$, '23514',
  'un avatar doit être en https');
select test.throws($$update public.profiles set bio = repeat('x', 281) where id = auth.uid()$$, '23514', 'bio limitée à 280 caractères');

-- Synchronisation : fusion puis remplacement
select test.ok((public.sync_user_data(jsonb_build_object(
    'places', jsonb_build_object('rampe-des-docks', jsonb_build_object('favorite', true, 'visitedAt', '2026-11-10T10:00:00.000Z'),
                                 'lieu-inexistant', jsonb_build_object('favorite', true)),
    'progress', jsonb_build_object('mission-introduction', '2026-11-11T10:00:00.000Z'),
    'objectives', jsonb_build_array(jsonb_build_object('id', 'pas-un-uuid', 'title', 'Tout visiter', 'done', false, 'createdAt', '2026-11-11T10:00:00.000Z'),
                                    jsonb_build_object('id', 'x', 'title', 'ab', 'done', false)),
    'guideFavorites', jsonb_build_array('tour-de-la-pointe-turquoise'),
    'guideSteps', jsonb_build_object('tour-de-la-pointe-turquoise', jsonb_build_array(0, 2, 99))
  ), 'merge') -> 'places' -> 'rampe-des-docks' ->> 'favorite') = 'true', 'fusion : favori enregistré');
select test.ok((select count(*) from public.user_objectives) = 1, 'fusion : objectif trop court ignoré, identifiant invalide régénéré');
select test.ok((select count(*) from public.user_guide_steps) = 2, 'fusion : étape hors limites ignorée');
select test.ok((public.sync_user_data('{"places":{"rampe-des-docks":{"visitedAt":"2026-11-01T10:00:00.000Z"}}}', 'merge')
  -> 'places' -> 'rampe-des-docks' ->> 'visitedAt') = '2026-11-01T10:00:00.000Z', 'fusion : la visite la plus ancienne est gardée');
select test.ok((public.sync_user_data('{"places":{},"progress":{},"objectives":[],"guideFavorites":[],"guideSteps":{}}', 'replace')
  -> 'places') = '{}'::jsonb, 'remplacement : l''état envoyé remplace tout');
select test.ok((select count(*) from public.user_objectives) = 0, 'remplacement : objectifs supprimés');
select test.throws($$select public.sync_user_data('{}', 'detruire')$$, '22023', 'mode inconnu refusé');
reset role;

set role anon;
select test.login(null);
select test.ok((select count(*) from public.profiles) = 1, 'un profil rendu public devient visible');
select test.throws($$select public.sync_user_data('{}', 'pull')$$, '42501', 'anon ne peut pas synchroniser');
reset role;

select 'TOUS LES TESTS SQL DES COMPTES SONT PASSÉS';

-- =====================================================================
-- Tests de permissions — phase 3 (comparateur Miami)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000003aa', 'joueur3@test.local'),
  ('00000000-0000-0000-0000-0000000003cc', 'moderateur3@test.local')
on conflict do nothing;
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000003cc', 'moderator')
on conflict (user_id) do update set role = excluded.role;
-- Une correspondance en brouillon, invisible du public
insert into public.place_correspondences (place_id, miami_spot_id, summary, publication)
select p.id, m.id, 'Brouillon de test pour le comparateur.', 'draft'
  from public.places p, public.miami_spots m where p.slug = 'tour-radio-de-la-palmeraie' and m.slug = 'wynwood';

set role anon;
select test.login(null);
select test.ok((select count(*) from public.miami_spots) = 9, 'anon voit les 9 lieux de Miami');
select test.ok((select count(*) from public.place_correspondences) = 9, 'anon ne voit que les 9 correspondances publiées');
select test.throws($$insert into public.miami_spots (slug, name, neighborhood, x, y, description)
  values ('pirate', 'Pirate', 'Test', 1, 1, 'Tentative anonyme.')$$, '42501', 'anon ne peut pas ajouter de lieu réel');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-0000000003aa');
select test.throws($$insert into public.place_correspondences (place_id, miami_spot_id, summary)
  select p.id, m.id, 'Proposition directe interdite.' from public.places p, public.miami_spots m
  where p.slug = 'club-nautique' and m.slug = 'wynwood'$$, '42501', 'un joueur ne peut pas créer de correspondance');
update public.place_correspondences set status = 'verifie', verified_at = now();
select test.ok(not exists (select 1 from public.place_correspondences where status = 'verifie'),
  'un joueur ne peut pas marquer une correspondance comme vérifiée');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-0000000003cc');
select test.ok((select count(*) from public.place_correspondences) = 10, 'le modérateur voit aussi les brouillons');
select test.throws($$update public.place_correspondences set status = 'verifie'
  where summary = 'Brouillon de test pour le comparateur.'$$, '23514', '« vérifié » exige une date et une source');
update public.place_correspondences
   set status = 'verifie', verified_at = now(), verified_by = auth.uid(),
       sources = '[{"label":"Source de test","url":"https://example.com"}]'
 where summary = 'Brouillon de test pour le comparateur.';
select test.ok(exists (select 1 from public.place_correspondences where status = 'verifie'), 'le modérateur vérifie avec preuve');
select test.throws($$insert into public.place_correspondences (place_id, miami_spot_id, summary)
  select p.id, m.id, 'Doublon du rapprochement.' from public.places p, public.miami_spots m
  where p.slug = 'phare-du-port-neon' and m.slug = 'cape-florida-light'$$, '23505', 'une même paire ne peut exister deux fois');
delete from public.place_correspondences where summary = 'Brouillon de test pour le comparateur.';
select test.ok(exists (select 1 from public.place_correspondences where summary = 'Brouillon de test pour le comparateur.'),
  'le modérateur ne peut pas supprimer de correspondance');
reset role;

select 'TOUS LES TESTS SQL DU COMPARATEUR SONT PASSÉS';

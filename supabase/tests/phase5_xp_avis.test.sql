-- =====================================================================
-- Tests — phase 5 (XP, avis, badges, notifications)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000501', 'critique@test.local', '{"username":"Critique"}'),
  ('00000000-0000-0000-0000-000000000502', 'fan@test.local', '{"username":"Fan_Absolu"}'),
  ('00000000-0000-0000-0000-000000000503', 'modo5@test.local', '{"username":"Modo_5"}'),
  ('00000000-0000-0000-0000-000000000504', 'admin5@test.local', '{"username":"Admin_5"}');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000503', 'moderator'), ('00000000-0000-0000-0000-000000000504', 'admin');

select test.ok(public.level_for_xp(0) = 1 and public.level_for_xp(99) = 1 and public.level_for_xp(100) = 2
  and public.level_for_xp(7500) = 10 and public.level_for_xp(99999) = 10 and public.level_for_xp(-5) = 1, 'seuils de niveaux');

-- ---------- Avis ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000501');
select test.throws($$insert into public.reviews (rating, comment) values (1, 'trop court')$$, '23514', 'commentaire de moins de 30 caractères refusé');
select test.throws($$insert into public.reviews (rating, comment) values (6, repeat('a', 40))$$, '23514', 'note hors de 1 à 5 refusée');
insert into public.reviews (rating, comment) values (1, 'La carte manque encore de lieux et le carnet est trop simple.');
select test.throws($$insert into public.reviews (rating, comment) values (2, 'Un deuxième avis pour gagner plus d''XP, bien tenté.')$$,
  '23505', 'un seul avis par joueur');
select test.throws($$insert into public.reviews (user_id, rating, comment) values ('00000000-0000-0000-0000-000000000502', 5, repeat('b', 40))$$,
  '42501', 'impossible de déposer un avis au nom d''un autre');
select test.throws($$update public.reviews set status = 'approved'$$, '42501', 'le joueur ne peut pas approuver son avis');
select test.throws($$select public.moderate_review((select id from public.reviews limit 1), 'approved')$$, '42501',
  'le joueur ne peut pas modérer');
select test.throws($$insert into public.xp_events (user_id, amount, reason, source_key)
  values (auth.uid(), 1000, 'review_approved', 'triche')$$, '42501', 'le joueur ne peut pas s''attribuer d''XP');
reset role;

set role authenticated;
select test.login('00000000-0000-0000-0000-000000000502');
insert into public.reviews (rating, comment) values (5, 'Super plateforme, la carte et la roulette sont géniales !');
reset role;

set role anon;
select test.login(null);
select test.ok((select count(*) from public.reviews) = 0, 'les avis en attente ne sont pas publics');
reset role;

-- ---------- Modération ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000503');
select test.throws($$select public.moderate_review((select id from public.reviews where rating = 1), 'rejected', 'non')$$, '22023',
  'un refus doit être motivé');
select public.moderate_review((select id from public.reviews where rating = 1), 'approved');
select public.moderate_review((select id from public.reviews where rating = 5), 'approved');
-- Une seconde approbation ne redonne pas d'XP
select public.moderate_review((select id from public.reviews where rating = 1), 'approved');
reset role;

select test.ok(private.user_xp('00000000-0000-0000-0000-000000000501') = 20, 'note 1/5 : +20 XP');
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000502') = 20, 'note 5/5 : +20 XP, exactement la même récompense');
select test.ok((select count(*) from public.xp_events where reason = 'review_approved') = 2, 'aucune double récompense');
select test.ok((select count(*) from public.user_badges where badge_id = 'premier-avis') = 2, 'badge Premier avis attribué');
select test.ok((select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-000000000501') >= 2,
  'le joueur est notifié (XP + badge)');

set role anon;
select test.login(null);
select test.ok((select count(*) from public.reviews) = 2, 'les avis approuvés (y compris négatifs) sont publics');
select test.ok((public.review_stats() ->> 'average')::numeric = 3, 'moyenne des avis approuvés');
reset role;

-- Modifier son avis le renvoie en modération, sans nouvelle récompense
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000501');
update public.reviews set rating = 2, comment = 'Mieux après la mise à jour, mais il manque encore des lieux.' where user_id = auth.uid();
select test.ok((select status from public.reviews where user_id = auth.uid()) = 'pending', 'un avis modifié repasse en modération');
select test.ok((select count(*) from public.xp_events) = 1, 'le joueur ne voit que ses propres XP');
reset role;
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000503');
select public.moderate_review((select id from public.reviews where user_id = '00000000-0000-0000-0000-000000000501'), 'approved');
reset role;
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000501') = 20, 'réapprobation : toujours 20 XP');

-- ---------- Profil complété ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000502');
select test.ok((public.claim_profile_completion() ->> 'complete')::boolean = false, 'profil incomplet : pas d''XP');
update public.profiles set bio = 'Fan de la première heure', avatar_url = 'https://exemple.supabase.co/a.webp' where id = auth.uid();
select test.ok((public.claim_profile_completion() ->> 'granted')::boolean, 'profil complété : +30 XP');
select test.ok((public.claim_profile_completion() ->> 'granted')::boolean = false, 'profil complété : une seule fois');
select test.ok((public.player_progression(auth.uid()) ->> 'xp')::int = 50 and (public.player_progression(auth.uid()) ->> 'level')::int = 1,
  'progression : 50 XP, niveau 1');
reset role;

-- ---------- Corrections par l'administration ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000503');
select test.throws($$select public.admin_reverse_xp((select min(id) from public.xp_events), 'Justification suffisante')$$, '42501',
  'un modérateur ne peut pas annuler des XP');
reset role;
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000504');
select test.throws($$select public.admin_reverse_xp((select min(id) from public.xp_events), 'court')$$, '23514', 'annulation sans justification refusée');
select test.ok(public.admin_reverse_xp((select min(id) from public.xp_events where user_id = '00000000-0000-0000-0000-000000000502'),
  'Avis supprimé à la demande du joueur') is not null, 'l''admin annule un gain avec justification');
select test.throws($$select public.admin_reverse_xp((select min(id) from public.xp_events where user_id = '00000000-0000-0000-0000-000000000502'),
  'Deuxième annulation du même gain')$$, '23505', 'un gain ne s''annule qu''une fois');
select test.ok(public.admin_adjust_xp('00000000-0000-0000-0000-000000000502', 15, 'Compensation après un bug de la carte') is not null,
  'ajustement justifié');
reset role;
select test.ok(private.user_xp('00000000-0000-0000-0000-000000000502') = 45, 'solde après annulation et ajustement (50 - 20 + 15)');
select test.throws($$update public.xp_events set amount = 9999$$, '42501', 'le registre des XP est infalsifiable');

-- ---------- Badges d'exploration ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000501');
insert into public.user_place_marks (place_id, visited_at) select id, now() from public.places where status = 'published' limit 10;
select test.ok(exists (select 1 from public.user_badges where user_id = auth.uid() and badge_id = 'explorateur'), 'badge Explorateur à 10 lieux');
insert into public.user_place_marks (place_id, visited_at) select id, now() from public.places where status = 'published'
  on conflict (user_id, place_id) do update set visited_at = excluded.visited_at;
select test.ok(exists (select 1 from public.user_badges where user_id = auth.uid() and badge_id = 'grand-explorateur'),
  'badge Grand explorateur quand tous les lieux sont visités');
select test.ok((select count(*) from public.notifications where kind = 'badge') >= 3, 'notifications de badges');
update public.notifications set read_at = now() where user_id = auth.uid();
select test.ok(not exists (select 1 from public.notifications where read_at is null), 'le joueur marque ses notifications comme lues');
select test.throws($$update public.notifications set title = 'Piraté'$$, '42501', 'le contenu d''une notification n''est pas modifiable');
reset role;

-- Progression d'un profil privé : invisible des autres
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000502');
select test.ok(public.player_progression('00000000-0000-0000-0000-000000000501') is null, 'progression d''un profil privé masquée');
reset role;

-- ---------- Anti-spam ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000000501');
update public.reviews set comment = 'Modification numéro deux de mon avis, toujours constructif.' where user_id = auth.uid();
update public.reviews set comment = 'Modification numéro trois de mon avis, toujours constructif.' where user_id = auth.uid();
update public.reviews set comment = 'Modification numéro quatre de mon avis, toujours constructif.' where user_id = auth.uid();
select test.throws($$update public.reviews set comment = 'Modification de trop dans la même heure, spam bloqué.' where user_id = auth.uid()$$,
  'P0429', 'trop de modifications en une heure : bloqué');
reset role;

select 'TOUS LES TESTS SQL XP / AVIS / BADGES SONT PASSÉS';

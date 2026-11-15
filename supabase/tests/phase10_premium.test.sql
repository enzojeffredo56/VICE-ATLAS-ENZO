-- =====================================================================
-- Tests — phase 10 (VICE ATLAS PLUS, Stripe, parrainage modèle B)
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001001', 'parrain@plus.local', '{"username":"Parrain_Plus"}');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001002', 'filleul1@plus.local',
   jsonb_build_object('username', 'Filleul_Un', 'referral_code', (select referral_code from public.profiles where id = '00000000-0000-0000-0000-000000001001'))),
  ('00000000-0000-0000-0000-000000001003', 'filleul2@plus.local',
   jsonb_build_object('username', 'Filleul_Deux', 'referral_code', (select referral_code from public.profiles where id = '00000000-0000-0000-0000-000000001001'))),
  ('00000000-0000-0000-0000-000000001004', 'filleul3@plus.local',
   jsonb_build_object('username', 'Filleul_Trois', 'referral_code', (select referral_code from public.profiles where id = '00000000-0000-0000-0000-000000001001'))),
  ('00000000-0000-0000-0000-000000001005', 'admin10@plus.local', '{"username":"Admin_10"}');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-000000001005', 'admin');

-- ---------- Le navigateur ne peut rien écrire ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000001002');
select test.throws($$select public.billing_link_customer(auth.uid(), 'cus_Pirate')$$, '42501', 'un joueur ne peut pas appeler les fonctions du webhook');
select test.throws($$insert into public.subscriptions (id, user_id, status) values ('sub_Faux', auth.uid(), 'active')$$, '42501',
  'un joueur ne peut pas s''offrir un abonnement');
select test.throws($$select public.process_referral_rewards()$$, '42501', 'un joueur ne peut pas déclencher les récompenses');
select test.ok(not public.is_premium(), 'pas Premium sans abonnement');
reset role;

-- ---------- Webhook (rôle service) ----------
set role service_role;
select test.ok(public.billing_claim_event('evt_1', 'invoice.paid'), 'nouvel événement Stripe accepté');
select public.billing_mark_event_processed('evt_1');
select test.ok(not public.billing_claim_event('evt_1', 'invoice.paid'), 'un événement déjà traité est ignoré (idempotence)');
select test.ok(public.billing_claim_event('evt_2', 'invoice.paid') and public.billing_claim_event('evt_2', 'invoice.paid'),
  'un événement non terminé peut être retraité (nouvelle tentative de Stripe)');

select public.billing_link_customer('00000000-0000-0000-0000-000000001001', 'cus_Parrain');
select public.billing_link_customer('00000000-0000-0000-0000-000000001002', 'cus_F1');
select public.billing_link_customer('00000000-0000-0000-0000-000000001003', 'cus_F2');
select public.billing_link_customer('00000000-0000-0000-0000-000000001004', 'cus_F3');
select public.billing_upsert_subscription('sub_F1', 'cus_F1', 'active', 'price_Plus', now() + interval '20 days', false, null);
select public.billing_upsert_subscription('sub_F2', 'cus_F2', 'active', 'price_Plus', now() + interval '20 days', false, null);
select public.billing_upsert_subscription('sub_F3', 'cus_F3', 'active', 'price_Plus', now() + interval '20 days', false, null);
select public.billing_upsert_subscription('sub_P', 'cus_Parrain', 'active', 'price_Plus', now() + interval '20 days', false, null);
-- Paiements : il y a 15 jours (délai écoulé) ; F3 paie avec la même carte que le parrain
select public.billing_record_invoice_paid('in_P1', 'cus_Parrain', 'sub_P', 499, 'EUR', now() - interval '40 days', 'https://invoice.stripe.com/p1', 'fp_PARRAIN');
select public.billing_record_invoice_paid('in_F1', 'cus_F1', 'sub_F1', 499, 'EUR', now() - interval '15 days', 'https://invoice.stripe.com/f1', 'fp_F1');
select public.billing_record_invoice_paid('in_F1b', 'cus_F1', 'sub_F1', 499, 'EUR', now() - interval '1 day', 'https://invoice.stripe.com/f1b', 'fp_F1');
select public.billing_record_invoice_paid('in_F2', 'cus_F2', 'sub_F2', 499, 'EUR', now() - interval '15 days', 'https://invoice.stripe.com/f2', 'fp_F2');
select public.billing_record_invoice_paid('in_F3', 'cus_F3', 'sub_F3', 499, 'EUR', now() - interval '15 days', 'https://invoice.stripe.com/f3', 'fp_PARRAIN');
select public.billing_record_invoice_paid('in_F1', 'cus_F1', 'sub_F1', 499, 'EUR', now() - interval '15 days', 'https://invoice.stripe.com/f1', 'fp_F1');
reset role;

select test.ok((select count(*) from public.referral_rewards) = 3, 'une récompense en attente par filleul, au premier paiement seulement');
select test.ok((select count(*) from public.payments where id = 'in_F1') = 1, 'un paiement rejoué n''est pas dupliqué');
select test.ok((select count(*) from public.referral_rewards where referee_id = '00000000-0000-0000-0000-000000001001') = 0,
  'le parrain (sans parrain) ne génère aucune récompense');

-- F2 est remboursé pendant le délai
set role service_role;
select public.billing_record_refund('in_F2', 499);
select test.ok((public.process_referral_rewards() ->> 'granted')::int = 1, 'une seule récompense accordée (F1)');
select test.ok((public.process_referral_rewards() ->> 'granted')::int = 0, 'le traitement est idempotent');
reset role;

select test.ok((select status from public.referral_rewards where referee_id = '00000000-0000-0000-0000-000000001003') = 'cancelled',
  'remboursement pendant le délai : récompense annulée');
select test.ok((select cancelled_reason from public.referral_rewards where referee_id = '00000000-0000-0000-0000-000000001004') = 'Même moyen de paiement que le parrain',
  'même carte que le parrain : fraude détectée');
select test.ok((select coalesce(sum(months), 0) from public.premium_credits where user_id = '00000000-0000-0000-0000-000000001001') = 1,
  'le parrain a un mois offert');

-- ---------- Côté parrain ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000001001');
select test.ok(public.is_premium(), 'le parrain abonné est Premium');
select test.ok((public.my_billing() ->> 'creditsAvailable')::int = 1, 'crédit disponible affiché');
select test.ok((public.my_referrals() ->> 'signups')::int = 3, 'trois filleuls inscrits');
select test.ok((public.my_referrals() -> 'rewards' -> 0 ->> 'referee') = 'Filleul', 'le pseudo d''un filleul au profil privé reste masqué');
select test.ok((select count(*) from public.payments) = 1, 'le parrain ne voit que ses propres paiements');
reset role;

-- Application du crédit aux prochaines échéances (solde Stripe)
set role service_role;
select test.ok((select count(*) from public.billing_credits_to_apply()) = 1, 'un crédit à appliquer');
select public.billing_mark_credit_applied((select credit_id from public.billing_credits_to_apply() limit 1), 'cbtxn_1');
select test.ok((select count(*) from public.billing_credits_to_apply()) = 0, 'crédit appliqué une seule fois');
-- Litige tardif sur le paiement de F1 : la récompense est reprise
select public.billing_record_refund('in_F1', 0, true);
reset role;
select test.ok((select status from public.referral_rewards where referee_id = '00000000-0000-0000-0000-000000001002') = 'cancelled',
  'litige après octroi : récompense annulée');
select test.ok((select count(*) from public.premium_credits where months = -1) = 1, 'reprise du mois enregistrée dans le registre');

-- Abonnement résilié : plus Premium
set role service_role;
select public.billing_upsert_subscription('sub_P', 'cus_Parrain', 'canceled', 'price_Plus', now() - interval '1 day', false, now());
reset role;
set role authenticated;
select test.login('00000000-0000-0000-0000-000000001001');
select test.ok(not public.is_premium(), 'abonnement résilié : plus Premium');
reset role;

-- ---------- Le parrain ne peut pas être changé ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000001002');
select test.throws($$update public.profiles set referred_by = null where id = auth.uid()$$, '42501', 'le filleul ne peut pas changer de parrain');
reset role;

-- ---------- Administration ----------
set role authenticated;
select test.login('00000000-0000-0000-0000-000000001005');
select test.ok((select count(*) from public.referral_rewards) = 3, 'l''admin voit toutes les récompenses');
select test.throws($$select public.admin_cancel_referral_reward((select id from public.referral_rewards limit 1), 'court')$$, '22023',
  'annulation sans justification refusée');
update public.premium_features set enabled = true where key = 'badge_plus';
select test.ok((select enabled from public.premium_features where key = 'badge_plus'), 'l''admin configure les avantages Premium');
reset role;
set role authenticated;
select test.login('00000000-0000-0000-0000-000000001002');
update public.premium_features set enabled = true where key = 'themes_carte';
select test.ok(not (select enabled from public.premium_features where key = 'themes_carte'), 'un joueur ne modifie pas les avantages Premium');
reset role;

select 'TOUS LES TESTS SQL DE VICE ATLAS PLUS ET DU PARRAINAGE SONT PASSÉS';

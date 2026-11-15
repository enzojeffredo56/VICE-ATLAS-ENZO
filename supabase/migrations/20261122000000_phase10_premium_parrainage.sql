-- =====================================================================
-- VICE ATLAS — Migration phase 10 : VICE ATLAS PLUS et parrainage Premium
-- ---------------------------------------------------------------------
-- Paiements : Stripe est la source de vérité. La base garde une copie
-- mise à jour UNIQUEMENT par le webhook signé (rôle service), jamais par
-- le navigateur. Chaque événement Stripe n'est traité qu'une fois.
--
-- Parrainage (modèle B) :
--   un filleul qui paie son premier abonnement VICE ATLAS PLUS donne droit,
--   après 14 jours sans remboursement ni litige (délai anti-fraude), à
--   UN MOIS PREMIUM OFFERT au parrain. Crédits cumulables, appliqués aux
--   prochaines échéances (solde client Stripe). Pas un remboursement bancaire.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fonctionnalités Premium configurables (à valider avant commercialisation)
-- ---------------------------------------------------------------------
create table public.premium_features (
  key          text primary key check (key ~ '^[a-z0-9_]{3,40}$'),
  label        text not null check (char_length(label) between 3 and 80),
  description  text not null check (char_length(description) <= 300),
  premium_only boolean not null default true,
  enabled      boolean not null default false,
  sort_order   integer not null default 0
);
comment on table public.premium_features is 'Liste éditable des avantages Premium. enabled = false tant qu''ils ne sont pas validés.';
insert into public.premium_features (key, label, description, sort_order) values
  ('badge_plus', 'Badge VICE ATLAS PLUS', 'Un badge distinctif sur le profil public.', 1),
  ('themes_carte', 'Thèmes de carte', 'Des variantes visuelles de la carte (nuit, néon, plan).', 2),
  ('stats_detaillees', 'Statistiques détaillées', 'Historique complet de progression et graphiques personnels.', 3),
  ('salons_etendus', 'Salons étendus', 'Salons GTA Roulette jusqu''à 24 joueurs et défis de salon illimités.', 4)
on conflict (key) do nothing;
alter table public.premium_features enable row level security;
create policy "premium_features: lecture publique" on public.premium_features for select to anon, authenticated using (true);
create policy "premium_features: gestion admin" on public.premium_features for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- Facturation (copie des données Stripe)
-- ---------------------------------------------------------------------
create table public.billing_customers (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  created_at         timestamptz not null default now()
);

create table public.subscriptions (
  id                   text primary key check (id ~ '^sub_[A-Za-z0-9]+$'),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  status               text not null check (status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  price_id             text,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id, status);

create table public.payments (
  id                  text primary key check (id ~ '^in_[A-Za-z0-9]+$'),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  subscription_id     text,
  amount_paid         integer not null check (amount_paid >= 0),
  currency            text not null check (currency ~ '^[a-z]{3}$'),
  paid_at             timestamptz not null,
  hosted_invoice_url  text check (hosted_invoice_url is null or hosted_invoice_url ~ '^https://'),
  card_fingerprint    text,
  refunded_amount     integer not null default 0 check (refunded_amount >= 0),
  disputed            boolean not null default false,
  created_at          timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id, paid_at desc);
create index payments_fingerprint_idx on public.payments (card_fingerprint);

-- Idempotence des webhooks Stripe
create table private.stripe_events (
  id           text primary key,
  type         text not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------------------
-- Parrainage : récompenses et crédits de mois offerts
-- ---------------------------------------------------------------------
create type public.referral_status as enum ('pending', 'granted', 'cancelled');

create table public.referral_rewards (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid not null references public.profiles (id) on delete cascade,
  referee_id       uuid not null unique references public.profiles (id) on delete cascade, -- une seule récompense par filleul
  invoice_id       text not null unique references public.payments (id) on delete cascade,
  status           public.referral_status not null default 'pending',
  eligible_at      timestamptz not null,
  decided_at       timestamptz,
  cancelled_reason text,
  created_at       timestamptz not null default now(),
  check (referrer_id <> referee_id)
);
create index referral_rewards_pending_idx on public.referral_rewards (eligible_at) where status = 'pending';
create index referral_rewards_referrer_idx on public.referral_rewards (referrer_id);

-- Registre des mois offerts : +1 à l'octroi, -1 si annulé avant application
create table public.premium_credits (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  months             integer not null check (months in (-1, 1)),
  reason             text not null check (reason in ('referral', 'referral_reversal', 'admin')),
  reward_id          uuid references public.referral_rewards (id) on delete set null,
  applied_at         timestamptz,
  stripe_balance_txn text unique,
  created_at         timestamptz not null default now()
);
create unique index premium_credits_one_grant on public.premium_credits (reward_id) where months = 1;
create unique index premium_credits_one_reversal on public.premium_credits (reward_id) where months = -1;
create index premium_credits_user_idx on public.premium_credits (user_id);

alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.premium_credits enable row level security;
revoke insert, update, delete on public.billing_customers, public.subscriptions, public.payments,
  public.referral_rewards, public.premium_credits from anon, authenticated;

create policy "billing_customers: le sien ou admin" on public.billing_customers for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "subscriptions: le sien ou admin" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "payments: les siens ou admin" on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "referral_rewards: parrain ou admin" on public.referral_rewards for select to authenticated
  using (referrer_id = (select auth.uid()) or (select private.is_admin()));
create policy "premium_credits: les siens ou admin" on public.premium_credits for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ---------------------------------------------------------------------
-- Statut Premium
-- ---------------------------------------------------------------------
create or replace function public.is_premium(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.subscriptions s
                  where s.user_id = p_user and s.status in ('active', 'trialing')
                    and (s.current_period_end is null or s.current_period_end > now()));
$$;
grant execute on function public.is_premium(uuid) to authenticated;

-- Résumé pour la page « Mon abonnement »
create or replace function public.my_billing()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'premium', public.is_premium(auth.uid()),
    'subscription', (select jsonb_build_object('status', s.status, 'currentPeriodEnd', s.current_period_end,
                       'cancelAtPeriodEnd', s.cancel_at_period_end)
                       from public.subscriptions s where s.user_id = auth.uid() order by s.updated_at desc limit 1),
    'hasCustomer', exists (select 1 from public.billing_customers where user_id = auth.uid()),
    'creditsAvailable', (select coalesce(sum(months), 0) from public.premium_credits where user_id = auth.uid() and applied_at is null),
    'creditsApplied', (select count(*) from public.premium_credits where user_id = auth.uid() and months = 1 and applied_at is not null)
  );
$$;
grant execute on function public.my_billing() to authenticated;

-- Résumé du parrainage (sans exposer les profils privés des filleuls)
create or replace function public.my_referrals()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code', (select referral_code from public.profiles where id = auth.uid()),
    'signups', (select count(*) from public.profiles where referred_by = auth.uid()),
    'rewards', coalesce((select jsonb_agg(jsonb_build_object(
                  'referee', case when p.is_public then p.username::text else 'Filleul' end,
                  'status', r.status, 'eligibleAt', r.eligible_at, 'reason', r.cancelled_reason) order by r.created_at desc)
                  from public.referral_rewards r join public.profiles p on p.id = r.referee_id
                 where r.referrer_id = auth.uid()), '[]')
  );
$$;
grant execute on function public.my_referrals() to authenticated;

-- ---------------------------------------------------------------------
-- Fonctions du webhook Stripe (rôle service uniquement)
-- ---------------------------------------------------------------------
create or replace function public.billing_claim_event(p_id text, p_type text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_processed timestamptz;
begin
  insert into private.stripe_events (id, type) values (p_id, p_type) on conflict (id) do nothing;
  select processed_at into v_processed from private.stripe_events where id = p_id for update;
  return v_processed is null; -- false = déjà traité : on ne refait rien
end;
$$;

create or replace function public.billing_mark_event_processed(p_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.stripe_events set processed_at = now() where id = p_id;
$$;

create or replace function public.billing_link_customer(p_user uuid, p_customer text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.billing_customers (user_id, stripe_customer_id) values (p_user, p_customer)
  on conflict (user_id) do update set stripe_customer_id = excluded.stripe_customer_id;
$$;

create or replace function public.billing_upsert_subscription(p_id text, p_customer text, p_status text, p_price text,
                                                              p_period_end timestamptz, p_cancel_at_period_end boolean,
                                                              p_canceled_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select user_id into v_user from public.billing_customers where stripe_customer_id = p_customer;
  if v_user is null then
    raise exception 'Client Stripe inconnu' using errcode = 'P0002';
  end if;
  insert into public.subscriptions (id, user_id, status, price_id, current_period_end, cancel_at_period_end, canceled_at)
  values (p_id, v_user, p_status, p_price, p_period_end, p_cancel_at_period_end, p_canceled_at)
  on conflict (id) do update set status = excluded.status, price_id = excluded.price_id,
    current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end,
    canceled_at = excluded.canceled_at, updated_at = now();
end;
$$;

-- Facture payée : enregistre le paiement ; premier paiement d'un filleul → récompense en attente (J+14)
create or replace function public.billing_record_invoice_paid(p_invoice text, p_customer text, p_subscription text, p_amount integer,
                                                              p_currency text, p_paid_at timestamptz, p_url text, p_fingerprint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_referrer uuid;
begin
  select user_id into v_user from public.billing_customers where stripe_customer_id = p_customer;
  if v_user is null then
    raise exception 'Client Stripe inconnu' using errcode = 'P0002';
  end if;
  insert into public.payments (id, user_id, subscription_id, amount_paid, currency, paid_at, hosted_invoice_url, card_fingerprint)
  values (p_invoice, v_user, p_subscription, p_amount, lower(p_currency), p_paid_at, p_url, p_fingerprint)
  on conflict (id) do nothing;

  if p_amount > 0 then
    select referred_by into v_referrer from public.profiles where id = v_user;
    if v_referrer is not null and v_referrer <> v_user
       and not exists (select 1 from public.payments where user_id = v_user and amount_paid > 0 and id <> p_invoice and paid_at < p_paid_at) then
      insert into public.referral_rewards (referrer_id, referee_id, invoice_id, eligible_at)
      values (v_referrer, v_user, p_invoice, p_paid_at + interval '14 days')
      on conflict do nothing;
    end if;
  end if;
end;
$$;

-- Remboursement ou litige : annule la récompense en attente, ou la reprend si déjà accordée et non utilisée
create or replace function public.billing_record_refund(p_invoice text, p_refunded integer, p_disputed boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.referral_rewards;
begin
  update public.payments set refunded_amount = greatest(refunded_amount, p_refunded), disputed = disputed or p_disputed where id = p_invoice;
  select * into r from public.referral_rewards where invoice_id = p_invoice for update;
  if r.id is null or r.status = 'cancelled' then
    return;
  end if;
  update public.referral_rewards
     set status = 'cancelled', decided_at = now(),
         cancelled_reason = case when p_disputed then 'Paiement du filleul contesté' else 'Paiement du filleul remboursé' end
   where id = r.id;
  if r.status = 'granted' then
    insert into public.premium_credits (user_id, months, reason, reward_id)
    values (r.referrer_id, -1, 'referral_reversal', r.id)
    on conflict do nothing;
  end if;
  perform private.notify(r.referrer_id, 'referral', 'Récompense de parrainage annulée',
                         'Le paiement de ton filleul a été remboursé ou contesté.', '/plus/parrainage');
end;
$$;

-- Tâche planifiée : décide des récompenses arrivées à échéance (idempotent)
create or replace function public.process_referral_rewards()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_granted integer := 0;
  v_cancelled integer := 0;
  v_reason text;
begin
  for r in
    select rw.*, p.refunded_amount, p.disputed, p.card_fingerprint
      from public.referral_rewards rw join public.payments p on p.id = rw.invoice_id
     where rw.status = 'pending' and rw.eligible_at <= now()
     for update of rw skip locked
  loop
    v_reason := null;
    if r.refunded_amount > 0 or r.disputed then
      v_reason := 'Paiement du filleul remboursé ou contesté';
    elsif not public.is_premium(r.referee_id) then
      v_reason := 'Abonnement du filleul arrêté pendant la période de vérification';
    elsif r.card_fingerprint is not null and exists (
            select 1 from public.payments pp where pp.user_id = r.referrer_id and pp.card_fingerprint = r.card_fingerprint) then
      v_reason := 'Même moyen de paiement que le parrain';
    end if;

    if v_reason is null then
      update public.referral_rewards set status = 'granted', decided_at = now() where id = r.id;
      insert into public.premium_credits (user_id, months, reason, reward_id) values (r.referrer_id, 1, 'referral', r.id)
      on conflict do nothing;
      perform private.notify(r.referrer_id, 'referral', 'Un mois VICE ATLAS PLUS offert !',
                             'Merci d''avoir parrainé un ami : le mois sera déduit de ta prochaine échéance.', '/plus/parrainage');
      v_granted := v_granted + 1;
    else
      update public.referral_rewards set status = 'cancelled', decided_at = now(), cancelled_reason = v_reason where id = r.id;
      v_cancelled := v_cancelled + 1;
    end if;
  end loop;
  return jsonb_build_object('granted', v_granted, 'cancelled', v_cancelled);
end;
$$;

-- Crédit appliqué au solde Stripe du parrain (déduit de ses prochaines échéances)
create or replace function public.billing_mark_credit_applied(p_credit uuid, p_balance_txn text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.premium_credits set applied_at = now(), stripe_balance_txn = p_balance_txn
   where id = p_credit and applied_at is null;
$$;

-- Crédits prêts à appliquer : solde positif d'un parrain qui a un client Stripe
create or replace function public.billing_credits_to_apply()
returns table (credit_id uuid, user_id uuid, stripe_customer_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.user_id, bc.stripe_customer_id
    from public.premium_credits c
    join public.billing_customers bc on bc.user_id = c.user_id
   where c.months = 1 and c.applied_at is null
     and not exists (select 1 from public.premium_credits x where x.reward_id = c.reward_id and x.months = -1)
   order by c.created_at;
$$;

revoke all on function public.billing_claim_event(text, text), public.billing_mark_event_processed(text),
  public.billing_link_customer(uuid, text),
  public.billing_upsert_subscription(text, text, text, text, timestamptz, boolean, timestamptz),
  public.billing_record_invoice_paid(text, text, text, integer, text, timestamptz, text, text),
  public.billing_record_refund(text, integer, boolean), public.process_referral_rewards(),
  public.billing_mark_credit_applied(uuid, text), public.billing_credits_to_apply()
  from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.billing_claim_event(text, text), public.billing_mark_event_processed(text),
      public.billing_link_customer(uuid, text),
      public.billing_upsert_subscription(text, text, text, text, timestamptz, boolean, timestamptz),
      public.billing_record_invoice_paid(text, text, text, integer, text, timestamptz, text, text),
      public.billing_record_refund(text, integer, boolean), public.process_referral_rewards(),
      public.billing_mark_credit_applied(uuid, text), public.billing_credits_to_apply() to service_role';
  end if;
end;
$$;

-- Administration : annuler une récompense frauduleuse (justifiée et auditée)
create or replace function public.admin_cancel_referral_reward(p_reward uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.referral_rewards;
begin
  if not private.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_reason), '')) < 10 then
    raise exception 'Justification obligatoire (10 caractères minimum)' using errcode = '22023';
  end if;
  select * into r from public.referral_rewards where id = p_reward for update;
  if r.id is null or r.status = 'cancelled' then
    return;
  end if;
  update public.referral_rewards set status = 'cancelled', decided_at = now(), cancelled_reason = p_reason where id = r.id;
  if r.status = 'granted' then
    insert into public.premium_credits (user_id, months, reason, reward_id) values (r.referrer_id, -1, 'referral_reversal', r.id)
    on conflict do nothing;
  end if;
  insert into public.audit_log (actor_id, action, target_table, target_id, details)
  values (auth.uid(), 'cancel', 'referral_rewards', r.id::text, jsonb_build_object('reason', p_reason, 'previous', r.status));
end;
$$;
revoke all on function public.admin_cancel_referral_reward(uuid, text) from public, anon;
grant execute on function public.admin_cancel_referral_reward(uuid, text) to authenticated;

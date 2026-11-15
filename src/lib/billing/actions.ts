"use server";

import { redirect } from "next/navigation";
import { getEditorContext } from "@/lib/auth/editor";
import type { FormState } from "@/lib/auth/schemas";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe, paymentsEnabled } from "./stripe";

const CLOSED: FormState = { ok: false, message: "Les abonnements VICE ATLAS PLUS ne sont pas encore ouverts. Ils le seront après la phase de tests." };

async function currentUser() {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { sb, user };
}

/** Démarre la souscription (Stripe Checkout). */
export async function startCheckoutAction(): Promise<FormState> {
  if (!paymentsEnabled()) return CLOSED;
  const stripe = getStripe()!;
  const { sb, user } = await currentUser();
  if (!user) redirect("/connexion?suite=/plus");
  const { data: billing } = await sb.rpc("my_billing");
  if ((billing as { premium?: boolean } | null)?.premium) return { ok: false, message: "Tu es déjà abonné à VICE ATLAS PLUS." };

  const { data: existing } = await sb.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  let customer = existing?.stripe_customer_id;
  if (!customer) {
    const created = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } }, { idempotencyKey: `customer-${user.id}` });
    customer = created.id;
    const service = createSupabaseServiceClient();
    await service?.rpc("billing_link_customer", { p_user: user.id, p_customer: customer });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    metadata: { userId: user.id },
    line_items: [{ price: serverEnv().STRIPE_PRICE_PLUS_MONTHLY!, quantity: 1 }],
    locale: "fr",
    allow_promotion_codes: false,
    success_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/plus/abonnement?statut=merci`,
    cancel_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/plus?statut=annule`,
  });
  redirect(session.url!);
}

/** Portail de facturation Stripe : moyen de paiement, factures, résiliation. */
export async function openBillingPortalAction(): Promise<FormState> {
  const stripe = getStripe();
  if (!stripe) return CLOSED;
  const { sb, user } = await currentUser();
  if (!user) redirect("/connexion?suite=/plus/abonnement");
  const { data } = await sb.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!data) return { ok: false, message: "Aucun abonnement associé à ton compte." };
  const portal = await stripe.billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/plus/abonnement`, locale: "fr" });
  redirect(portal.url);
}

export async function cancelReferralRewardAction(rewardId: string, reason: string): Promise<FormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok" || ctx.role !== "admin") return { ok: false, message: "Réservé aux administrateurs." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("admin_cancel_referral_reward", { p_reward: rewardId, p_reason: reason });
  if (error) return { ok: false, message: error.code === "22023" ? "Justification obligatoire (10 caractères minimum)." : "Annulation impossible." };
  return { ok: true, message: "Récompense annulée." };
}

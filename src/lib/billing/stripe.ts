import "server-only";

import Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";
import type { BillingStore, StripeLookups } from "./webhook-handler";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: Stripe | null = null;

/** Client Stripe (clé secrète côté serveur uniquement), ou null si non configuré. */
export function getStripe(): Stripe | null {
  const key = serverEnv().STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, { appInfo: { name: "VICE ATLAS" }, maxNetworkRetries: 2 });
  return client;
}

/** Les paiements restent fermés tant que PAYMENTS_ENABLED n'est pas « true ». */
export function paymentsEnabled(): boolean {
  const env = serverEnv();
  return env.PAYMENTS_ENABLED === "true" && Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PLUS_MONTHLY);
}

export function stripeLookups(stripe: Stripe): StripeLookups {
  return {
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    async invoiceForCharge(chargeId) {
      const charge = await stripe.charges.retrieve(chargeId, { expand: ["payment_intent"] });
      const fromCharge = (charge as unknown as { invoice?: string | { id: string } | null }).invoice;
      if (fromCharge) return typeof fromCharge === "string" ? fromCharge : fromCharge.id;
      const pi = charge.payment_intent;
      if (pi && typeof pi !== "string") {
        const list = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: pi.id }, limit: 1 });
        const inv = list.data[0]?.invoice;
        return inv ? (typeof inv === "string" ? inv : inv.id ?? null) : null;
      }
      return null;
    },
    async cardFingerprintForInvoice(invoice) {
      try {
        const payments = await stripe.invoicePayments.list({ invoice: invoice.id!, limit: 1, expand: ["data.payment.payment_intent.latest_charge"] });
        const pi = payments.data[0]?.payment?.payment_intent;
        const charge = pi && typeof pi !== "string" ? pi.latest_charge : null;
        return charge && typeof charge !== "string" ? (charge.payment_method_details?.card?.fingerprint ?? null) : null;
      } catch {
        return null;
      }
    },
  };
}

/** Opérations sur la base, via le client « service » et les fonctions SQL dédiées. */
export function supabaseBillingStore(sb: SupabaseClient): BillingStore {
  const call = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new Error(`${fn} : ${error.message}`);
    return data;
  };
  return {
    claimEvent: async (id, type) => Boolean(await call("billing_claim_event", { p_id: id, p_type: type })),
    markProcessed: async (id) => void (await call("billing_mark_event_processed", { p_id: id })),
    linkCustomer: async (userId, customerId) => void (await call("billing_link_customer", { p_user: userId, p_customer: customerId })),
    upsertSubscription: async (s) =>
      void (await call("billing_upsert_subscription", {
        p_id: s.id,
        p_customer: s.customerId,
        p_status: s.status,
        p_price: s.priceId,
        p_period_end: s.currentPeriodEnd?.toISOString() ?? null,
        p_cancel_at_period_end: s.cancelAtPeriodEnd,
        p_canceled_at: s.canceledAt?.toISOString() ?? null,
      })),
    recordInvoicePaid: async (i) =>
      void (await call("billing_record_invoice_paid", {
        p_invoice: i.id,
        p_customer: i.customerId,
        p_subscription: i.subscriptionId,
        p_amount: i.amountPaid,
        p_currency: i.currency,
        p_paid_at: i.paidAt.toISOString(),
        p_url: i.url,
        p_fingerprint: i.cardFingerprint,
      })),
    recordRefund: async (invoiceId, refunded, disputed) => void (await call("billing_record_refund", { p_invoice: invoiceId, p_refunded: refunded, p_disputed: disputed })),
  };
}

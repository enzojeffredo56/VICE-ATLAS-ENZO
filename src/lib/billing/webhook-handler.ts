import type Stripe from "stripe";

/**
 * Traduction des événements Stripe en opérations sur la base.
 * Fonction pure (dépendances injectées) : testée sans Stripe ni Supabase.
 * Chaque opération côté base est elle-même idempotente.
 */
export type BillingStore = {
  claimEvent(id: string, type: string): Promise<boolean>;
  markProcessed(id: string): Promise<void>;
  linkCustomer(userId: string, customerId: string): Promise<void>;
  upsertSubscription(s: {
    id: string;
    customerId: string;
    status: string;
    priceId: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
  }): Promise<void>;
  recordInvoicePaid(i: {
    id: string;
    customerId: string;
    subscriptionId: string | null;
    amountPaid: number;
    currency: string;
    paidAt: Date;
    url: string | null;
    cardFingerprint: string | null;
  }): Promise<void>;
  recordRefund(invoiceId: string, refunded: number, disputed: boolean): Promise<void>;
};

export type StripeLookups = {
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  invoiceForCharge(chargeId: string): Promise<string | null>;
  cardFingerprintForInvoice(invoice: Stripe.Invoice): Promise<string | null>;
};

const id = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));
const date = (s: number | null | undefined) => (s ? new Date(s * 1000) : null);

function subscriptionRow(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0];
  return {
    id: sub.id,
    customerId: id(sub.customer)!,
    status: sub.status,
    priceId: item?.price?.id ?? null,
    currentPeriodEnd: date((item as unknown as { current_period_end?: number })?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt: date(sub.canceled_at),
  };
}

function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const legacy = (inv as unknown as { subscription?: string | { id: string } | null }).subscription;
  const parent = (inv as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } }).parent;
  return id(legacy ?? parent?.subscription_details?.subscription ?? null);
}

export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "charge.refunded",
  "charge.dispute.created",
] as const;

export async function handleStripeEvent(event: Stripe.Event, store: BillingStore, stripe: StripeLookups): Promise<"processed" | "duplicate" | "ignored"> {
  if (!(HANDLED_EVENTS as readonly string[]).includes(event.type)) return "ignored";
  if (!(await store.claimEvent(event.id, event.type))) return "duplicate";

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id ?? s.metadata?.userId;
      const customerId = id(s.customer);
      if (s.mode !== "subscription" || !userId || !customerId) break;
      await store.linkCustomer(userId, customerId);
      const subId = id(s.subscription);
      if (subId) await store.upsertSubscription(subscriptionRow(await stripe.retrieveSubscription(subId)));
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await store.upsertSubscription(subscriptionRow(event.data.object as Stripe.Subscription));
      break;
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      if (!inv.id) break;
      await store.recordInvoicePaid({
        id: inv.id,
        customerId: id(inv.customer)!,
        subscriptionId: invoiceSubscriptionId(inv),
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        paidAt: date(inv.status_transitions?.paid_at) ?? new Date(event.created * 1000),
        url: inv.hosted_invoice_url ?? null,
        cardFingerprint: await stripe.cardFingerprintForInvoice(inv),
      });
      break;
    }
    case "charge.refunded": {
      const c = event.data.object as Stripe.Charge;
      const invoiceId = await stripe.invoiceForCharge(c.id);
      if (invoiceId) await store.recordRefund(invoiceId, c.amount_refunded, false);
      break;
    }
    case "charge.dispute.created": {
      const d = event.data.object as Stripe.Dispute;
      const invoiceId = await stripe.invoiceForCharge(id(d.charge)!);
      if (invoiceId) await store.recordRefund(invoiceId, 0, true);
      break;
    }
  }
  await store.markProcessed(event.id);
  return "processed";
}

import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { ALWAYS_FREE, formatPrice, PLUS_PLAN, REFERRAL_DELAY_DAYS } from "@/lib/billing/plan";
import { handleStripeEvent, type BillingStore, type StripeLookups } from "@/lib/billing/webhook-handler";

function fakeStore(processed = new Set<string>()) {
  const calls: string[] = [];
  const store: BillingStore = {
    claimEvent: vi.fn(async (id) => !processed.has(id)),
    markProcessed: vi.fn(async (id) => void processed.add(id)),
    linkCustomer: vi.fn(async (u, c) => void calls.push(`link:${u}:${c}`)),
    upsertSubscription: vi.fn(async (s) => void calls.push(`sub:${s.id}:${s.status}`)),
    recordInvoicePaid: vi.fn(async (i) => void calls.push(`paid:${i.id}:${i.amountPaid}:${i.cardFingerprint}`)),
    recordRefund: vi.fn(async (inv, amount, disputed) => void calls.push(`refund:${inv}:${amount}:${disputed}`)),
  };
  return { store, calls, processed };
}

const subscription = { id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: false, canceled_at: null, items: { data: [{ price: { id: "price_plus" }, current_period_end: 1_800_000_000 }] } } as unknown as Stripe.Subscription;
const lookups: StripeLookups = {
  retrieveSubscription: vi.fn(async () => subscription),
  invoiceForCharge: vi.fn(async () => "in_1"),
  cardFingerprintForInvoice: vi.fn(async () => "fp_abc"),
};
const event = (type: string, object: unknown, id = `evt_${type}`) => ({ id, type, created: 1_790_000_000, data: { object } }) as unknown as Stripe.Event;

describe("webhook Stripe", () => {
  it("vérifie la signature du corps brut (valide, altérée, mauvais secret)", () => {
    const stripe = new Stripe("sk_test_factice");
    const secret = "whsec_test_secret";
    const payload = JSON.stringify({ id: "evt_sig", object: "event", type: "invoice.paid", data: { object: {} } });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe("evt_sig");
    expect(() => stripe.webhooks.constructEvent(payload.replace("invoice", "charge"), header, secret)).toThrow();
    expect(() => stripe.webhooks.constructEvent(payload, header, "whsec_autre")).toThrow();
  });

  it("une souscription terminée relie le client et enregistre l'abonnement", async () => {
    const { store, calls } = fakeStore();
    const r = await handleStripeEvent(event("checkout.session.completed", { mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1", metadata: {} }), store, lookups);
    expect(r).toBe("processed");
    expect(calls).toEqual(["link:user-1:cus_1", "sub:sub_1:active"]);
    expect(store.markProcessed).toHaveBeenCalledWith("evt_checkout.session.completed");
  });

  it("ne traite jamais deux fois le même événement", async () => {
    const { store, calls } = fakeStore(new Set(["evt_invoice.paid"]));
    const r = await handleStripeEvent(event("invoice.paid", { id: "in_1" }), store, lookups);
    expect(r).toBe("duplicate");
    expect(calls).toEqual([]);
  });

  it("enregistre une facture payée avec l'empreinte de carte (anti-fraude parrainage)", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(event("invoice.paid", { id: "in_1", customer: "cus_1", amount_paid: 499, currency: "eur", status_transitions: { paid_at: 1_790_000_000 }, hosted_invoice_url: "https://invoice.stripe.com/i/1", parent: { subscription_details: { subscription: "sub_1" } } }), store, lookups);
    expect(calls).toEqual(["paid:in_1:499:fp_abc"]);
    const arg = vi.mocked(store.recordInvoicePaid).mock.calls[0][0];
    expect(arg.subscriptionId).toBe("sub_1");
    expect(arg.paidAt.toISOString()).toBe(new Date(1_790_000_000 * 1000).toISOString());
  });

  it("gère remboursements et litiges", async () => {
    const { store, calls } = fakeStore();
    await handleStripeEvent(event("charge.refunded", { id: "ch_1", amount_refunded: 499 }), store, lookups);
    await handleStripeEvent(event("charge.dispute.created", { id: "dp_1", charge: "ch_1" }), store, lookups);
    expect(calls).toEqual(["refund:in_1:499:false", "refund:in_1:0:true"]);
  });

  it("ignore les types d'événements non utilisés et un paiement unique hors abonnement", async () => {
    const { store, calls } = fakeStore();
    expect(await handleStripeEvent(event("customer.created", {}), store, lookups)).toBe("ignored");
    await handleStripeEvent(event("checkout.session.completed", { mode: "payment", client_reference_id: "u", customer: "cus_1" }), store, lookups);
    expect(calls).toEqual([]);
    expect(store.claimEvent).toHaveBeenCalledTimes(1);
  });

  it("une erreur de base laisse l'événement non terminé pour que Stripe réessaie", async () => {
    const { store, processed } = fakeStore();
    store.recordInvoicePaid = vi.fn(async () => {
      throw new Error("base indisponible");
    });
    await expect(handleStripeEvent(event("invoice.paid", { id: "in_2", customer: "cus_1", amount_paid: 499, currency: "eur" }, "evt_retry"), store, lookups)).rejects.toThrow();
    expect(processed.has("evt_retry")).toBe(false);
  });
});

describe("offre VICE ATLAS PLUS", () => {
  it("affiche le tarif provisoire en euros", () => {
    expect(PLUS_PLAN.priceCents).toBe(499);
    expect(formatPrice(PLUS_PLAN.priceCents).replace(/\s/g, " ")).toBe("4,99 €");
  });
  it("garde les fonctions essentielles gratuites et un délai anti-fraude", () => {
    expect(ALWAYS_FREE.length).toBeGreaterThanOrEqual(5);
    expect(REFERRAL_DELAY_DAYS).toBe(14);
  });
});

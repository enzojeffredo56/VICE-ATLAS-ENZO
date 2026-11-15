import "server-only";

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLUS_PLAN } from "./plan";

/**
 * Applique chaque mois offert au solde client Stripe du parrain :
 * le montant est déduit de ses prochaines échéances (ce n'est pas un remboursement).
 * Clé d'idempotence = identifiant du crédit : impossible d'appliquer deux fois.
 */
export async function applyPendingCredits(stripe: Stripe, sb: SupabaseClient) {
  const { data, error } = await sb.rpc("billing_credits_to_apply");
  if (error) throw new Error(error.message);
  let applied = 0;
  for (const c of (data ?? []) as { credit_id: string; stripe_customer_id: string }[]) {
    const txn = await stripe.customers.createBalanceTransaction(
      c.stripe_customer_id,
      { amount: -PLUS_PLAN.priceCents, currency: PLUS_PLAN.currency, description: "Parrainage VICE ATLAS : 1 mois offert", metadata: { creditId: c.credit_id } },
      { idempotencyKey: `credit-${c.credit_id}` },
    );
    const { error: markError } = await sb.rpc("billing_mark_credit_applied", { p_credit: c.credit_id, p_balance_txn: txn.id });
    if (markError) throw new Error(markError.message);
    applied++;
  }
  return applied;
}

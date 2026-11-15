import { NextResponse, type NextRequest } from "next/server";
import { getStripe, stripeLookups, supabaseBillingStore } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/webhook-handler";
import { serverEnv } from "@/lib/env.server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

/**
 * Webhook Stripe : signature vérifiée sur le corps brut, puis traitement idempotent.
 * Une erreur renvoie 500 : Stripe réessaiera, et l'événement non terminé sera retraité.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET;
  const sb = createSupabaseServiceClient();
  if (!stripe || !secret || !sb) return NextResponse.json({ error: "Paiements non configurés" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event, supabaseBillingStore(sb), stripeLookups(stripe));
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error("Webhook Stripe", event.type, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
}

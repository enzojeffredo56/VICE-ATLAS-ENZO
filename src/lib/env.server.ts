import "server-only";

import { z } from "zod";

/** Secrets côté serveur uniquement (jamais préfixés NEXT_PUBLIC_). */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  CRON_SECRET: z.string().min(24).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_PRICE_PLUS_MONTHLY: z.string().startsWith("price_").optional(),
  PAYMENTS_ENABLED: z.enum(["true", "false"]).default("false"),
});

export function serverEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    STRIPE_PRICE_PLUS_MONTHLY: process.env.STRIPE_PRICE_PLUS_MONTHLY || undefined,
    PAYMENTS_ENABLED: process.env.PAYMENTS_ENABLED || undefined,
  });
}

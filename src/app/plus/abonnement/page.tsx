import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Crown, ExternalLink, Receipt } from "lucide-react";
import { PortalButton } from "@/components/plus/subscribe-button";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/billing/plan";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = { title: "Mon abonnement", robots: { index: false } };

const STATUS: Record<string, string> = {
  active: "Actif",
  trialing: "Période d'essai",
  past_due: "Paiement en retard",
  canceled: "Résilié",
  unpaid: "Impayé",
  incomplete: "Incomplet",
  incomplete_expired: "Expiré",
  paused: "En pause",
};

export default function AbonnementPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32 pb-16 sm:px-8">
      <h1 className="flex items-center gap-3 text-4xl font-bold sm:text-5xl">
        <Crown className="size-9 text-[#b49cff]" aria-hidden /> Mon abonnement
      </h1>
      <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-3xl" />}>
        <Details />
      </Suspense>
    </div>
  );
}

type Billing = { premium: boolean; hasCustomer: boolean; creditsAvailable: number; subscription: { status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null };

async function Details() {
  const none = (
    <EmptyState
      className="mt-8"
      icon={Crown}
      title="Pas d'abonnement"
      description="Toutes les fonctions essentielles restent gratuites. VICE ATLAS PLUS est un bonus facultatif."
      action={
        <Button asChild>
          <Link href="/plus">Découvrir VICE ATLAS PLUS</Link>
        </Button>
      }
    />
  );
  if (!isSupabaseConfigured) return none;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/connexion?suite=/plus/abonnement");
  const [{ data }, { data: payments }] = await Promise.all([
    sb.rpc("my_billing"),
    sb.from("payments").select("id,amount_paid,currency,paid_at,hosted_invoice_url,refunded_amount").eq("user_id", user.id).order("paid_at", { ascending: false }).limit(24),
  ]);
  const b = data as Billing;
  if (!b?.subscription && !payments?.length) return none;
  const s = b.subscription;
  return (
    <div className="mt-8 space-y-6">
      {s && (
        <section aria-label="Statut" className="neon-border glass rounded-3xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={b.premium ? "turquoise" : "pink"}>{STATUS[s.status] ?? s.status}</Badge>
            {b.premium && <span className="font-semibold">Tu es membre VICE ATLAS PLUS</span>}
          </div>
          {s.currentPeriodEnd && (
            <p className="mt-3 text-ink/85">
              {s.cancelAtPeriodEnd ? "Résiliation programmée : accès jusqu'au " : "Prochaine échéance le "}
              <strong>{formatDateFr(s.currentPeriodEnd)}</strong>.
            </p>
          )}
          {b.creditsAvailable > 0 && <p className="mt-2 text-sm text-turquoise">{b.creditsAvailable} mois offert(s) par le parrainage, bientôt déduit(s).</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            {b.hasCustomer && <PortalButton />}
            <Button asChild variant="ghost">
              <Link href="/plus/parrainage">Parrainage</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Le portail sécurisé Stripe permet de changer de carte, télécharger les factures et résilier.</p>
        </section>
      )}
      <section aria-labelledby="pay-title" className="glass rounded-3xl p-6">
        <h2 id="pay-title" className="flex items-center gap-2 text-xl font-bold">
          <Receipt className="size-5 text-cyan" aria-hidden /> Historique des paiements
        </h2>
        {!payments?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucun paiement.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/8">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">{formatDateFr(p.paid_at)}</span>
                <span className="font-semibold tabular-nums">{formatPrice(p.amount_paid, p.currency)}</span>
                {p.refunded_amount > 0 && <Badge variant="pink">Remboursé {formatPrice(p.refunded_amount, p.currency)}</Badge>}
                {p.hosted_invoice_url && (
                  <a href={p.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan underline-offset-4 hover:underline">
                    Facture <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

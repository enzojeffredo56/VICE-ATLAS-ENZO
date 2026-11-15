import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check, Crown, Gift, Info, Lock } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SubscribeButton } from "@/components/plus/subscribe-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ALWAYS_FREE, formatPrice, PLUS_PLAN, REFERRAL_DELAY_DAYS } from "@/lib/billing/plan";
import { paymentsEnabled } from "@/lib/billing/stripe";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "VICE ATLAS PLUS", description: "L'abonnement Premium de VICE ATLAS. Les fonctions essentielles restent gratuites." };

const FALLBACK = [
  { key: "badge_plus", label: "Badge VICE ATLAS PLUS", description: "Un badge distinctif sur le profil public.", enabled: false },
  { key: "themes_carte", label: "Thèmes de carte", description: "Des variantes visuelles de la carte (nuit, néon, plan).", enabled: false },
  { key: "stats_detaillees", label: "Statistiques détaillées", description: "Historique complet de progression et graphiques personnels.", enabled: false },
  { key: "salons_etendus", label: "Salons étendus", description: "Salons GTA Roulette jusqu'à 24 joueurs et défis de salon illimités.", enabled: false },
];

const FAQ = [
  ["Que reste-t-il gratuit ?", "Tout ce qui est essentiel : la carte, le carnet, les guides, le comparateur, la roulette, STUNT ARENA, les avis, les XP et les classements."],
  ["Comment résilier ?", "En deux clics depuis « Mon abonnement ». Tu gardes l'accès jusqu'à la fin de la période payée."],
  ["Comment marche le parrainage ?", `Quand un ami que tu as parrainé paie son premier mois, tu reçois un mois offert après ${REFERRAL_DELAY_DAYS} jours (délai de vérification). Les mois offerts se cumulent et sont déduits de tes prochaines échéances : ce n'est pas un remboursement bancaire.`],
  ["Mes paiements sont-ils sécurisés ?", "Les paiements passent par Stripe. VICE ATLAS ne voit ni ne stocke jamais tes données bancaires."],
] as const;

export default function PlusPage() {
  const enabled = paymentsEnabled();
  return (
    <div className="relative isolate mx-auto max-w-6xl px-5 pt-32 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgb(139_92_246/0.3),transparent_70%)]" />
      <Reveal className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-pink to-violet text-white shadow-[0_0_40px_-6px_rgb(139_92_246/0.9)]">
          <Crown className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 text-5xl font-bold sm:text-7xl">
          VICE ATLAS <span className="text-neon">PLUS</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">Un coup de pouce pour faire vivre le projet, avec quelques bonus. L&apos;essentiel reste gratuit, pour toujours.</p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section aria-label="Offre" className="neon-border glass rounded-3xl p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{PLUS_PLAN.name}</h2>
            {!enabled && <Badge variant="violet">Bientôt</Badge>}
          </div>
          <p className="mt-4 font-display text-5xl font-bold">
            {formatPrice(PLUS_PLAN.priceCents)}
            <span className="text-lg font-normal text-muted-foreground"> / {PLUS_PLAN.interval}</span>
          </p>
          {PLUS_PLAN.provisional && <p className="mt-1 text-sm text-muted-foreground">Tarif provisoire, confirmé avant l&apos;ouverture. Sans engagement.</p>}
          <Suspense fallback={<Skeleton className="mt-6 h-40" />}>
            <Features />
          </Suspense>
          <div className="mt-8 flex flex-wrap gap-3">
            <SubscribeButton enabled={enabled} />
            <Button asChild variant="outline" size="lg">
              <Link href="/plus/parrainage">
                <Gift /> Parrainer un ami
              </Link>
            </Button>
          </div>
          {!enabled && (
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Les paiements ouvriront après les tests de sécurité et de facturation.
            </p>
          )}
        </section>

        <section aria-labelledby="free-title" className="glass rounded-3xl p-7 sm:p-9">
          <h2 id="free-title" className="text-2xl font-bold">
            Gratuit, pour tout le monde
          </h2>
          <ul className="mt-5 space-y-3">
            {ALWAYS_FREE.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-turquoise" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="faq-title" className="mt-14">
        <h2 id="faq-title" className="text-2xl font-bold">
          Questions fréquentes
        </h2>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="glass rounded-2xl p-5">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

async function Features() {
  let features = FALLBACK;
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServerClient();
    const { data } = await sb.from("premium_features").select("key,label,description,enabled").order("sort_order");
    if (data?.length) features = data;
  }
  return (
    <ul className="mt-6 space-y-3">
      {features.map((f) => (
        <li key={f.key} className="flex items-start gap-3">
          <Crown className="mt-0.5 size-5 shrink-0 text-[#b49cff]" aria-hidden />
          <span>
            <span className="font-medium">{f.label}</span>
            {!f.enabled && <span className="ml-2 text-xs text-muted-foreground">(à confirmer)</span>}
            <span className="block text-sm text-muted-foreground">{f.description}</span>
          </span>
        </li>
      ))}
      <li className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> La liste définitive des avantages sera fixée avant l&apos;ouverture des abonnements.
      </li>
    </ul>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarClock, CreditCard, Gift, ShieldCheck, UserPlus } from "lucide-react";
import { ReferralShare } from "@/components/plus/referral-share";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { REFERRAL_DELAY_DAYS } from "@/lib/billing/plan";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = { title: "Parrainage", robots: { index: false } };

const STEPS = [
  { icon: UserPlus, title: "Ton ami s'inscrit", text: "Avec ton lien ou ton code. Le parrain est fixé à l'inscription et ne peut plus être changé." },
  { icon: CreditCard, title: "Il s'abonne à PLUS", text: "Son premier paiement d'un abonnement VICE ATLAS PLUS déclenche la récompense." },
  { icon: CalendarClock, title: `${REFERRAL_DELAY_DAYS} jours de vérification`, text: "Si le paiement est remboursé, contesté ou si l'abonnement est arrêté entre-temps, la récompense est annulée." },
  { icon: Gift, title: "Un mois offert", text: "Il est déduit de tes prochaines échéances. Les mois se cumulent. Ce n'est pas un remboursement bancaire." },
];

const STATUS = { pending: ["En vérification", "violet"], granted: ["Mois offert", "turquoise"], cancelled: ["Annulée", "pink"] } as const;

export default function ParrainagePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.25em] text-pink uppercase">Parrainage</p>
      <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
        Un ami abonné, <span className="text-neon">un mois offert</span>
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">Le parrainage est gratuit et facultatif. Personne n&apos;est obligé de s&apos;abonner.</p>
      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="glass rounded-3xl p-5">
            <span className="text-xs font-semibold text-muted-foreground">Étape {i + 1}</span>
            <Icon className="mt-3 size-6 text-cyan" aria-hidden />
            <h2 className="mt-3 font-display font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
      <Suspense fallback={<Skeleton className="mt-10 h-64 rounded-3xl" />}>
        <Mine />
      </Suspense>
      <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Interdits : se parrainer soi-même, créer de faux comptes, payer avec son propre moyen de paiement pour un filleul. Ces cas sont détectés et la
        récompense est annulée.
      </p>
    </div>
  );
}

type Referrals = { code: string; signups: number; rewards: { referee: string; status: keyof typeof STATUS; eligibleAt: string; reason: string | null }[] };

async function Mine() {
  if (!isSupabaseConfigured) return <EmptyState className="mt-10" icon={Gift} title="Bientôt disponible" description="Ton code de parrainage apparaîtra ici dès que les comptes joueurs seront actifs." />;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/connexion?suite=/plus/parrainage");
  const [{ data: r }, { data: billing }] = await Promise.all([sb.rpc("my_referrals"), sb.rpc("my_billing")]);
  const ref = r as Referrals;
  const b = billing as { creditsAvailable: number; creditsApplied: number };
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section aria-labelledby="share-title" className="glass rounded-3xl p-6">
        <h2 id="share-title" className="text-xl font-bold">
          Ton code personnel
        </h2>
        <div className="mt-4">
          <ReferralShare code={ref.code} />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {ref.signups} ami{ref.signups > 1 ? "s" : ""} inscrit{ref.signups > 1 ? "s" : ""} avec ton code · {b.creditsAvailable} mois offert{b.creditsAvailable > 1 ? "s" : ""} en attente
          d&apos;application · {b.creditsApplied} déjà appliqué{b.creditsApplied > 1 ? "s" : ""}
        </p>
        {b.creditsAvailable > 0 && (
          <p className="mt-2 text-sm">
            Tes mois offerts seront déduits dès que tu auras un abonnement :{" "}
            <Link href="/plus" className="text-cyan underline-offset-4 hover:underline">
              VICE ATLAS PLUS
            </Link>
            .
          </p>
        )}
      </section>
      <section aria-labelledby="rewards-title" className="glass rounded-3xl p-6">
        <h2 id="rewards-title" className="text-xl font-bold">
          Mes récompenses
        </h2>
        {ref.rewards.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune récompense pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ref.rewards.map((w, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{w.referee}</span>
                <span className="flex items-center gap-2">
                  {w.status === "pending" && <span className="text-xs text-muted-foreground">à partir du {formatDateFr(w.eligibleAt)}</span>}
                  <Badge variant={STATUS[w.status][1]}>{STATUS[w.status][0]}</Badge>
                </span>
                {w.reason && <span className="w-full text-xs text-pink">{w.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

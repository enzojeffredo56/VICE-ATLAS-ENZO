import type { Metadata } from "next";
import { Suspense } from "react";
import { HandHeart } from "lucide-react";
import { ContributionForm } from "@/components/community/contribution-form";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaces, placeCategories } from "@/lib/content/repository";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = { title: "Communauté", description: "Propose des lieux et signale des erreurs pour améliorer la carte VICE ATLAS." };

export default async function CommunautePage() {
  const places = await getPlaces();
  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-16 sm:px-8">
      <Reveal>
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
          <HandHeart className="size-4" aria-hidden /> Communauté
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Construis la carte <span className="text-neon">avec nous</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Propose les lieux que tu découvres, signale ce qui cloche. Chaque contribution est vérifiée par l&apos;équipe avant d&apos;apparaître.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section aria-label="Nouvelle contribution" className="glass rounded-3xl p-6 sm:p-8">
          {!isSupabaseConfigured && <p className="mb-5 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-3 text-sm">Aperçu : les contributions ouvriront dès que la base de données sera branchée.</p>}
          <ContributionForm places={places.map((p) => ({ slug: p.slug, name: p.name }))} categories={placeCategories} />
        </section>
        <section aria-labelledby="mine-title" className="glass rounded-3xl p-6">
          <h2 id="mine-title" className="text-xl font-bold">
            Mes contributions
          </h2>
          <Suspense fallback={<Skeleton className="mt-4 h-40" />}>
            <Mine />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

const STATUS = { pending: ["En vérification", "violet"], approved: ["Acceptée", "turquoise"], rejected: ["Non retenue", "pink"] } as const;

async function Mine() {
  if (!isSupabaseConfigured) return <p className="mt-3 text-sm text-muted-foreground">Tes contributions apparaîtront ici.</p>;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return <p className="mt-3 text-sm text-muted-foreground">Connecte-toi pour voir tes contributions.</p>;
  const { data } = await sb.from("contributions").select("id,kind,title,status,moderation_note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  if (!data?.length) return <p className="mt-3 text-sm text-muted-foreground">Aucune contribution pour l&apos;instant.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {data.map((c) => (
        <li key={c.id} className="rounded-2xl border border-white/10 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{c.title}</span>
            <Badge variant={STATUS[c.status as keyof typeof STATUS][1]}>{STATUS[c.status as keyof typeof STATUS][0]}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.kind === "place_proposal" ? "Lieu proposé" : "Signalement"} · {formatDateFr(c.created_at)}
          </p>
          {c.moderation_note && <p className="mt-1 text-xs text-ink/80">« {c.moderation_note} »</p>}
        </li>
      ))}
    </ul>
  );
}

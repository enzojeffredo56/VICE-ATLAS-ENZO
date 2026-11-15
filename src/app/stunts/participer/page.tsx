import type { Metadata } from "next";
import { Suspense } from "react";
import { EntryForm } from "@/components/stunts/entry-form";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";
import { getStuntOverview } from "@/lib/stunts/repository";

export const metadata: Metadata = { title: "Participer à STUNT ARENA" };

export default function ParticiperPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-32 pb-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.25em] text-pink uppercase">STUNT ARENA</p>
      <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Publie ta cascade</h1>
      <p className="mt-3 text-muted-foreground">Une participation active par concours. Tu pourras la retirer depuis « Mes vidéos » tant que les votes ne sont pas clos.</p>
      <div className="glass mt-8 rounded-3xl p-6 sm:p-8">
        {!isSupabaseConfigured && <p className="mb-5 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-3 text-sm">Aperçu : les participations ouvriront dès que la base de données sera branchée.</p>}
        <Suspense fallback={<Skeleton className="h-64" />}>
          <Form />
        </Suspense>
      </div>
    </div>
  );
}

async function Form() {
  const overview = await getStuntOverview();
  return <EntryForm options={overview.map(({ spot, competition }) => ({ competitionId: competition.id, slug: spot.slug, name: spot.name, open: competition.phase === "participations" }))} />;
}

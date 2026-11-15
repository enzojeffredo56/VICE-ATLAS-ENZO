import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Film, MapPin, Trophy } from "lucide-react";
import { EntriesGrid } from "@/components/stunts/entries-grid";
import { PhaseBanner } from "@/components/stunts/phase-banner";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { demoPlaces } from "@/content/map";
import { formatDateFr } from "@/lib/text";
import { getSpotPage } from "@/lib/stunts/repository";

export const metadata: Metadata = { title: "Concours STUNT ARENA" };

export function generateStaticParams() {
  return demoPlaces.filter((p) => p.category === "stunt").map((p) => ({ spot: p.slug }));
}

export default function SpotPage({ params }: PageProps<"/stunts/[spot]">) {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32 pb-16 sm:px-8">
      <Link href="/stunts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> Tous les spots
      </Link>
      <Suspense fallback={<Skeleton className="mt-6 h-96 rounded-3xl" />}>
        <Spot params={params} />
      </Suspense>
    </div>
  );
}

async function Spot({ params }: { params: Promise<{ spot: string }> }) {
  const { spot: slug } = await params;
  const data = await getSpotPage(slug);
  if (!data) notFound();
  const { spot, competition, entries, ranking, myVote, myUserId, history } = data;
  return (
    <div className="mt-6 space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-pink uppercase">Spot de cascade · semaine du {formatDateFr(competition.weekStart)}</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-6xl">{spot.name}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{spot.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {competition.phase === "participations" && (
              <Button asChild>
                <Link href={`/stunts/participer?spot=${spot.slug}`}>
                  <Film /> Participer sur ce spot
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/carte?lieu=${spot.slug}`}>
                <MapPin /> Voir sur la carte
              </Link>
            </Button>
          </div>
        </div>
        <div className="w-full max-w-md">
          <PhaseBanner phase={competition.phase} dates={competition} />
        </div>
      </header>

      <section aria-labelledby="entries-title">
        <h2 id="entries-title" className="text-2xl font-bold">
          Les cascades de la semaine
        </h2>
        {competition.phase === "votes" && <p className="mt-2 text-sm text-muted-foreground">Les compteurs de votes restent cachés jusqu&apos;à la clôture.</p>}
        <div className="mt-6">
          {entries.length === 0 ? (
            <EmptyState icon={Film} title="Aucune vidéo publiée pour l'instant" description="Sois le premier à relever le défi de ce spot cette semaine." />
          ) : (
            <EntriesGrid entries={entries} phase={competition.phase} myVote={myVote} myUserId={myUserId} ranking={ranking} />
          )}
        </div>
      </section>

      <section aria-labelledby="palmares-title">
        <h2 id="palmares-title" className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="size-6 text-[#ffb36b]" aria-hidden /> Palmarès du spot
        </h2>
        {history.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Pas encore de résultats confirmés sur ce spot.</p>
        ) : (
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {history.map((h) => (
              <li key={h.weekStart} className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold">Semaine du {formatDateFr(h.weekStart)}</p>
                <ol className="mt-2 space-y-1 text-sm">
                  {h.podium.length === 0 && <li className="text-muted-foreground">Aucun vote valide.</li>}
                  {h.podium.map((p) => (
                    <li key={p.entryId}>
                      {p.rank}
                      {p.rank === 1 ? "re" : "e"} · {p.title} — {p.player ?? "Joueur anonyme"} ({p.votes} vote{p.votes > 1 ? "s" : ""})
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

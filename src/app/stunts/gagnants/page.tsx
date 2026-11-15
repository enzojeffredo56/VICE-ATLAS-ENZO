import type { Metadata } from "next";
import { Suspense } from "react";
import { Medal, Trophy } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = { title: "Gagnants STUNT ARENA", description: "Les podiums confirmés de chaque concours STUNT ARENA." };

const MEDAL = ["", "text-[#ffd166]", "text-[#d7dde8]", "text-[#e0a170]"];

export default function GagnantsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.25em] text-pink uppercase">STUNT ARENA</p>
      <h1 className="mt-3 flex items-center gap-3 text-4xl font-bold sm:text-5xl">
        <Trophy className="size-10 text-[#ffd166]" aria-hidden /> Les gagnants
      </h1>
      <p className="mt-3 text-muted-foreground">Uniquement les résultats vérifiés et confirmés par l&apos;équipe.</p>
      <div className="mt-10">
        <Suspense fallback={<Skeleton className="h-64 rounded-3xl" />}>
          <Winners />
        </Suspense>
      </div>
    </div>
  );
}

async function Winners() {
  const empty = <EmptyState icon={Trophy} title="Pas encore de gagnants" description="Les premiers podiums apparaîtront après la confirmation du premier concours." />;
  if (!isSupabaseConfigured) return empty;
  const sb = await createSupabaseServerClient();
  const { data } = await sb
    .from("competition_results")
    .select("rank,votes,stunt_entries(title),profiles(username,is_public),stunt_competitions(week_start,places(name,slug))")
    .lte("rank", 3)
    .gt("votes", 0)
    .order("rank")
    .limit(300);
  if (!data?.length) return empty;
  type Row = { rank: number; votes: number; title: string; player: string | null; week: string; spot: string };
  const rows: Row[] = data.map((r) => {
    const c = r.stunt_competitions as unknown as { week_start: string; places: { name: string } };
    const p = r.profiles as unknown as { username: string; is_public: boolean } | null;
    return { rank: r.rank, votes: r.votes, title: (r.stunt_entries as unknown as { title: string }).title, player: p?.is_public ? p.username : null, week: c.week_start, spot: c.places.name };
  });
  const groups = new Map<string, Row[]>();
  for (const r of rows) groups.set(`${r.week}|${r.spot}`, [...(groups.get(`${r.week}|${r.spot}`) ?? []), r]);
  const sorted = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {sorted.map(([key, podium]) => {
        const [week, spot] = key.split("|");
        return (
          <li key={key} className="glass rounded-3xl p-5">
            <p className="text-xs tracking-wider text-muted-foreground uppercase">Semaine du {formatDateFr(week)}</p>
            <h2 className="mt-1 font-display text-xl font-bold">{spot}</h2>
            <ol className="mt-3 space-y-2">
              {podium.map((p) => (
                <li key={`${p.rank}-${p.title}`} className="flex items-center gap-3 text-sm">
                  <Medal className={`size-5 shrink-0 ${MEDAL[p.rank]}`} aria-label={`${p.rank}e place`} />
                  <span className="min-w-0 flex-1 truncate">
                    <strong>{p.player ?? "Joueur anonyme"}</strong> — {p.title}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{p.votes} votes</span>
                </li>
              ))}
            </ol>
          </li>
        );
      })}
    </ul>
  );
}

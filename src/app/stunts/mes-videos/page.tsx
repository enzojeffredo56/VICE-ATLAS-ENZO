import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Film } from "lucide-react";
import { MyEntries, type MyEntry } from "@/components/stunts/my-entries";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";
import { phaseAt } from "@/lib/stunts/calendar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes vidéos STUNT ARENA", robots: { index: false } };

export default function MesVideosPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32 pb-16 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.25em] text-pink uppercase">STUNT ARENA</p>
      <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Mes vidéos</h1>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-48 rounded-3xl" />}>
          <List />
        </Suspense>
      </div>
    </div>
  );
}

async function List() {
  const empty = (
    <EmptyState
      icon={Film}
      title="Aucune participation pour l'instant"
      description="Publie ta première cascade : +10 XP une fois validée."
      action={
        <Button asChild>
          <Link href="/stunts/participer">Participer</Link>
        </Button>
      }
    />
  );
  if (!isSupabaseConfigured) return empty;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/connexion?suite=/stunts/mes-videos");
  const { data } = await sb
    .from("stunt_entries")
    .select("id,title,status,moderation_note,withdrawn_at,stunt_competitions(week_start,submissions_open_at,submissions_close_at,voting_close_at,confirmed_at,places(name)),competition_results(rank)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!data?.length) return empty;
  const now = new Date();
  const entries: MyEntry[] = data.map((e) => {
    const c = e.stunt_competitions as unknown as { week_start: string; submissions_open_at: string; submissions_close_at: string; voting_close_at: string; confirmed_at: string | null; places: { name: string } };
    const phase = phaseAt({ submissionsOpenAt: new Date(c.submissions_open_at), submissionsCloseAt: new Date(c.submissions_close_at), votingCloseAt: new Date(c.voting_close_at) }, now, Boolean(c.confirmed_at));
    const rank = (e.competition_results as unknown as { rank: number }[] | null)?.[0]?.rank ?? null;
    return { id: e.id, title: e.title, spot: c.places.name, weekStart: c.week_start, status: e.status, note: e.moderation_note, withdrawn: Boolean(e.withdrawn_at), canWithdraw: ["a-venir", "participations", "votes"].includes(phase), rank };
  });
  return <MyEntries entries={entries} />;
}

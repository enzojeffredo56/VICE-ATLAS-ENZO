import "server-only";

import { connection } from "next/server";
import { demoPlaces } from "@/content/map";
import { getPlaces } from "@/lib/content/repository";
import type { Place } from "@/lib/content/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { weekStartParis } from "@/lib/time/paris";
import { phaseAt, scheduleForWeek, type StuntPhase } from "./calendar";

export type Competition = {
  id: string | null;
  weekStart: string;
  submissionsOpenAt: string;
  submissionsCloseAt: string;
  votingCloseAt: string;
  phase: StuntPhase;
};

export type Entry = { id: string; title: string; videoUrl: string; player: string | null; userId: string; createdAt: string };
export type RankingRow = { entryId: string; title: string; votes: number; rank: number; player: string | null };

function demoCompetition(now: Date): Competition {
  const week = weekStartParis(now);
  const s = scheduleForWeek(week);
  return {
    id: null,
    weekStart: week,
    submissionsOpenAt: s.submissionsOpenAt.toISOString(),
    submissionsCloseAt: s.submissionsCloseAt.toISOString(),
    votingCloseAt: s.votingCloseAt.toISOString(),
    phase: phaseAt(s, now),
  };
}

type CompRow = { id: string; week_start: string; submissions_open_at: string; submissions_close_at: string; voting_close_at: string; confirmed_at: string | null; place_id: string };
const toCompetition = (r: CompRow, now: Date): Competition => ({
  id: r.id,
  weekStart: r.week_start,
  submissionsOpenAt: r.submissions_open_at,
  submissionsCloseAt: r.submissions_close_at,
  votingCloseAt: r.voting_close_at,
  phase: phaseAt(
    { submissionsOpenAt: new Date(r.submissions_open_at), submissionsCloseAt: new Date(r.submissions_close_at), votingCloseAt: new Date(r.voting_close_at) },
    now,
    Boolean(r.confirmed_at),
  ),
});

async function stuntSpots(): Promise<Place[]> {
  const places = isSupabaseConfigured ? await getPlaces() : demoPlaces;
  return places.filter((p) => p.category === "stunt");
}

/** Tous les spots avec leur concours de la semaine. */
export async function getStuntOverview() {
  await connection();
  const now = new Date();
  const spots = await stuntSpots();
  if (!isSupabaseConfigured) return spots.map((spot) => ({ spot, competition: demoCompetition(now), entryCount: 0 }));

  const sb = await createSupabaseServerClient();
  const week = weekStartParis(now);
  const { data: places } = await sb.from("places").select("id,slug").eq("category_id", "stunt");
  const { data: comps } = await sb
    .from("stunt_competitions")
    .select("id,week_start,submissions_open_at,submissions_close_at,voting_close_at,confirmed_at,place_id,stunt_entries(count)")
    .eq("week_start", week);
  return spots.map((spot) => {
    const placeId = places?.find((p) => p.slug === spot.slug)?.id;
    const row = comps?.find((c) => c.place_id === placeId) as (CompRow & { stunt_entries: { count: number }[] }) | undefined;
    return { spot, competition: row ? toCompetition(row, now) : demoCompetition(now), entryCount: row?.stunt_entries?.[0]?.count ?? 0 };
  });
}

/** Page d'un spot : concours en cours, vidéos, classement, palmarès. */
export async function getSpotPage(slug: string) {
  await connection();
  const now = new Date();
  const spot = (await stuntSpots()).find((p) => p.slug === slug) ?? null;
  if (!spot) return null;
  const empty = { spot, competition: demoCompetition(now), entries: [] as Entry[], ranking: null as RankingRow[] | null, myVote: null as string | null, myUserId: null as string | null, history: [] as { weekStart: string; podium: RankingRow[] }[] };
  if (!isSupabaseConfigured) return empty;

  const sb = await createSupabaseServerClient();
  const [{ data: place }, { data: auth }] = await Promise.all([sb.from("places").select("id").eq("slug", slug).single(), sb.auth.getUser()]);
  if (!place) return empty;
  const { data: comps } = await sb
    .from("stunt_competitions")
    .select("id,week_start,submissions_open_at,submissions_close_at,voting_close_at,confirmed_at,place_id")
    .eq("place_id", place.id)
    .lte("week_start", weekStartParis(now))
    .order("week_start", { ascending: false })
    .limit(9);
  const current = (comps as CompRow[] | null)?.[0];
  const competition = current ? toCompetition(current, now) : demoCompetition(now);

  let entries: Entry[] = [];
  let ranking: RankingRow[] | null = null;
  let myVote: string | null = null;
  if (current) {
    const [{ data: e }, { data: r }, { data: v }] = await Promise.all([
      sb.from("stunt_entries").select("id,title,video_url,user_id,created_at,profiles(username,is_public)").eq("competition_id", current.id).eq("status", "approved").is("withdrawn_at", null).order("created_at"),
      sb.rpc("competition_ranking", { p_competition: current.id }),
      auth.user ? sb.rpc("my_stunt_vote", { p_competition: current.id }) : Promise.resolve({ data: null }),
    ]);
    entries = (e ?? []).map((x) => {
      const p = x.profiles as unknown as { username: string; is_public: boolean } | null;
      return { id: x.id, title: x.title, videoUrl: x.video_url, userId: x.user_id, createdAt: x.created_at, player: p?.is_public ? p.username : null };
    });
    ranking = (r as RankingRow[] | null) ?? null;
    myVote = (v as string | null) ?? null;
  }

  const past = ((comps as CompRow[] | null) ?? []).filter((c) => c.confirmed_at && c.id !== current?.id);
  const history = await Promise.all(
    past.map(async (c) => {
      const { data } = await sb.rpc("competition_ranking", { p_competition: c.id });
      return { weekStart: c.week_start, podium: ((data as RankingRow[] | null) ?? []).filter((x) => x.rank <= 3 && x.votes > 0) };
    }),
  );
  return { spot, competition, entries, ranking, myVote, myUserId: auth.user?.id ?? null, history };
}

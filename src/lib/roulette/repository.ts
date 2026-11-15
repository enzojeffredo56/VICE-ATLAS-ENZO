import "server-only";

import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { weekBounds, weekStartParis } from "@/lib/time/paris";
import type { WeeklyInfo } from "@/components/roulette/roulette-app";
import { demoWeeklyChallenge, officialChallenges, type Challenge } from "./engine";

/** Défis disponibles pour la roue solo + défi de la semaine en cours. */
export async function getRouletteData(): Promise<{ challenges: Challenge[]; weekly: WeeklyInfo }> {
  // Le défi de la semaine dépend de la date : calculé à chaque requête
  await connection();
  const week = weekStartParis(new Date());
  const { start, end } = weekBounds(week);
  const demoWeekly = demoWeeklyChallenge(week);
  const fallback = {
    challenges: officialChallenges,
    weekly: { title: demoWeekly.title, category: demoWeekly.category, difficulty: demoWeekly.difficulty, startsAt: start.toISOString(), endsAt: end.toISOString(), isDemo: true },
  };
  if (!isSupabaseConfigured) return fallback;

  const sb = await createSupabaseServerClient();
  const [{ data: rows }, { data: w }] = await Promise.all([
    sb.from("challenges").select("id,title,description,category,difficulty,is_custom").eq("status", "approved").is("room_id", null),
    sb.from("weekly_challenges").select("starts_at,ends_at,challenges(title,category,difficulty)").eq("week_start", week).maybeSingle(),
  ]);
  const challenges: Challenge[] = (rows ?? []).map((r) => ({ id: r.id, title: r.title, description: r.description, category: r.category, difficulty: r.difficulty, isCustom: r.is_custom }));
  const wc = w?.challenges as unknown as { title: string; category: Challenge["category"]; difficulty: Challenge["difficulty"] } | null;
  return {
    challenges: challenges.length ? challenges : officialChallenges,
    weekly: wc && w ? { ...wc, startsAt: w.starts_at, endsAt: w.ends_at, isDemo: false } : fallback.weekly,
  };
}

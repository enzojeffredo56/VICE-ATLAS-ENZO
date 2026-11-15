import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { serverEnv } from "@/lib/env.server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

/**
 * Tâche planifiée quotidienne (vercel.json) — idempotente :
 * crée les concours STUNT ARENA de la semaine (et de la suivante) et le défi de la semaine.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get("authorization"), serverEnv().CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const sb = createSupabaseServiceClient();
  if (!sb) return NextResponse.json({ error: "Base de données non configurée" }, { status: 503 });
  const [competitions, weekly, referrals] = await Promise.all([
    sb.rpc("ensure_weekly_competitions"),
    sb.rpc("ensure_weekly_challenge"),
    sb.rpc("process_referral_rewards"),
  ]);
  const error = competitions.error ?? weekly.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, competitionsCreated: competitions.data, weeklyChallenge: weekly.data, referrals: referrals.data ?? null });
}

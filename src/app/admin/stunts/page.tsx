import { Suspense } from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { StuntModeration, type PendingEntry, type SuspectVote, type ToConfirm } from "@/components/stunts/stunt-moderation";
import { Spinner } from "@/components/states/spinner";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "STUNT ARENA" };

export default function AdminStuntsPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">STUNT ARENA</h1>
      <div className="mt-8">
        <Suspense fallback={<Spinner label="Chargement…" />}>
          <Data />
        </Suspense>
      </div>
    </>
  );
}

async function Data() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="text-muted-foreground">Base de données non configurée.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  const sb = await createSupabaseServerClient();
  const [{ data: entries }, { data: votes }, { data: comps }] = await Promise.all([
    sb.from("stunt_entries").select("id,title,video_url,profiles(username),stunt_competitions(places(name))").eq("status", "pending").is("withdrawn_at", null).order("created_at").limit(100),
    sb.from("stunt_votes").select("competition_id,user_id,profiles(username),stunt_entries(title),stunt_competitions(places(name))").eq("is_suspect", true).eq("voided", false).limit(200),
    sb.from("stunt_competitions").select("id,week_start,places(name),stunt_votes(is_suspect,voided)").is("confirmed_at", null).lt("voting_close_at", new Date().toISOString()).order("week_start"),
  ]);
  const name = (x: unknown, k: string) => (x as Record<string, string> | null)?.[k] ?? "—";
  const pending: PendingEntry[] = (entries ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    url: e.video_url,
    player: name(e.profiles, "username"),
    spot: name((e.stunt_competitions as unknown as { places: unknown })?.places, "name"),
  }));
  const suspects: SuspectVote[] = (votes ?? []).map((v) => ({
    competitionId: v.competition_id,
    userId: v.user_id,
    voter: name(v.profiles, "username"),
    entry: name(v.stunt_entries, "title"),
    spot: name((v.stunt_competitions as unknown as { places: unknown })?.places, "name"),
  }));
  const toConfirm: ToConfirm[] = (comps ?? []).map((c) => ({
    id: c.id,
    weekStart: c.week_start,
    spot: name(c.places, "name"),
    suspects: ((c.stunt_votes as unknown as { is_suspect: boolean; voided: boolean }[]) ?? []).filter((v) => v.is_suspect && !v.voided).length,
  }));
  return <StuntModeration entries={pending} votes={suspects} toConfirm={toConfirm} />;
}

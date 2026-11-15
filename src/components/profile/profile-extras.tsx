import { History, Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { XP_REASON_LABELS } from "@/lib/xp/badges";
import { formatDateFr } from "@/lib/text";
import { cn } from "@/lib/utils";
import { ProfileSection } from "./profile-sections";
import { ProgressionCard, type Progression } from "./progression-card";
import { ProfileActivity } from "./profile-activity";

/** Sections du profil privé : progression, historique des XP, activité et parrainage. */
export async function ProfileExtras({ userId, referralCode }: { userId: string; referralCode: string }) {
  const sb = await createSupabaseServerClient();
  const [{ data: progression }, { data: history }] = await Promise.all([
    sb.rpc("player_progression", { p_user: userId }),
    sb.from("xp_events").select("id,amount,reason,note,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <>
      <ProfileSection id="progression" title="Progression" icon={<Sparkles className="size-5 text-pink" aria-hidden />}>
        {progression ? <ProgressionCard data={progression as Progression} /> : <p className="text-muted-foreground">Progression indisponible.</p>}
      </ProfileSection>
      <ProfileSection id="historique-xp" title="Historique des XP" icon={<History className="size-5 text-cyan" aria-hidden />}>
        {!history?.length ? (
          <p className="text-muted-foreground">Aucun XP pour l&apos;instant. Complète ton profil (+30 XP) ou donne ton avis sur VICE ATLAS (+20 XP).</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {history.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{XP_REASON_LABELS[e.reason] ?? e.reason}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDateFr(e.created_at)}
                    {e.note ? ` · ${e.note}` : ""}
                  </span>
                </span>
                <span className={cn("font-display text-lg font-bold tabular-nums", e.amount > 0 ? "text-turquoise" : "text-pink")}>
                  {e.amount > 0 ? "+" : ""}
                  {e.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSection>
      <ProfileActivity userId={userId} referralCode={referralCode} />
    </>
  );
}

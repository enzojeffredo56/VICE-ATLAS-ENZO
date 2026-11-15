import { Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileSection } from "./profile-sections";
import { ProgressionCard, type Progression } from "./progression-card";

/** Niveau et badges d'un profil public (la base masque ce qui est privé). */
export async function PublicProfileExtras({ userId }: { userId: string; showProgress: boolean }) {
  const sb = await createSupabaseServerClient();
  const { data } = await sb.rpc("player_progression", { p_user: userId });
  if (!data) return null;
  return (
    <ProfileSection id="progression" title="Progression" icon={<Sparkles className="size-5 text-pink" aria-hidden />}>
      <ProgressionCard data={data as Progression} showLocked={false} />
    </ProfileSection>
  );
}

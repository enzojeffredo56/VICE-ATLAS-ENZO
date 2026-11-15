import { Dices } from "lucide-react";
import { CHALLENGE_CATEGORIES } from "@/content/challenges";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";
import { ProfileSection } from "./profile-sections";

/** Activité du joueur : historique GTA Roulette (+ STUNT ARENA et parrainage, phases 7 et 10). */
export async function ProfileActivity({ userId }: { userId: string; referralCode: string }) {
  const sb = await createSupabaseServerClient();
  const { data: spins } = await sb
    .from("room_spins")
    .select("id,created_at,rooms(name),challenges(title,category)")
    .eq("spun_by", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <ProfileSection id="roulette" title="Historique GTA Roulette" icon={<Dices className="size-5 text-[#b49cff]" aria-hidden />}>
      {!spins?.length ? (
        <p className="text-muted-foreground">Aucun tirage dans un salon pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {spins.map((s) => {
            const c = s.challenges as unknown as { title: string; category: string } | null;
            const room = s.rooms as unknown as { name: string } | null;
            return (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: CHALLENGE_CATEGORIES.find((x) => x.id === c?.category)?.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{c?.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {room?.name} · {formatDateFr(s.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileSection>
  );
}

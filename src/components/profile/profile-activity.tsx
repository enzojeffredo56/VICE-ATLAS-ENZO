import Link from "next/link";
import { Dices, Flame, Gift } from "lucide-react";
import { ReferralShare } from "@/components/plus/referral-share";
import { CHALLENGE_CATEGORIES } from "@/content/challenges";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";
import { ProfileSection } from "./profile-sections";

/** Activité du joueur : historique GTA Roulette (+ STUNT ARENA et parrainage, phases 7 et 10). */
export async function ProfileActivity({ userId, referralCode }: { userId: string; referralCode: string }) {
  const sb = await createSupabaseServerClient();
  const { data: entries } = await sb
    .from("stunt_entries")
    .select("id,title,status,withdrawn_at,stunt_competitions(week_start,places(name)),competition_results(rank)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  const { data: spins } = await sb
    .from("room_spins")
    .select("id,created_at,rooms(name),challenges(title,category)")
    .eq("spun_by", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <>
    <ProfileSection id="stunts" title="Participations STUNT ARENA" icon={<Flame className="size-5 text-pink" aria-hidden />}>
      {!entries?.length ? (
        <p className="text-muted-foreground">
          Aucune participation pour l&apos;instant.{" "}
          <Link href="/stunts/participer" className="text-cyan underline-offset-4 hover:underline">
            Publier une cascade
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => {
            const c = e.stunt_competitions as unknown as { week_start: string; places: { name: string } };
            const rank = (e.competition_results as unknown as { rank: number }[] | null)?.[0]?.rank;
            const status = e.withdrawn_at ? "retirée" : e.status === "approved" ? "publiée" : e.status === "pending" ? "en vérification" : "refusée";
            return (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{e.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.places.name} · {formatDateFr(c.week_start)} · {rank ? `${rank}e place` : status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileSection>
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
    <ProfileSection id="parrainage" title="Parrainage" icon={<Gift className="size-5 text-pink" aria-hidden />}>
      <p className="mb-4 text-sm text-muted-foreground">
        Un ami qui s&apos;abonne à VICE ATLAS PLUS avec ton code = un mois offert pour toi (après vérification).{" "}
        <Link href="/plus/parrainage" className="text-cyan underline-offset-4 hover:underline">
          Voir mes récompenses
        </Link>
      </p>
      <ReferralShare code={referralCode} />
    </ProfileSection>
    </>
  );
}

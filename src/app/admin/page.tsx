import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, BookOpenText, Crown, Flame, Gauge, Inbox, Map as MapIcon, ScrollText, Star, Users } from "lucide-react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { Spinner } from "@/components/states/spinner";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SECTIONS = [
  { href: "/admin/moderation", label: "Modération", text: "Contributions, défis proposés, preuves du défi de la semaine.", icon: Inbox },
  { href: "/admin/avis", label: "Avis", text: "Modération des avis VICE ATLAS.", icon: Star },
  { href: "/admin/stunts", label: "STUNT ARENA", text: "Vidéos, votes signalés et résultats.", icon: Flame },
  { href: "/admin/guides", label: "Guides", text: "Créer, modifier et publier les guides.", icon: BookOpenText },
  { href: "/admin/lieux", label: "Lieux", text: "Lieux de la carte, brouillons et publication.", icon: MapIcon },
  { href: "/admin/utilisateurs", label: "Utilisateurs", text: "Rôles, XP, badges.", icon: Users },
  { href: "/admin/premium", label: "Premium et parrainage", text: "Abonnements, paiements, récompenses de parrainage.", icon: Crown },
  { href: "/admin/journal", label: "Journal d'audit", text: "Qui a fait quoi, et quand.", icon: ScrollText },
] as const;

export default function AdminHome() {
  return (
    <>
      <h1 className="text-4xl font-bold">Tableau de bord</h1>
      <Suspense fallback={<Spinner label="Chargement des statistiques…" />}>
        <Stats />
      </Suspense>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map(({ href, label, text, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="glass block h-full rounded-3xl p-5 transition hover:-translate-y-1 hover:border-white/25">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-cyan/10 text-cyan">
                  <Icon className="size-5" aria-hidden />
                </span>
                <ArrowUpRight className="size-5 text-pink" aria-hidden />
              </div>
              <h2 className="mt-6 font-display text-lg font-bold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

const LABELS: Record<string, string> = {
  players: "Joueurs",
  publicProfiles: "Profils publics",
  newPlayers7d: "Nouveaux (7 j)",
  xpDistributed: "XP distribués",
  pendingReviews: "Avis à modérer",
  pendingEntries: "Vidéos à vérifier",
  pendingContributions: "Contributions à vérifier",
  pendingChallenges: "Défis proposés",
  pendingWeekly: "Preuves hebdo",
  suspectVotes: "Votes signalés",
  activeRooms7d: "Salons actifs (7 j)",
  reviewAverage: "Note moyenne",
};

async function Stats() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="mt-6 text-muted-foreground">Base de données non configurée : les statistiques apparaîtront une fois Supabase branché.</p>;
  if (ctx.status !== "ok") return <div className="mt-6"><AdminAccessDenied ctx={ctx} /></div>;
  const sb = await createSupabaseServerClient();
  const { data } = await sb.rpc("admin_stats");
  const stats = (data ?? {}) as Record<string, number>;
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Object.entries(LABELS).map(([k, label]) => (
        <li key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="size-3.5" aria-hidden /> {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{Number(stats[k] ?? 0).toLocaleString("fr-FR")}</p>
        </li>
      ))}
    </ul>
  );
}

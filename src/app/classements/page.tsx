import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Crown, Flame, Sparkles, Trophy } from "lucide-react";
import { Avatar } from "@/components/auth/user-menu";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/states/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Classements", description: "Les joueurs les plus actifs de VICE ATLAS et les champions de STUNT ARENA." };

type XpRow = { rank: number; username: string; avatar_url: string | null; xp: number; level: number };
type StuntRow = { rank: number; username: string; avatar_url: string | null; wins: number; podiums: number };

export default function ClassementsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-32 pb-16 sm:px-8">
      <Reveal>
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
          <Trophy className="size-4" aria-hidden /> Classements
        </p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Le <span className="text-neon">top</span> de VICE ATLAS
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Seuls les joueurs au profil public apparaissent. Ton profil est privé par défaut : tu choisis.</p>
      </Reveal>
      <Suspense fallback={<Skeleton className="mt-10 h-96 rounded-3xl" />}>
        <Boards />
      </Suspense>
    </div>
  );
}

async function Boards() {
  let xp: XpRow[] = [];
  let stunts: StuntRow[] = [];
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServerClient();
    const [a, b] = await Promise.all([sb.rpc("leaderboard_xp", { p_limit: 50 }), sb.rpc("leaderboard_stunts", { p_limit: 50 })]);
    xp = (a.data as XpRow[] | null) ?? [];
    stunts = (b.data as StuntRow[] | null) ?? [];
  }
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <Board title="XP général" icon={<Sparkles className="size-5 text-pink" aria-hidden />} empty="Le classement se remplira avec les premiers XP.">
        {xp.map((r) => (
          <Row key={r.username} rank={r.rank} username={r.username} avatar={r.avatar_url} right={`${r.xp.toLocaleString("fr-FR")} XP`} sub={`Niveau ${r.level}`} />
        ))}
      </Board>
      <Board title="STUNT ARENA" icon={<Flame className="size-5 text-[#ffb36b]" aria-hidden />} empty="Les premiers champions apparaîtront après le premier concours confirmé.">
        {stunts.map((r) => (
          <Row key={r.username} rank={r.rank} username={r.username} avatar={r.avatar_url} right={`${r.wins} victoire${r.wins > 1 ? "s" : ""}`} sub={`${r.podiums} podium${r.podiums > 1 ? "s" : ""}`} />
        ))}
      </Board>
    </div>
  );
}

function Board({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode[] }) {
  return (
    <section aria-label={title} className="glass rounded-3xl p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {icon} {title}
      </h2>
      {children.length === 0 ? <EmptyState className="mt-4" icon={Trophy} title="Classement vide" description={empty} /> : <ol className="mt-4 space-y-1">{children}</ol>}
    </section>
  );
}

function Row({ rank, username, avatar, right, sub }: { rank: number; username: string; avatar: string | null; right: string; sub: string }) {
  return (
    <li>
      <Link href={`/joueurs/${username}`} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/[0.05]", rank <= 3 && "bg-white/[0.03]")}>
        <span className={cn("w-8 text-center font-display text-lg font-bold tabular-nums", rank === 1 ? "text-[#ffd166]" : rank === 2 ? "text-[#d7dde8]" : rank === 3 ? "text-[#e0a170]" : "text-ink/50")}>
          {rank === 1 ? <Crown className="mx-auto size-5" aria-label="1er" /> : rank}
        </span>
        <Avatar url={avatar} name={username} className="size-9" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{username}</span>
          <span className="block text-xs text-muted-foreground">{sub}</span>
        </span>
        <span className="font-display font-bold text-turquoise tabular-nums">{right}</span>
      </Link>
    </li>
  );
}

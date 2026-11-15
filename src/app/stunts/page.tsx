import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, CalendarClock, Film, Flame, ListChecks, Trophy, Vote } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PhaseBanner } from "@/components/stunts/phase-banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PODIUM_XP } from "@/lib/stunts/calendar";
import { getStuntOverview } from "@/lib/stunts/repository";

export const metadata: Metadata = {
  title: "STUNT ARENA",
  description: "Un concours de cascades par spot, chaque semaine : publie ta vidéo, vote, grimpe au classement.",
};

const RULES = [
  { icon: CalendarClock, title: "Une semaine, un concours par spot", text: "Participations du lundi 00:00 au vendredi 23:59, votes le samedi et le dimanche. Heure de Paris." },
  { icon: Film, title: "Une vidéo par concours", text: "Lien YouTube, clip Twitch ou Streamable. Chaque vidéo est vérifiée avant publication." },
  { icon: Vote, title: "Un vote par concours", text: "Modifiable jusqu'à la clôture. Pas de vote pour sa propre vidéo. Compteurs cachés pendant le vote." },
  { icon: ListChecks, title: "Résultats vérifiés", text: "Votes suspects contrôlés, égalités partagées. Les XP tombent après confirmation par l'équipe." },
];

export default function StuntsPage() {
  return (
    <div className="relative isolate mx-auto max-w-7xl px-5 pt-32 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(ellipse_60%_60%_at_30%_0%,rgb(255_61_145/0.25),transparent_70%)]" />
      <Reveal>
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-pink uppercase">
          <Flame className="size-4" aria-hidden /> Concours hebdomadaires
        </p>
        <h1 className="mt-3 text-5xl leading-[0.95] font-bold sm:text-7xl">
          STUNT <span className="text-neon">ARENA</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">Choisis ton spot, publie ta meilleure cascade et fais voter la communauté.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/stunts/participer">
              <Film /> Participer
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/stunts/gagnants">
              <Trophy /> Gagnants
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/stunts/mes-videos">Mes vidéos</Link>
          </Button>
        </div>
      </Reveal>

      <Suspense fallback={<Skeleton className="mt-12 h-72 rounded-3xl" />}>
        <Spots />
      </Suspense>

      <section aria-labelledby="rules-title" className="mt-16">
        <h2 id="rules-title" className="text-2xl font-bold">
          Le règlement en bref
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass rounded-3xl p-5">
              <Icon className="size-6 text-cyan" aria-hidden />
              <h3 className="mt-4 font-display font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Barème : +10 XP pour ta première participation validée de la semaine, puis +{PODIUM_XP[1]} / +{PODIUM_XP[2]} / +{PODIUM_XP[3]} XP pour le podium
          de chaque spot.
        </p>
      </section>
    </div>
  );
}

async function Spots() {
  const overview = await getStuntOverview();
  return (
    <section aria-labelledby="spots-title" className="mt-14">
      <h2 id="spots-title" className="text-2xl font-bold">
        Les spots de la semaine
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {overview.map(({ spot, competition, entryCount }) => (
          <li key={spot.slug}>
            <Link href={`/stunts/${spot.slug}`} className="glass group flex h-full flex-col gap-4 rounded-3xl p-6 transition hover:-translate-y-1 hover:border-pink/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-bold">{spot.name}</h3>
                  <p className="text-sm text-muted-foreground">{spot.district}</p>
                </div>
                <ArrowUpRight className="size-5 text-pink transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </div>
              <p className="text-sm text-ink/80">{spot.description}</p>
              <div className="mt-auto space-y-2">
                <PhaseBanner phase={competition.phase} dates={competition} compact />
                <p className="text-xs text-muted-foreground">
                  {entryCount} participation{entryCount > 1 ? "s" : ""} cette semaine
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

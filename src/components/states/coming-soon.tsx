import Link from "next/link";
import { ArrowLeft, Construction, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";

type ComingSoonProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  phase: number;
  features?: string[];
};

/** Page d'attente d'un module pas encore développé (état vide). */
export function ComingSoon({ title, description, icon: Icon = Construction, phase, features = [] }: ComingSoonProps) {
  return (
    <section className="relative isolate overflow-hidden px-5 pt-36 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(139_92_246/0.28),transparent_70%)]" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <div className="relative mx-auto grid size-24 place-items-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-pink/25" aria-hidden />
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-cyan/20 [animation-delay:1.2s]" aria-hidden />
            <span className="relative grid size-20 place-items-center rounded-3xl border border-white/15 bg-gradient-to-br from-pink/25 to-violet/25 text-white shadow-[0_0_50px_-10px_rgb(255_61_145/0.8)]">
              <Icon className="size-9" aria-hidden />
            </span>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Badge variant="cyan" className="mt-8">
            En construction · phase {phase}
          </Badge>
        </Reveal>
        <Reveal delay={0.14}>
          <h1 className="mt-5 text-4xl font-bold sm:text-6xl">{title}</h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{description}</p>
        </Reveal>
        {features.length > 0 && (
          <Reveal delay={0.26}>
            <ul className="mx-auto mt-10 grid max-w-2xl gap-2 text-left sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ink/85">
                  <span className="size-1.5 shrink-0 rounded-full bg-gradient-to-r from-pink to-cyan" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
        <Reveal delay={0.32}>
          <Button asChild variant="outline" className="mt-10">
            <Link href="/">
              <ArrowLeft /> Retour à l&apos;accueil
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

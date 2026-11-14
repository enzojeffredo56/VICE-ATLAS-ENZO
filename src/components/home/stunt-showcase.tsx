"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { CalendarClock, Flame, Link2, MapPin, ScrollText, ShieldCheck, Trophy, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Counter } from "@/components/motion/counter";
import { XP_REWARDS } from "@/lib/xp/levels";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: MapPin, title: "Choisis ton spot", text: "Chaque spot de cascade a sa propre compétition, relancée chaque semaine.", color: "text-cyan" },
  { icon: ScrollText, title: "Lis les règles", text: "Règles claires par spot, calendrier affiché avec son fuseau horaire.", color: "text-turquoise" },
  { icon: Link2, title: "Publie ta vidéo", text: "Un lien vidéo externe autorisé, une participation active par concours. Modération avant publication.", color: "text-pink" },
  { icon: Vote, title: "Vote", text: "Un vote par personne et par concours, modifiable jusqu'à la clôture.", color: "text-[#b49cff]" },
  { icon: ShieldCheck, title: "Résultats vérifiés", text: "Égalités et votes suspects contrôlés : les XP tombent après confirmation.", color: "text-cyan" },
] as const;

export function StuntShowcase() {
  return (
    <section id="stunts" aria-label="STUNT ARENA" className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_20%_40%,rgb(255_61_145/0.16),transparent_70%)]" />
      <HorizontalTrack />
    </section>
  );
}

function Intro({ headingId }: { headingId?: string }) {
  return (
    <div className="flex w-[min(86vw,460px)] shrink-0 flex-col justify-center pr-4">
      <Badge variant="pink" className="mb-5 w-fit">
        <Flame /> Concours hebdomadaires
      </Badge>
      <h2 id={headingId} className="text-5xl leading-[0.95] font-bold sm:text-7xl">
        STUNT
        <br />
        <span className="text-neon">ARENA</span>
      </h2>
      <p className="mt-5 text-muted-foreground sm:text-lg">
        Poste ta meilleure cascade, fais voter la communauté et grave ton pseudo au palmarès du spot.
      </p>
      <p className="mt-6 hidden items-center gap-2 text-xs tracking-[0.25em] text-ink/40 uppercase lg:flex">
        Continue à scroller <span className="inline-block animate-pulse">→</span>
      </p>
    </div>
  );
}

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const Icon = step.icon;
  return (
    <motion.article
      whileHover={{ y: -10, rotate: index % 2 ? 1.2 : -1.2 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="glass group relative flex h-[400px] w-[min(78vw,320px)] shrink-0 snap-center flex-col overflow-hidden rounded-3xl p-7"
    >
      <span className="absolute -top-8 -right-3 font-display text-[9rem] leading-none font-bold text-white/[0.04] transition-colors duration-500 group-hover:text-pink/15">
        {index + 1}
      </span>
      <span className={cn("grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12", step.color)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-auto font-display text-2xl font-bold">{step.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
      <span className="absolute inset-x-7 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-pink to-cyan transition-transform duration-500 group-hover:scale-x-100" />
    </motion.article>
  );
}

function Podium() {
  const places = [
    { place: 2, xp: XP_REWARDS.stuntSecondPlace, h: "h-28", color: "from-cyan/80 to-cyan/20", order: "order-1" },
    { place: 1, xp: XP_REWARDS.stuntFirstPlace, h: "h-40", color: "from-pink to-pink/25", order: "order-2" },
    { place: 3, xp: XP_REWARDS.stuntThirdPlace, h: "h-20", color: "from-violet/80 to-violet/20", order: "order-3" },
  ];
  return (
    <div className="glass flex h-[400px] w-[min(86vw,440px)] shrink-0 snap-center flex-col rounded-3xl p-7">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-bold">Le podium</h3>
        <Trophy className="size-6 text-pink" aria-hidden />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        +{XP_REWARDS.stuntWeeklyParticipation} XP pour ta 1re participation valide de la semaine.
      </p>
      <div className="mt-auto flex items-end justify-center gap-3">
        {places.map((p) => (
          <div key={p.place} className={cn("flex w-24 flex-col items-center gap-2", p.order)}>
            <span className="font-display text-lg font-bold">
              +<Counter to={p.xp} /> <span className="text-xs text-muted-foreground">XP</span>
            </span>
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: p.place * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={cn("grid w-full origin-bottom place-items-start justify-center rounded-t-2xl bg-gradient-to-b pt-3", p.h, p.color)}
            >
              <span className="font-display text-3xl font-bold text-night">{p.place}</span>
            </motion.div>
          </div>
        ))}
      </div>
      <Button asChild size="sm" className="mt-5 self-start">
        <Link href="/stunts">
          <CalendarClock /> Voir les concours
        </Link>
      </Button>
    </div>
  );
}

/**
 * Grand écran : le scroll vertical fait défiler la piste horizontalement.
 * Mobile / tablette : carrousel natif à balayage (scroll-snap).
 */
function HorizontalTrack() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setDistance(Math.max(0, trackRef.current.scrollWidth - window.innerWidth + 64));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const items = (headingId?: string) => (
    <>
      <Intro headingId={headingId} />
      {STEPS.map((s, i) => (
        <StepCard key={s.title} step={s} index={i} />
      ))}
      <Podium />
    </>
  );

  return (
    <>
      {/* Desktop */}
      <div ref={sectionRef} className="relative hidden lg:block" style={{ height: `calc(100vh + ${distance}px)` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <motion.div ref={trackRef} style={{ x }} className="flex items-center gap-6 pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            {items("stunt-title")}
          </motion.div>
        </div>
      </div>
      {/* Mobile */}
      <div className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-5 py-24 [scrollbar-width:none] sm:px-8 lg:hidden">
        {items()}
      </div>
    </>
  );
}

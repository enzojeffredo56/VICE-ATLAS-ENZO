"use client";

import Link from "next/link";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useState } from "react";
import { Dices, Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import {
  DEMO_CHALLENGES,
  DIFFICULTIES,
  pickChallengeIndex,
  targetRotation,
  type Difficulty,
} from "@/lib/roulette/demo-challenges";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const N = DEMO_CHALLENGES.length;
const R = 150;

function segmentPath(i: number) {
  const a0 = ((i * 360) / N - 90) * (Math.PI / 180);
  const a1 = (((i + 1) * 360) / N - 90) * (Math.PI / 180);
  const x0 = 160 + R * Math.cos(a0);
  const y0 = 160 + R * Math.sin(a0);
  const x1 = 160 + R * Math.cos(a1);
  const y1 = 160 + R * Math.sin(a1);
  return `M160 160 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

const DIFF_BADGE: Record<Difficulty, "turquoise" | "cyan" | "pink"> = {
  facile: "turquoise",
  moyenne: "cyan",
  difficile: "pink",
};

export function RouletteShowcase() {
  const [scope, animate] = useAnimate();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [result, setResult] = useState<number | null>(null);

  async function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const index = pickChallengeIndex(difficulty);
    const next = targetRotation(rotation, index, N);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await animate(scope.current, { rotate: next }, { duration: reduce ? 0 : 4.2, ease: [0.12, 0.8, 0.18, 1] });
    setRotation(next);
    setResult(index);
    setSpinning(false);
  }

  const challenge = result !== null ? DEMO_CHALLENGES[result] : null;

  return (
    <section id="roulette" aria-labelledby="roulette-title" className="relative scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_75%_50%,rgb(139_92_246/0.2),transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="GTA Roulette"
            title="Un tour de roue, un défi pour toute la crew."
            highlight={["défi"]}
            description="Crée un salon privé, partage le code à tes amis : le défi tiré s'affiche en même temps chez tout le monde."
          />

          <Reveal delay={0.15}>
            <div className="mt-8" role="group" aria-label="Difficulté">
              <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-ink/50 uppercase">Difficulté</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={difficulty === null} onClick={() => setDifficulty(null)}>
                  Toutes
                </Chip>
                {DIFFICULTIES.map((d) => (
                  <Chip key={d.value} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div aria-live="polite" className="mt-8 min-h-36">
              <AnimatePresence mode="wait">
                {challenge ? (
                  <motion.div
                    key={challenge.id + rotation}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="neon-border glass rounded-2xl p-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={DIFF_BADGE[challenge.difficulty]}>{challenge.difficulty}</Badge>
                      <Badge>{challenge.category}</Badge>
                    </div>
                    <p className="mt-3 font-display text-xl font-semibold sm:text-2xl">{challenge.label}</p>
                  </motion.div>
                ) : (
                  <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-white/12 p-5 text-muted-foreground">
                    {spinning ? "La roue tourne…" : "Fais tourner la roue pour tirer un défi de démonstration."}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={spin} disabled={spinning} className="group">
                <Dices className={cn("transition-transform duration-500", spinning ? "animate-spin" : "group-hover:rotate-180")} />
                {spinning ? "Ça tourne…" : "Lancer la roue"}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/roulette">
                  <Users /> Créer un salon
                </Link>
              </Button>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Défis de démonstration : les défis invérifiables ne rapportent pas d&apos;XP.
            </p>
          </Reveal>
        </div>

        {/* Roue */}
        <Reveal delay={0.1} className="relative mx-auto w-full max-w-[460px]">
          <div className="relative aspect-square">
            <div aria-hidden className="absolute inset-[6%] rounded-full bg-gradient-to-br from-pink/40 to-cyan/40 blur-3xl" />
            {/* Pointeur */}
            <div aria-hidden className="absolute top-[1%] left-1/2 z-20 -translate-x-1/2">
              <svg viewBox="0 0 40 48" className="w-10 drop-shadow-[0_0_10px_rgb(255_255_255/0.6)]">
                <path d="M20 46 L4 10 A16 16 0 1 1 36 10 Z" fill="#F8FAFC" />
                <circle cx="20" cy="16" r="6" fill="#FF3D91" />
              </svg>
            </div>
            <motion.div ref={scope} className="relative size-full" style={{ rotate: 0 }}>
              <svg viewBox="0 0 320 320" className="size-full" role="img" aria-label="Roue des défis">
                <circle cx="160" cy="160" r="158" fill="#0B1020" stroke="url(#wheel-ring)" strokeWidth="4" />
                <defs>
                  <linearGradient id="wheel-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FF3D91" />
                    <stop offset="1" stopColor="#00D4FF" />
                  </linearGradient>
                </defs>
                {DEMO_CHALLENGES.map((c, i) => {
                  const mid = ((i + 0.5) * 360) / N;
                  return (
                    <g key={c.id}>
                      <path d={segmentPath(i)} fill={c.color} opacity={i % 2 ? 0.8 : 0.55} stroke="#0B1020" strokeWidth="2" />
                      <text
                        x="160"
                        y="48"
                        textAnchor="middle"
                        transform={`rotate(${mid} 160 160)`}
                        className="fill-white font-display text-[12px] font-bold"
                      >
                        {c.category.toUpperCase()}
                      </text>
                      <text x="160" y="66" textAnchor="middle" transform={`rotate(${mid} 160 160)`} className="fill-white/75 text-[10px]">
                        {c.difficulty}
                      </text>
                    </g>
                  );
                })}
                {Array.from({ length: 24 }, (_, i) => (
                  <circle
                    key={i}
                    cx={160 + 154 * Math.cos((i * 15 * Math.PI) / 180)}
                    cy={160 + 154 * Math.sin((i * 15 * Math.PI) / 180)}
                    r="2.2"
                    fill={i % 2 ? "#00D4FF" : "#FF3D91"}
                  />
                ))}
              </svg>
            </motion.div>
            {/* Moyeu */}
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              aria-label="Lancer la roue"
              className="absolute top-1/2 left-1/2 z-10 grid size-[22%] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-4 border-night bg-gradient-to-br from-pink to-violet font-display text-sm font-bold text-white shadow-[0_0_40px_rgb(255_61_145/0.7)] transition-transform hover:scale-110 active:scale-95 disabled:cursor-wait"
            >
              GO
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 cursor-pointer rounded-full border px-4 text-sm font-medium transition-all duration-300",
        active
          ? "border-pink/60 bg-pink/15 text-white shadow-[0_0_20px_-6px_rgb(255_61_145/0.8)]"
          : "border-white/12 text-ink/70 hover:border-white/30 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

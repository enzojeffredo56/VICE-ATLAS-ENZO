"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Award, BadgeCheck, Compass, Crown, Flame, HandHeart, Map as MapIcon, Star, Trophy } from "lucide-react";
import { Counter } from "@/components/motion/counter";
import { Stagger, staggerItem } from "@/components/motion/reveal";
import { LEVEL_THRESHOLDS, XP_REWARDS, getLevelInfo } from "@/lib/xp/levels";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const REWARDS = [
  { label: "Profil complété", xp: XP_REWARDS.profileCompleted },
  { label: "Avis VICE ATLAS approuvé", xp: XP_REWARDS.reviewApproved },
  { label: "Découverte communautaire approuvée", xp: XP_REWARDS.discoveryApproved },
  { label: "Participation Stunt de la semaine", xp: XP_REWARDS.stuntWeeklyParticipation },
  { label: "Défi hebdomadaire validé", xp: XP_REWARDS.weeklyChallengeValidated },
  { label: "Victoire STUNT ARENA", xp: XP_REWARDS.stuntFirstPlace },
];

const BADGES = [
  { icon: Star, name: "Premier avis", color: "#FF3D91" },
  { icon: Flame, name: "Premier Stunt", color: "#ffb36b" },
  { icon: Trophy, name: "Champion du spot", color: "#00D4FF" },
  { icon: Crown, name: "Légende du Stunt", color: "#8B5CF6" },
  { icon: Compass, name: "Explorateur", color: "#2DD4BF" },
  { icon: MapIcon, name: "Grand explorateur", color: "#00D4FF" },
  { icon: HandHeart, name: "Contributeur", color: "#FF3D91" },
  { icon: BadgeCheck, name: "Expert communautaire", color: "#8B5CF6" },
];

const MAX_XP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

export function ProgressionShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  const xp = useTransform(scrollYProgress, [0, 1], [0, 2900]);
  const [xpValue, setXpValue] = useState(0);
  useMotionValueEvent(xp, "change", (v) => setXpValue(Math.round(v)));
  const info = getLevelInfo(xpValue);
  const width = useTransform(xp, (v) => `${Math.min(100, (v / MAX_XP) * 100)}%`);

  return (
    <section aria-labelledby="xp-title" className="relative px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="XP · Niveaux · Badges"
          title="Chaque action te fait grimper."
          highlight={["grimper."]}
          description="Les XP sont attribués côté serveur, avec historique et protection contre les doublons. Dix niveaux, huit badges à débloquer."
          align="center"
        />

        {/* Jauge de niveaux pilotée par le scroll */}
        <div ref={ref} className="glass mt-14 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-ink/50 uppercase">Exemple de progression</p>
              <p className="mt-1 font-display text-4xl font-bold sm:text-5xl">
                Niveau <span className="text-neon">{info.level}</span>
              </p>
            </div>
            <p className="font-mono text-sm text-cyan tabular-nums">
              {xpValue.toLocaleString("fr-FR")} XP
              {info.nextThreshold !== null && (
                <span className="text-muted-foreground"> / {info.nextThreshold.toLocaleString("fr-FR")}</span>
              )}
            </p>
          </div>
          <div className="relative mt-6 h-4 overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={`Exemple : niveau ${info.level}`}>
            <motion.div style={{ width }} className="relative h-full rounded-full bg-gradient-to-r from-pink via-violet to-cyan">
              <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.45),transparent)] bg-[length:50%_100%] bg-no-repeat" />
            </motion.div>
          </div>
          <ol className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {LEVEL_THRESHOLDS.map((t, i) => {
              const reached = xpValue >= t;
              return (
                <li
                  key={t}
                  className={cn(
                    "rounded-xl border px-1 py-2 text-center transition-all duration-500",
                    reached ? "border-pink/40 bg-pink/10 text-white" : "border-white/8 text-ink/40",
                  )}
                >
                  <span className="block font-display text-sm font-bold">N{i + 1}</span>
                  <span className="block text-[10px] tabular-nums">{t.toLocaleString("fr-FR")}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Barème */}
          <div className="glass rounded-3xl p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold">
              <Award className="size-5 text-turquoise" aria-hidden /> Barème XP
            </h3>
            <ul className="mt-5 divide-y divide-white/8">
              {REWARDS.map((r) => (
                <li key={r.label} className="group flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-ink/80 transition-colors group-hover:text-white">{r.label}</span>
                  <span className="font-display text-lg font-bold text-turquoise tabular-nums transition-transform group-hover:scale-110">
                    +<Counter to={r.xp} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Badges */}
          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.name}
                  variants={staggerItem}
                  whileHover={{ y: -8, rotate: -2 }}
                  className="glass group relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl p-5 text-center"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.12)_50%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <span
                    className="relative grid size-16 place-items-center rounded-full border-2 transition-all duration-500 group-hover:scale-110"
                    style={{ borderColor: `${b.color}80`, background: `${b.color}1f`, color: b.color, boxShadow: `0 0 0 0 ${b.color}` }}
                  >
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <span className="relative text-sm font-semibold">{b.name}</span>
                </motion.div>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

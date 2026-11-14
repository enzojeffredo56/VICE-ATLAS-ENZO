"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { Check, Filter, Map as MapIcon, MousePointer2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    icon: MousePointer2,
    title: "Explore",
    text: "Zoom, déplacement fluide et coordonnées X/Y : une carte pensée pour fouiller chaque recoin.",
  },
  {
    icon: Filter,
    title: "Filtre",
    text: "Catégories, recherche et favoris : n'affiche que ce qui t'intéresse, en un geste.",
  },
  {
    icon: Check,
    title: "Progresse",
    text: "Marque les lieux visités : ton carnet de progression se met à jour automatiquement.",
  },
] as const;

// Lieux fictifs de démonstration (aucune donnée officielle).
const PINS = [
  { x: 300, y: 210, color: "#FF3D91", cat: "stunt", at: 0.06 },
  { x: 430, y: 160, color: "#00D4FF", cat: "lieu", at: 0.12 },
  { x: 520, y: 300, color: "#2DD4BF", cat: "collectible", at: 0.18 },
  { x: 360, y: 360, color: "#8B5CF6", cat: "lieu", at: 0.24 },
  { x: 610, y: 210, color: "#FF3D91", cat: "stunt", at: 0.3 },
  { x: 250, y: 330, color: "#00D4FF", cat: "lieu", at: 0.34 },
  { x: 655, y: 430, color: "#2DD4BF", cat: "collectible", at: 0.38 },
] as const;

export function MapShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(v < 0.38 ? 0 : v < 0.7 ? 1 : 2);
  });

  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.92, 1.12, 1.28]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-4, 3]);
  const routeLength = useTransform(scrollYProgress, [0.1, 0.65], [0, 1]);
  const coordX = useTransform(scrollYProgress, (v) => Math.round(120 + v * 512));
  const coordY = useTransform(scrollYProgress, (v) => Math.round(480 - v * 296));

  return (
    <section ref={ref} aria-labelledby="map-title" className="relative h-[320vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 pt-20 pb-28 sm:px-8 lg:py-0">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Texte */}
          <div className="order-2 lg:order-1">
            <SectionHeading eyebrow="Carte interactive" title="Une carte qui vit avec toi." highlight={["vit"]} className="hidden lg:block" />
            <h2 id="map-title" className="text-3xl font-bold lg:hidden">
              Une carte qui <span className="text-neon">vit</span> avec toi.
            </h2>

            <ol className="mt-6 space-y-2 lg:mt-10 lg:space-y-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = i === step;
                return (
                  <li
                    key={s.title}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 lg:p-5",
                      active ? "border-cyan/40 bg-cyan/[0.07]" : "border-transparent opacity-45",
                      !active && "max-lg:hidden",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="map-step"
                        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pink to-cyan"
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <span className={cn("grid size-9 place-items-center rounded-xl", active ? "bg-cyan/15 text-cyan" : "bg-white/5")}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <h3 className="font-display text-lg font-semibold">
                        <span className="mr-2 text-ink/40">0{i + 1}</span>
                        {s.title}
                      </h3>
                    </div>
                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pt-2 pl-12 text-sm text-muted-foreground sm:text-base"
                        >
                          {s.text}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>

            <Button asChild variant="cyan" className="mt-6 lg:mt-8">
              <Link href="/carte">
                <MapIcon /> Ouvrir la carte
              </Link>
            </Button>
          </div>

          {/* Carte */}
          <div className="order-1 lg:order-2">
            <div className="glass relative aspect-[4/3] overflow-hidden rounded-3xl max-lg:max-h-[38svh] max-lg:w-full">
              {/* Barre d'outils */}
              <div className="absolute top-3 right-3 left-3 z-20 flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-night/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
                  <Search className="size-3.5" aria-hidden />
                  <span className="truncate">Rechercher un lieu…</span>
                </div>
                {(["Stunts", "Lieux", "Collectibles"] as const).map((f, i) => (
                  <span
                    key={f}
                    className={cn(
                      "hidden rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-500 sm:inline",
                      step >= 1 && i === 0 ? "border-pink/50 bg-pink/20 text-pink" : "border-white/10 bg-night/70 text-ink/60",
                    )}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <motion.svg
                viewBox="0 0 800 600"
                className="absolute inset-0 size-full"
                style={{ scale, rotate }}
                aria-hidden
              >
                <defs>
                  <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M0 10 Q 10 4 20 10 T 40 10" fill="none" stroke="rgb(0 212 255 / 0.1)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#1d2550" />
                    <stop offset="1" stopColor="#141a3a" />
                  </linearGradient>
                </defs>
                <rect width="800" height="600" fill="#0a0f22" />
                <rect width="800" height="600" fill="url(#waves)" />
                {/* Île principale (fictive) */}
                <path
                  d="M180 140 C 260 80, 420 70, 540 110 C 650 140, 720 230, 700 330 C 690 420, 610 500, 500 500 C 420 500, 380 450, 300 440 C 200 430, 140 360, 150 280 C 155 220, 150 170, 180 140 Z"
                  fill="url(#land)"
                  stroke="rgb(0 212 255 / 0.55)"
                  strokeWidth="2"
                />
                {/* Lagune */}
                <path d="M420 250 C 460 230, 500 250, 490 290 C 480 320, 430 320, 415 295 C 405 278, 405 260, 420 250 Z" fill="#0a0f22" stroke="rgb(45 212 191 / 0.5)" strokeWidth="1.5" />
                {/* Petites îles */}
                {[
                  [720, 470, 22],
                  [760, 520, 14],
                  [690, 540, 10],
                  [110, 470, 18],
                ].map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill="#161d42" stroke="rgb(0 212 255 / 0.4)" strokeWidth="1.5" />
                ))}
                {/* Routes */}
                <g stroke="rgb(248 250 252 / 0.14)" strokeWidth="3" fill="none" strokeLinecap="round">
                  <path d="M200 280 C 300 260, 400 200, 560 180" />
                  <path d="M300 160 C 320 260, 330 360, 360 440" />
                  <path d="M520 130 C 560 220, 600 300, 640 360" />
                  <path d="M250 380 C 380 380, 520 400, 640 420" />
                </g>
                {/* Itinéraire tracé au scroll */}
                <motion.path
                  d="M250 330 C 300 260, 340 220, 430 160 S 560 230, 610 210 S 640 380, 655 430"
                  fill="none"
                  stroke="#FF3D91"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ pathLength: routeLength, filter: "drop-shadow(0 0 6px #FF3D91)" }}
                />
                {PINS.map((p, i) => (
                  <Pin key={i} pin={p} progress={scrollYProgress} step={step} />
                ))}
              </motion.svg>

              {/* Radar */}
              <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="size-[140%] animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgb(0_212_255/0.12)_40deg,transparent_60deg)] [animation-duration:6s]" />
              </div>

              {/* Coordonnées */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 rounded-full border border-white/10 bg-night/80 px-3 py-1.5 font-mono text-[11px] text-cyan backdrop-blur">
                <span>
                  X <Coord value={coordX} />
                </span>
                <span>
                  Y <Coord value={coordY} />
                </span>
              </div>
              <p className="absolute right-3 bottom-3 z-20 rounded-full bg-night/80 px-3 py-1.5 text-[10px] tracking-wide text-ink/50 uppercase backdrop-blur">
                Carte fictive de démo
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Coord({ value }: { value: MotionValue<number> }) {
  const [v, setV] = useState(value.get());
  useMotionValueEvent(value, "change", setV);
  return <span className="inline-block w-8 tabular-nums">{v}</span>;
}

function Pin({
  pin,
  progress,
  step,
}: {
  pin: (typeof PINS)[number];
  progress: MotionValue<number>;
  step: number;
}) {
  const opacity = useTransform(progress, [pin.at, pin.at + 0.05], [0, 1]);
  const y = useTransform(progress, [pin.at, pin.at + 0.05], [-30, 0]);
  const dim = step >= 1 && pin.cat !== "stunt" ? 0.25 : 1;
  const visited = step >= 2 && pin.cat === "stunt";
  return (
    <motion.g style={{ opacity, y }}>
      <g style={{ opacity: dim, transition: "opacity 0.5s" }}>
        <circle cx={pin.x} cy={pin.y} r="18" fill={pin.color} opacity="0.18">
          <animate attributeName="r" values="10;26;10" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <path
          d={`M${pin.x} ${pin.y} c -9 -12 -14 -18 -14 -25 a 14 14 0 1 1 28 0 c 0 7 -5 13 -14 25 z`}
          fill={pin.color}
          stroke="#0B1020"
          strokeWidth="2.5"
        />
        {visited ? (
          <path d={`M${pin.x - 6} ${pin.y - 26} l 4 4 l 8 -9`} fill="none" stroke="#0B1020" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <circle cx={pin.x} cy={pin.y - 25} r="5" fill="#0B1020" />
        )}
      </g>
    </motion.g>
  );
}

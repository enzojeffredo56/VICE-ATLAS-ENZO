"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Stagger, staggerItem } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { Badge } from "@/components/ui/badge";
import { accentClasses, modules } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const GLOWS = {
  pink: "rgb(255 61 145 / 0.22)",
  cyan: "rgb(0 212 255 / 0.2)",
  violet: "rgb(139 92 246 / 0.25)",
  turquoise: "rgb(45 212 191 / 0.2)",
} as const;

// Disposition « bento » sur grand écran
const SPANS = ["lg:col-span-4 lg:row-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3", "lg:col-span-6"];

export function ModulesGrid() {
  return (
    <section id="modules" aria-labelledby="modules-title" className="relative scroll-mt-24 px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Six modules"
          title="Tout ton jeu, sur une seule plateforme."
          highlight={["seule", "plateforme"]}
          description="Chaque module est relié aux autres : un lieu de la carte mène au guide, au comparateur Miami ou à un spot de STUNT ARENA."
        />

        <Stagger className="mt-14 grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {modules.map((m, i) => {
            const Icon = m.icon;
            const accent = accentClasses[m.accent];
            const big = i === 0;
            return (
              <motion.div key={m.id} variants={staggerItem} className={cn(SPANS[i], "h-full")}>
                <TiltCard glow={GLOWS[m.accent]} className="h-full rounded-3xl" max={big ? 5 : 9}>
                  <Link
                    href={m.href}
                    className="glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition-[border-color,box-shadow] duration-500 hover:border-white/25 sm:p-7"
                  >
                    {/* Numéro géant en filigrane */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-6 -right-2 font-display text-[8rem] leading-none font-bold text-white/[0.035] transition-all duration-700 group-hover:-translate-y-2 group-hover:text-white/[0.07]"
                    >
                      0{i + 1}
                    </span>
                    {/* Halo de couleur */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-60",
                        accent.bg,
                      )}
                    />

                    <div className="relative flex items-start justify-between [transform:translateZ(40px)]">
                      <span
                        className={cn(
                          "grid size-13 place-items-center rounded-2xl border border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6",
                          accent.bg,
                          accent.text,
                          accent.hoverGlow,
                        )}
                      >
                        <Icon className="size-6" aria-hidden />
                      </span>
                      <Badge variant="default">Bientôt</Badge>
                    </div>

                    <div className="relative mt-auto pt-10 [transform:translateZ(30px)]">
                      <h3 className={cn("font-display font-bold", big ? "text-3xl sm:text-4xl" : "text-2xl")}>{m.label}</h3>
                      <p className={cn("mt-2 text-muted-foreground", big ? "max-w-md text-base" : "text-sm")}>{m.description}</p>
                      <span className={cn("mt-5 inline-flex items-center gap-1.5 text-sm font-semibold", accent.text)}>
                        Découvrir
                        <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </span>
                    </div>

                    {big && <MiniMap />}
                  </Link>
                </TiltCard>
              </motion.div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/** Mini-carte décorative de la grande tuile. */
function MiniMap() {
  const pins = [
    { x: 62, y: 30, c: "#FF3D91" },
    { x: 78, y: 52, c: "#00D4FF" },
    { x: 66, y: 64, c: "#2DD4BF" },
    { x: 86, y: 24, c: "#8B5CF6" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full opacity-60 transition-opacity duration-700 group-hover:opacity-100">
        <path
          d="M48 12 C 62 6, 82 10, 92 20 C 98 34, 94 50, 90 62 C 84 74, 70 78, 60 74 C 50 70, 44 60, 46 48 C 47 36, 40 24, 48 12 Z"
          fill="rgb(139 92 246 / 0.12)"
          stroke="rgb(0 212 255 / 0.5)"
          strokeWidth="0.4"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M50 30 Q 66 40 78 52 T 88 26" fill="none" stroke="#FF3D91" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="animate-[dash_3s_linear_infinite]" />
      </svg>
      {pins.map((p, i) => (
        <span key={i} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <span className="absolute -inset-2 animate-pulse-ring rounded-full" style={{ background: p.c, animationDelay: `${i * 0.5}s` }} />
          <span className="relative block size-2.5 rounded-full ring-2 ring-night" style={{ background: p.c }} />
        </span>
      ))}
    </div>
  );
}

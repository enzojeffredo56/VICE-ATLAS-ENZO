"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeftRight, BadgeCheck, Globe, ScanEye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "./section-heading";

/**
 * Aperçu du comparateur : curseur avant/après entre deux illustrations
 * originales (aucune image Google ou Rockstar). Le vrai module utilisera
 * les intégrations officielles Google Maps (phase 3).
 */
export function CompareShowcase() {
  const [pos, setPos] = useState(52);

  return (
    <section aria-labelledby="compare-title" className="relative px-5 py-28 sm:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <SectionHeading
            eyebrow="Comparateur Miami"
            title="Le jeu face à la vraie ville."
            highlight={["vraie", "ville."]}
            description="Place la carte VICE ATLAS à côté de Miami : vue satellite, Street View à 360° et inspirations réelles, chacune avec ses sources et son statut de vérification."
          />
          <Reveal delay={0.2}>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                { icon: Globe, t: "Intégration officielle Google Maps : plan, satellite et Street View" },
                { icon: ArrowLeftRight, t: "Correspondances sélectionnables et recentrage sur un lieu" },
                { icon: BadgeCheck, t: "Statut de vérification affiché : rien n'est présenté comme officiel" },
              ].map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-start gap-3 text-ink/80">
                  <Icon className="mt-0.5 size-4 shrink-0 text-turquoise" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/comparateur">
                <ScanEye /> Voir le comparateur
              </Link>
            </Button>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_100px_-40px_rgb(0_212_255/0.5)] select-none">
            {/* Côté « Miami » : plan clair stylisé */}
            <RealCity />
            {/* Côté VICE ATLAS : version néon, découpée par le curseur */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <NeonCity />
            </div>

            <span className="absolute top-3 left-3 rounded-full bg-night/85 px-3 py-1 text-xs font-semibold text-pink backdrop-blur">VICE ATLAS</span>
            <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-night">Miami réel</span>
            <span className="absolute right-3 bottom-3 rounded-full bg-night/70 px-3 py-1 text-[10px] tracking-wide text-ink/60 uppercase">Illustration</span>

            {/* Poignée */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_20px_rgb(255_255_255/0.8)]"
              style={{ left: `${pos}%` }}
            >
              <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-night/80 text-white backdrop-blur">
                <ArrowLeftRight className="size-5" />
              </span>
            </motion.div>

            {/* Contrôle accessible (clavier + tactile) */}
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-label="Glisser pour comparer la carte VICE ATLAS et Miami"
              className="absolute inset-0 size-full cursor-ew-resize opacity-0"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const BLOCKS = Array.from({ length: 48 }, (_, i) => ({ x: (i % 8) * 50 + 20, y: Math.floor(i / 8) * 46 + 18 }));

function RealCity() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#a9d4e6" />
      <path d="M0 0 H300 C 280 80, 300 160, 260 300 H0 Z" fill="#eef1ea" />
      {BLOCKS.filter((b) => b.x < 260 - b.y * 0.1).map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width="38" height="34" rx="3" fill={i % 7 === 0 ? "#cfe6c5" : "#ffffff"} stroke="#d9ddd3" />
      ))}
      <path d="M0 150 H290" stroke="#f7c66b" strokeWidth="6" />
      <path d="M140 0 V300" stroke="#f7c66b" strokeWidth="5" />
      <path d="M330 30 C 350 90, 340 200, 360 290" stroke="#f3e6c8" strokeWidth="14" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function NeonCity() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#0a0f22" />
      <path d="M0 0 H300 C 280 80, 300 160, 260 300 H0 Z" fill="#141a3a" stroke="#00D4FF" strokeWidth="1.5" />
      {BLOCKS.filter((b) => b.x < 260 - b.y * 0.1).map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width="38"
          height="34"
          rx="3"
          fill={i % 7 === 0 ? "rgb(45 212 191 / 0.18)" : "rgb(139 92 246 / 0.12)"}
          stroke="rgb(139 92 246 / 0.45)"
        />
      ))}
      <path d="M0 150 H290" stroke="#FF3D91" strokeWidth="4" style={{ filter: "drop-shadow(0 0 4px #FF3D91)" }} />
      <path d="M140 0 V300" stroke="#00D4FF" strokeWidth="3.5" style={{ filter: "drop-shadow(0 0 4px #00D4FF)" }} />
      <path d="M330 30 C 350 90, 340 200, 360 290" stroke="#2DD4BF" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

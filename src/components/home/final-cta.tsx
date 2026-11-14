"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Bell, Dices, Download, Flame, Map as MapIcon, NotebookPen, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";
import { LogoMark } from "@/components/brand/logo-mark";
import { SplitText } from "@/components/motion/split-text";

export function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [10, -8]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1.1, 0.8]);

  return (
    <section ref={ref} aria-labelledby="cta-title" className="relative overflow-hidden px-5 py-28 sm:px-8">
      <motion.div
        aria-hidden
        style={{ scale: glowScale }}
        className="absolute top-1/2 left-1/2 -z-10 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_61_145/0.22),rgb(139_92_246/0.12)_40%,transparent_70%)]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
            <Smartphone className="size-4" aria-hidden /> Aussi en application
          </p>
          <h2 id="cta-title" className="mt-4 text-5xl leading-[0.95] font-bold sm:text-7xl">
            <SplitText text="Prêt à explorer ?" wordClassName={(_, i) => (i === 2 ? "text-neon" : undefined)} />
          </h2>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            VICE ATLAS s&apos;installe sur ton téléphone comme une vraie appli : plein écran, navigation tactile,
            compte synchronisé entre tes appareils. Gratuit pour l&apos;essentiel.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Magnetic>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/inscription">Créer mon compte gratuit</Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/a-propos#installer">
                  <Download /> Installer l&apos;appli
                </Link>
              </Button>
            </Magnetic>
          </div>
        </div>

        {/* Maquette de téléphone */}
        <motion.div style={{ y: phoneY, rotate: phoneRotate }} className="relative mx-auto w-[260px] sm:w-[290px]" aria-hidden>
          <div className="relative aspect-[9/19] rounded-[2.6rem] border-[6px] border-[#1c2347] bg-night p-3 shadow-[0_50px_120px_-30px_rgb(255_61_145/0.6),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
            <div className="absolute top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1a1240] via-night to-night">
              <div className="flex items-center justify-between px-4 pt-9">
                <LogoMark className="size-7" />
                <Bell className="size-4 text-ink/60" />
              </div>
              <div className="px-4 pt-5">
                <p className="text-[10px] tracking-widest text-ink/50 uppercase">Salut, explorateur</p>
                <p className="font-display text-lg font-bold">Niveau 4</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-pink to-cyan" />
                </div>
              </div>
              <div className="mx-4 mt-4 aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f22]">
                <svg viewBox="0 0 160 120" className="size-full">
                  <path d="M30 30 C 60 10, 110 15, 130 40 C 145 65, 120 100, 85 100 C 50 100, 20 80, 25 55 Z" fill="#161d42" stroke="#00D4FF" strokeWidth="1" />
                  <circle cx="70" cy="50" r="4" fill="#FF3D91" />
                  <circle cx="100" cy="70" r="4" fill="#2DD4BF" />
                  <circle cx="60" cy="80" r="4" fill="#8B5CF6" />
                </svg>
              </div>
              <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-pink/15 p-2.5">
                  <Flame className="size-4 text-pink" />
                  <p className="mt-1 text-[10px] font-semibold">Stunt de la semaine</p>
                </div>
                <div className="rounded-xl bg-violet/15 p-2.5">
                  <Dices className="size-4 text-[#b49cff]" />
                  <p className="mt-1 text-[10px] font-semibold">Salon roulette</p>
                </div>
              </div>
              <div className="mx-3 mt-auto mb-3 grid grid-cols-4 rounded-2xl bg-white/[0.06] p-2 text-ink/60">
                {[MapIcon, NotebookPen, Flame, Dices].map((Icon, i) => (
                  <Icon key={i} className={`mx-auto size-4 ${i === 0 ? "text-pink" : ""}`} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

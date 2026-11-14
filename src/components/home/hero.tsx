"use client";

import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { ArrowDown, Dices, Flame, Map as MapIcon, MapPin, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitText } from "@/components/motion/split-text";
import { LogoMark } from "@/components/brand/logo-mark";
import { siteConfig } from "@/lib/site-config";

// Étoiles à positions déterministes (identiques serveur / client).
const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 23.3) % 62,
  size: 1 + ((i * 7) % 3),
  delay: (i % 9) * 0.45,
}));

const TITLE = ["V", "I", "C", "E", " ", "A", "T", "L", "A", "S"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Parallaxe au scroll
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const sunY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const compassRotate = useTransform(scrollYProgress, [0, 1], [0, 140]);

  // Parallaxe à la souris
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const layer1x = useTransform(mx, (v) => v * 18);
  const layer2x = useTransform(mx, (v) => v * -34);
  const layer2y = useTransform(my, (v) => v * -22);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      {/* ---------- Décor ---------- */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(139_92_246/0.35),transparent_60%),radial-gradient(ellipse_60%_50%_at_90%_60%,rgb(0_212_255/0.18),transparent_60%),radial-gradient(ellipse_50%_50%_at_5%_70%,rgb(255_61_145/0.2),transparent_60%)]" />

        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute animate-pulse rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              opacity: 0.55,
            }}
          />
        ))}

        {/* Soleil rétro */}
        <motion.div style={{ y: sunY, x: layer1x }} className="absolute top-[18%] left-1/2 -translate-x-1/2">
          <div className="size-[min(78vw,560px)] rounded-full bg-gradient-to-b from-[#ffb36b] via-pink to-violet opacity-60 sm:opacity-75 shadow-[0_0_140px_30px_rgb(255_61_145/0.35)] [mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,transparent_48%,transparent_52%,#000_52%,#000_60%,transparent_60%,transparent_64%,#000_64%,#000_70%,transparent_70%,transparent_75%,#000_75%,#000_80%,transparent_80%,transparent_86%,#000_86%)]" />
        </motion.div>

        {/* Boussole géante */}
        <motion.div
          style={{ rotate: compassRotate, x: layer2x, y: layer2y }}
          className="absolute -right-40 -bottom-40 opacity-[0.12] sm:-right-24"
        >
          <LogoMark className="size-[560px] animate-spin-slow" />
        </motion.div>

        {/* Sol quadrillé en perspective */}
        <motion.div style={{ y: gridY }} className="absolute inset-x-0 bottom-0 h-[46%] [perspective:420px]">
          <div className="neon-grid absolute inset-x-[-50%] top-0 bottom-[-40%] origin-top animate-grid [transform:rotateX(68deg)] [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]" />
        </motion.div>
        <div className="absolute inset-x-0 bottom-[46%] h-px bg-gradient-to-r from-transparent via-pink to-transparent shadow-[0_0_30px_6px_rgb(255_61_145/0.6)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />
      </div>

      {/* Cartes flottantes (desktop) */}
      <FloatingCards x={layer2x} y={layer2y} />

      {/* ---------- Contenu ---------- */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
        className="relative mx-auto w-full max-w-5xl px-5 text-center sm:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-7 flex justify-center"
        >
          <Badge variant="cyan" className="glass gap-2 py-1.5 pr-3.5 pl-2 text-[13px]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-turquoise opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-turquoise" />
            </span>
            Plateforme de fans indépendante<span className="hidden sm:inline"> · Pour les joueurs de GTA 6</span>
          </Badge>
        </motion.div>

        <h1 id="hero-title" className="font-display leading-[0.86] font-bold tracking-tight">
          <span className="sr-only">VICE ATLAS</span>
          <span
            aria-hidden
            className="flex flex-col items-center justify-center text-[clamp(3.5rem,19vw,6rem)] sm:flex-row sm:gap-[0.22em] sm:text-[clamp(4rem,11vw,9.5rem)]"
          >
            {[TITLE.slice(0, 4), TITLE.slice(5)].map((word, w) => (
              <span key={w} className="flex whitespace-nowrap">
                {word.map((char, j) => {
                  const i = w === 0 ? j : j + 5;
                  return (
                    <motion.span
                      key={i}
                      className={`inline-block ${w === 1 ? "text-neon" : "text-white"} drop-shadow-[0_0_30px_rgb(255_61_145/0.35)]`}
                      initial={{ opacity: 0, y: 80, rotateX: -90, filter: "blur(12px)" }}
                      animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -12, scale: 1.06, transition: { duration: 0.25 } }}
                    >
                      {char}
                    </motion.span>
                  );
                })}
              </span>
            ))}
          </span>
        </h1>

        <p className="mt-6 font-display text-xl font-medium text-ink [text-shadow:0_2px_18px_rgb(11_16_32/0.95)] sm:text-3xl">
          <SplitText text={siteConfig.slogan} inView={false} delay={0.9} wordClassName={(_, i) => (i === 2 ? "text-glow-cyan text-cyan" : undefined)} />
        </p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className="mx-auto mt-5 max-w-2xl text-base text-ink/75 [text-shadow:0_1px_14px_rgb(11_16_32/1)] sm:text-lg"
        >
          Carte interactive, carnet de progression, guide, comparateur Miami, STUNT ARENA et GTA Roulette :
          tout ce qu&apos;il faut pour explorer Vice City avec ta crew.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Magnetic>
            <Button asChild size="lg" className="group w-64 sm:w-auto">
              <Link href="/carte">
                <MapIcon className="transition-transform duration-300 group-hover:-rotate-12" />
                Explorer la carte
              </Link>
            </Button>
          </Magnetic>
          <Magnetic>
            <Button asChild size="lg" variant="outline" className="group w-64 sm:w-auto">
              <Link href="#roulette">
                <Dices className="transition-transform duration-500 group-hover:rotate-[360deg]" />
                Lancer la roulette
              </Link>
            </Button>
          </Magnetic>
        </motion.div>
      </motion.div>

      <motion.a
        href="#modules"
        aria-label="Faire défiler vers les modules"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.3em] text-ink/50 uppercase sm:flex lg:bottom-8"
      >
        Scroll
        <span className="grid h-10 w-6 place-items-start justify-center rounded-full border border-white/20 p-1">
          <motion.span
            className="block size-1.5 rounded-full bg-cyan"
            animate={{ y: [0, 18, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
        <ArrowDown className="sr-only" />
      </motion.a>
    </section>
  );
}

function FloatingCards({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  const cards = [
    { icon: MapPin, label: "Spot de cascade", sub: "Démo · X 412 / Y 188", color: "text-cyan", pos: "left-[4%] top-[28%]", delay: 1.6 },
    { icon: Trophy, label: "+150 XP", sub: "1re place STUNT ARENA", color: "text-pink", pos: "right-[5%] top-[24%]", delay: 1.8 },
    { icon: Flame, label: "Concours hebdo", sub: "Un par spot", color: "text-[#ffb36b]", pos: "left-[8%] bottom-[20%]", delay: 2 },
    { icon: Sparkles, label: "Niveau 4", sub: "640 / 1 000 XP", color: "text-turquoise", pos: "right-[9%] bottom-[24%]", delay: 2.2 },
  ];
  return (
    <motion.div aria-hidden style={{ x, y }} className="pointer-events-none absolute inset-0 hidden xl:block">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: c.delay, type: "spring", stiffness: 160, damping: 16 }}
            className={`absolute ${c.pos}`}
          >
            <div className="glass flex animate-float items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl" style={{ animationDelay: `${i * 0.9}s` }}>
              <span className={`grid size-9 place-items-center rounded-xl bg-white/[0.06] ${c.color}`}>
                <Icon className="size-4" />
              </span>
              <span className="text-left">
                <span className="block font-display text-sm font-semibold">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.sub}</span>
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

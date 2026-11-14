"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { Check, Crown, Gift, MessageSquareHeart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { XP_REWARDS } from "@/lib/xp/levels";
import { cn } from "@/lib/utils";

export function CommunityPlus() {
  return (
    <section aria-label="Avis et VICE ATLAS PLUS" className="px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <Reveal>
          <ReviewCard />
        </Reveal>
        <Reveal delay={0.12}>
          <PlusCard />
        </Reveal>
      </div>
    </section>
  );
}

function ReviewCard() {
  const [hover, setHover] = useState(0);
  return (
    <TiltCard glow="rgb(255 61 145 / 0.2)" max={5} className="h-full rounded-3xl">
      <div className="glass flex h-full flex-col rounded-3xl p-7 sm:p-9">
        <span className="grid size-13 place-items-center rounded-2xl bg-pink/15 text-pink">
          <MessageSquareHeart className="size-6" aria-hidden />
        </span>
        <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
          Ton avis sur <span className="text-neon">VICE ATLAS</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Donne une note de 1 à 5 et un commentaire sur la plateforme. Ta participation est récompensée par{" "}
          <strong className="text-white">+{XP_REWARDS.reviewApproved} XP</strong> après approbation,{" "}
          <strong className="text-white">quelle que soit ta note</strong>. Les critiques respectueuses sont publiées.
        </p>
        <div className="mt-6 flex gap-1.5" onPointerLeave={() => setHover(0)} aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.span
              key={n}
              onPointerEnter={() => setHover(n)}
              whileHover={{ scale: 1.25, rotate: 12 }}
              className="cursor-pointer"
            >
              <Star
                className={cn(
                  "size-9 transition-all duration-200",
                  n <= hover ? "fill-pink text-pink drop-shadow-[0_0_10px_rgb(255_61_145/0.8)]" : "text-ink/25",
                )}
              />
            </motion.span>
          ))}
        </div>
        <div className="mt-auto pt-8">
          <Button asChild>
            <Link href="/avis">Donner mon avis</Link>
          </Button>
        </div>
      </div>
    </TiltCard>
  );
}

function PlusCard() {
  const perks = [
    "Les fonctions essentielles restent gratuites",
    "Avantages Premium définis avant le lancement",
    "Gestion et annulation en libre-service",
  ];
  return (
    <TiltCard glow="rgb(139 92 246 / 0.28)" max={5} className="h-full rounded-3xl">
      <div className="neon-border glass relative flex h-full flex-col overflow-hidden rounded-3xl p-7 sm:p-9">
        <div aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-violet/30 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <span className="grid size-13 place-items-center rounded-2xl bg-gradient-to-br from-pink to-violet text-white shadow-[0_0_30px_-4px_rgb(139_92_246/0.9)]">
            <Crown className="size-6" aria-hidden />
          </span>
          <Badge variant="violet">Bientôt</Badge>
        </div>
        <h2 className="relative mt-6 text-3xl font-bold sm:text-4xl">VICE ATLAS PLUS</h2>
        <p className="relative mt-2 font-display text-2xl">
          4,99 €<span className="text-base text-muted-foreground"> / mois</span>
          <span className="ml-2 align-middle text-xs text-muted-foreground">(tarif provisoire)</span>
        </p>
        <ul className="relative mt-6 space-y-2.5">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-ink/85">
              <Check className="mt-0.5 size-4 shrink-0 text-turquoise" aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <div className="relative mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Gift className="mt-0.5 size-5 shrink-0 text-pink" aria-hidden />
          <p className="text-sm text-ink/80">
            <strong className="text-white">Parrainage :</strong> un ami parrainé qui s&apos;abonne et remplit les conditions
            de validation t&apos;offre un mois Premium.
          </p>
        </div>
        <div className="relative mt-auto pt-8">
          <Button asChild variant="outline">
            <Link href="/plus">En savoir plus</Link>
          </Button>
        </div>
      </div>
    </TiltCard>
  );
}

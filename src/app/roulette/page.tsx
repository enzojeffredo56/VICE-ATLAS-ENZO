import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { RouletteClient } from "@/components/roulette/roulette-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getRouletteData } from "@/lib/roulette/repository";

export const metadata: Metadata = {
  title: "GTA Roulette",
  description: "Fais tourner la roue, crée un salon privé et lance le même défi à toute ta crew.",
};

export default function RoulettePage() {
  return (
    <div className="relative isolate mx-auto max-w-6xl px-5 pt-32 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_60%_60%_at_70%_0%,rgb(139_92_246/0.28),transparent_70%)]" />
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan uppercase">GTA Roulette</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Un tour de roue, <span className="text-neon">un défi</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Seul ou dans un salon privé avec ta crew : la roue décide, vous relevez le défi.</p>
      </Reveal>
      <div className="mt-12">
        <Suspense fallback={<Skeleton className="h-[60vh] rounded-3xl" />}>
          <RouletteData />
        </Suspense>
      </div>
    </div>
  );
}

async function RouletteData() {
  const { challenges, weekly } = await getRouletteData();
  return <RouletteClient challenges={challenges} weekly={weekly} />;
}

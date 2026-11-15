import type { Metadata } from "next";
import { ComparateurClient } from "@/components/comparateur/comparateur-client";
import { Reveal } from "@/components/motion/reveal";
import { getComparator, getPlaces, placeCategories } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "Comparateur Miami",
  description: "Compare la carte VICE ATLAS avec un plan de Miami : correspondances, sources et statut de vérification.",
};

export default async function ComparateurPage() {
  const [places, { spots, correspondences }] = await Promise.all([getPlaces(), getComparator()]);
  return (
    <div className="relative isolate mx-auto max-w-[1500px] px-4 pt-32 pb-16 sm:px-6">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgb(0_212_255/0.18),transparent_70%)]" />
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan uppercase">Comparateur Miami</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Le jeu face à <span className="text-neon">la ville</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          Choisis un lieu : les deux plans se recentrent ensemble. Chaque rapprochement indique ses sources et son statut de
          vérification. Les plans sont dessinés par VICE ATLAS.
        </p>
      </Reveal>
      <div className="mt-10">
        <ComparateurClient places={places} categories={placeCategories} spots={spots} correspondences={correspondences} />
      </div>
    </div>
  );
}

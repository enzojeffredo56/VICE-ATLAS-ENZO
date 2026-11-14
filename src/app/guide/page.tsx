import type { Metadata } from "next";
import { GuideBrowser } from "@/components/guide/guide-browser";
import { Reveal } from "@/components/motion/reveal";
import { guideCategories } from "@/content/guides";
import { getGuides } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "Guide interactif",
  description: "Guides pas à pas VICE ATLAS, reliés à la carte, avec sources et dates de mise à jour.",
};

export default async function GuidePage() {
  const guides = await getGuides();
  return (
    <div className="relative isolate mx-auto max-w-7xl px-5 pt-32 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_60%_60%_at_20%_0%,rgb(139_92_246/0.25),transparent_70%)]" />
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan uppercase">Guide interactif</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Des guides <span className="text-neon">pas à pas</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Chaque guide est relié à la carte, indique ses sources et sa date de mise à jour. Coche les étapes au fur et à mesure.
        </p>
      </Reveal>
      <div className="mt-10">
        <GuideBrowser guides={guides} categories={guideCategories} />
      </div>
    </div>
  );
}

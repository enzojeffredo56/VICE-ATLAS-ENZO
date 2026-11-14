import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { ModulesGrid } from "@/components/home/modules-grid";
import { MapShowcase } from "@/components/home/map-showcase";
import { CompareShowcase } from "@/components/home/compare-showcase";
import { StuntShowcase } from "@/components/home/stunt-showcase";
import { RouletteShowcase } from "@/components/home/roulette-showcase";
import { ProgressionShowcase } from "@/components/home/progression-showcase";
import { CommunityPlus } from "@/components/home/community-plus";
import { FinalCta } from "@/components/home/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <ModulesGrid />
      <MapShowcase />
      <CompareShowcase />
      <StuntShowcase />
      <RouletteShowcase />
      <ProgressionShowcase />
      <CommunityPlus />
      <FinalCta />
    </>
  );
}

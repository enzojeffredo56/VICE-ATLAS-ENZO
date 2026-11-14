import type { Metadata } from "next";
import { Star } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Avis sur VICE ATLAS" };

export default function Page() {
  return (
    <ComingSoon
      title="Avis sur VICE ATLAS"
      description="Note la plateforme de 1 à 5 étoiles. +20 XP après approbation, quelle que soit ta note."
      icon={Star}
      phase={5}
      features={["Un avis par joueur, modifiable", "Commentaire de 30 caractères minimum", "Critiques respectueuses publiées", "Récompense identique pour toute note"]}
    />
  );
}

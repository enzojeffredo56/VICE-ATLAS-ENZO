import type { Metadata } from "next";
import { Map as MapIcon } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Carte interactive" };

export default function Page() {
  return (
    <ComingSoon
      title="Carte interactive"
      description="Une carte originale à explorer : zoom, filtres, recherche, favoris et lieux visités."
      icon={MapIcon}
      phase={2}
      features={["Zoom et déplacement (Leaflet)", "Filtres et catégories", "Recherche de lieux", "Favoris et lieux visités", "Fiches détaillées et coordonnées X/Y", "Spots de Stunt"]}
    />
  );
}

import type { Metadata } from "next";
import { Dices } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "GTA Roulette" };

export default function Page() {
  return (
    <ComingSoon
      title="GTA Roulette"
      description="Fais tourner la roue et lance le même défi à tous tes amis dans un salon privé."
      icon={Dices}
      phase={6}
      features={["Défis facile, moyen, difficile", "Salons privés par code", "Défi synchronisé entre joueurs", "Historique et défis personnalisés"]}
    />
  );
}

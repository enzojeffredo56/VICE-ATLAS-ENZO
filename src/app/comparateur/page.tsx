import type { Metadata } from "next";
import { ScanEye } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Comparateur Miami" };

export default function Page() {
  return (
    <ComingSoon
      title="Comparateur Miami"
      description="La carte VICE ATLAS face à Miami, avec les intégrations officielles Google Maps."
      icon={ScanEye}
      phase={3}
      features={["Vue côte à côte", "Vue satellite", "Street View à 360°", "Sources et statut de vérification"]}
    />
  );
}

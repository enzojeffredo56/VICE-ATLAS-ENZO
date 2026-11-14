import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Carnet de progression" };

export default function Page() {
  return (
    <ComingSoon
      title="Carnet de progression"
      description="Suis tes missions, activités, lieux et collectibles. Privé par défaut."
      icon={NotebookPen}
      phase={2}
      features={["Checklists par catégorie", "Pourcentages de progression", "Sauvegarde automatique", "Liens vers la carte"]}
    />
  );
}

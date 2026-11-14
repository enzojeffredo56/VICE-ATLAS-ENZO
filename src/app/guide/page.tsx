import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Guide interactif" };

export default function Page() {
  return (
    <ComingSoon
      title="Guide interactif"
      description="Des fiches pas à pas, sourcées et datées, reliées à la carte."
      icon={BookOpenText}
      phase={2}
      features={["Articles et fiches", "Recherche et catégories", "Guides étape par étape", "Sources et dates de mise à jour"]}
    />
  );
}

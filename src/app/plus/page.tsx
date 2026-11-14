import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "VICE ATLAS PLUS" };

export default function Page() {
  return (
    <ComingSoon
      title="VICE ATLAS PLUS"
      description="L'abonnement Premium (4,99 €/mois, tarif provisoire). Les fonctions essentielles restent gratuites."
      icon={Crown}
      phase={10}
      features={["Souscription et gestion en libre-service", "Portail de facturation", "Parrainage : 1 mois offert", "Avantages définis avant le lancement"]}
    />
  );
}

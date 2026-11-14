import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Connexion" };

export default function Page() {
  return (
    <ComingSoon
      title="Connexion"
      description="Les comptes joueurs arrivent bientôt avec Supabase Auth."
      icon={LogIn}
      phase={4}
      features={["Connexion par e-mail", "Récupération de mot de passe", "Synchronisation entre appareils"]}
    />
  );
}

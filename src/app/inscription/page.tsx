import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Rejoindre VICE ATLAS" };

export default function Page() {
  return (
    <ComingSoon
      title="Rejoindre VICE ATLAS"
      description="Crée ton profil joueur : pseudo unique, avatar, progression et badges."
      icon={UserPlus}
      phase={4}
      features={["Pseudo unique et avatar", "Profil public ou privé", "Code de parrainage"]}
    />
  );
}

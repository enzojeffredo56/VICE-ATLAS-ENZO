import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "Classements" };

export default function Page() {
  return (
    <ComingSoon
      title="Classements"
      description="Les classements généraux et STUNT ARENA de la communauté."
      icon={Trophy}
      phase={8}
      features={["Classement XP général", "Classements par spot de Stunt", "Archives des gagnants"]}
    />
  );
}

import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { ComingSoon } from "@/components/states/coming-soon";

export const metadata: Metadata = { title: "STUNT ARENA" };

export default function Page() {
  return (
    <ComingSoon
      title="STUNT ARENA"
      description="Un concours de cascades par spot, chaque semaine, avec votes et podium."
      icon={Flame}
      phase={7}
      features={["Un concours par spot et par semaine", "Vidéos par lien externe, modérées", "Un vote par concours, modifiable", "Podium : +150 / +75 / +40 XP"]}
    />
  );
}

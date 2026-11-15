import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false } };

export default function HorsLignePage() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-36 pb-20">
      <EmptyState
        icon={WifiOff}
        title="Pas de connexion"
        description="Cette page n'est pas disponible hors ligne. Ton carnet reste enregistré sur l'appareil : il se synchronisera dès ton retour en ligne."
        action={
          <Button asChild>
            <Link href="/carnet">Ouvrir mon carnet</Link>
          </Button>
        }
      />
    </div>
  );
}

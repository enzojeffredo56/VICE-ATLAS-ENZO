"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-xl px-5 pt-36 pb-20">
      <EmptyState
        icon={TriangleAlert}
        title="Oups, une erreur est survenue"
        description="Vérifie ta connexion puis réessaie. Si le problème persiste, signale-le-nous."
        action={
          <Button onClick={reset}>
            <RefreshCw /> Réessayer
          </Button>
        }
      />
    </section>
  );
}

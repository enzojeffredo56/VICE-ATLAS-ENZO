"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Le carnet lit les données enregistrées sur l'appareil : rendu côté client uniquement. */
export const CarnetClient = dynamic(() => import("./carnet-view"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl space-y-6 px-5 pt-32 pb-16 sm:px-8" aria-busy="true" aria-label="Chargement du carnet">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Skeleton className="h-44 w-full lg:w-80" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  ),
});

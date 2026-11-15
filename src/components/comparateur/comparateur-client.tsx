"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Le comparateur lit l'adresse (?lieu=) et utilise Leaflet : rendu côté client uniquement. */
export const ComparateurClient = dynamic(() => import("./compare-explorer"), {
  ssr: false,
  loading: () => (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du comparateur">
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[42dvh] min-h-72 rounded-3xl lg:h-[58dvh]" />
        <Skeleton className="h-[42dvh] min-h-72 rounded-3xl lg:h-[58dvh]" />
      </div>
      <Skeleton className="h-56 rounded-3xl" />
    </div>
  ),
});

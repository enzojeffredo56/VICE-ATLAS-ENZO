"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** La carte dépend du navigateur (Leaflet, URL, stockage local) : rendu côté client uniquement. */
export const CarteClient = dynamic(() => import("./map-explorer"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-full max-w-[1600px] gap-4" aria-busy="true" aria-label="Chargement de la carte">
      <div className="glass hidden w-[360px] shrink-0 flex-col gap-3 rounded-3xl p-5 lg:flex">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <Skeleton className="flex-1 rounded-none lg:rounded-3xl" />
    </div>
  ),
});

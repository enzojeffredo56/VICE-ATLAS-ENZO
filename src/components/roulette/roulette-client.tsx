"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Historique local et animations : rendu côté navigateur. */
export const RouletteClient = dynamic(() => import("./roulette-app"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-10 lg:grid-cols-2" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="mx-auto aspect-square w-full max-w-[440px] rounded-full" />
    </div>
  ),
});

export const RoomClient = dynamic(() => import("./room-view"), {
  ssr: false,
  loading: () => <Skeleton className="h-[60vh] rounded-3xl" />,
});

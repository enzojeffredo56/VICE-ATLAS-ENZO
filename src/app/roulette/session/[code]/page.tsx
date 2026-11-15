import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomClient } from "@/components/roulette/roulette-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Salon GTA Roulette", robots: { index: false } };

export function generateStaticParams() {
  return [{ code: "DEMO42" }];
}

export default function RoomPage({ params }: PageProps<"/roulette/session/[code]">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-32 pb-16 sm:px-8">
      <Suspense fallback={<Skeleton className="h-[60vh] rounded-3xl" />}>
        <Room params={params} />
      </Suspense>
    </div>
  );
}

async function Room({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomClient code={code.toUpperCase()} />;
}

"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { PHASE_LABELS, type StuntPhase } from "@/lib/stunts/calendar";
import { formatParis, formatRemaining } from "@/lib/time/paris";
import { cn } from "@/lib/utils";

const NEXT_DEADLINE: Partial<Record<StuntPhase, "submissionsOpenAt" | "submissionsCloseAt" | "votingCloseAt">> = {
  "a-venir": "submissionsOpenAt",
  participations: "submissionsCloseAt",
  votes: "votingCloseAt",
};

export function PhaseBanner({ phase, dates, compact = false }: { phase: StuntPhase; dates: { submissionsOpenAt: string; submissionsCloseAt: string; votingCloseAt: string }; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const key = NEXT_DEADLINE[phase];
  const deadline = key ? new Date(dates[key]) : null;
  const tone = phase === "participations" ? "border-turquoise/40 bg-turquoise/10" : phase === "votes" ? "border-pink/40 bg-pink/10" : "border-white/12 bg-white/[0.04]";
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border px-4 py-3 text-sm", tone)}>
      <span className="inline-flex items-center gap-2 font-semibold">
        <span className={cn("size-2 rounded-full", phase === "participations" ? "bg-turquoise" : phase === "votes" ? "animate-pulse bg-pink" : "bg-ink/40")} aria-hidden />
        {PHASE_LABELS[phase].label}
      </span>
      {deadline && (
        <span className="inline-flex items-center gap-1.5 text-ink/80">
          <CalendarClock className="size-4" aria-hidden /> {phase === "a-venir" ? "Ouverture" : "Fin"} dans {formatRemaining(deadline.getTime() - now)}
          {!compact && <span className="text-muted-foreground"> · {formatParis(deadline)}</span>}
        </span>
      )}
      {!compact && !deadline && <span className="text-muted-foreground">{PHASE_LABELS[phase].description}</span>}
    </div>
  );
}

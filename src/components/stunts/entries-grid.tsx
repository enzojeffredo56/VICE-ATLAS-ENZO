"use client";

import { useState, useTransition } from "react";
import { Check, Trophy, Vote } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StuntPhase } from "@/lib/stunts/calendar";
import { voteAction } from "@/lib/stunts/actions";
import type { Entry, RankingRow } from "@/lib/stunts/repository";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "./video-player";

export function EntriesGrid({ entries, phase, myVote, myUserId, ranking }: { entries: Entry[]; phase: StuntPhase; myVote: string | null; myUserId: string | null; ranking: RankingRow[] | null }) {
  const auth = useAuth();
  const [vote, setVote] = useState(myVote);
  const [pending, start] = useTransition();
  const rankOf = (id: string) => ranking?.find((r) => r.entryId === id);

  const cast = (id: string) =>
    start(async () => {
      const res = await voteAction(id);
      toast[res.ok ? "success" : "error"](res.message ?? "");
      if (res.ok) setVote(id);
    });

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((e) => {
        const r = rankOf(e.id);
        const mine = e.userId === myUserId;
        const voted = vote === e.id;
        return (
          <li key={e.id} className={cn("glass flex flex-col gap-3 rounded-3xl p-4 transition", voted && "border-pink/50 shadow-[0_0_40px_-15px_rgb(255_61_145/0.8)]")}>
            <VideoPlayer url={e.videoUrl} title={e.title} />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-display font-bold">{e.title}</h3>
                <p className="text-xs text-muted-foreground">{e.player ?? "Joueur anonyme"}</p>
              </div>
              {r && (
                <Badge variant={r.rank === 1 ? "pink" : r.rank <= 3 ? "cyan" : "default"}>
                  {r.rank <= 3 && <Trophy />} {r.rank}
                  {r.rank === 1 ? "re" : "e"} · {r.votes} vote{r.votes > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {phase === "votes" &&
              (mine ? (
                <p className="text-xs text-muted-foreground">Ta vidéo : tu ne peux pas voter pour elle.</p>
              ) : auth.status === "authenticated" ? (
                <Button size="sm" variant={voted ? "cyan" : "outline"} disabled={pending || voted} onClick={() => cast(e.id)}>
                  {voted ? <Check /> : <Vote />} {voted ? "Ton vote" : vote ? "Changer mon vote" : "Voter"}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Connecte-toi pour voter.</p>
              ))}
          </li>
        );
      })}
    </ul>
  );
}

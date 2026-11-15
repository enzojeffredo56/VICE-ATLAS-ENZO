"use client";

import { useState, useTransition } from "react";
import { Check, ShieldAlert, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { confirmResultsAction, moderateEntryAction, reviewVoteAction } from "@/lib/stunts/actions";
import { formatDateFr } from "@/lib/text";
import { VideoPlayer } from "./video-player";

export type PendingEntry = { id: string; title: string; url: string; player: string; spot: string };
export type SuspectVote = { competitionId: string; userId: string; voter: string; entry: string; spot: string };
export type ToConfirm = { id: string; spot: string; weekStart: string; suspects: number };

const REASONS = ["Vidéo d'une autre personne", "Cascade coupée ou montage trompeur", "Vidéo inaccessible", "Contenu inapproprié", "Pas sur le bon spot"];

export function StuntModeration({ entries, votes, toConfirm }: { entries: PendingEntry[]; votes: SuspectVote[]; toConfirm: ToConfirm[] }) {
  const [e, setE] = useState(entries);
  const [v, setV] = useState(votes);
  const [c, setC] = useState(toConfirm);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after: () => void) =>
    start(async () => {
      const res = await fn();
      toast[res.ok ? "success" : "error"](res.message ?? "");
      if (res.ok) after();
    });

  return (
    <div className="space-y-12">
      <section aria-labelledby="mod-entries">
        <h2 id="mod-entries" className="text-2xl font-bold">
          Vidéos à vérifier ({e.length})
        </h2>
        {e.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Aucune vidéo en attente.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {e.map((x) => (
              <li key={x.id} className="glass space-y-3 rounded-2xl p-4">
                <VideoPlayer url={x.url} title={x.title} />
                <p className="font-semibold">
                  {x.title} <span className="font-normal text-muted-foreground">· {x.player} · {x.spot}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="cyan" disabled={pending} onClick={() => run(() => moderateEntryAction(x.id, "approved", ""), () => setE((l) => l.filter((y) => y.id !== x.id)))}>
                    <Check /> Publier
                  </Button>
                  <select aria-label="Motif de refus" value={reasons[x.id] ?? ""} onChange={(ev) => setReasons((s) => ({ ...s, [x.id]: ev.target.value }))} className="h-9 rounded-full border border-white/12 bg-night px-3 text-sm">
                    <option value="">Motif de refus…</option>
                    {REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" disabled={pending || !reasons[x.id]} onClick={() => run(() => moderateEntryAction(x.id, "rejected", reasons[x.id]), () => setE((l) => l.filter((y) => y.id !== x.id)))}>
                    <X /> Refuser
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mod-votes">
        <h2 id="mod-votes" className="flex items-center gap-2 text-2xl font-bold">
          <ShieldAlert className="size-6 text-pink" aria-hidden /> Votes signalés ({v.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Votes de comptes créés il y a moins de 48 h : exclus du classement tant qu&apos;ils ne sont pas validés.</p>
        <ul className="mt-4 space-y-2">
          {v.map((x) => (
            <li key={`${x.competitionId}-${x.userId}`} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3 text-sm">
              <span className="min-w-0 flex-1">
                <strong>{x.voter}</strong> → {x.entry} <span className="text-muted-foreground">({x.spot})</span>
              </span>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => reviewVoteAction(x.competitionId, x.userId, true), () => setV((l) => l.filter((y) => y !== x)))}>
                Valider
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => reviewVoteAction(x.competitionId, x.userId, false), () => setV((l) => l.filter((y) => y !== x)))}>
                Annuler
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mod-results">
        <h2 id="mod-results" className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="size-6 text-[#ffd166]" aria-hidden /> Résultats à confirmer ({c.length})
        </h2>
        <ul className="mt-4 space-y-2">
          {c.map((x) => (
            <li key={x.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm">
              <span className="min-w-0 flex-1">
                <strong>{x.spot}</strong> · semaine du {formatDateFr(x.weekStart)}
                {x.suspects > 0 && <span className="ml-2 text-pink">{x.suspects} vote(s) signalé(s) à vérifier</span>}
              </span>
              <ConfirmDialog
                trigger={
                  <Button size="sm" disabled={pending || x.suspects > 0}>
                    Confirmer les résultats
                  </Button>
                }
                title="Confirmer les résultats ?"
                description="Le classement sera figé et les XP du podium attribués (+150 / +75 / +40, égalités partagées). Cette action est définitive."
                confirmLabel="Confirmer"
                onConfirm={() => run(() => confirmResultsAction(x.id), () => setC((l) => l.filter((y) => y.id !== x.id)))}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

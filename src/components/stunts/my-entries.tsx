"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { withdrawEntryAction } from "@/lib/stunts/actions";
import { formatDateFr } from "@/lib/text";

export type MyEntry = { id: string; title: string; spot: string; weekStart: string; status: "pending" | "approved" | "rejected"; note: string | null; withdrawn: boolean; canWithdraw: boolean; rank: number | null };

const STATUS = {
  pending: { label: "En vérification", variant: "violet" },
  approved: { label: "Publiée", variant: "turquoise" },
  rejected: { label: "Refusée", variant: "pink" },
} as const;

export function MyEntries({ entries }: { entries: MyEntry[] }) {
  const [list, setList] = useState(entries);
  const [pending, start] = useTransition();
  return (
    <ul className="space-y-3">
      {list.map((e) => (
        <li key={e.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-5">
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">{e.title}</p>
            <p className="text-sm text-muted-foreground">
              {e.spot} · semaine du {formatDateFr(e.weekStart)}
            </p>
            {e.note && <p className="mt-1 text-sm text-pink">Motif : {e.note}</p>}
          </div>
          {e.withdrawn ? <Badge>Retirée</Badge> : <Badge variant={STATUS[e.status].variant}>{STATUS[e.status].label}</Badge>}
          {e.rank && <Badge variant="cyan">{e.rank}e place</Badge>}
          {e.canWithdraw && !e.withdrawn && e.status !== "rejected" && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={pending}>
                  <Undo2 /> Retirer
                </Button>
              }
              title="Retirer cette participation ?"
              description="Ta vidéo disparaîtra du concours et les votes reçus seront annulés. Tu pourras en publier une autre tant que les participations sont ouvertes."
              confirmLabel="Retirer"
              destructive
              onConfirm={() =>
                start(async () => {
                  const res = await withdrawEntryAction(e.id);
                  toast[res.ok ? "success" : "error"](res.message ?? "");
                  if (res.ok) setList((l) => l.map((x) => (x.id === e.id ? { ...x, withdrawn: true } : x)));
                })
              }
            />
          )}
        </li>
      ))}
    </ul>
  );
}

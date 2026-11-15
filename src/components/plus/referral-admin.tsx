"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelReferralRewardAction } from "@/lib/billing/actions";
import { formatDateFr } from "@/lib/text";

export type RewardRow = { id: string; referrer: string; referee: string; status: "pending" | "granted" | "cancelled"; eligibleAt: string; reason: string | null };

const STATUS = { pending: ["En vérification", "violet"], granted: ["Accordée", "turquoise"], cancelled: ["Annulée", "pink"] } as const;

export function ReferralAdmin({ rewards }: { rewards: RewardRow[] }) {
  const [list, setList] = useState(rewards);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  if (list.length === 0) return <p className="text-muted-foreground">Aucune récompense de parrainage.</p>;
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Justification d&apos;annulation (obligatoire)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : comptes liés à la même personne" className="mt-1 h-10 w-full rounded-xl border border-white/12 bg-night px-3" />
      </label>
      <ul className="divide-y divide-white/8 rounded-2xl border border-white/10">
        {list.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="min-w-0 flex-1">
              <strong>{r.referrer}</strong> → {r.referee}
              <span className="block text-xs text-muted-foreground">
                éligible le {formatDateFr(r.eligibleAt)}
                {r.reason ? ` · ${r.reason}` : ""}
              </span>
            </span>
            <Badge variant={STATUS[r.status][1]}>{STATUS[r.status][0]}</Badge>
            {r.status !== "cancelled" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await cancelReferralRewardAction(r.id, reason);
                    toast[res.ok ? "success" : "error"](res.message ?? "");
                    if (res.ok) setList((l) => l.map((x) => (x.id === r.id ? { ...x, status: "cancelled", reason } : x)));
                  })
                }
              >
                Annuler
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

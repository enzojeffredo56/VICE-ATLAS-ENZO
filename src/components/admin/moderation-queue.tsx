"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/schemas";

export type QueueItem = { id: string; title: string; meta: string; body?: string; link?: { href: string; label: string } };

/** File de modération générique : publier, ou refuser avec un motif obligatoire. */
export function ModerationQueue({
  items,
  approveLabel,
  reasons,
  onDecide,
}: {
  items: QueueItem[];
  approveLabel: string;
  reasons: string[];
  onDecide: (id: string, decision: "approved" | "rejected", note: string) => Promise<FormState>;
}) {
  const [list, setList] = useState(items);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const decide = (id: string, d: "approved" | "rejected") =>
    start(async () => {
      const res = await onDecide(id, d, reason[id] ?? "");
      toast[res.ok ? "success" : "error"](res.message ?? "");
      if (res.ok) setList((l) => l.filter((x) => x.id !== id));
    });
  if (list.length === 0) return <p className="text-muted-foreground">Rien en attente.</p>;
  return (
    <ul className="space-y-3">
      {list.map((x) => (
        <li key={x.id} className="glass rounded-2xl p-4">
          <p className="font-semibold">{x.title}</p>
          <p className="text-xs text-muted-foreground">{x.meta}</p>
          {x.body && <p className="mt-2 text-sm whitespace-pre-line text-ink/85">{x.body}</p>}
          {x.link && (
            <a href={x.link.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-cyan underline-offset-4 hover:underline">
              {x.link.label}
            </a>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="cyan" disabled={pending} onClick={() => decide(x.id, "approved")}>
              <Check /> {approveLabel}
            </Button>
            <select aria-label="Motif de refus" value={reason[x.id] ?? ""} onChange={(e) => setReason((s) => ({ ...s, [x.id]: e.target.value }))} className="h-9 rounded-full border border-white/12 bg-night px-3 text-sm">
              <option value="">Motif de refus…</option>
              {reasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" disabled={pending || !reason[x.id]} onClick={() => decide(x.id, "rejected")}>
              <X /> Refuser
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

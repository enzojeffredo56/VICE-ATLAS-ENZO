"use client";

import { useState, useTransition } from "react";
import { Check, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/lib/reviews/actions";
import { REJECTION_REASONS } from "@/lib/reviews/schema";
import { formatDateFr } from "@/lib/text";

type Item = { id: string; rating: number; comment: string; updated_at: string; username: string };

export function ReviewModerationList({ items }: { items: Item[] }) {
  const [list, setList] = useState(items);
  const [pending, start] = useTransition();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const decide = (id: string, decision: "approved" | "rejected") =>
    start(async () => {
      const res = await moderateReviewAction(id, decision, reasons[id] ?? "");
      toast[res.ok ? "success" : "error"](res.message ?? "");
      if (res.ok) setList((l) => l.filter((i) => i.id !== id));
    });

  if (list.length === 0) return <p className="text-muted-foreground">Aucun avis en attente. Bravo !</p>;
  return (
    <ul className="space-y-3">
      {list.map((r) => (
        <li key={r.id} className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold">{r.username}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="flex" aria-label={`${r.rating} sur 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={n <= r.rating ? "size-4 fill-pink text-pink" : "size-4 text-ink/20"} aria-hidden />
                ))}
              </span>
              {formatDateFr(r.updated_at)}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-line">{r.comment}</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Button size="sm" variant="cyan" disabled={pending} onClick={() => decide(r.id, "approved")}>
              <Check /> Publier (+20 XP)
            </Button>
            <label className="sr-only" htmlFor={`reason-${r.id}`}>
              Motif de refus
            </label>
            <select
              id={`reason-${r.id}`}
              value={reasons[r.id] ?? ""}
              onChange={(e) => setReasons((s) => ({ ...s, [r.id]: e.target.value }))}
              className="h-9 rounded-full border border-white/12 bg-night px-3 text-sm"
            >
              <option value="">Motif de refus…</option>
              {REJECTION_REASONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" disabled={pending || !reasons[r.id]} onClick={() => decide(r.id, "rejected")}>
              <X /> Refuser
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

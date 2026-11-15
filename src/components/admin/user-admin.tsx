"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { inputClass } from "@/components/forms/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adjustXpAction, badgeAction, reverseXpAction, setRoleAction } from "@/lib/admin/actions";
import { BADGES, XP_REASON_LABELS } from "@/lib/xp/badges";
import { formatDateFr } from "@/lib/text";
import { cn } from "@/lib/utils";

export type AdminUser = {
  id: string;
  username: string;
  role: "user" | "moderator" | "admin";
  isPublic: boolean;
  createdAt: string;
  xp: number;
  badges: string[];
  events: { id: number; amount: number; reason: string; note: string | null; createdAt: string; reversed: boolean }[];
};

export function UserAdminList({ users, canEdit }: { users: AdminUser[]; canEdit: boolean }) {
  return (
    <ul className="space-y-2">
      {users.map((u) => (
        <UserRow key={u.id} user={u} canEdit={canEdit} />
      ))}
    </ul>
  );
}

function UserRow({ user, canEdit }: { user: AdminUser; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user.role);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      toast[r.ok ? "success" : "error"](r.message ?? "");
    });

  return (
    <li className="glass rounded-2xl">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-3 p-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="font-semibold">{user.username}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            inscrit le {formatDateFr(user.createdAt)} · {user.isPublic ? "public" : "privé"}
          </span>
        </span>
        <Badge variant={role === "admin" ? "pink" : role === "moderator" ? "cyan" : "default"}>{role}</Badge>
        <span className="font-display font-bold text-turquoise tabular-nums">{user.xp} XP</span>
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="space-y-5 border-t border-white/10 p-4">
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`role-${user.id}`} className="text-sm font-medium">
                Rôle
              </label>
              <select id={`role-${user.id}`} value={role} onChange={(e) => setRole(e.target.value as AdminUser["role"])} className="h-9 rounded-full border border-white/12 bg-night px-3 text-sm">
                <option value="user">Utilisateur</option>
                <option value="moderator">Modérateur</option>
                <option value="admin">Administrateur</option>
              </select>
              <Button size="sm" variant="outline" disabled={pending || role === user.role} onClick={() => run(() => setRoleAction(user.id, role))}>
                Enregistrer le rôle
              </Button>
            </div>
          )}
          {canEdit && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Justification (obligatoire pour toute correction)</p>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ex. : compensation après un bug du carnet" className={inputClass()} />
              <div className="flex flex-wrap gap-2">
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="± XP" className={cn(inputClass(), "w-28")} aria-label="Montant d'XP" />
                <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => adjustXpAction(user.id, Number(amount), note))}>
                  Ajuster les XP
                </Button>
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-medium">Badges</p>
            <div className="flex flex-wrap gap-2">
              {BADGES.map((b) => {
                const has = user.badges.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!canEdit || pending}
                    onClick={() => run(() => badgeAction(user.id, b.id, !has, note))}
                    title={canEdit ? (has ? "Retirer (avec justification)" : "Attribuer (avec justification)") : b.description}
                    className={cn("rounded-full border px-3 py-1 text-xs transition", has ? "border-turquoise/50 bg-turquoise/10" : "border-white/10 opacity-60", canEdit && "cursor-pointer hover:border-white/30")}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Historique des XP</p>
            {user.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun mouvement.</p>
            ) : (
              <ul className="divide-y divide-white/8 text-sm">
                {user.events.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      {XP_REASON_LABELS[e.reason] ?? e.reason}
                      <span className="block text-xs text-muted-foreground">
                        {formatDateFr(e.createdAt)}
                        {e.note ? ` · ${e.note}` : ""}
                      </span>
                    </span>
                    <span className={cn("tabular-nums", e.amount > 0 ? "text-turquoise" : "text-pink")}>{e.amount > 0 ? `+${e.amount}` : e.amount}</span>
                    {canEdit && e.reason !== "reversal" && !e.reversed && (
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => reverseXpAction(e.id, note))} aria-label="Annuler ce gain">
                        <Undo2 />
                      </Button>
                    )}
                    {e.reversed && <Badge>annulé</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

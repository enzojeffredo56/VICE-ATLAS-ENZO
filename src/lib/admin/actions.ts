"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { getEditorContext } from "@/lib/auth/editor";
import type { FormState } from "@/lib/auth/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { placeAdminSchema } from "./place-schema";

async function admin(level: "editor" | "admin") {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok" || (level === "admin" && ctx.role !== "admin")) return null;
  return createSupabaseServerClient();
}

const justification = z.string().trim().min(10, "Justification obligatoire (10 caractères minimum).").max(500);

export async function setRoleAction(userId: string, role: "user" | "moderator" | "admin"): Promise<FormState> {
  const sb = await admin("admin");
  if (!sb) return { ok: false, message: "Réservé aux administrateurs." };
  const { error } = await sb.rpc("admin_set_role", { p_user: userId, p_role: role });
  if (error) return { ok: false, message: error.code === "P0001" ? "Impossible de retirer le dernier administrateur." : "Changement de rôle impossible." };
  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: "Rôle mis à jour." };
}

export async function adjustXpAction(userId: string, amount: number, note: string): Promise<FormState> {
  const sb = await admin("admin");
  if (!sb) return { ok: false, message: "Réservé aux administrateurs." };
  const n = z.number().int().refine((v) => v !== 0 && Math.abs(v) <= 1000, "Montant entre -1000 et 1000, non nul.").safeParse(amount);
  const j = justification.safeParse(note);
  if (!n.success || !j.success) return { ok: false, message: (n.error ?? j.error)!.issues[0].message };
  const { error } = await sb.rpc("admin_adjust_xp", { p_user: userId, p_amount: n.data, p_justification: j.data });
  if (error) return { ok: false, message: "Ajustement impossible." };
  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: "XP ajustés." };
}

export async function reverseXpAction(eventId: number, note: string): Promise<FormState> {
  const sb = await admin("admin");
  if (!sb) return { ok: false, message: "Réservé aux administrateurs." };
  const j = justification.safeParse(note);
  if (!j.success) return { ok: false, message: j.error.issues[0].message };
  const { error } = await sb.rpc("admin_reverse_xp", { p_event: eventId, p_justification: j.data });
  if (error) return { ok: false, message: error.code === "23505" ? "Ce gain a déjà été annulé." : "Annulation impossible." };
  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: "Gain annulé." };
}

export async function badgeAction(userId: string, badgeId: string, grant: boolean, note: string): Promise<FormState> {
  const sb = await admin("admin");
  if (!sb) return { ok: false, message: "Réservé aux administrateurs." };
  const j = justification.safeParse(note);
  if (!j.success) return { ok: false, message: j.error.issues[0].message };
  const { error } = await sb.rpc(grant ? "admin_award_badge" : "admin_revoke_badge", { p_user: userId, p_badge: badgeId, p_justification: j.data });
  if (error) return { ok: false, message: "Opération impossible." };
  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: grant ? "Badge attribué." : "Badge retiré." };
}

export async function savePlaceAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const sb = await admin("editor");
  if (!sb) return { ok: false, message: "Accès refusé." };
  const parsed = placeAdminSchema.safeParse(Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""])));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, tags, ...rest } = parsed.data;
  const row = { ...rest, category_id: rest.category_id, tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) : [] };
  const { error } = id ? await sb.from("places").update(row).eq("id", id) : await sb.from("places").insert(row);
  if (error) return { ok: false, message: error.code === "23505" ? "Cet identifiant d'URL est déjà utilisé." : "Enregistrement impossible." };
  updateTag("places");
  revalidatePath("/admin/lieux");
  return { ok: true, message: "Lieu enregistré." };
}

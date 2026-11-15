"use server";

import { revalidatePath } from "next/cache";
import { getEditorContext } from "@/lib/auth/editor";
import { toFieldErrors, type FormState } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { contributionSchema } from "./schema";

export async function submitContributionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const parsed = contributionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: toFieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return { ok: false, message: "Les contributions ouvriront dès que la base de données sera branchée." };
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Connecte-toi pour contribuer." };
  const d = parsed.data;
  const { error } = await sb.rpc("submit_contribution", {
    p_kind: d.kind,
    p_title: d.title,
    p_description: d.description,
    p_place_slug: d.kind === "error_report" ? d.placeSlug : null,
    p_category: d.kind === "place_proposal" ? d.category : null,
    p_x: d.kind === "place_proposal" ? d.x : null,
    p_y: d.kind === "place_proposal" ? d.y : null,
  });
  if (error) return { ok: false, message: error.code === "P0429" ? "Tu as envoyé beaucoup de contributions aujourd'hui. Reviens demain !" : "Envoi impossible pour le moment." };
  revalidatePath("/communaute");
  return {
    ok: true,
    message: d.kind === "place_proposal" ? "Merci ! Ta découverte sera vérifiée : +50 XP si elle est retenue." : "Merci pour ton signalement, l'équipe va vérifier.",
  };
}

export async function moderateContributionAction(id: string, decision: "approved" | "rejected", note: string): Promise<FormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok") return { ok: false, message: "Accès refusé." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("moderate_contribution", { p_contribution: id, p_decision: decision, p_note: note || null });
  if (error) return { ok: false, message: error.code === "22023" ? "Indique le motif du refus." : "Modération impossible." };
  revalidatePath("/admin/moderation");
  return { ok: true, message: decision === "approved" ? "Contribution acceptée." : "Contribution refusée." };
}

export async function markNotificationsReadAction(): Promise<FormState> {
  if (!isSupabaseConfigured) return { ok: false };
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false };
  await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
  return { ok: true };
}

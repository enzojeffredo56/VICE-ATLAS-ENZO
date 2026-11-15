"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getEditorContext } from "@/lib/auth/editor";
import { toFieldErrors, type FormState } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { videoUrlSchema } from "@/lib/video";
import { customChallengeSchema } from "./engine";

const NOT_READY: FormState = { ok: false, message: "Disponible dès que la base de données sera branchée." };

async function requireUser() {
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { sb, user };
}

const DB_ERRORS: Record<string, string> = {
  P0429: "Tu as fait beaucoup de demandes récemment. Réessaie plus tard.",
  P0002: "Aucun défi de la semaine n'est en cours.",
  P0001: "Ta preuve de cette semaine est déjà validée.",
  "23514": "Ce contenu ne respecte pas les règles.",
};

export async function createRoomAction(name: string): Promise<{ ok: boolean; code?: string; message?: string }> {
  const parsed = z.string().trim().min(3, "Nom de salon trop court.").max(40, "40 caractères maximum.").safeParse(name);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!isSupabaseConfigured) return NOT_READY;
  const { sb, user } = await requireUser();
  if (!user) return { ok: false, message: "Connecte-toi pour créer un salon." };
  const { data, error } = await sb.rpc("create_room", { p_name: parsed.data });
  if (error) return { ok: false, message: DB_ERRORS[error.code ?? ""] ?? "Création impossible pour le moment." };
  return { ok: true, code: data as string };
}

export async function proposeChallengeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = customChallengeSchema.safeParse({
    title: fd.get("title") ?? "",
    description: fd.get("description") ?? "",
    category: fd.get("category"),
    difficulty: fd.get("difficulty"),
  });
  if (!parsed.success) return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: toFieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return NOT_READY;
  const { sb, user } = await requireUser();
  if (!user) return { ok: false, message: "Connecte-toi pour proposer un défi." };
  const { error } = await sb.rpc("propose_challenge", {
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category: parsed.data.category,
    p_difficulty: parsed.data.difficulty,
  });
  if (error) return { ok: false, message: DB_ERRORS[error.code ?? ""] ?? "Envoi impossible pour le moment." };
  return { ok: true, message: "Merci ! Ton défi sera ajouté à la roue après vérification. Les défis entre amis ne rapportent pas d'XP." };
}

export async function submitWeeklyProofAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = videoUrlSchema.safeParse(fd.get("url") ?? "");
  if (!parsed.success) return { ok: false, fieldErrors: { url: parsed.error.issues[0].message }, message: "Lien refusé." };
  if (!isSupabaseConfigured) return NOT_READY;
  const { sb, user } = await requireUser();
  if (!user) return { ok: false, message: "Connecte-toi pour envoyer ta preuve." };
  const { error } = await sb.rpc("submit_weekly_proof", { p_url: parsed.data });
  if (error) return { ok: false, message: DB_ERRORS[error.code ?? ""] ?? "Envoi impossible pour le moment." };
  return { ok: true, message: "Preuve envoyée ! +100 XP dès qu'un modérateur l'aura validée." };
}

export async function moderateChallengeAction(id: string, decision: "approved" | "rejected"): Promise<FormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok") return { ok: false, message: "Accès refusé." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("moderate_challenge", { p_challenge: id, p_decision: decision });
  if (error) return { ok: false, message: "Modération impossible." };
  revalidatePath("/admin/moderation");
  return { ok: true, message: decision === "approved" ? "Défi ajouté à la roue." : "Défi refusé." };
}

export async function moderateWeeklyAction(id: string, decision: "approved" | "rejected", note: string): Promise<FormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok") return { ok: false, message: "Accès refusé." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("moderate_weekly_submission", { p_submission: id, p_decision: decision, p_note: note || null });
  if (error) return { ok: false, message: error.code === "22023" ? "Indique le motif du refus." : "Modération impossible." };
  revalidatePath("/admin/moderation");
  return { ok: true, message: decision === "approved" ? "Preuve validée (+100 XP)." : "Preuve refusée." };
}

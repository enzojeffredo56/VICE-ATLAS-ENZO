"use server";

import { revalidatePath } from "next/cache";
import { getEditorContext } from "@/lib/auth/editor";
import { toFieldErrors, type FormState } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { entrySchema } from "./schema";

const ERRORS: Record<string, string> = {
  "23505": "Tu as déjà une participation active pour ce concours. Retire-la d'abord dans « Mes vidéos ».",
  "23514": "Lien vidéo non autorisé : YouTube, clip Twitch ou Streamable (https).",
  P0001: "Ce concours n'accepte pas cette action en ce moment (vérifie le calendrier).",
  P0002: "Concours ou vidéo introuvable.",
  P0429: "Trop de tentatives récentes. Réessaie plus tard.",
  "42501": "Action non autorisée.",
};
const describe = (code?: string) => (code && ERRORS[code]) || "Action impossible pour le moment.";


export async function submitEntryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = entrySchema.safeParse({ competitionId: fd.get("competitionId"), title: fd.get("title") ?? "", url: fd.get("url") ?? "", rules: fd.get("rules") });
  if (!parsed.success) return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: toFieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return { ok: false, message: "Les participations ouvriront dès que la base de données sera branchée." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("submit_stunt_entry", { p_competition: parsed.data.competitionId, p_url: parsed.data.url, p_title: parsed.data.title });
  if (error) return { ok: false, message: describe(error.code) };
  revalidatePath("/stunts/mes-videos");
  return { ok: true, message: "Vidéo envoyée ! Elle apparaîtra après vérification par l'équipe." };
}

export async function voteAction(entryId: string): Promise<FormState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Les votes ouvriront dès que la base de données sera branchée." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("cast_stunt_vote", { p_entry: entryId });
  if (error) return { ok: false, message: error.code === "42501" ? "Tu ne peux pas voter pour ta propre vidéo (ou tu n'es pas connecté)." : describe(error.code) };
  return { ok: true, message: "Vote enregistré. Tu peux le changer jusqu'à dimanche 23:59." };
}

export async function withdrawEntryAction(entryId: string): Promise<FormState> {
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("withdraw_stunt_entry", { p_entry: entryId });
  if (error) return { ok: false, message: describe(error.code) };
  revalidatePath("/stunts/mes-videos");
  return { ok: true, message: "Participation retirée." };
}

async function editor() {
  const ctx = await getEditorContext();
  return ctx.status === "ok" ? await createSupabaseServerClient() : null;
}

export async function moderateEntryAction(entryId: string, decision: "approved" | "rejected", note: string): Promise<FormState> {
  const sb = await editor();
  if (!sb) return { ok: false, message: "Accès refusé." };
  const { error } = await sb.rpc("moderate_stunt_entry", { p_entry: entryId, p_decision: decision, p_note: note || null });
  if (error) return { ok: false, message: error.code === "22023" ? "Indique le motif du refus." : describe(error.code) };
  revalidatePath("/admin/stunts");
  return { ok: true, message: decision === "approved" ? "Vidéo publiée." : "Vidéo refusée, le joueur est prévenu." };
}

export async function reviewVoteAction(competitionId: string, userId: string, valid: boolean): Promise<FormState> {
  const sb = await editor();
  if (!sb) return { ok: false, message: "Accès refusé." };
  const { error } = await sb.rpc("review_stunt_vote", { p_competition: competitionId, p_user: userId, p_valid: valid });
  if (error) return { ok: false, message: describe(error.code) };
  revalidatePath("/admin/stunts");
  return { ok: true, message: valid ? "Vote validé." : "Vote annulé." };
}

export async function confirmResultsAction(competitionId: string): Promise<FormState> {
  const sb = await editor();
  if (!sb) return { ok: false, message: "Accès refusé." };
  const { error } = await sb.rpc("confirm_competition_results", { p_competition: competitionId });
  if (error) return { ok: false, message: error.code === "P0001" ? "Vérifie d'abord les votes signalés (ou attends la fin des votes)." : describe(error.code) };
  revalidatePath("/admin/stunts");
  revalidatePath("/stunts/gagnants");
  return { ok: true, message: "Résultats confirmés : XP et badges attribués." };
}

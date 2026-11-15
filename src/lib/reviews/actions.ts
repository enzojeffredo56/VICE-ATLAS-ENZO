"use server";

import { revalidatePath } from "next/cache";
import { getEditorContext } from "@/lib/auth/editor";
import { toFieldErrors, type FormState } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reviewSchema } from "./schema";

export async function submitReviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = reviewSchema.safeParse({ rating: fd.get("rating"), comment: fd.get("comment") ?? "", website: fd.get("website") ?? "" });
  if (!parsed.success) return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: toFieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return { ok: false, message: "Les avis seront ouverts dès que la base de données sera branchée." };

  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Connecte-toi pour donner ton avis." };

  const { data: existing } = await sb.from("reviews").select("id").eq("user_id", user.id).maybeSingle();
  const payload = { rating: parsed.data.rating, comment: parsed.data.comment };
  const { error } = existing
    ? await sb.from("reviews").update(payload).eq("id", existing.id)
    : await sb.from("reviews").insert(payload);
  if (error?.code === "P0429") return { ok: false, message: "Tu as modifié ton avis plusieurs fois récemment. Réessaie dans une heure." };
  if (error) return { ok: false, message: "Envoi impossible pour le moment. Réessaie plus tard." };
  revalidatePath("/avis");
  return { ok: true, message: "Merci ! Ton avis sera publié après une rapide vérification." };
}

export async function moderateReviewAction(reviewId: string, decision: "approved" | "rejected", note: string): Promise<FormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok") return { ok: false, message: "Accès refusé." };
  const sb = await createSupabaseServerClient();
  const { error } = await sb.rpc("moderate_review", { p_review: reviewId, p_decision: decision, p_note: note || null });
  if (error) return { ok: false, message: error.code === "22023" ? "Indique le motif du refus." : "Modération impossible pour le moment." };
  revalidatePath("/admin/avis");
  revalidatePath("/avis");
  return { ok: true, message: decision === "approved" ? "Avis publié (+20 XP pour le joueur)." : "Avis refusé, le joueur est prévenu." };
}

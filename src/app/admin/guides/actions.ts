"use server";

import { updateTag } from "next/cache";
import { getEditorContext } from "@/lib/auth/editor";
import { describeDbError, parseGuideForm, toSaveGuidePayload, type GuideFormState } from "@/lib/admin/guide-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function saveGuideAction(_prev: GuideFormState, formData: FormData): Promise<GuideFormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok") return { ok: false, message: describeDbError("42501") };

  const parsed = parseGuideForm(formData);
  if (!parsed.success) {
    return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: parsed.fieldErrors };
  }

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("save_guide", { payload: toSaveGuidePayload(parsed.data) });
  if (error) return { ok: false, message: describeDbError(error.code) };

  updateTag("guides");
  updateTag("places");
  return { ok: true, message: "Guide enregistré.", savedId: String(data) };
}

export async function deleteGuideAction(id: string): Promise<GuideFormState> {
  const ctx = await getEditorContext();
  if (ctx.status !== "ok" || ctx.role !== "admin") return { ok: false, message: "Seul un administrateur peut supprimer un guide." };
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return { ok: false, message: "Identifiant invalide." };

  const sb = await createSupabaseServerClient();
  const { error, count } = await sb.from("guides").delete({ count: "exact" }).eq("id", parsedId.data);
  if (error) return { ok: false, message: describeDbError(error.code) };
  if (!count) return { ok: false, message: describeDbError("P0002") };

  updateTag("guides");
  updateTag("places");
  return { ok: true, message: "Guide supprimé." };
}

import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EditorContext =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "ok"; userId: string; role: "moderator" | "admin" };

/**
 * Qui consulte l'administration ? Vérifié côté serveur à chaque requête ;
 * la base applique en plus ses propres règles (RLS), même si ce contrôle était contourné.
 */
export async function getEditorContext(): Promise<EditorContext> {
  if (!isSupabaseConfigured) return { status: "unconfigured" };
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { status: "anonymous" };
  const { data } = await sb.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  const role = data?.role;
  if (role !== "admin" && role !== "moderator") return { status: "forbidden" };
  return { status: "ok", userId: user.id, role };
}

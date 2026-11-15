import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  show_progress: boolean;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
};

export type Session = { userId: string; email: string | null; profile: Profile | null };

/** Compte connecté (vérifié auprès de Supabase), ou null. */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id,username,avatar_url,bio,is_public,show_progress,referral_code,referred_by,created_at")
    .eq("id", user.id)
    .maybeSingle();
  return { userId: user.id, email: user.email ?? null, profile: (data as Profile | null) ?? null };
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/**
 * Client Supabase côté navigateur (clé anonyme uniquement, protégée par RLS).
 * Branché en phase 4 (comptes et profils).
 */
export function createSupabaseBrowserClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase n'est pas configuré : renseigne .env.local (voir .env.example).");
  }
  return createBrowserClient(url, key);
}

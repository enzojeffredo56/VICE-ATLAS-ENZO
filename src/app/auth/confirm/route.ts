import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "recovery", "email", "email_change", "invite", "magiclink"];

/** Lien reçu par e-mail (confirmation d'inscription, nouveau mot de passe). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const fail = new URL("/connexion?erreur=lien", request.url);

  if (!isSupabaseConfigured || !tokenHash || !type || !TYPES.includes(type)) return NextResponse.redirect(fail);
  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
  return NextResponse.redirect(error ? fail : new URL(next, request.url));
}

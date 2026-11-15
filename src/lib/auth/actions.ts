"use server";

import { redirect } from "next/navigation";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  describeAuthError,
  newPasswordSchema,
  profileUpdateSchema,
  resetRequestSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
  toFieldErrors,
  type FormState,
} from "./schemas";

const NOT_READY: FormState = {
  ok: false,
  message: "Les comptes joueurs seront actifs dès que la base de données sera branchée. Reviens très vite !",
};

const formValues = (fd: FormData) => Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(formValues(fd));
  if (!parsed.success) return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: toFieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return NOT_READY;

  const sb = await createSupabaseServerClient();
  const { data: available } = await sb.rpc("username_available", { p_username: parsed.data.username });
  if (available === false) return { ok: false, fieldErrors: { username: "Ce pseudo est déjà pris." }, message: "Choisis un autre pseudo." };

  const { error } = await sb.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/profil`,
      data: { username: parsed.data.username, referral_code: parsed.data.referralCode || undefined },
    },
  });
  if (error && error.code !== "user_already_exists") {
    return { ok: false, message: describeAuthError(error.code, "Inscription impossible pour le moment. Réessaie plus tard.") };
  }
  // Même message que le compte existe ou non : on ne révèle pas les adresses inscrites.
  return { ok: true, message: "Presque fini ! Ouvre l'e-mail que nous venons d'envoyer pour confirmer ton compte." };
}

export async function signInAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(formValues(fd));
  if (!parsed.success) return { ok: false, message: "Certains champs sont à corriger.", fieldErrors: toFieldErrors(parsed.error) };
  if (!isSupabaseConfigured) return NOT_READY;

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: describeAuthError(error.code, "Connexion impossible pour le moment.") };
  redirect(safeNextPath(fd.get("next")));
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordResetAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(formValues(fd));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error), message: "Adresse e-mail invalide." };
  if (!isSupabaseConfigured) return NOT_READY;
  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reinitialiser-mot-de-passe`,
  });
  if (error?.code?.startsWith("over_")) return { ok: false, message: describeAuthError(error.code, "") };
  return { ok: true, message: "Si un compte existe avec cette adresse, tu vas recevoir un lien pour choisir un nouveau mot de passe." };
}

export async function updatePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(formValues(fd));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error), message: "Certains champs sont à corriger." };
  if (!isSupabaseConfigured) return NOT_READY;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Le lien a expiré. Refais une demande de nouveau mot de passe." };
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: describeAuthError(error.code, "Modification impossible pour le moment.") };
  return { ok: true, message: "Ton mot de passe a été modifié." };
}

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = profileUpdateSchema.safeParse({
    username: fd.get("username") ?? "",
    bio: fd.get("bio") ?? "",
    isPublic: fd.get("isPublic") === "on",
    showProgress: fd.get("showProgress") === "on",
  });
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error), message: "Certains champs sont à corriger." };
  if (!isSupabaseConfigured) return NOT_READY;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Ta session a expiré. Reconnecte-toi." };
  const { error } = await sb
    .from("profiles")
    .update({
      username: parsed.data.username,
      bio: parsed.data.bio || null,
      is_public: parsed.data.isPublic,
      show_progress: parsed.data.showProgress,
    })
    .eq("id", user.id);
  if (error?.code === "23505") return { ok: false, fieldErrors: { username: "Ce pseudo est déjà pris." }, message: "Choisis un autre pseudo." };
  if (error) return { ok: false, message: "Enregistrement impossible pour le moment." };
  return { ok: true, message: "Profil enregistré." };
}

/** Enregistre l'adresse d'un avatar déjà envoyé dans le dossier personnel du joueur. */
export async function setAvatarAction(url: string | null): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_READY;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Ta session a expiré. Reconnecte-toi." };
  const prefix = `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/`;
  if (url !== null && (!url.startsWith(prefix) || url.length > 500)) return { ok: false, message: "Image refusée." };
  const { error } = await sb.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { ok: false, message: "Enregistrement impossible pour le moment." };
  return { ok: true, message: url ? "Avatar mis à jour." : "Avatar retiré." };
}

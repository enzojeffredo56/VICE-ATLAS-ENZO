import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,20}$/, "Ton pseudo doit faire 3 à 20 caractères : lettres, chiffres ou _ uniquement.");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide."));

export const passwordSchema = z
  .string()
  .min(8, "Ton mot de passe doit faire au moins 8 caractères.")
  .max(72, "Ton mot de passe doit faire 72 caractères maximum.")
  .regex(/[A-Za-z]/, "Ajoute au moins une lettre.")
  .regex(/[0-9]/, "Ajoute au moins un chiffre.");

export const referralCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{8}$/, "Code de parrainage invalide (8 caractères).");

export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    referralCode: z.union([z.literal(""), referralCodeSchema]).optional(),
    terms: z.literal("on", { error: "Tu dois accepter les conditions d'utilisation." }),
    /** Champ piège invisible : un robot le remplit, un humain non. */
    website: z.string().max(0, "Envoi refusé.").optional(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Saisis ton mot de passe."),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." });

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  bio: z.string().trim().max(280, "280 caractères maximum."),
  isPublic: z.boolean(),
  showProgress: z.boolean(),
});

export type FormState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> };

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join(".") || "form"] ??= issue.message;
  return out;
}

/**
 * Redirection après connexion : uniquement vers une page interne du site
 * (empêche les redirections ouvertes du type ?suite=https://site-pirate).
 */
export function safeNextPath(next: unknown, fallback = "/profil"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

/** Messages d'erreur Supabase Auth traduits, sans révéler si un compte existe. */
export function describeAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou mot de passe incorrect.";
    case "email_not_confirmed":
      return "Confirme d'abord ton adresse e-mail grâce au lien reçu.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Trop de tentatives. Patiente quelques minutes avant de réessayer.";
    case "weak_password":
      return "Mot de passe trop faible. Choisis-en un plus long.";
    case "same_password":
      return "Choisis un mot de passe différent de l'ancien.";
    case "user_already_exists":
    case "email_exists":
      return "Si cette adresse est libre, un e-mail de confirmation vient d'être envoyé.";
    default:
      return fallback;
  }
}

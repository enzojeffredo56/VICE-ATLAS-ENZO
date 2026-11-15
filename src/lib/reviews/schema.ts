import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choisis une note de 1 à 5 étoiles.").max(5, "Choisis une note de 1 à 5 étoiles."),
  comment: z
    .string()
    .trim()
    .min(30, "Ton commentaire doit faire au moins 30 caractères.")
    .max(1000, "Ton commentaire doit faire 1 000 caractères maximum."),
  website: z.string().max(0, "Envoi refusé.").optional(),
});

/** Motifs de refus autorisés : jamais la note elle-même. */
export const REJECTION_REASONS = [
  "Propos irrespectueux ou insultants",
  "Spam ou publicité",
  "Données personnelles d'un tiers",
  "Hors sujet : l'avis doit porter sur VICE ATLAS",
] as const;

export type ReviewStats = { count: number; average: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };

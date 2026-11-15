import { z } from "zod";
import { MAP_HEIGHT, MAP_WIDTH, placeCategoryIdSchema, slugSchema } from "@/lib/content/schemas";

const base = {
  title: z.string().trim().min(5, "Le titre doit faire au moins 5 caractères.").max(120, "120 caractères maximum."),
  description: z.string().trim().min(20, "Décris en au moins 20 caractères.").max(1000, "1 000 caractères maximum."),
  website: z.string().max(0, "Envoi refusé.").optional(),
};

export const placeProposalSchema = z.object({
  ...base,
  kind: z.literal("place_proposal"),
  category: placeCategoryIdSchema,
  x: z.coerce.number({ error: "Coordonnée X invalide." }).min(0, `X entre 0 et ${MAP_WIDTH}.`).max(MAP_WIDTH, `X entre 0 et ${MAP_WIDTH}.`),
  y: z.coerce.number({ error: "Coordonnée Y invalide." }).min(0, `Y entre 0 et ${MAP_HEIGHT}.`).max(MAP_HEIGHT, `Y entre 0 et ${MAP_HEIGHT}.`),
});

export const errorReportSchema = z.object({ ...base, kind: z.literal("error_report"), placeSlug: slugSchema });

export const contributionSchema = z.discriminatedUnion("kind", [placeProposalSchema, errorReportSchema]);

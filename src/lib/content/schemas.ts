import { z } from "zod";

/** Dimensions du repère de la carte (unités de carte). Origine en bas à gauche. */
export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 1500;

export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilise uniquement des minuscules, chiffres et tirets.");

export const placeCategoryIdSchema = z.enum(["point-interet", "stunt", "collectible", "activite", "panorama"]);
export type PlaceCategoryId = z.infer<typeof placeCategoryIdSchema>;

export const placeCategorySchema = z.object({
  id: placeCategoryIdSchema,
  label: z.string().min(2),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

export const placeSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2).max(80),
  category: placeCategoryIdSchema,
  x: z.number().min(0).max(MAP_WIDTH),
  y: z.number().min(0).max(MAP_HEIGHT),
  district: z.string().min(2),
  description: z.string().min(10).max(600),
  tags: z.array(z.string().min(2)).max(8).default([]),
  guideSlugs: z.array(slugSchema).default([]),
  /** Donnée de démonstration : jamais présentée comme officielle. */
  isDemo: z.boolean(),
});
export type Place = z.infer<typeof placeSchema>;

export const progressCategoryIdSchema = z.enum(["mission", "activite", "lieu", "collectible", "decouverte", "objectif"]);
export type ProgressCategoryId = z.infer<typeof progressCategoryIdSchema>;

export const progressItemSchema = z.object({
  id: slugSchema,
  category: z.enum(["mission", "activite", "decouverte"]),
  title: z.string().min(3).max(120),
  placeSlug: slugSchema.optional(),
  isDemo: z.boolean(),
});
export type ProgressItem = z.infer<typeof progressItemSchema>;

export const guideCategoryIdSchema = z.enum(["bien-demarrer", "exploration", "cascades", "entre-amis"]);
export type GuideCategoryId = z.infer<typeof guideCategoryIdSchema>;

export const guideStepSchema = z.object({
  title: z.string().trim().min(3, "Titre d'étape trop court.").max(120),
  body: z.string().trim().min(10, "Décris l'étape en 10 caractères minimum.").max(2000),
  placeSlug: slugSchema.optional(),
});
export type GuideStep = z.infer<typeof guideStepSchema>;

export const guideSourceSchema = z.object({
  label: z.string().trim().min(3).max(160),
  url: z
    .url({ protocol: /^https$/, message: "Lien https uniquement." })
    .or(z.string().regex(/^\/[a-z0-9/\-#?=]*$/, "Lien interne invalide."))
    .optional(),
});
export type GuideSource = z.infer<typeof guideSourceSchema>;

export const guideImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(3).max(200),
  credit: z.string().min(2).max(160),
});

export const guideStatusSchema = z.enum(["draft", "published", "archived"]);

export const guideSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(5).max(120),
  category: guideCategoryIdSchema,
  summary: z.string().trim().min(20).max(280),
  intro: z.string().trim().min(20).max(2000),
  steps: z.array(guideStepSchema).min(1).max(40),
  sources: z.array(guideSourceSchema).max(20).default([]),
  cover: guideImageSchema.optional(),
  placeSlugs: z.array(slugSchema).max(30).default([]),
  updatedAt: z.iso.date(),
  status: guideStatusSchema.default("published"),
  isDemo: z.boolean(),
});
export type Guide = z.infer<typeof guideSchema>;

/* ------------------------------------------------------------------
   Comparateur Miami
   ------------------------------------------------------------------ */

/** Statut de vérification d'un rapprochement jeu ↔ ville réelle. */
export const verificationStatusSchema = z.enum(["demo", "a-verifier", "probable", "verifie"]);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/** Lieu réel de Miami placé sur le plan schématique (même repère que la carte : origine en bas à gauche). */
export const miamiSpotSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2).max(120),
  neighborhood: z.string().min(2).max(80),
  x: z.number().min(0).max(MAP_WIDTH),
  y: z.number().min(0).max(MAP_HEIGHT),
  description: z.string().min(10).max(600),
});
export type MiamiSpot = z.infer<typeof miamiSpotSchema>;

export const correspondenceSchema = z.object({
  placeSlug: slugSchema,
  miamiSlug: slugSchema,
  /** Pourquoi on rapproche les deux lieux. */
  summary: z.string().min(10).max(600),
  status: verificationStatusSchema,
  sources: z.array(guideSourceSchema).max(10).default([]),
  isDemo: z.boolean(),
});
export type Correspondence = z.infer<typeof correspondenceSchema>;

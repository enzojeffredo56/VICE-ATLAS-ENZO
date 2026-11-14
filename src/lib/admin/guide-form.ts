import { z } from "zod";
import {
  guideCategoryIdSchema,
  guideSourceSchema,
  guideStatusSchema,
  guideStepSchema,
  slugSchema,
} from "@/lib/content/schemas";

/** Données du formulaire d'administration d'un guide (validées côté client ET côté serveur). */
export const guideFormSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(5, "Le titre doit faire au moins 5 caractères.").max(120, "120 caractères maximum."),
  slug: slugSchema,
  category: guideCategoryIdSchema,
  summary: z.string().trim().min(20, "Le résumé doit faire au moins 20 caractères.").max(280, "280 caractères maximum."),
  intro: z.string().trim().min(20, "L'introduction doit faire au moins 20 caractères.").max(2000, "2 000 caractères maximum."),
  status: guideStatusSchema,
  steps: z.array(guideStepSchema).min(1, "Ajoute au moins une étape.").max(40, "40 étapes maximum."),
  sources: z.array(guideSourceSchema).max(20, "20 sources maximum."),
  placeSlugs: z.array(slugSchema).max(30, "30 lieux maximum."),
});
export type GuideFormData = z.infer<typeof guideFormSchema>;

export type FieldErrors = Record<string, string>;
export type GuideFormState = { ok: boolean; message?: string; fieldErrors?: FieldErrors; savedId?: string };

function parseJsonArray(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value === "") return [];
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Lit un FormData ; les étapes et sources arrivent en JSON (champs cachés). */
export function parseGuideForm(fd: FormData): { success: true; data: GuideFormData } | { success: false; fieldErrors: FieldErrors } {
  const id = fd.get("id");
  const raw = {
    id: typeof id === "string" && id !== "" ? id : undefined,
    title: fd.get("title") ?? "",
    slug: fd.get("slug") ?? "",
    category: fd.get("category") ?? "",
    summary: fd.get("summary") ?? "",
    intro: fd.get("intro") ?? "",
    status: fd.get("status") ?? "draft",
    steps: parseJsonArray(fd.get("steps")),
    sources: parseJsonArray(fd.get("sources")),
    placeSlugs: fd.getAll("placeSlugs"),
  };
  const parsed = guideFormSchema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };
  const fieldErrors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return { success: false, fieldErrors };
}

/** Charge utile de la fonction SQL public.save_guide. */
export function toSaveGuidePayload(data: GuideFormData) {
  return {
    id: data.id ?? null,
    slug: data.slug,
    title: data.title,
    category_id: data.category,
    summary: data.summary,
    intro: data.intro,
    steps: data.steps,
    sources: data.sources,
    status: data.status,
    place_slugs: data.placeSlugs,
  };
}

/** Message lisible pour une erreur PostgreSQL / Supabase. */
export function describeDbError(code: string | undefined): string {
  switch (code) {
    case "23505":
      return "Cet identifiant d'URL (slug) est déjà utilisé par un autre guide.";
    case "23503":
      return "Un lieu lié ou la catégorie est introuvable. Vérifie la sélection.";
    case "42501":
      return "Accès refusé : cette action est réservée aux modérateurs et administrateurs.";
    case "P0002":
      return "Ce guide n'existe plus. Recharge la page.";
    case "23514":
      return "Un champ ne respecte pas les limites autorisées.";
    default:
      return "Enregistrement impossible pour le moment. Réessaie dans quelques instants.";
  }
}

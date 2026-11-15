import { z } from "zod";
import { MAP_HEIGHT, MAP_WIDTH, placeCategoryIdSchema, slugSchema } from "@/lib/content/schemas";

export const placeAdminSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]).transform((v) => v || undefined),
  slug: slugSchema,
  name: z.string().trim().min(2, "Nom trop court.").max(80),
  category_id: placeCategoryIdSchema,
  x: z.coerce.number().min(0).max(MAP_WIDTH),
  y: z.coerce.number().min(0).max(MAP_HEIGHT),
  district: z.string().trim().min(2, "Quartier obligatoire.").max(60),
  description: z.string().trim().min(10, "Description trop courte.").max(600),
  tags: z.string().max(200).optional(),
  status: z.enum(["draft", "published", "archived"]),
});

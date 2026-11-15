import { z } from "zod";
import { videoUrlSchema } from "@/lib/video";

export const entrySchema = z.object({
  competitionId: z.uuid("Choisis un spot."),
  title: z.string().trim().min(3, "Donne un titre d'au moins 3 caractères.").max(80, "80 caractères maximum."),
  url: videoUrlSchema,
  rules: z.literal("on", { error: "Tu dois accepter le règlement." }),
});

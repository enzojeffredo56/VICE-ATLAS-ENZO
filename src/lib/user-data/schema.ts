import { z } from "zod";

export const OBJECTIVE_MAX = 100;

export const objectiveTitleSchema = z
  .string()
  .trim()
  .min(3, "Ton objectif doit faire au moins 3 caractères.")
  .max(120, "Ton objectif doit faire 120 caractères maximum.");

export const userDataSchema = z.object({
  version: z.literal(1),
  places: z.record(
    z.string(),
    z.object({ favorite: z.boolean().optional(), visitedAt: z.string().optional() }),
  ),
  progress: z.record(z.string(), z.string()),
  objectives: z
    .array(
      z.object({
        id: z.string().min(1),
        title: objectiveTitleSchema,
        done: z.boolean(),
        createdAt: z.string(),
      }),
    )
    .max(OBJECTIVE_MAX),
  guideFavorites: z.array(z.string()),
  guideSteps: z.record(z.string(), z.array(z.number().int().min(0))),
  updatedAt: z.string().nullable(),
});

export type UserData = z.infer<typeof userDataSchema>;
export type Objective = UserData["objectives"][number];

export const emptyUserData = (): UserData => ({
  version: 1,
  places: {},
  progress: {},
  objectives: [],
  guideFavorites: [],
  guideSteps: {},
  updatedAt: null,
});

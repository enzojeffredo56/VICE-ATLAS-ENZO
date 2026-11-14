/**
 * Seuils de niveaux VICE ATLAS (cahier des charges, section L).
 * Index 0 = niveau 1. Fonctions pures : la vraie attribution d'XP
 * se fera côté serveur (phase 5) ; ici on ne fait que calculer un niveau.
 */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export type LevelInfo = {
  level: number;
  currentThreshold: number;
  nextThreshold: number | null;
  /** Progression vers le niveau suivant, entre 0 et 1 (1 au niveau max). */
  progress: number;
};

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let index = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) index = i;
  }
  const currentThreshold = LEVEL_THRESHOLDS[index];
  const nextThreshold = index + 1 < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[index + 1] : null;
  const progress =
    nextThreshold === null ? 1 : (safeXp - currentThreshold) / (nextThreshold - currentThreshold);
  return { level: index + 1, currentThreshold, nextThreshold, progress };
}

/** Barème XP officiel (section L). Les montants sont attribués côté serveur. */
export const XP_REWARDS = {
  profileCompleted: 30,
  reviewApproved: 20,
  discoveryApproved: 50,
  stuntWeeklyParticipation: 10,
  stuntFirstPlace: 150,
  stuntSecondPlace: 75,
  stuntThirdPlace: 40,
  weeklyChallengeValidated: 100,
} as const;

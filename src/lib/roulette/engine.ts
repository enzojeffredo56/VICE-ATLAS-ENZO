import { z } from "zod";
import { CHALLENGE_CATEGORIES, OFFICIAL_CHALLENGES, type ChallengeCategory } from "@/content/challenges";
import type { Difficulty } from "./demo-challenges";

export type Challenge = {
  id: string;
  title: string;
  description?: string | null;
  category: ChallengeCategory;
  difficulty: Difficulty;
  isCustom: boolean;
};

export const officialChallenges: Challenge[] = OFFICIAL_CHALLENGES.map((c) => ({ ...c, id: c.slug, isCustom: false }));

/** Codes de salon : 6 caractères, sans 0/O ni 1/I (lisibles à l'oral). */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

export const normalizeRoomCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
export const isValidRoomCode = (code: string) => ROOM_CODE_RE.test(code);

export function generateRoomCode(random: () => number = secureRandom): string {
  return Array.from({ length: 6 }, () => ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)]).join("");
}

export function secureRandom(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

const BANNED = /\b(argent réel|carte bancaire|mot de passe|triche|cheat|hack|glitch d.argent|mod menu)\b/i;
const LINK = /(https?:\/\/|www\.|\.(com|fr|net|org|gg|io)\b)/i;

/** Mêmes règles que la base (private.validate_challenge_text). */
export const customChallengeSchema = z
  .object({
    title: z.string().trim().min(10, "Ton défi doit faire au moins 10 caractères.").max(140, "140 caractères maximum."),
    description: z.string().trim().max(400, "400 caractères maximum.").optional().default(""),
    category: z.enum(CHALLENGE_CATEGORIES.map((c) => c.id) as [ChallengeCategory, ...ChallengeCategory[]]),
    difficulty: z.enum(["facile", "moyenne", "difficile"]),
  })
  .superRefine((v, ctx) => {
    const all = `${v.title} ${v.description}`;
    if (LINK.test(all)) ctx.addIssue({ code: "custom", path: ["title"], message: "Pas de liens dans un défi." });
    if (BANNED.test(all)) ctx.addIssue({ code: "custom", path: ["title"], message: "Pas de triche, d'argent réel ni de données personnelles." });
  });

export function filterChallenges(list: Challenge[], difficulty: Difficulty | null, categories: ReadonlySet<ChallengeCategory>) {
  return list.filter((c) => (!difficulty || c.difficulty === difficulty) && (categories.size === 0 || categories.has(c.category)));
}

export function pickChallenge(list: Challenge[], random: () => number = secureRandom): Challenge | null {
  if (list.length === 0) return null;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

/** Segments de la roue : les catégories, répétées deux fois pour une roue plus vivante. */
export const WHEEL_SEGMENTS = [...CHALLENGE_CATEGORIES, ...CHALLENGE_CATEGORIES].map((c, i) => ({ ...c, key: `${c.id}-${i}` }));

/** Index de segment où doit s'arrêter la roue pour une catégorie (un des deux segments, au hasard). */
export function segmentForCategory(category: ChallengeCategory, random: () => number = Math.random): number {
  const indexes = WHEEL_SEGMENTS.flatMap((s, i) => (s.id === category ? [i] : []));
  return indexes[Math.floor(random() * indexes.length)] ?? 0;
}

/** Défi de la semaine hors ligne : déterministe d'après la date du lundi. */
export function demoWeeklyChallenge(weekStart: string): Challenge {
  const pool = officialChallenges.filter((c) => c.difficulty !== "facile");
  let h = 0;
  for (const ch of weekStart) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

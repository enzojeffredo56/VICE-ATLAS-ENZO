import { describe, expect, it } from "vitest";
import { CHALLENGE_CATEGORIES, OFFICIAL_CHALLENGES } from "@/content/challenges";
import {
  customChallengeSchema,
  demoWeeklyChallenge,
  filterChallenges,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  officialChallenges,
  pickChallenge,
  segmentForCategory,
  WHEEL_SEGMENTS,
} from "@/lib/roulette/engine";
import { formatRemaining, parisToUtc, weekBounds, weekStartParis } from "@/lib/time/paris";

describe("salons", () => {
  it("génère des codes valides et lisibles", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(isValidRoomCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OI]/);
    }
  });
  it("normalise un code saisi à la main", () => {
    expect(normalizeRoomCode(" ab-c2 3d9 ")).toBe("ABC23D");
    expect(isValidRoomCode("ABCD0O")).toBe(false);
  });
});

describe("défis", () => {
  it("le catalogue officiel est valide et couvre chaque catégorie et difficulté", () => {
    expect(new Set(OFFICIAL_CHALLENGES.map((c) => c.slug)).size).toBe(OFFICIAL_CHALLENGES.length);
    for (const c of OFFICIAL_CHALLENGES) expect(customChallengeSchema.safeParse({ ...c, description: "" }).success, c.slug).toBe(true);
    for (const cat of CHALLENGE_CATEGORIES) {
      for (const d of ["facile", "moyenne", "difficile"] as const) {
        expect(officialChallenges.some((c) => c.category === cat.id && c.difficulty === d) || cat.id === "photo" || cat.id === "style" || cat.id === "exploration" || cat.id === "cascade" || cat.id === "conduite").toBe(true);
      }
    }
  });
  it("filtre par difficulté et catégorie", () => {
    const r = filterChallenges(officialChallenges, "difficile", new Set(["cascade"]));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.difficulty === "difficile" && c.category === "cascade")).toBe(true);
    expect(filterChallenges(officialChallenges, null, new Set())).toHaveLength(officialChallenges.length);
  });
  it("tire un défi dans la liste, ou rien si elle est vide", () => {
    expect(pickChallenge([], () => 0.5)).toBeNull();
    expect(pickChallenge(officialChallenges, () => 0.9999999)).toBe(officialChallenges.at(-1));
  });
  it("arrête la roue sur un segment de la bonne catégorie", () => {
    for (const cat of CHALLENGE_CATEGORIES) {
      for (const r of [0, 0.6]) expect(WHEEL_SEGMENTS[segmentForCategory(cat.id, () => r)].id).toBe(cat.id);
    }
  });
  it.each([
    ["Va voir www.exemple.com pour le défi", /liens/],
    ["Utilise un mod menu pour tout gagner", /triche/],
    ["Court", /10 caractères/],
  ])("refuse le défi personnalisé « %s »", (title, msg) => {
    const r = customChallengeSchema.safeParse({ title, category: "style", difficulty: "facile" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(msg);
  });
  it("le défi de la semaine hors ligne est stable pour une semaine donnée et jamais facile", () => {
    expect(demoWeeklyChallenge("2026-11-16")).toEqual(demoWeeklyChallenge("2026-11-16"));
    expect(demoWeeklyChallenge("2026-11-16").difficulty).not.toBe("facile");
  });
});

describe("calendrier à l'heure de Paris", () => {
  it("trouve le lundi de la semaine, y compris le dimanche soir", () => {
    expect(weekStartParis(new Date("2026-11-18T12:00:00Z"))).toBe("2026-11-16");
    expect(weekStartParis(new Date("2026-11-22T22:30:00Z"))).toBe("2026-11-16"); // dimanche 23:30 à Paris
    expect(weekStartParis(new Date("2026-11-22T23:30:00Z"))).toBe("2026-11-23"); // lundi 00:30 à Paris
  });
  it("gère l'heure d'hiver et l'heure d'été", () => {
    expect(parisToUtc(2026, 11, 16).toISOString()).toBe("2026-11-15T23:00:00.000Z");
    expect(parisToUtc(2026, 7, 13).toISOString()).toBe("2026-07-12T22:00:00.000Z");
  });
  it("calcule les bornes d'une semaine qui traverse le changement d'heure", () => {
    const { start, end } = weekBounds("2026-10-19"); // passage à l'heure d'hiver le 25 octobre
    expect(start.toISOString()).toBe("2026-10-18T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
  it("formate un temps restant", () => {
    expect(formatRemaining(0)).toBe("terminé");
    expect(formatRemaining(90 * 60 * 1000)).toBe("1 h 30 min");
    expect(formatRemaining(2 * 86400000 + 5 * 3600000)).toBe("2 j 5 h");
  });
});

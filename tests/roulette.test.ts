import { describe, expect, it } from "vitest";
import { DEMO_CHALLENGES, pickChallengeIndex, targetRotation } from "@/lib/roulette/demo-challenges";

describe("roulette de démonstration", () => {
  it("ne tire que des défis de la difficulté choisie", () => {
    for (const difficulty of ["facile", "moyenne", "difficile"] as const) {
      for (let r = 0; r < 1; r += 0.05) {
        const index = pickChallengeIndex(difficulty, () => r);
        expect(DEMO_CHALLENGES[index].difficulty).toBe(difficulty);
      }
    }
  });

  it("reste dans les bornes même si random() renvoie 1", () => {
    const index = pickChallengeIndex(null, () => 0.9999999);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(DEMO_CHALLENGES.length);
  });

  it("amène le segment tiré sous le pointeur (en haut)", () => {
    const n = 8;
    for (let index = 0; index < n; index++) {
      for (const current of [0, 37, 1800, 2213]) {
        const rot = targetRotation(current, index, n);
        expect(rot).toBeGreaterThan(current);
        // Angle du centre du segment après rotation, ramené à [0, 360)
        const centre = (index * 45 + 22.5 + rot) % 360;
        expect(Math.min(centre, 360 - centre)).toBeCloseTo(0);
      }
    }
  });
});

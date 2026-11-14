import { describe, expect, it } from "vitest";
import { LEVEL_THRESHOLDS, MAX_LEVEL, XP_REWARDS, getLevelInfo } from "@/lib/xp/levels";

describe("niveaux XP", () => {
  it("respecte les seuils du cahier des charges", () => {
    expect(LEVEL_THRESHOLDS).toEqual([0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500]);
    expect(MAX_LEVEL).toBe(10);
  });

  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [249, 2],
    [250, 3],
    [999, 4],
    [1000, 5],
    [7499, 9],
    [7500, 10],
    [999999, 10],
  ])("%i XP → niveau %i", (xp, level) => {
    expect(getLevelInfo(xp).level).toBe(level);
  });

  it("calcule la progression vers le niveau suivant", () => {
    const info = getLevelInfo(175);
    expect(info.currentThreshold).toBe(100);
    expect(info.nextThreshold).toBe(250);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it("borne les valeurs invalides", () => {
    expect(getLevelInfo(-50).level).toBe(1);
    expect(getLevelInfo(Number.NaN).level).toBe(1);
    expect(getLevelInfo(7500).nextThreshold).toBeNull();
    expect(getLevelInfo(7500).progress).toBe(1);
  });

  it("applique le barème officiel", () => {
    expect(XP_REWARDS).toEqual({
      profileCompleted: 30,
      reviewApproved: 20,
      discoveryApproved: 50,
      stuntWeeklyParticipation: 10,
      stuntFirstPlace: 150,
      stuntSecondPlace: 75,
      stuntThirdPlace: 40,
      weeklyChallengeValidated: 100,
    });
  });
});

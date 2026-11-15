import { describe, expect, it } from "vitest";
import { phaseAt, rankEntries, scheduleForWeek } from "@/lib/stunts/calendar";

describe("calendrier STUNT ARENA", () => {
  const s = scheduleForWeek("2026-11-16");
  it("ouvre lundi 00:00 et ferme les participations samedi 00:00, les votes lundi suivant 00:00 (Paris)", () => {
    expect(s.submissionsOpenAt.toISOString()).toBe("2026-11-15T23:00:00.000Z");
    expect(s.submissionsCloseAt.toISOString()).toBe("2026-11-20T23:00:00.000Z");
    expect(s.votingCloseAt.toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });
  it.each([
    ["2026-11-15T22:59:59Z", "a-venir"],
    ["2026-11-16T10:00:00Z", "participations"],
    ["2026-11-20T22:59:59Z", "participations"],
    ["2026-11-20T23:00:00Z", "votes"],
    ["2026-11-22T22:59:59Z", "votes"],
    ["2026-11-22T23:00:00Z", "verification"],
  ])("%s → %s", (at, phase) => {
    expect(phaseAt(s, new Date(at))).toBe(phase);
  });
  it("affiche les résultats une fois confirmés", () => {
    expect(phaseAt(s, new Date("2026-11-30T00:00:00Z"), true)).toBe("resultats");
  });
});

describe("classement", () => {
  it("partage la place en cas d'égalité (1, 1, 3)", () => {
    const r = rankEntries([{ id: "a", votes: 3 }, { id: "b", votes: 5 }, { id: "c", votes: 5 }, { id: "d", votes: 1 }]);
    expect(r.map((x) => [x.id, x.rank])).toEqual([["b", 1], ["c", 1], ["a", 3], ["d", 4]]);
  });
  it("gère trois égalités et une liste vide", () => {
    expect(rankEntries([{ votes: 2 }, { votes: 2 }, { votes: 2 }]).map((x) => x.rank)).toEqual([1, 1, 1]);
    expect(rankEntries([])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { demoProgressItems } from "@/content/carnet";
import { demoPlaces } from "@/content/map";
import { buildEntries, computeProgress } from "@/lib/carnet/progress";
import { emptyUserData } from "@/lib/user-data/schema";

describe("progression du carnet", () => {
  it("répartit les entrées dans les bonnes catégories", () => {
    const entries = buildEntries(demoProgressItems, demoPlaces, emptyUserData());
    const count = (c: string) => entries.filter((e) => e.category === c).length;
    expect(count("mission")).toBe(6);
    expect(count("collectible")).toBe(5);
    expect(count("lieu")).toBe(demoPlaces.length - 5);
    expect(count("objectif")).toBe(0);
  });

  it("calcule les pourcentages par catégorie et au total", () => {
    const data = emptyUserData();
    data.progress["mission-introduction"] = "2026-11-15T00:00:00Z";
    data.progress["mission-histoire"] = "2026-11-15T00:00:00Z";
    data.places["coquillage-neon-1"] = { visitedAt: "2026-11-15T00:00:00Z" };
    data.objectives.push({ id: "o1", title: "Objectif", done: true, createdAt: "2026-11-15T00:00:00Z" });
    const { byCategory, overall } = computeProgress(buildEntries(demoProgressItems, demoPlaces, data));
    expect(byCategory.mission).toEqual({ done: 2, total: 6, percent: 33 });
    expect(byCategory.collectible).toEqual({ done: 1, total: 5, percent: 20 });
    expect(byCategory.objectif).toEqual({ done: 1, total: 1, percent: 100 });
    expect(overall.done).toBe(4);
    expect(overall.total).toBe(demoProgressItems.length + demoPlaces.length + 1);
  });

  it("affiche 0 % pour une catégorie vide", () => {
    const { byCategory } = computeProgress(buildEntries([], [], emptyUserData()));
    expect(byCategory.objectif).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("un lieu visité sur la carte coche le carnet", () => {
    const data = emptyUserData();
    data.places["rampe-des-docks"] = { visitedAt: "2026-11-15T00:00:00Z" };
    const entry = buildEntries(demoProgressItems, demoPlaces, data).find((e) => e.key === "place:rampe-des-docks");
    expect(entry).toMatchObject({ category: "lieu", done: true });
  });
});

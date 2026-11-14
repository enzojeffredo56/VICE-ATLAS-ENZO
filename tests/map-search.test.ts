import { describe, expect, it } from "vitest";
import { demoPlaces } from "@/content/map";
import type { PlaceCategoryId } from "@/lib/content/schemas";
import { countByCategory, filterPlaces, formatCoord } from "@/lib/map/search";

const all = new Set<PlaceCategoryId>(["point-interet", "stunt", "collectible", "activite", "panorama"]);
const base = { query: "", categories: all, onlyFavorites: false, hideVisited: false };

describe("filterPlaces", () => {
  it("renvoie tout sans filtre", () => {
    expect(filterPlaces(demoPlaces, base, {})).toHaveLength(demoPlaces.length);
  });

  it("ignore les accents et la casse", () => {
    const r = filterPlaces(demoPlaces, { ...base, query: "NEON phare" }, {});
    expect(r.map((p) => p.slug)).toEqual(["phare-du-port-neon"]);
  });

  it("cherche aussi dans le quartier et les étiquettes", () => {
    expect(filterPlaces(demoPlaces, { ...base, query: "docks" }, {}).length).toBeGreaterThanOrEqual(3);
    expect(filterPlaces(demoPlaces, { ...base, query: "coucher de soleil" }, {}).map((p) => p.slug)).toContain("belvedere-de-la-palmeraie");
  });

  it("filtre par catégorie", () => {
    const r = filterPlaces(demoPlaces, { ...base, categories: new Set<PlaceCategoryId>(["stunt"]) }, {});
    expect(r.every((p) => p.category === "stunt")).toBe(true);
    expect(r).toHaveLength(4);
  });

  it("gère favoris et lieux visités", () => {
    const marks = { "rampe-des-docks": { favorite: true }, "club-nautique": { visitedAt: "2026-11-15T10:00:00Z" } };
    expect(filterPlaces(demoPlaces, { ...base, onlyFavorites: true }, marks).map((p) => p.slug)).toEqual(["rampe-des-docks"]);
    const unvisited = filterPlaces(demoPlaces, { ...base, hideVisited: true }, marks);
    expect(unvisited.some((p) => p.slug === "club-nautique")).toBe(false);
    expect(unvisited).toHaveLength(demoPlaces.length - 1);
  });

  it("compte les lieux par catégorie", () => {
    const c = countByCategory(demoPlaces);
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(demoPlaces.length);
    expect(c.collectible).toBe(5);
  });

  it("arrondit les coordonnées", () => {
    expect(formatCoord(412.6)).toBe("413");
  });
});

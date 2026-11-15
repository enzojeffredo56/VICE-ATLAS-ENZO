import { describe, expect, it } from "vitest";
import plan from "@/content/maps/miami-plan.land.json";
import { demoCorrespondences, miamiSpots, verificationLabels } from "@/content/comparateur";
import { demoPlaces } from "@/content/map";
import { buildPairs, findPair } from "@/lib/comparateur/pairs";
import { correspondenceSchema, MAP_HEIGHT, miamiSpotSchema } from "@/lib/content/schemas";

type Pt = [number, number];
const inside = ([x, y]: Pt, poly: Pt[]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

describe("comparateur Miami", () => {
  it("chaque lieu réel respecte le schéma et se trouve sur la terre ferme du plan", () => {
    const polys = Object.values(plan.land) as Pt[][];
    for (const s of miamiSpots) {
      expect(() => miamiSpotSchema.parse(s)).not.toThrow();
      expect(polys.some((poly) => inside([s.x, MAP_HEIGHT - s.y], poly)), `${s.slug} est dans l'eau`).toBe(true);
    }
  });

  it("chaque correspondance est valide, sourcée en https et relie deux lieux existants", () => {
    const places = new Set(demoPlaces.map((p) => p.slug));
    const spots = new Set(miamiSpots.map((s) => s.slug));
    for (const c of demoCorrespondences) {
      expect(() => correspondenceSchema.parse(c)).not.toThrow();
      expect(places.has(c.placeSlug), c.placeSlug).toBe(true);
      expect(spots.has(c.miamiSlug), c.miamiSlug).toBe(true);
      expect(c.status).toBe("demo");
      c.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
    }
  });

  it("propose les quatre statuts de vérification", () => {
    expect(Object.keys(verificationLabels)).toEqual(["demo", "a-verifier", "probable", "verifie"]);
  });

  it("assemble les paires et ignore les liens cassés", () => {
    const broken = { ...demoCorrespondences[0], placeSlug: "lieu-inexistant" };
    const pairs = buildPairs([...demoCorrespondences, broken], demoPlaces, miamiSpots);
    expect(pairs).toHaveLength(demoCorrespondences.length);
    expect(new Set(pairs.map((p) => p.id)).size).toBe(pairs.length);
  });

  it("retrouve une paire depuis un lieu du jeu ou un lieu réel", () => {
    const pairs = buildPairs(demoCorrespondences, demoPlaces, miamiSpots);
    expect(findPair(pairs, { placeSlug: "phare-du-port-neon" })?.spot.slug).toBe("cape-florida-light");
    expect(findPair(pairs, { miamiSlug: "wynwood" })?.place.slug).toBe("galerie-murale-de-corail");
    expect(findPair(pairs, { placeSlug: "coquillage-neon-1" })).toBeNull();
  });
});

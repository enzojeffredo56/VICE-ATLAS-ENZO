import { describe, expect, it } from "vitest";
import land from "@/content/maps/demo-island.land.json";
import { demoPlaces, placeCategories } from "@/content/map";
import { demoGuides } from "@/content/guides";
import { demoProgressItems } from "@/content/carnet";
import { guideSchema, MAP_HEIGHT, placeSchema, progressItemSchema } from "@/lib/content/schemas";

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
const polys = Object.values(land.land) as Pt[][];
const lagoon = land.water.lagune as Pt[];
const placeSlugs = new Set(demoPlaces.map((p) => p.slug));
const guideSlugs = new Set(demoGuides.map((g) => g.slug));

describe("contenu de démonstration", () => {
  it("chaque lieu respecte le schéma et est marqué comme démo", () => {
    for (const p of demoPlaces) {
      expect(() => placeSchema.parse(p)).not.toThrow();
      expect(p.isDemo).toBe(true);
    }
  });

  it("les identifiants sont uniques", () => {
    expect(placeSlugs.size).toBe(demoPlaces.length);
    expect(guideSlugs.size).toBe(demoGuides.length);
    expect(new Set(demoProgressItems.map((i) => i.id)).size).toBe(demoProgressItems.length);
  });

  it("chaque lieu est sur la terre ferme (pas dans l'eau ni la lagune)", () => {
    for (const p of demoPlaces) {
      const svgPoint: Pt = [p.x, MAP_HEIGHT - p.y];
      expect(polys.some((poly) => inside(svgPoint, poly)), `${p.slug} est dans l'eau`).toBe(true);
      expect(inside(svgPoint, lagoon), `${p.slug} est dans la lagune`).toBe(false);
    }
  });

  it("chaque catégorie de lieu utilisée existe", () => {
    const ids = new Set(placeCategories.map((c) => c.id));
    demoPlaces.forEach((p) => expect(ids.has(p.category)).toBe(true));
  });

  it("les guides respectent le schéma et leurs liens pointent vers des lieux existants", () => {
    for (const g of demoGuides) {
      expect(() => guideSchema.parse(g)).not.toThrow();
      g.placeSlugs.forEach((s) => expect(placeSlugs.has(s), `${g.slug} → ${s}`).toBe(true));
      g.steps.forEach((st) => st.placeSlug && expect(placeSlugs.has(st.placeSlug), `${g.slug} étape → ${st.placeSlug}`).toBe(true));
    }
  });

  it("les liens lieu → guide pointent vers des guides existants", () => {
    demoPlaces.forEach((p) => p.guideSlugs.forEach((s) => expect(guideSlugs.has(s), `${p.slug} → ${s}`).toBe(true)));
  });

  it("le catalogue du carnet est valide", () => {
    for (const it of demoProgressItems) {
      expect(() => progressItemSchema.parse(it)).not.toThrow();
      if (it.placeSlug) expect(placeSlugs.has(it.placeSlug)).toBe(true);
    }
  });
});

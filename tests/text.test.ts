import { describe, expect, it } from "vitest";
import { formatDateFr, normalizeText, slugify } from "@/lib/text";

describe("utilitaires texte", () => {
  it("normalise les accents", () => {
    expect(normalizeText("  Île Néon  ")).toBe("ile neon");
  });
  it.each([
    ["Tour de la Pointe Turquoise", "tour-de-la-pointe-turquoise"],
    ["L'aérodrome : la piste !", "l-aerodrome-la-piste"],
    ["  --Déjà vu--  ", "deja-vu"],
  ])("slugify(%s)", (input, out) => {
    expect(slugify(input)).toBe(out);
  });
  it("limite la longueur des slugs sans tiret final", () => {
    const s = slugify("mot ".repeat(40));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
  it("formate les dates en français", () => {
    expect(formatDateFr("2026-11-15")).toBe("15 novembre 2026");
  });
});

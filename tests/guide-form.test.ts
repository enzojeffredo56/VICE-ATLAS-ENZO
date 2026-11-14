import { describe, expect, it } from "vitest";
import { describeDbError, parseGuideForm, toSaveGuidePayload } from "@/lib/admin/guide-form";
import { searchGuides } from "@/components/guide/guide-browser";
import { demoGuides } from "@/content/guides";

function form(overrides: Record<string, string | string[]> = {}) {
  const values: Record<string, string | string[]> = {
    title: "Mon guide de test",
    slug: "mon-guide-de-test",
    category: "exploration",
    summary: "Un résumé de plus de vingt caractères.",
    intro: "Une introduction de plus de vingt caractères.",
    status: "draft",
    steps: JSON.stringify([{ title: "Première étape", body: "Un contenu suffisamment long." }]),
    sources: JSON.stringify([{ label: "Carte VICE ATLAS", url: "/carte" }]),
    placeSlugs: ["rampe-des-docks"],
    ...overrides,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) (Array.isArray(v) ? v : [v]).forEach((x) => fd.append(k, x));
  return fd;
}

describe("formulaire d'administration des guides", () => {
  it("accepte un guide valide et prépare la charge utile SQL", () => {
    const r = parseGuideForm(form());
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(toSaveGuidePayload(r.data)).toMatchObject({
      id: null,
      slug: "mon-guide-de-test",
      category_id: "exploration",
      place_slugs: ["rampe-des-docks"],
      status: "draft",
    });
  });

  it("indique l'erreur sur le bon champ d'étape", () => {
    const r = parseGuideForm(form({ steps: JSON.stringify([{ title: "OK titre", body: "court" }]) }));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.fieldErrors["steps.0.body"]).toMatch(/10 caractères/);
  });

  it("refuse un JSON d'étapes invalide, un slug mal formé et une catégorie inconnue", () => {
    const r = parseGuideForm(form({ steps: "{oups", slug: "Pas Un Slug", category: "inconnue" }));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(["steps", "slug", "category"]));
  });

  it("n'accepte que des sources https ou internes", () => {
    for (const url of ["javascript:alert(1)", "http://exemple.com", "ftp://x"]) {
      const r = parseGuideForm(form({ sources: JSON.stringify([{ label: "Source", url }]) }));
      expect(r.success, url).toBe(false);
    }
    expect(parseGuideForm(form({ sources: JSON.stringify([{ label: "Source", url: "https://exemple.com/page" }]) })).success).toBe(true);
  });

  it("exige au moins une étape et un identifiant valide", () => {
    expect(parseGuideForm(form({ steps: "[]" })).success).toBe(false);
    expect(parseGuideForm(form({ id: "pas-un-uuid" } as never)).success).toBe(false);
  });

  it("traduit les erreurs de base de données", () => {
    expect(describeDbError("23505")).toMatch(/déjà utilisé/);
    expect(describeDbError("42501")).toMatch(/Accès refusé/);
    expect(describeDbError(undefined)).toMatch(/Réessaie/);
  });
});

describe("recherche de guides", () => {
  it("filtre par texte, catégorie et favoris", () => {
    expect(searchGuides(demoGuides, "cascade", null, null).map((g) => g.slug)).toContain("filmer-une-cascade-pour-stunt-arena");
    expect(searchGuides(demoGuides, "", "entre-amis", null)).toHaveLength(1);
    expect(searchGuides(demoGuides, "", null, ["tour-de-la-pointe-turquoise"])).toHaveLength(1);
    expect(searchGuides(demoGuides, "zzz introuvable", null, null)).toHaveLength(0);
  });
});

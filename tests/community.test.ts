import { describe, expect, it } from "vitest";
import { placeAdminSchema } from "@/lib/admin/place-schema";
import { contributionSchema } from "@/lib/community/schema";

describe("contributions", () => {
  const proposal = { kind: "place_proposal", title: "Plage cachée du nord", description: "Une petite plage derrière les rochers, superbe au coucher du soleil.", category: "panorama", x: "820", y: "1300" };
  it("accepte une proposition de lieu complète et convertit les coordonnées", () => {
    const r = contributionSchema.safeParse(proposal);
    expect(r.success).toBe(true);
    if (r.success && r.data.kind === "place_proposal") expect(r.data.x).toBe(820);
  });
  it("refuse des coordonnées hors de la carte", () => {
    expect(contributionSchema.safeParse({ ...proposal, x: "2500" }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...proposal, y: "-1" }).success).toBe(false);
    expect(contributionSchema.safeParse({ ...proposal, x: "abc" }).success).toBe(false);
  });
  it("exige un lieu existant (format) pour un signalement", () => {
    const report = { kind: "error_report", title: "Mauvaise position", description: "Le phare est trop à l'ouest sur la carte.", placeSlug: "phare-du-port-neon" };
    expect(contributionSchema.safeParse(report).success).toBe(true);
    expect(contributionSchema.safeParse({ ...report, placeSlug: "Pas Un Slug" }).success).toBe(false);
  });
  it("bloque le champ piège anti-robot", () => {
    expect(contributionSchema.safeParse({ ...proposal, website: "spam" }).success).toBe(false);
  });
});

describe("administration des lieux", () => {
  const place = { id: "", slug: "plage-cachee", name: "Plage cachée", category_id: "panorama", x: "820", y: "1300", district: "Palmeraie", description: "Une petite plage cachée.", tags: "plage, photo", status: "draft" };
  it("accepte un nouveau lieu (sans identifiant)", () => {
    const r = placeAdminSchema.safeParse(place);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.id).toBeUndefined();
  });
  it("refuse un statut ou une catégorie inconnus", () => {
    expect(placeAdminSchema.safeParse({ ...place, status: "supprime" }).success).toBe(false);
    expect(placeAdminSchema.safeParse({ ...place, category_id: "casino" }).success).toBe(false);
  });
});

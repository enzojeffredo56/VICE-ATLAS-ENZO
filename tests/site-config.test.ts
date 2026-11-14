import { describe, expect, it } from "vitest";
import { mainNav, mobileTabs, modules, secondaryNav, siteConfig } from "@/lib/site-config";

describe("configuration du site", () => {
  it("affiche le slogan officiel", () => {
    expect(siteConfig.slogan).toBe("Explore. Découvre. Relève les défis.");
  });

  it("mentionne le caractère non officiel", () => {
    expect(siteConfig.disclaimer).toMatch(/non officiel/);
    expect(siteConfig.disclaimer).toMatch(/Rockstar/);
  });

  it("contient exactement les modules retenus (aucun mini-jeu supplémentaire)", () => {
    expect(modules.map((m) => m.id)).toEqual(["carte", "carnet", "guide", "comparateur", "stunts", "roulette"]);
  });

  it("n'a pas de liens en double et tous commencent par /", () => {
    const hrefs = [...mainNav, ...secondaryNav].map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    hrefs.forEach((h) => expect(h.startsWith("/")).toBe(true));
  });

  it("propose 5 onglets mobiles maximum", () => {
    expect(mobileTabs.length).toBeLessThanOrEqual(5);
  });
});

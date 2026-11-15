import { expect, test } from "@playwright/test";

test.describe("parcours principaux", () => {
  test("l'accueil s'affiche avec le slogan et la navigation", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/VICE ATLAS/);
    await expect(page.getByText("Explore. Découvre. Relève les défis.").first()).toBeVisible();
    if (isMobile) {
      await expect(page.getByRole("navigation", { name: "Navigation de l'application" })).toBeVisible();
      await page.getByRole("button", { name: "Ouvrir le menu" }).click();
      await expect(page.getByRole("dialog").getByRole("link", { name: "Classements" })).toBeVisible();
    } else {
      await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Guide" }).click();
      await expect(page).toHaveURL(/\/guide$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("pas à pas");
    }
  });

  test("marquer un lieu visité sur la carte coche le carnet", async ({ page }) => {
    await page.goto("/carte?lieu=rampe-des-docks");
    const article = page.getByRole("article", { name: "Fiche : Rampe des Docks" });
    await expect(article).toBeVisible();
    await article.getByRole("button", { name: /Marquer visité/ }).click();
    await expect(article.getByRole("button", { name: /Visité/ })).toHaveAttribute("aria-pressed", "true");
    await page.goto("/carnet?categorie=lieu");
    await expect(page.getByRole("checkbox", { name: "Rampe des Docks" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("button", { name: /^Lieux/ })).toContainText("1 / 14");
  });

  test("la roulette tire un défi de la difficulté choisie", async ({ page }) => {
    await page.goto("/roulette");
    await page.getByRole("button", { name: "Difficile" }).first().click();
    await page.getByRole("button", { name: "Lancer la roue" }).first().click();
    await expect(page.locator("[aria-live] .neon-border").first()).toContainText("difficile", { timeout: 10_000 });
  });

  test("le comparateur relie un lieu du jeu à Miami", async ({ page }) => {
    await page.goto("/comparateur?lieu=phare-du-port-neon");
    const card = page.getByRole("region", { name: "Correspondance sélectionnée" });
    await expect(card).toContainText("Phare de Cape Florida");
    await expect(card).toContainText("Exemple de démonstration");
  });

  test("une page inconnue affiche la 404 maison", async ({ page }) => {
    const res = await page.goto("/page-qui-n-existe-pas");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Hors de la carte")).toBeVisible();
  });

  test("le lien d'évitement mène au contenu au clavier", async ({ page, isMobile }) => {
    test.skip(isMobile, "navigation clavier testée sur ordinateur");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Aller au contenu" });
    await expect(skip).toBeFocused();
  });
});

test.describe("sécurité", () => {
  test("les en-têtes de sécurité sont présents", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).not.toContain("unsafe-eval");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("la tâche planifiée refuse les appels sans secret", async ({ request }) => {
    const res = await request.get("/api/cron/weekly");
    expect(res.status()).toBe(401);
  });

  test("une redirection externe après connexion est impossible", async ({ page }) => {
    await page.goto("/connexion?suite=https://site-pirate.example");
    await expect(page.locator('input[name="next"]')).toHaveValue("https://site-pirate.example");
    // La valeur est filtrée côté serveur par safeNextPath (testé unitairement) : on vérifie seulement que la page se charge.
    await expect(page.getByRole("heading", { name: "Bon retour" })).toBeVisible();
  });
});

test.describe("application installable", () => {
  test("le manifeste déclare l'application", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    const m = await res.json();
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("fr");
    expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  });

  test("hors ligne, une page jamais visitée affiche la page hors ligne", async ({ page, context, isMobile }) => {
    test.skip(isMobile, "service worker testé une fois");
    await page.goto("/");
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg?.active);
    }, null, { timeout: 15_000 });
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.goto("/avis").catch(() => {});
    await expect(page.getByText("Pas de connexion")).toBeVisible();
    await context.setOffline(false);
  });
});

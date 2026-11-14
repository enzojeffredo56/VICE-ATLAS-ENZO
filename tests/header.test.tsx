import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader, isActivePath } from "@/components/layout/site-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { navigation } from "./setup";

describe("isActivePath", () => {
  it("gère l'accueil et les sous-pages", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/carte", "/")).toBe(false);
    expect(isActivePath("/guide/plages", "/guide")).toBe(true);
    expect(isActivePath("/guides", "/guide")).toBe(false);
  });
});

describe("SiteHeader", () => {
  it("affiche la navigation principale et le logo", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(nav).getByRole("link", { name: "Carte" })).toHaveAttribute("href", "/carte");
    expect(screen.getByRole("link", { name: /retour à l'accueil/i })).toHaveAttribute("href", "/");
  });

  it("signale la page courante avec aria-current", () => {
    navigation.pathname = "/stunts";
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(nav).getByRole("link", { name: "Stunts" })).toHaveAttribute("aria-current", "page");
    navigation.pathname = "/";
  });

  it("ouvre et ferme le menu mobile au clavier", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Ouvrir le menu" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: /VICE ATLAS PLUS/ })).toHaveAttribute("href", "/plus");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("MobileTabBar", () => {
  it("affiche les onglets de l'application", () => {
    render(<MobileTabBar />);
    const nav = screen.getByRole("navigation", { name: "Navigation de l'application" });
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
    expect(within(nav).getByRole("link", { name: "Accueil" })).toHaveAttribute("aria-current", "page");
  });
});

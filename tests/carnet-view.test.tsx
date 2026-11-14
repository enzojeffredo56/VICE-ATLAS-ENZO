import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CarnetView from "@/components/carnet/carnet-view";
import { GuideSteps } from "@/components/guide/guide-steps";
import { demoProgressItems } from "@/content/carnet";
import { demoPlaces } from "@/content/map";
import { userData } from "@/lib/user-data/use-user-data";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/carnet");
  userData.reload();
});

describe("CarnetView", () => {
  it("coche un élément et met à jour le pourcentage de sa catégorie", async () => {
    const user = userEvent.setup();
    render(<CarnetView items={demoProgressItems} places={demoPlaces} />);
    const missions = screen.getByRole("button", { name: /^Missions/ });
    expect(missions).toHaveTextContent("0 / 6");
    await user.click(screen.getByRole("checkbox", { name: "Terminer la mission d'introduction" }));
    expect(screen.getByRole("checkbox", { name: "Terminer la mission d'introduction" })).toHaveAttribute("aria-checked", "true");
    expect(missions).toHaveTextContent("1 / 6");
    expect(missions).toHaveTextContent("17%");
  });

  it("ouvre l'onglet demandé dans l'adresse (?categorie=)", () => {
    window.history.replaceState(null, "", "/carnet?categorie=collectible");
    render(<CarnetView items={demoProgressItems} places={demoPlaces} />);
    expect(screen.getByRole("tab", { name: "Collectibles" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
  });

  it("filtre les éléments terminés", async () => {
    const user = userEvent.setup();
    userData.setProgress("mission-histoire", true);
    render(<CarnetView items={demoProgressItems} places={demoPlaces} />);
    await user.click(screen.getByRole("radio", { name: "Terminés" }));
    // Les éléments masqués sortent avec une courte animation
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(1));
    expect(screen.getByRole("checkbox")).toHaveAccessibleName("Terminer l'histoire principale");
  });

  it("ajoute, valide et supprime un objectif personnel avec confirmation", async () => {
    const user = userEvent.setup();
    render(<CarnetView items={demoProgressItems} places={demoPlaces} />);
    await user.click(screen.getByRole("tab", { name: "Objectifs personnels" }));
    expect(screen.getByText("Aucun objectif personnel")).toBeInTheDocument();

    const input = screen.getByLabelText("Nouvel objectif personnel");
    await user.type(input, "ab");
    await user.click(screen.getByRole("button", { name: /Ajouter/ }));
    expect(screen.getByText(/au moins 3 caractères/)).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Visiter tous les panoramas");
    await user.click(screen.getByRole("button", { name: /Ajouter/ }));
    expect(screen.getByRole("checkbox", { name: "Visiter tous les panoramas" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Supprimer « Visiter tous les panoramas »" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Supprimer" }));
    expect(screen.queryByRole("checkbox", { name: "Visiter tous les panoramas" })).not.toBeInTheDocument();
  });

  it("propose un lien vers la carte pour les lieux", async () => {
    window.history.replaceState(null, "", "/carnet?categorie=lieu");
    render(<CarnetView items={demoProgressItems} places={demoPlaces} />);
    expect(screen.getByRole("link", { name: "Voir « Rampe des Docks » sur la carte" })).toHaveAttribute("href", "/carte?lieu=rampe-des-docks");
  });
});

describe("GuideSteps", () => {
  it("coche les étapes et affiche l'avancement", async () => {
    const user = userEvent.setup();
    const steps = [
      { title: "Étape A", body: "Contenu de l'étape A." },
      { title: "Étape B", body: "Contenu de l'étape B.", placeSlug: "rampe-des-docks" },
    ];
    render(<GuideSteps slug="test" steps={steps} placeNames={{ "rampe-des-docks": "Rampe des Docks" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("0 / 2");
    await user.click(screen.getByRole("checkbox", { name: "Étape 1 : Étape A" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 / 2");
    expect(screen.getByRole("link", { name: /Rampe des Docks sur la carte/ })).toHaveAttribute("href", "/carte?lieu=rampe-des-docks");
  });
});

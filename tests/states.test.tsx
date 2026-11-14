import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Spinner } from "@/components/states/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LogoMark } from "@/components/brand/logo-mark";

describe("composants d'état", () => {
  it("EmptyState affiche titre, description et action", () => {
    render(<EmptyState icon={Inbox} title="Rien ici" description="Ajoute un lieu" action={<button>Ajouter</button>} />);
    expect(screen.getByRole("heading", { name: "Rien ici" })).toBeInTheDocument();
    expect(screen.getByText("Ajoute un lieu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
  });

  it("Spinner est annoncé aux lecteurs d'écran", () => {
    render(<Spinner label="Chargement…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Chargement…");
  });

  it("LogoMark a un nom accessible quand un titre est fourni", () => {
    render(<LogoMark title="Emblème VICE ATLAS" />);
    expect(screen.getByRole("img", { name: "Emblème VICE ATLAS" })).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("n'exécute l'action qu'après confirmation", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog trigger={<button>Supprimer</button>} title="Sûr ?" description="Action définitive" onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await user.click(await screen.findByRole("button", { name: "Annuler" }));
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await user.click(await screen.findByRole("button", { name: "Confirmer" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

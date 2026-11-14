import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { EditorContext } from "@/lib/auth/editor";

/** Écran affiché quand la personne n'a pas accès à l'administration. */
export function AdminAccessDenied({ ctx }: { ctx: Exclude<EditorContext, { status: "ok" | "unconfigured" }> }) {
  if (ctx.status === "anonymous") {
    return (
      <EmptyState
        icon={LogIn}
        title="Connecte-toi pour accéder à l'administration"
        description="Cet espace est réservé aux modérateurs et administrateurs."
        action={
          <Button asChild>
            <Link href="/connexion">Se connecter</Link>
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={Lock}
      title="Accès réservé"
      description="Ton compte n'a pas le rôle de modérateur ou d'administrateur. Demande à un administrateur si tu penses que c'est une erreur."
    />
  );
}

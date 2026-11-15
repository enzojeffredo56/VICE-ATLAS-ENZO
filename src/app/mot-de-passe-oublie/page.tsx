import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { ResetRequestForm } from "@/components/forms/password-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function MotDePasseOubliePage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Indique ton e-mail, nous t'envoyons un lien pour en choisir un nouveau."
      footer={
        <Link href="/connexion" className="text-cyan underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthCard>
  );
}

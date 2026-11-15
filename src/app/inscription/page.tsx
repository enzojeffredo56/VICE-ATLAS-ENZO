import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { SignUpForm } from "@/components/forms/sign-up-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return (
    <AuthCard
      title="Rejoins VICE ATLAS"
      subtitle="Ta progression, tes badges et tes défis, sur tous tes appareils."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-cyan underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}

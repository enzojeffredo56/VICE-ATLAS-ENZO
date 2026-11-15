import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { SignInForm } from "@/components/forms/sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <AuthCard
      title="Bon retour"
      subtitle="Connecte-toi pour retrouver ta progression."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-cyan underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthCard>
  );
}

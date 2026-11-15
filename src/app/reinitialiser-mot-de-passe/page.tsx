import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { NewPasswordForm } from "@/components/forms/password-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default function ReinitialiserPage() {
  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisis un mot de passe que tu n'utilises nulle part ailleurs.">
      <NewPasswordForm />
    </AuthCard>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, updatePasswordAction } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schemas";
import { FormMessage, SubmitButton, TextField } from "./fields";

export function ResetRequestForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordResetAction, { ok: false });
  if (state.ok) return <FormMessage ok message={state.message} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <TextField name="email" type="email" label="E-mail de ton compte" autoComplete="email" required error={state.fieldErrors?.email} />
      <FormMessage ok={false} message={state.message} />
      <SubmitButton>Recevoir un lien</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePasswordAction, { ok: false });
  if (state.ok)
    return (
      <div className="space-y-4">
        <FormMessage ok message={state.message} />
        <Link href="/profil" className="block text-center text-cyan underline-offset-4 hover:underline">
          Aller à mon profil
        </Link>
      </div>
    );
  return (
    <form action={action} className="space-y-4" noValidate>
      <TextField name="password" type="password" label="Nouveau mot de passe" autoComplete="new-password" required error={state.fieldErrors?.password} hint="8 caractères minimum, avec au moins une lettre et un chiffre" />
      <TextField name="confirm" type="password" label="Confirme le mot de passe" autoComplete="new-password" required error={state.fieldErrors?.confirm} />
      <FormMessage ok={false} message={state.message} />
      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}

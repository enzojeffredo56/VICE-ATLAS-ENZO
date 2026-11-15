"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Gift } from "lucide-react";
import { signUpAction } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schemas";
import { FormMessage, HoneypotField, SubmitButton, TextField } from "./fields";

function initialReferral() {
  if (typeof window === "undefined") return "";
  return (new URLSearchParams(window.location.search).get("parrain") ?? "").toUpperCase().slice(0, 8);
}

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, { ok: false });
  const [referral] = useState(initialReferral);
  const e = state.fieldErrors ?? {};
  if (state.ok) return <FormMessage ok message={state.message} />;
  return (
    <form action={action} className="relative space-y-4" noValidate>
      <HoneypotField />
      <TextField name="username" label="Pseudo" autoComplete="username" required maxLength={20} error={e.username} hint="3 à 20 caractères : lettres, chiffres ou _" />
      <TextField name="email" type="email" label="E-mail" autoComplete="email" required error={e.email} />
      <TextField name="password" type="password" label="Mot de passe" autoComplete="new-password" required error={e.password} hint="8 caractères minimum, avec au moins une lettre et un chiffre" />
      <TextField name="confirm" type="password" label="Confirme le mot de passe" autoComplete="new-password" required error={e.confirm} />
      <div className="relative">
        <TextField name="referralCode" label="Code de parrainage (facultatif)" defaultValue={referral} maxLength={8} autoCapitalize="characters" error={e.referralCode} />
        <Gift className="pointer-events-none absolute top-[2.65rem] right-4 size-4 text-pink" aria-hidden />
      </div>
      <label className="flex items-start gap-3 text-sm text-ink/85">
        <input type="checkbox" name="terms" className="mt-1 size-4 accent-[#FF3D91]" required />
        <span>
          J&apos;accepte les <Link href="/a-propos" className="text-cyan underline-offset-4 hover:underline">conditions d&apos;utilisation</Link> et je
          comprends que VICE ATLAS est un projet de fans non officiel.
        </span>
      </label>
      {e.terms && (
        <p role="alert" className="text-xs text-pink">
          {e.terms}
        </p>
      )}
      <FormMessage ok={false} message={state.message} />
      <SubmitButton>Créer mon compte</SubmitButton>
    </form>
  );
}

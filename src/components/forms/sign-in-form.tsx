"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schemas";
import { FormMessage, SubmitButton, TextField } from "./fields";

function readParams() {
  if (typeof window === "undefined") return { next: "", linkError: false };
  const p = new URLSearchParams(window.location.search);
  return { next: p.get("suite") ?? "", linkError: p.get("erreur") === "lien" };
}

export function SignInForm() {
  const [state, action] = useActionState<FormState, FormData>(signInAction, { ok: false });
  const [{ next, linkError }] = useState(readParams);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {linkError && <FormMessage ok={false} message="Ce lien a expiré ou a déjà servi. Connecte-toi ou refais une demande." />}
      <input type="hidden" name="next" value={next} />
      <TextField name="email" type="email" label="E-mail" autoComplete="email" required error={e.email} />
      <TextField name="password" type="password" label="Mot de passe" autoComplete="current-password" required error={e.password} />
      <div className="text-right text-sm">
        <Link href="/mot-de-passe-oublie" className="text-cyan underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton>Se connecter</SubmitButton>
    </form>
  );
}

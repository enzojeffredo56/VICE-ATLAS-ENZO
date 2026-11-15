"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Flag, MapPinPlus } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { FormMessage, HoneypotField, SubmitButton, TextField, inputClass } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/schemas";
import { submitContributionAction } from "@/lib/community/actions";
import { cn } from "@/lib/utils";

type Props = { places: { slug: string; name: string }[]; categories: { id: string; label: string }[] };

export function ContributionForm({ places, categories }: Props) {
  const auth = useAuth();
  const [kind, setKind] = useState<"place_proposal" | "error_report">("place_proposal");
  const [state, action] = useActionState<FormState, FormData>(submitContributionAction, { ok: false });
  const e = state.fieldErrors ?? {};

  if (auth.status === "anonymous")
    return (
      <div className="space-y-3 text-center">
        <p>Connecte-toi pour proposer un lieu ou signaler une erreur.</p>
        <Button asChild>
          <Link href="/connexion?suite=/communaute">Se connecter</Link>
        </Button>
      </div>
    );
  if (state.ok) return <FormMessage ok message={state.message} />;

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <HoneypotField />
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type de contribution">
        {(
          [
            ["place_proposal", MapPinPlus, "Proposer un lieu", "+50 XP si retenu"],
            ["error_report", Flag, "Signaler une erreur", "Merci d'avance !"],
          ] as const
        ).map(([value, Icon, label, sub]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={kind === value}
            onClick={() => setKind(value)}
            className={cn("cursor-pointer rounded-2xl border p-4 text-left transition", kind === value ? "border-pink/60 bg-pink/10" : "border-white/12 hover:border-white/25")}
          >
            <Icon className="size-5 text-pink" aria-hidden />
            <span className="mt-2 block font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">{sub}</span>
          </button>
        ))}
      </div>

      <TextField name="title" label={kind === "place_proposal" ? "Nom du lieu" : "Résumé du problème"} maxLength={120} required error={e.title} />

      {kind === "place_proposal" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-sm font-medium">
              Catégorie
            </label>
            <select id="category" name="category" className={inputClass(e.category)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <TextField name="x" type="number" inputMode="numeric" label="Coordonnée X" min={0} max={2000} required error={e.x} />
          <TextField name="y" type="number" inputMode="numeric" label="Coordonnée Y" min={0} max={1500} required error={e.y} />
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Astuce : survole l&apos;endroit sur la{" "}
            <Link href="/carte" className="text-cyan underline-offset-4 hover:underline">
              carte
            </Link>{" "}
            pour lire ses coordonnées X et Y en bas à gauche.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="placeSlug" className="text-sm font-medium">
            Lieu concerné
          </label>
          <select id="placeSlug" name="placeSlug" className={inputClass(e.placeSlug)}>
            {places.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          {kind === "place_proposal" ? "Pourquoi ce lieu vaut le détour ?" : "Qu'est-ce qui ne va pas ?"}
        </label>
        <textarea id="description" name="description" rows={4} maxLength={1000} className={cn(inputClass(e.description), "h-auto py-3")} aria-invalid={Boolean(e.description)} />
        {e.description && (
          <p role="alert" className="text-xs text-pink">
            {e.description}
          </p>
        )}
      </div>
      <FormMessage ok={false} message={state.message} />
      <SubmitButton className="sm:w-auto">Envoyer</SubmitButton>
    </form>
  );
}

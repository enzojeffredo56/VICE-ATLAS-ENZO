"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { FormMessage, SubmitButton, TextField, inputClass } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/schemas";
import { submitEntryAction } from "@/lib/stunts/actions";

type Option = { competitionId: string | null; slug: string; name: string; open: boolean };

export function EntryForm({ options }: { options: Option[] }) {
  const auth = useAuth();
  const [state, action] = useActionState<FormState, FormData>(submitEntryAction, { ok: false });
  const [initial] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("spot") ?? ""));
  const open = options.filter((o) => o.open && o.competitionId);
  const e = state.fieldErrors ?? {};

  if (auth.status === "anonymous")
    return (
      <div className="space-y-4 text-center">
        <p>Connecte-toi pour publier ta cascade.</p>
        <Button asChild>
          <Link href="/connexion?suite=/stunts/participer">Se connecter</Link>
        </Button>
      </div>
    );
  if (state.ok)
    return (
      <div className="space-y-4">
        <FormMessage ok message={state.message} />
        <Button asChild variant="outline">
          <Link href="/stunts/mes-videos">Voir mes vidéos</Link>
        </Button>
      </div>
    );
  if (open.length === 0)
    return <p className="text-muted-foreground">Aucun concours n&apos;accepte de participations en ce moment. Les participations ouvrent le lundi à 00:00 (heure de Paris).</p>;

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="competitionId" className="text-sm font-medium">
          Spot
        </label>
        <select id="competitionId" name="competitionId" defaultValue={open.find((o) => o.slug === initial)?.competitionId ?? open[0].competitionId!} className={inputClass(e.competitionId)}>
          {open.map((o) => (
            <option key={o.slug} value={o.competitionId!}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <TextField name="title" label="Titre de ta cascade" maxLength={80} required error={e.title} placeholder="Saut du quai en moto" />
      <TextField name="url" type="url" label="Lien de la vidéo" required error={e.url} placeholder="https://youtu.be/…" hint="YouTube, clip Twitch ou Streamable. La vidéo doit être la tienne." />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="rules" className="mt-1 size-4 accent-[#FF3D91]" />
        <span>
          Je certifie être l&apos;auteur de cette vidéo, qu&apos;elle montre la cascade en entier sans montage trompeur, et j&apos;accepte qu&apos;elle soit
          vérifiée avant publication.
        </span>
      </label>
      {e.rules && (
        <p role="alert" className="text-xs text-pink">
          {e.rules}
        </p>
      )}
      <FormMessage ok={false} message={state.message} />
      <SubmitButton className="sm:w-auto">Publier ma cascade</SubmitButton>
    </form>
  );
}

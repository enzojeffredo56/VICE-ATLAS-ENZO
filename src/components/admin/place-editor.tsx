"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { FormMessage, SubmitButton, inputClass } from "@/components/forms/fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { savePlaceAction } from "@/lib/admin/actions";
import type { FormState } from "@/lib/auth/schemas";
import { slugify } from "@/lib/text";

export type AdminPlace = { id: string; slug: string; name: string; category_id: string; x: number; y: number; district: string; description: string; tags: string[]; status: "draft" | "published" | "archived" };

const EMPTY: AdminPlace = { id: "", slug: "", name: "", category_id: "point-interet", x: 1000, y: 750, district: "", description: "", tags: [], status: "draft" };
const STATUS = { draft: ["Brouillon", "default"], published: ["Publié", "turquoise"], archived: ["Archivé", "violet"] } as const;

export function PlaceAdmin({ places, categories }: { places: AdminPlace[]; categories: { id: string; label: string }[] }) {
  const [editing, setEditing] = useState<AdminPlace | null>(null);
  return (
    <div className="space-y-6">
      <Button onClick={() => setEditing(EMPTY)}>
        <Plus /> Nouveau lieu
      </Button>
      {editing && <PlaceForm key={editing.id || "new"} place={editing} categories={categories} onClose={() => setEditing(null)} />}
      <ul className="divide-y divide-white/8 overflow-hidden rounded-3xl border border-white/10">
        {places.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="font-medium">{p.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {p.district} · X {p.x} · Y {p.y}
              </span>
            </span>
            <Badge variant={STATUS[p.status][1]}>{STATUS[p.status][0]}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setEditing(p)} aria-label={`Modifier ${p.name}`}>
              <Pencil />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceForm({ place, categories, onClose }: { place: AdminPlace; categories: { id: string; label: string }[]; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(savePlaceAction, { ok: false });
  const [name, setName] = useState(place.name);
  const [slug, setSlug] = useState(place.slug);
  return (
    <form action={action} className="glass grid gap-4 rounded-3xl p-5 sm:grid-cols-2" noValidate>
      <input type="hidden" name="id" value={place.id} />
      <Field label="Nom">
        <input name="name" value={name} onChange={(e) => (setName(e.target.value), !place.id && setSlug(slugify(e.target.value)))} className={inputClass()} required />
      </Field>
      <Field label="Identifiant d'URL">
        <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass()} required />
      </Field>
      <Field label="Catégorie">
        <select name="category_id" defaultValue={place.category_id} className={inputClass()}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Statut">
        <select name="status" defaultValue={place.status} className={inputClass()}>
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
          <option value="archived">Archivé</option>
        </select>
      </Field>
      <Field label="X (0 à 2000)">
        <input name="x" type="number" defaultValue={place.x} className={inputClass()} />
      </Field>
      <Field label="Y (0 à 1500)">
        <input name="y" type="number" defaultValue={place.y} className={inputClass()} />
      </Field>
      <Field label="Quartier">
        <input name="district" defaultValue={place.district} className={inputClass()} />
      </Field>
      <Field label="Étiquettes (séparées par des virgules)">
        <input name="tags" defaultValue={place.tags.join(", ")} className={inputClass()} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description">
          <textarea name="description" defaultValue={place.description} rows={3} maxLength={600} className={`${inputClass()} h-auto py-3`} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <SubmitButton className="w-auto">Enregistrer</SubmitButton>
        <Button type="button" variant="ghost" onClick={onClose}>
          Fermer
        </Button>
        <FormMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

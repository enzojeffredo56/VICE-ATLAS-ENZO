"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Info, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { saveGuideAction, deleteGuideAction } from "@/app/admin/guides/actions";
import { parseGuideForm, type FieldErrors, type GuideFormState } from "@/lib/admin/guide-form";
import type { Guide, GuideCategoryId, GuideSource, GuideStep } from "@/lib/content/schemas";
import { slugify } from "@/lib/text";
import { cn } from "@/lib/utils";

type Props = {
  guide: (Guide & { id?: string }) | null;
  categories: { id: GuideCategoryId; label: string }[];
  places: { slug: string; name: string }[];
  /** Aperçu sans base de données : le formulaire fonctionne mais n'enregistre pas. */
  readOnly: boolean;
  canDelete: boolean;
};

const STATUS_LABELS = { draft: "Brouillon", published: "Publié", archived: "Archivé" } as const;

export function GuideEditor({ guide, categories, places, readOnly, canDelete }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<GuideFormState, FormData>(saveGuideAction, { ok: false });
  const [title, setTitle] = useState(guide?.title ?? "");
  const [slug, setSlug] = useState(guide?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(guide));
  const [steps, setSteps] = useState<GuideStep[]>(guide?.steps ?? [{ title: "", body: "" }]);
  const [sources, setSources] = useState<GuideSource[]>(guide?.sources ?? []);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>(guide?.placeSlugs ?? []);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const errors = { ...state.fieldErrors, ...clientErrors };

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      if (!guide?.id && state.savedId) router.replace(`/admin/guides/${state.savedId}`);
    } else {
      toast.error(state.message);
    }
  }, [state, guide?.id, router]);

  const updateStep = (i: number, patch: Partial<GuideStep>) =>
    setSteps((s) => s.map((step, j) => (j === i ? { ...step, ...patch } : step)));
  const moveStep = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      const [item] = next.splice(i, 1);
      next.splice(i + dir, 0, item);
      return next;
    });

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(e) => {
        if (readOnly) {
          e.preventDefault();
          toast.info("Mode aperçu : l'enregistrement sera disponible une fois Supabase configuré.");
          return;
        }
        const check = parseGuideForm(new FormData(e.currentTarget));
        if (!check.success) {
          e.preventDefault();
          setClientErrors(check.fieldErrors);
          toast.error("Certains champs sont à corriger.");
        } else {
          setClientErrors({});
        }
      }}
      className="space-y-8"
    >
      {readOnly && (
        <div className="flex items-start gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-4 text-sm">
          <Eye className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
          <p>
            Mode aperçu : Supabase n&apos;est pas encore configuré. Tu peux tester le formulaire et sa validation, mais rien ne sera
            enregistré.
          </p>
        </div>
      )}

      <input type="hidden" name="id" value={guide?.id ?? ""} />
      <input type="hidden" name="steps" value={JSON.stringify(steps.map((s) => ({ ...s, placeSlug: s.placeSlug || undefined })))} />
      <input type="hidden" name="sources" value={JSON.stringify(sources.map((s) => ({ ...s, url: s.url || undefined })))} />

      <Panel title="Informations">
        <Field label="Titre" htmlFor="title" error={errors.title}>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={inputCls(errors.title)}
            maxLength={120}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Identifiant d'URL (slug)" htmlFor="slug" error={errors.slug} hint={`/guide/${slug || "…"}`}>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className={inputCls(errors.slug)}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Catégorie" htmlFor="category" error={errors.category}>
            <select id="category" name="category" defaultValue={guide?.category ?? categories[0]?.id} className={inputCls(errors.category)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Résumé (affiché dans la liste)" htmlFor="summary" error={errors.summary}>
          <textarea id="summary" name="summary" defaultValue={guide?.summary} rows={2} maxLength={280} className={inputCls(errors.summary)} />
        </Field>
        <Field label="Introduction" htmlFor="intro" error={errors.intro}>
          <textarea id="intro" name="intro" defaultValue={guide?.intro} rows={4} maxLength={2000} className={inputCls(errors.intro)} />
        </Field>
        <Field label="Statut" htmlFor="status" error={errors.status}>
          <select id="status" name="status" defaultValue={guide?.status ?? "draft"} className={inputCls(errors.status)}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </Panel>

      <Panel title={`Étapes (${steps.length})`} error={errors.steps}>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display font-semibold">Étape {i + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" className="size-9" disabled={i === 0} onClick={() => moveStep(i, -1)} aria-label={`Monter l'étape ${i + 1}`}>
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9"
                    disabled={i === steps.length - 1}
                    onClick={() => moveStep(i, 1)}
                    aria-label={`Descendre l'étape ${i + 1}`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9 hover:text-pink"
                    disabled={steps.length === 1}
                    onClick={() => setSteps((s) => s.filter((_, j) => j !== i))}
                    aria-label={`Supprimer l'étape ${i + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                <Field label="Titre de l'étape" htmlFor={`step-${i}-title`} error={errors[`steps.${i}.title`]}>
                  <input id={`step-${i}-title`} value={step.title} onChange={(e) => updateStep(i, { title: e.target.value })} className={inputCls(errors[`steps.${i}.title`])} maxLength={120} />
                </Field>
                <Field label="Contenu" htmlFor={`step-${i}-body`} error={errors[`steps.${i}.body`]}>
                  <textarea id={`step-${i}-body`} value={step.body} onChange={(e) => updateStep(i, { body: e.target.value })} rows={3} className={inputCls(errors[`steps.${i}.body`])} maxLength={2000} />
                </Field>
                <Field label="Lieu sur la carte (facultatif)" htmlFor={`step-${i}-place`}>
                  <select id={`step-${i}-place`} value={step.placeSlug ?? ""} onChange={(e) => updateStep(i, { placeSlug: e.target.value || undefined })} className={inputCls()}>
                    <option value="">Aucun</option>
                    {places.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </li>
          ))}
        </ol>
        <Button type="button" variant="outline" size="sm" disabled={steps.length >= 40} onClick={() => setSteps((s) => [...s, { title: "", body: "" }])}>
          <Plus /> Ajouter une étape
        </Button>
      </Panel>

      <Panel title="Lieux liés" error={errors.placeSlugs}>
        <div className="flex flex-wrap gap-2">
          {places.map((p) => {
            const checked = selectedPlaces.includes(p.slug);
            return (
              <label
                key={p.slug}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan",
                  checked ? "border-cyan/50 bg-cyan/10 text-white" : "border-white/12 text-ink/70 hover:text-white",
                )}
              >
                <input
                  type="checkbox"
                  name="placeSlugs"
                  value={p.slug}
                  checked={checked}
                  onChange={() => setSelectedPlaces((s) => (checked ? s.filter((x) => x !== p.slug) : [...s, p.slug]))}
                  className="sr-only"
                />
                {p.name}
              </label>
            );
          })}
        </div>
      </Panel>

      <Panel title={`Sources (${sources.length})`} error={errors.sources}>
        <ul className="space-y-3">
          {sources.map((src, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Libellé" htmlFor={`src-${i}-label`} error={errors[`sources.${i}.label`]}>
                <input
                  id={`src-${i}-label`}
                  value={src.label}
                  onChange={(e) => setSources((s) => s.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  className={inputCls(errors[`sources.${i}.label`])}
                />
              </Field>
              <Field label="Lien (https ou page interne)" htmlFor={`src-${i}-url`} error={errors[`sources.${i}.url`]}>
                <input
                  id={`src-${i}-url`}
                  value={src.url ?? ""}
                  placeholder="https://… ou /carte"
                  onChange={(e) => setSources((s) => s.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  className={inputCls(errors[`sources.${i}.url`])}
                />
              </Field>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="self-end hover:text-pink"
                onClick={() => setSources((s) => s.filter((_, j) => j !== i))}
                aria-label={`Supprimer la source ${i + 1}`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" size="sm" disabled={sources.length >= 20} onClick={() => setSources((s) => [...s, { label: "", url: "" }])}>
          <Plus /> Ajouter une source
        </Button>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Cite toujours d&apos;où vient une information. N&apos;utilise que des images et textes dont tu as les droits.
        </p>
      </Panel>

      <div className="sticky bottom-24 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/95 p-3 backdrop-blur lg:bottom-4">
        {canDelete && guide?.id ? (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" className="hover:text-pink">
                <Trash2 /> Supprimer
              </Button>
            }
            title="Supprimer ce guide ?"
            description="Le guide et ses liens vers la carte seront supprimés définitivement. Les favoris des joueurs sur ce guide disparaîtront aussi."
            confirmLabel="Supprimer définitivement"
            destructive
            onConfirm={async () => {
              const res = await deleteGuideAction(guide.id!);
              if (res.ok) {
                toast.success(res.message);
                router.replace("/admin/guides");
              } else toast.error(res.message);
            }}
          />
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

const inputCls = (error?: string) =>
  cn(
    "w-full rounded-xl border bg-night px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted-foreground focus:ring-2",
    error ? "border-pink/70 focus:ring-pink/30" : "border-white/12 focus:border-cyan/60 focus:ring-cyan/30",
  );

function Panel({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset className="glass space-y-4 rounded-3xl p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-display text-lg font-bold" aria-hidden>
        {title}
      </h2>
      {error && (
        <p className="text-sm text-pink" role="alert">
          {error}
        </p>
      )}
      {children}
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink/85">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-pink" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="font-mono text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

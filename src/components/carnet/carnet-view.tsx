"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Check, CloudOff, Info, Lock, MapPin, Pencil, Plus, RotateCcw, Save, Search, SearchX, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/states/empty-state";
import { buildEntries, computeProgress, progressCategories, type CarnetEntry } from "@/lib/carnet/progress";
import { progressCategoryIdSchema, type Place, type ProgressCategoryId, type ProgressItem } from "@/lib/content/schemas";
import { normalizeText } from "@/lib/text";
import { userData, useSaveStatus, useUserData } from "@/lib/user-data/use-user-data";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./progress-ring";

type Tab = ProgressCategoryId | "tout";
type StatusFilter = "tous" | "a-faire" | "termines";

function initialTab(): Tab {
  if (typeof window === "undefined") return "tout";
  const parsed = progressCategoryIdSchema.safeParse(new URLSearchParams(window.location.search).get("categorie"));
  return parsed.success ? parsed.data : "tout";
}

function writeTab(tab: Tab) {
  const url = new URL(window.location.href);
  if (tab === "tout") url.searchParams.delete("categorie");
  else url.searchParams.set("categorie", tab);
  window.history.replaceState(window.history.state, "", url);
}

export default function CarnetView({ items, places }: { items: ProgressItem[]; places: Place[] }) {
  const data = useUserData();
  const status = useSaveStatus();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<StatusFilter>("tous");
  const [query, setQuery] = useState("");

  const entries = useMemo(() => buildEntries(items, places, data), [items, places, data]);
  const { byCategory, overall } = useMemo(() => computeProgress(entries), [entries]);

  const q = normalizeText(query);
  const visible = entries.filter(
    (e) =>
      (tab === "tout" || e.category === tab) &&
      (filter === "tous" || (filter === "termines" ? e.done : !e.done)) &&
      (!q || normalizeText(`${e.title} ${e.subtitle ?? ""}`).includes(q)),
  );

  const changeTab = (next: Tab) => {
    setTab(next);
    writeTab(next);
  };

  const toggle = (e: CarnetEntry) => {
    if (e.objectiveId) userData.setObjectiveDone(e.objectiveId, !e.done);
    else if (e.placeSlug && (e.category === "lieu" || e.category === "collectible")) userData.setVisited(e.placeSlug, !e.done);
    else userData.setProgress(e.key.replace(/^item:/, ""), !e.done);
  };

  const resetCategory = (cat: ProgressCategoryId) => {
    for (const e of entries.filter((x) => x.category === cat && x.done)) toggle(e);
    toast.success("Catégorie remise à zéro");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pt-32 pb-16 sm:px-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
            <Lock className="size-3.5" aria-hidden /> Privé
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Mon <span className="text-neon">carnet</span>
          </h1>
        </div>
        <SaveIndicator status={status} />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan/20 bg-cyan/[0.06] p-4 text-sm text-ink/85">
        <Info className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
        <p>
          Liste de démonstration : la liste réelle sera ajoutée après la sortie du jeu, avec ses sources. Ta progression est
          enregistrée sur cet appareil ; elle sera synchronisée avec ton compte quand les comptes joueurs arriveront.
        </p>
      </div>

      {/* Vue d'ensemble */}
      <section aria-label="Vue d'ensemble" className="mt-8 grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="glass flex items-center gap-6 rounded-3xl p-6">
          <ProgressRing percent={overall.percent} size={132} stroke={12} label="Progression totale">
            <div>
              <p className="font-display text-3xl font-bold tabular-nums">{overall.percent}%</p>
              <p className="text-[11px] text-muted-foreground">au total</p>
            </div>
          </ProgressRing>
          <div>
            <p className="font-display text-xl font-bold">Progression totale</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {overall.done} / {overall.total} objectifs terminés
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {progressCategories.map((c) => {
            const p = byCategory[c.id];
            const current = tab === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => changeTab(current ? "tout" : c.id)}
                aria-pressed={current}
                className={cn(
                  "group cursor-pointer rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5",
                  current ? "border-pink/50 bg-pink/10" : "border-white/10 bg-white/[0.03] hover:border-white/25",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.label}</span>
                  <span className="font-display text-lg font-bold tabular-nums">{p.percent}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pink via-violet to-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${p.percent}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {p.done} / {p.total}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Onglets */}
      <div role="tablist" aria-label="Catégories du carnet" className="mt-10 -mx-5 flex gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {(["tout", ...progressCategories.map((c) => c.id)] as Tab[]).map((id) => {
          const label = id === "tout" ? "Tout" : progressCategories.find((c) => c.id === id)!.label;
          const selected = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={selected}
              onClick={() => changeTab(id)}
              className={cn(
                "relative h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors",
                selected ? "text-white" : "text-ink/60 hover:text-white",
              )}
            >
              {selected && <motion.span layoutId="carnet-tab" className="absolute inset-0 rounded-full bg-white/[0.09] ring-1 ring-white/15" />}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Barre d'outils */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="carnet-search" className="sr-only">
            Rechercher dans le carnet
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="carnet-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="h-11 w-full rounded-full border border-white/12 bg-white/[0.03] pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-cyan/60 focus:ring-2 focus:ring-cyan/30"
          />
        </div>
        <div className="flex rounded-full border border-white/12 p-1" role="radiogroup" aria-label="Filtrer par état">
          {(
            [
              ["tous", "Tous"],
              ["a-faire", "À faire"],
              ["termines", "Terminés"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              onClick={() => setFilter(value)}
              className={cn(
                "h-9 flex-1 cursor-pointer rounded-full px-4 text-sm transition sm:flex-none",
                filter === value ? "bg-gradient-to-r from-pink to-violet font-semibold text-white" : "text-ink/70 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== "tout" && byCategory[tab].done > 0 && tab !== "objectif" && (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm">
                <RotateCcw /> Remettre à zéro
              </Button>
            }
            title="Remettre cette catégorie à zéro ?"
            description="Tous les éléments cochés de cette catégorie seront décochés. Pour les lieux et collectibles, ils ne seront plus marqués comme visités sur la carte."
            confirmLabel="Remettre à zéro"
            destructive
            onConfirm={() => resetCategory(tab)}
          />
        )}
      </div>

      {tab === "objectif" && <ObjectiveForm />}

      {/* Liste */}
      <div className="mt-6">
        {visible.length === 0 ? (
          tab === "objectif" && data.objectives.length === 0 ? (
            <EmptyState icon={Target} title="Aucun objectif personnel" description="Ajoute ton premier objectif avec le champ ci-dessus." />
          ) : (
            <EmptyState icon={SearchX} title="Rien à afficher" description="Aucun élément ne correspond à tes filtres." />
          )
        ) : tab === "tout" ? (
          progressCategories.map((c) => {
            const list = visible.filter((e) => e.category === c.id);
            if (list.length === 0) return null;
            return (
              <section key={c.id} className="mb-8" aria-labelledby={`cat-${c.id}`}>
                <h2 id={`cat-${c.id}`} className="mb-3 flex items-baseline gap-3 text-lg font-bold">
                  {c.label}
                  <span className="text-sm font-normal text-muted-foreground tabular-nums">
                    {byCategory[c.id].done}/{byCategory[c.id].total}
                  </span>
                </h2>
                <EntryList entries={list} onToggle={toggle} />
              </section>
            );
          })
        ) : (
          <EntryList entries={visible} onToggle={toggle} />
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: ReturnType<typeof useSaveStatus> }) {
  const map = {
    idle: { icon: Save, text: "Sauvegarde automatique", cls: "text-muted-foreground" },
    saving: { icon: Save, text: "Enregistrement…", cls: "text-cyan" },
    saved: { icon: Check, text: "Enregistré sur cet appareil", cls: "text-turquoise" },
    error: { icon: CloudOff, text: "Enregistrement impossible : stockage du navigateur bloqué", cls: "text-pink" },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <p role="status" className={cn("flex items-center gap-2 text-sm", cls)}>
      <Icon className="size-4" aria-hidden /> {text}
    </p>
  );
}

function EntryList({ entries, onToggle }: { entries: CarnetEntry[]; onToggle: (e: CarnetEntry) => void }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.li
            key={e.key}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <EntryRow entry={e} onToggle={() => onToggle(e)} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function EntryRow({ entry, onToggle }: { entry: CarnetEntry; onToggle: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.title);
  const [error, setError] = useState<string | null>(null);
  const inputId = `edit-${entry.key}`;

  if (editing && entry.objectiveId) {
    const save = () => {
      const err = userData.renameObjective(entry.objectiveId!, draft);
      if (err) setError(err);
      else {
        setEditing(false);
        setError(null);
      }
    };
    return (
      <div className="glass rounded-2xl p-3">
        <label htmlFor={inputId} className="sr-only">
          Modifier l&apos;objectif
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-err` : undefined}
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-night px-3 text-sm outline-none focus:border-cyan/60"
          />
          <Button size="icon" variant="cyan" onClick={save} aria-label="Enregistrer">
            <Check />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)} aria-label="Annuler">
            <X />
          </Button>
        </div>
        {error && (
          <p id={`${inputId}-err`} className="mt-2 text-xs text-pink">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
        entry.done ? "border-turquoise/25 bg-turquoise/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={entry.done}
        aria-label={entry.title}
        onClick={onToggle}
        className={cn(
          "grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg border-2 transition-all duration-200 active:scale-90",
          entry.done ? "border-turquoise bg-turquoise text-night" : "border-white/25 hover:border-cyan",
        )}
      >
        <AnimatePresence>
          {entry.done && (
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
              <Check className="size-4" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium transition-colors", entry.done && "text-ink/60 line-through decoration-turquoise/60")}>
          {entry.title}
        </p>
        {entry.subtitle && <p className="text-xs text-muted-foreground">{entry.subtitle}</p>}
      </div>
      {entry.placeSlug && (
        <Link
          href={`/carte?lieu=${entry.placeSlug}`}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-cyan transition hover:bg-cyan/10"
          aria-label={`Voir « ${entry.title} » sur la carte`}
          title="Voir sur la carte"
        >
          <MapPin className="size-4" />
        </Link>
      )}
      {entry.objectiveId && (
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-9"
            onClick={() => {
              setDraft(entry.title);
              setEditing(true);
            }}
            aria-label={`Modifier « ${entry.title} »`}
          >
            <Pencil />
          </Button>
          <ConfirmDialog
            trigger={
              <Button size="icon" variant="ghost" className="size-9 hover:text-pink" aria-label={`Supprimer « ${entry.title} »`}>
                <Trash2 />
              </Button>
            }
            title="Supprimer cet objectif ?"
            description={`« ${entry.title} » sera définitivement supprimé de ton carnet.`}
            confirmLabel="Supprimer"
            destructive
            onConfirm={() => {
              userData.removeObjective(entry.objectiveId!);
              toast.success("Objectif supprimé");
            }}
          />
        </div>
      )}
    </div>
  );
}

function ObjectiveForm() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="glass mt-6 rounded-2xl p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err = userData.addObjective(title);
        if (err) {
          setError(err);
          return;
        }
        setTitle("");
        setError(null);
        toast.success("Objectif ajouté");
      }}
    >
      <label htmlFor="new-objective" className="text-sm font-semibold">
        Nouvel objectif personnel
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="new-objective"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. : visiter tous les panoramas avant le week-end"
          maxLength={140}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "new-objective-err" : undefined}
          className="h-11 min-w-0 flex-1 rounded-full border border-white/12 bg-night px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-cyan/60 focus:ring-2 focus:ring-cyan/30"
        />
        <Button type="submit">
          <Plus /> <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>
      {error && (
        <p id="new-objective-err" className="mt-2 text-xs text-pink">
          {error}
        </p>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Badge>Privé</Badge> Tes objectifs ne sont visibles que par toi.
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowUpRight, Clock, Heart, ListOrdered, Search, SearchX } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { Guide, GuideCategoryId } from "@/lib/content/schemas";
import { formatDateFr, normalizeText } from "@/lib/text";
import { useUserData } from "@/lib/user-data/use-user-data";
import { cn } from "@/lib/utils";
import { FavoriteGuideButton } from "./favorite-guide-button";

type Props = { guides: Guide[]; categories: { id: GuideCategoryId; label: string }[] };

/** Recherche plein texte tolérante (titre, résumé, étapes). */
export function searchGuides(guides: Guide[], query: string, category: GuideCategoryId | null, favorites: string[] | null) {
  const q = normalizeText(query);
  return guides.filter((g) => {
    if (category && g.category !== category) return false;
    if (favorites && !favorites.includes(g.slug)) return false;
    if (!q) return true;
    const text = normalizeText([g.title, g.summary, ...g.steps.map((s) => s.title)].join(" "));
    return q.split(/\s+/).every((w) => text.includes(w));
  });
}

export function GuideBrowser({ guides, categories }: Props) {
  const data = useUserData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GuideCategoryId | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const list = searchGuides(guides, query, category, onlyFavorites ? data.guideFavorites : null);
  const labelOf = (id: GuideCategoryId) => categories.find((c) => c.id === id)?.label ?? id;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="guide-search" className="sr-only">
            Rechercher un guide
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="guide-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un guide, une étape…"
            className="h-12 w-full rounded-full border border-white/12 bg-white/[0.03] pr-4 pl-11 outline-none placeholder:text-muted-foreground focus:border-cyan/60 focus:ring-2 focus:ring-cyan/30"
          />
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Catégories">
          <Chip active={category === null && !onlyFavorites} onClick={() => (setCategory(null), setOnlyFavorites(false))}>
            Tous
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
              {c.label}
            </Chip>
          ))}
          <Chip active={onlyFavorites} onClick={() => setOnlyFavorites(!onlyFavorites)}>
            <Heart className={cn("size-3.5", onlyFavorites && "fill-pink text-pink")} /> Favoris
          </Chip>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {list.length} guide{list.length > 1 ? "s" : ""}
      </p>

      {list.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={SearchX}
          title={onlyFavorites ? "Aucun guide en favori" : "Aucun guide trouvé"}
          description={onlyFavorites ? "Ajoute un guide à tes favoris avec le cœur." : "Essaie d'autres mots-clés ou une autre catégorie."}
          action={
            <Button size="sm" variant="outline" onClick={() => (setQuery(""), setCategory(null), setOnlyFavorites(false))}>
              Voir tous les guides
            </Button>
          }
        />
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((g, i) => (
              <motion.li
                key={g.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative"
              >
                <Link
                  href={`/guide/${g.slug}`}
                  className="glass group flex h-full flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_60px_-30px_rgb(255_61_145/0.6)]"
                >
                  <span className="text-xs font-semibold tracking-[0.18em] text-cyan uppercase">{labelOf(g.category)}</span>
                  <h2 className="mt-3 pr-10 font-display text-xl leading-snug font-bold">{g.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{g.summary}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-6 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ListOrdered className="size-3.5" aria-hidden /> {g.steps.length} étapes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden /> Mis à jour le {formatDateFr(g.updatedAt)}
                    </span>
                  </div>
                  <ArrowUpRight className="absolute right-6 bottom-6 size-5 text-pink opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
                </Link>
                <div className="absolute top-4 right-4">
                  <FavoriteGuideButton slug={g.slug} title={g.title} compact />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
        active ? "border-pink/60 bg-pink/15 text-white" : "border-white/12 text-ink/70 hover:border-white/30 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

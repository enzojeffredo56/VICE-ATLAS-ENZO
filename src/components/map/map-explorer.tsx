"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Crosshair,
  Flame,
  Heart,
  List,
  NotebookPen,
  ScanEye,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/states/empty-state";
import { Spinner } from "@/components/states/spinner";
import type { Place, PlaceCategory, PlaceCategoryId } from "@/lib/content/schemas";
import { countByCategory, filterPlaces, formatCoord } from "@/lib/map/search";
import { userData, useUserData } from "@/lib/user-data/use-user-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FocusRequest } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-[#070b1a]">
      <Spinner label="Chargement de la carte…" />
    </div>
  ),
});

export type GuideRef = { slug: string; title: string };

type Props = { places: Place[]; categories: PlaceCategory[]; guides: GuideRef[] };

function initialSlug(places: Place[]) {
  if (typeof window === "undefined") return null;
  const slug = new URLSearchParams(window.location.search).get("lieu");
  return slug && places.some((p) => p.slug === slug) ? slug : null;
}

function writeUrl(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("lieu", slug);
  else url.searchParams.delete("lieu");
  window.history.replaceState(window.history.state, "", url);
}

export default function MapExplorer({ places, categories, guides }: Props) {
  const data = useUserData();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<PlaceCategoryId>>(() => new Set(categories.map((c) => c.id)));
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [hideVisited, setHideVisited] = useState(false);
  const [selected, setSelected] = useState<string | null>(() => initialSlug(places));
  const [focus, setFocus] = useState<FocusRequest>(() => {
    const slug = initialSlug(places);
    return slug ? { slug, nonce: 1 } : null;
  });
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const colors = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.color])), [categories]);
  const counts = useMemo(() => countByCategory(places), [places]);
  const results = useMemo(
    () => filterPlaces(places, { query, categories: active, onlyFavorites, hideVisited }, data.places),
    [places, query, active, onlyFavorites, hideVisited, data.places],
  );
  const selectedPlace = places.find((p) => p.slug === selected) ?? null;
  const visitedCount = places.filter((p) => data.places[p.slug]?.visitedAt).length;

  const select = useCallback((slug: string | null) => {
    setSelected(slug);
    writeUrl(slug);
  }, []);

  const goTo = useCallback(
    (slug: string) => {
      select(slug);
      setFocus((f) => ({ slug, nonce: (f?.nonce ?? 0) + 1 }));
      setListOpen(false);
    },
    [select],
  );

  const toggleCategory = (id: PlaceCategoryId) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resetFilters = () => {
    setQuery("");
    setActive(new Set(categories.map((c) => c.id)));
    setOnlyFavorites(false);
    setHideVisited(false);
  };

  const filterControls = (
    <FilterControls
      categories={categories}
      counts={counts}
      active={active}
      onToggle={toggleCategory}
      onlyFavorites={onlyFavorites}
      setOnlyFavorites={setOnlyFavorites}
      hideVisited={hideVisited}
      setHideVisited={setHideVisited}
    />
  );

  return (
    <div className="mx-auto flex h-full max-w-[1600px] gap-4">
      {/* ------- Panneau latéral (ordinateur) ------- */}
      <aside className="glass hidden w-[360px] shrink-0 flex-col overflow-hidden rounded-3xl lg:flex" aria-label="Filtres et liste des lieux">
        <div className="space-y-4 border-b border-white/10 p-5">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-2xl font-bold">Carte</h1>
            <span className="text-xs text-muted-foreground">
              {visitedCount}/{places.length} visités
            </span>
          </div>
          <SearchInput value={query} onChange={setQuery} id="map-search-desktop" />
          {filterControls}
        </div>
        <PlaceList
          places={results}
          colors={colors}
          marks={data.places}
          selected={selected}
          onPick={goTo}
          onReset={resetFilters}
        />
      </aside>

      {/* ------- Carte ------- */}
      <div data-lenis-prevent className="relative isolate min-w-0 flex-1 overflow-hidden border-white/10 lg:rounded-3xl lg:border">
        <LeafletMap
          places={results}
          colors={colors}
          marks={data.places}
          selectedSlug={selected}
          focus={focus}
          onSelect={select}
          onPointer={setPointer}
        />

        {/* Barre de recherche et filtres (mobile) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] space-y-2 p-3 lg:hidden">
          <div className="pointer-events-auto flex gap-2">
            <SearchInput value={query} onChange={setQuery} id="map-search-mobile" className="flex-1" />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-night/85 backdrop-blur"
              aria-label="Filtres"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="size-5" />
            </Button>
          </div>
          <div className="pointer-events-auto -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
            {categories.map((c) => (
              <CategoryChip key={c.id} category={c} active={active.has(c.id)} onClick={() => toggleCategory(c.id)} compact />
            ))}
          </div>
        </div>

        {/* Coordonnées du curseur */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] hidden items-center gap-3 rounded-full border border-white/10 bg-night/85 px-3 py-1.5 font-mono text-xs text-cyan backdrop-blur sm:flex">
          <Crosshair className="size-3.5" aria-hidden />
          <span className="tabular-nums">X {pointer ? formatCoord(pointer.x) : "—"}</span>
          <span className="tabular-nums">Y {pointer ? formatCoord(pointer.y) : "—"}</span>
        </div>
        <p className="pointer-events-none absolute right-3 bottom-[7.5rem] z-[500] hidden rounded-full bg-night/80 px-3 py-1 text-[10px] tracking-wider text-ink/60 uppercase backdrop-blur lg:bottom-3 lg:right-16 lg:block">
          Carte fictive de démonstration
        </p>

        {/* Fiche du lieu */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              key={selectedPlace.slug}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-3 bottom-[6.5rem] z-[600] lg:inset-x-auto lg:top-4 lg:right-4 lg:bottom-auto lg:w-[380px]"
            >
              <PlacePanel
                place={selectedPlace}
                category={categories.find((c) => c.id === selectedPlace.category)!}
                guides={guides.filter((g) => selectedPlace.guideSlugs.includes(g.slug))}
                mark={data.places[selectedPlace.slug]}
                onClose={() => select(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton liste (mobile) */}
        {!selectedPlace && (
          <div className="absolute inset-x-0 bottom-[6.5rem] z-[500] flex justify-center lg:hidden">
            <Button onClick={() => setListOpen(true)} className="shadow-2xl">
              <List /> {results.length} lieu{results.length > 1 ? "x" : ""}
            </Button>
          </div>
        )}
      </div>

      {/* Feuilles mobiles */}
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="bottom" className="flex h-[75dvh] flex-col p-0">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <SheetTitle className="font-display text-lg font-bold">
              {results.length} lieu{results.length > 1 ? "x" : ""}
            </SheetTitle>
            <SheetDescription className="sr-only">Liste des lieux correspondant à tes filtres</SheetDescription>
            <Button variant="ghost" size="icon" onClick={() => setListOpen(false)} aria-label="Fermer la liste">
              <X className="size-5" />
            </Button>
          </div>
          <PlaceList
            places={results}
            colors={colors}
            marks={data.places}
            selected={selected}
            onPick={goTo}
            onReset={resetFilters}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="space-y-5 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg font-bold">Filtres</SheetTitle>
            <SheetDescription className="sr-only">Choisis les catégories et options d&apos;affichage</SheetDescription>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser
            </Button>
          </div>
          {filterControls}
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            Voir {results.length} lieu{results.length > 1 ? "x" : ""}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SearchInput({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Rechercher un lieu
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher un lieu, un quartier…"
        autoComplete="off"
        className="h-11 w-full rounded-full border border-white/12 bg-night/85 pr-10 pl-10 text-sm text-ink backdrop-blur transition outline-none placeholder:text-muted-foreground focus:border-cyan/60 focus:ring-2 focus:ring-cyan/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

function CategoryChip({
  category,
  active,
  onClick,
  count,
  compact = false,
}: {
  category: PlaceCategory;
  active: boolean;
  onClick: () => void;
  count?: number;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200",
        compact ? "h-9 bg-night/85 px-3 backdrop-blur" : "h-9 px-3",
        active ? "border-white/25 text-white" : "border-white/10 text-ink/45 line-through decoration-white/30",
      )}
      style={active ? { boxShadow: `inset 0 0 0 1px ${category.color}55, 0 0 18px -8px ${category.color}` } : undefined}
    >
      <span className="size-2.5 rounded-full" style={{ background: active ? category.color : "transparent", boxShadow: `0 0 0 1.5px ${category.color}` }} aria-hidden />
      {category.label}
      {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
    </button>
  );
}

function FilterControls(props: {
  categories: PlaceCategory[];
  counts: Record<PlaceCategoryId, number>;
  active: Set<PlaceCategoryId>;
  onToggle: (id: PlaceCategoryId) => void;
  onlyFavorites: boolean;
  setOnlyFavorites: (v: boolean) => void;
  hideVisited: boolean;
  setHideVisited: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-[0.18em] text-ink/50 uppercase">Catégories</legend>
        <div className="flex flex-wrap gap-2">
          {props.categories.map((c) => (
            <CategoryChip key={c.id} category={c} count={props.counts[c.id]} active={props.active.has(c.id)} onClick={() => props.onToggle(c.id)} />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Toggle checked={props.onlyFavorites} onChange={props.setOnlyFavorites} label="Favoris uniquement" />
        <Toggle checked={props.hideVisited} onChange={props.setHideVisited} label="Masquer les visités" />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition",
        checked ? "border-pink/50 bg-pink/15 text-white" : "border-white/10 text-ink/70 hover:text-white",
      )}
    >
      <span className={cn("relative h-4 w-7 rounded-full transition", checked ? "bg-pink" : "bg-white/15")} aria-hidden>
        <span className={cn("absolute top-0.5 size-3 rounded-full bg-white transition-all", checked ? "left-3.5" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

function PlaceList({
  places,
  colors,
  marks,
  selected,
  onPick,
  onReset,
}: {
  places: Place[];
  colors: Record<string, string>;
  marks: Record<string, { favorite?: boolean; visitedAt?: string } | undefined>;
  selected: string | null;
  onPick: (slug: string) => void;
  onReset: () => void;
}) {
  if (places.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={SearchX}
          title="Aucun lieu trouvé"
          description="Essaie un autre mot ou réactive des catégories."
          action={
            <Button size="sm" variant="outline" onClick={onReset}>
              Réinitialiser les filtres
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <ul data-lenis-prevent className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Lieux">
      {places.map((p) => {
        const mark = marks[p.slug];
        return (
          <li key={p.slug}>
            <button
              type="button"
              onClick={() => onPick(p.slug)}
              aria-current={selected === p.slug ? "true" : undefined}
              className={cn(
                "group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                selected === p.slug ? "bg-white/[0.08]" : "hover:bg-white/[0.05]",
              )}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${colors[p.category]}22`, color: colors[p.category] }}
              >
                {mark?.visitedAt ? <Check className="size-4" /> : <span className="size-2.5 rounded-full" style={{ background: colors[p.category] }} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.district}</span>
              </span>
              {mark?.favorite && <Heart className="size-4 shrink-0 fill-pink text-pink" aria-label="Favori" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PlacePanel({
  place,
  category,
  guides,
  mark,
  onClose,
}: {
  place: Place;
  category: PlaceCategory;
  guides: GuideRef[];
  mark: { favorite?: boolean; visitedAt?: string } | undefined;
  onClose: () => void;
}) {
  const visited = Boolean(mark?.visitedAt);
  const isCollectible = place.category === "collectible";
  const coords = `X ${formatCoord(place.x)} · Y ${formatCoord(place.y)}`;

  async function copyCoords() {
    try {
      await navigator.clipboard.writeText(coords);
      toast.success("Coordonnées copiées");
    } catch {
      toast.error("Copie impossible", { description: coords });
    }
  }

  return (
    <article
      aria-label={`Fiche : ${place.name}`}
      className="max-h-[52dvh] overflow-y-auto rounded-3xl border border-white/12 bg-surface/95 p-5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl lg:max-h-[calc(100dvh-10rem)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: `${category.color}1f`, color: category.color }}
            >
              <span className="size-1.5 rounded-full" style={{ background: category.color }} />
              {category.label}
            </span>
            {place.isDemo && <Badge>Démo</Badge>}
          </div>
          <h2 className="font-display text-xl leading-tight font-bold">{place.name}</h2>
          <p className="text-sm text-muted-foreground">{place.district}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer la fiche" className="-mt-1 -mr-2 shrink-0">
          <X className="size-5" />
        </Button>
      </div>

      <p className="mt-3 text-sm text-ink/85">{place.description}</p>

      <button
        type="button"
        onClick={copyCoords}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-cyan transition hover:border-cyan/50"
        aria-label={`Copier les coordonnées ${coords}`}
      >
        <Crosshair className="size-3.5" aria-hidden /> {coords} <Copy className="size-3" aria-hidden />
      </button>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant={visited ? "cyan" : "outline"}
          size="sm"
          aria-pressed={visited}
          onClick={() => {
            userData.setVisited(place.slug, !visited);
            toast.success(visited ? "Retiré des lieux visités" : isCollectible ? "Collectible récupéré" : "Lieu marqué comme visité", {
              description: "Ton carnet est à jour.",
            });
          }}
        >
          <Check /> {isCollectible ? (visited ? "Récupéré" : "Récupérer") : visited ? "Visité" : "Marquer visité"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={Boolean(mark?.favorite)}
          onClick={() => userData.toggleFavorite(place.slug)}
          className={cn(mark?.favorite && "border-pink/50 bg-pink/15 text-white")}
        >
          <Heart className={cn(mark?.favorite && "fill-pink text-pink")} /> {mark?.favorite ? "Favori" : "Favoris"}
        </Button>
      </div>

      <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
        {guides.map((g) => (
          <PanelLink key={g.slug} href={`/guide/${g.slug}`} icon={BookOpen}>
            Guide : {g.title}
          </PanelLink>
        ))}
        {place.category === "stunt" && (
          <PanelLink href="/stunts" icon={Flame}>
            Concours STUNT ARENA de ce spot
          </PanelLink>
        )}
        <PanelLink href={`/comparateur?lieu=${place.slug}`} icon={ScanEye}>
          Comparer avec Miami
        </PanelLink>
        <PanelLink href={`/carnet?categorie=${isCollectible ? "collectible" : "lieu"}`} icon={NotebookPen}>
          Voir dans mon carnet
        </PanelLink>
      </ul>
    </article>
  );
}

function PanelLink({ href, icon: Icon, children }: { href: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2.5 rounded-xl px-2 py-2 text-ink/85 transition hover:bg-white/[0.05] hover:text-white"
      >
        <Icon className="size-4 shrink-0 text-cyan transition-transform group-hover:scale-110" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </Link>
    </li>
  );
}

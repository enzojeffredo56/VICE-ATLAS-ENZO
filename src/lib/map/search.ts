import type { Place, PlaceCategoryId } from "@/lib/content/schemas";
import { normalizeText } from "@/lib/text";

export type PlaceFilters = {
  query: string;
  categories: ReadonlySet<PlaceCategoryId>;
  onlyFavorites: boolean;
  hideVisited: boolean;
};

export type PlaceMarks = Record<string, { favorite?: boolean; visitedAt?: string } | undefined>;

/** Filtre les lieux selon la recherche, les catégories et l'état du joueur. */
export function filterPlaces(places: readonly Place[], filters: PlaceFilters, marks: PlaceMarks): Place[] {
  const q = normalizeText(filters.query);
  return places.filter((p) => {
    if (!filters.categories.has(p.category)) return false;
    const mark = marks[p.slug];
    if (filters.onlyFavorites && !mark?.favorite) return false;
    if (filters.hideVisited && mark?.visitedAt) return false;
    if (!q) return true;
    const haystack = normalizeText([p.name, p.district, ...p.tags].join(" "));
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

/** Nombre de lieux par catégorie (pour les filtres). */
export function countByCategory(places: readonly Place[]): Record<PlaceCategoryId, number> {
  const counts = { "point-interet": 0, stunt: 0, collectible: 0, activite: 0, panorama: 0 } satisfies Record<PlaceCategoryId, number>;
  for (const p of places) counts[p.category]++;
  return counts;
}

/** Arrondi d'affichage des coordonnées. */
export const formatCoord = (value: number) => Math.round(value).toString();

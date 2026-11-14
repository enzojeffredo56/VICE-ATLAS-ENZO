import type { Place, ProgressCategoryId, ProgressItem } from "@/lib/content/schemas";
import type { UserData } from "@/lib/user-data/schema";

export const progressCategories: { id: ProgressCategoryId; label: string; short: string }[] = [
  { id: "mission", label: "Missions", short: "Missions" },
  { id: "activite", label: "Activités", short: "Activités" },
  { id: "lieu", label: "Lieux", short: "Lieux" },
  { id: "collectible", label: "Collectibles", short: "Collect." },
  { id: "decouverte", label: "Découvertes", short: "Découv." },
  { id: "objectif", label: "Objectifs personnels", short: "Objectifs" },
];

/** Une ligne de checklist, quelle que soit sa source (catalogue, carte, objectif perso). */
export type CarnetEntry = {
  key: string;
  category: ProgressCategoryId;
  title: string;
  done: boolean;
  placeSlug?: string;
  subtitle?: string;
  objectiveId?: string;
};

export type CategoryProgress = { done: number; total: number; percent: number };

export function buildEntries(items: readonly ProgressItem[], places: readonly Place[], data: UserData): CarnetEntry[] {
  const fromItems = items.map<CarnetEntry>((i) => ({
    key: `item:${i.id}`,
    category: i.category,
    title: i.title,
    done: Boolean(data.progress[i.id]),
    placeSlug: i.placeSlug,
  }));
  const fromPlaces = places.map<CarnetEntry>((p) => ({
    key: `place:${p.slug}`,
    category: p.category === "collectible" ? "collectible" : "lieu",
    title: p.name,
    subtitle: p.district,
    done: Boolean(data.places[p.slug]?.visitedAt),
    placeSlug: p.slug,
  }));
  const fromObjectives = data.objectives.map<CarnetEntry>((o) => ({
    key: `objective:${o.id}`,
    category: "objectif",
    title: o.title,
    done: o.done,
    objectiveId: o.id,
  }));
  return [...fromItems, ...fromPlaces, ...fromObjectives];
}

const toProgress = (done: number, total: number): CategoryProgress => ({
  done,
  total,
  percent: total === 0 ? 0 : Math.round((done / total) * 100),
});

export function computeProgress(entries: readonly CarnetEntry[]) {
  const byCategory = Object.fromEntries(
    progressCategories.map((c) => {
      const list = entries.filter((e) => e.category === c.id);
      return [c.id, toProgress(list.filter((e) => e.done).length, list.length)];
    }),
  ) as Record<ProgressCategoryId, CategoryProgress>;
  const overall = toProgress(entries.filter((e) => e.done).length, entries.length);
  return { byCategory, overall };
}

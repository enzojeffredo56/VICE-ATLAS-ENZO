import type { Correspondence, MiamiSpot, Place } from "@/lib/content/schemas";

export type Pair = { id: string; correspondence: Correspondence; place: Place; spot: MiamiSpot };

/** Assemble les correspondances complètes (lieu du jeu + lieu réel), en ignorant les liens cassés. */
export function buildPairs(correspondences: Correspondence[], places: Place[], spots: MiamiSpot[]): Pair[] {
  const placeBySlug = new Map(places.map((p) => [p.slug, p]));
  const spotBySlug = new Map(spots.map((s) => [s.slug, s]));
  return correspondences.flatMap((c) => {
    const place = placeBySlug.get(c.placeSlug);
    const spot = spotBySlug.get(c.miamiSlug);
    return place && spot ? [{ id: `${c.placeSlug}--${c.miamiSlug}`, correspondence: c, place, spot }] : [];
  });
}

/** Trouve la correspondance d'un lieu du jeu (lien ?lieu=) ou d'un lieu réel. */
export function findPair(pairs: Pair[], ref: { placeSlug?: string | null; miamiSlug?: string | null }): Pair | null {
  return (
    pairs.find((p) => (ref.placeSlug && p.place.slug === ref.placeSlug) || (ref.miamiSlug && p.spot.slug === ref.miamiSlug)) ?? null
  );
}

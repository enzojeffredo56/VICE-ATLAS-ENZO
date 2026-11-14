/** Minuscules sans accents, pour des recherches tolérantes (« neon » trouve « Néon »). */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Transforme un titre en identifiant d'URL : « Tour de la Pointe ! » → « tour-de-la-pointe ». */
export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** « 2026-11-15 » → « 15 novembre 2026 » (date seule, sans décalage horaire). */
export function formatDateFr(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

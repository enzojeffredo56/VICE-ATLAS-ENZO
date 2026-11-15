/**
 * Calendrier hebdomadaire VICE ATLAS, fuseau explicite : Europe/Paris.
 * Une semaine va du lundi 00:00 au dimanche 23:59:59 (heure de Paris),
 * changements d'heure été/hiver compris.
 */
export const TIME_ZONE = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parisParts(date: Date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Décalage (ms) entre l'heure de Paris et UTC à un instant donné. */
function offsetAt(date: Date) {
  const p = parisParts(date);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instant UTC correspondant à une heure locale de Paris (gère l'heure d'été). */
export function parisToUtc(y: number, m: number, d: number, h = 0, min = 0, s = 0): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, h, min, s));
  const first = new Date(guess.getTime() - offsetAt(guess));
  return new Date(guess.getTime() - offsetAt(first));
}

/** Date du lundi (AAAA-MM-JJ, heure de Paris) de la semaine contenant `date`. */
export function weekStartParis(date: Date = new Date()): string {
  const p = parisParts(date);
  const local = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const isoDow = local.getUTCDay() === 0 ? 7 : local.getUTCDay();
  local.setUTCDate(local.getUTCDate() - (isoDow - 1));
  return local.toISOString().slice(0, 10);
}

/** Bornes de la semaine (début inclus, fin exclue) en instants UTC. */
export function weekBounds(weekStart: string) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = parisToUtc(y, m, d);
  const next = new Date(Date.UTC(y, m - 1, d + 7));
  const end = parisToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  return { start, end };
}

const dateTimeFr = new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** « lundi 16 novembre à 00:00 (heure de Paris) » */
export function formatParis(date: Date): string {
  return `${dateTimeFr.format(date).replace(" ", " ").replace(/ (\d{2}:\d{2})$/, " à $1")} (heure de Paris)`;
}

/** Temps restant lisible : « 2 j 5 h », « 3 h 12 min », « 45 s ». */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "terminé";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

/** Offre VICE ATLAS PLUS (tarif provisoire, à confirmer avant commercialisation). */
export const PLUS_PLAN = {
  name: "VICE ATLAS PLUS",
  priceCents: 499,
  currency: "eur",
  interval: "mois",
  provisional: true,
} as const;

export const formatPrice = (cents: number, currency = "eur") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

/** Fonctions qui restent gratuites pour tout le monde (engagement). */
export const ALWAYS_FREE = [
  "Carte interactive, favoris et lieux visités",
  "Carnet de progression synchronisé",
  "Guides, comparateur Miami",
  "GTA Roulette et salons privés",
  "STUNT ARENA : participer, voter, gagner des XP",
  "Avis, contributions, classements et badges",
];

/** Délai anti-fraude avant d'accorder le mois offert au parrain. */
export const REFERRAL_DELAY_DAYS = 14;

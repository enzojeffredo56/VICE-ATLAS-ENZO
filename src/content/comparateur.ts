import { MAP_HEIGHT, type Correspondence, type MiamiSpot, type VerificationStatus } from "@/lib/content/schemas";

/** Convertit une position relevée sur le plan SVG (y vers le bas) en coordonnées (origine en bas à gauche). */
const at = (svgX: number, svgY: number) => ({ x: svgX, y: MAP_HEIGHT - svgY });

export const verificationLabels: Record<VerificationStatus, { label: string; description: string }> = {
  demo: { label: "Exemple de démonstration", description: "Rapprochement d'exemple entre la carte fictive et Miami." },
  "a-verifier": { label: "À vérifier", description: "Proposé, pas encore confirmé par l'équipe." },
  probable: { label: "Probable", description: "Plusieurs indices concordent, sans preuve formelle." },
  verifie: { label: "Vérifié", description: "Confirmé par des sources fiables citées ci-dessous." },
};

/**
 * Lieux réels de Miami, placés sur le plan schématique dessiné par VICE ATLAS.
 * Les descriptions sont volontairement générales et factuelles.
 */
export const miamiSpots: MiamiSpot[] = [
  {
    slug: "cape-florida-light",
    name: "Phare de Cape Florida",
    neighborhood: "Key Biscayne",
    ...at(1445, 1355),
    description:
      "Phare historique à la pointe sud de Key Biscayne, dans le parc d'État Bill Baggs Cape Florida. C'est la plus ancienne construction encore debout du comté de Miami-Dade.",
  },
  {
    slug: "bayside-marketplace",
    name: "Bayside Marketplace",
    neighborhood: "Downtown",
    ...at(1085, 560),
    description: "Centre commercial à ciel ouvert au bord de la baie de Biscayne, avec boutiques, restaurants et départs d'excursions en bateau.",
  },
  {
    slug: "wynwood",
    name: "Wynwood",
    neighborhood: "Wynwood",
    ...at(915, 400),
    description: "Ancien quartier d'entrepôts au nord du centre-ville, connu pour ses fresques murales en plein air.",
  },
  {
    slug: "ocean-drive",
    name: "Ocean Drive",
    neighborhood: "South Beach",
    ...at(1572, 690),
    description: "Boulevard de South Beach bordé d'hôtels Art déco, face à la plage et à Lummus Park.",
  },
  {
    slug: "dinner-key",
    name: "Marinas de Dinner Key",
    neighborhood: "Coconut Grove",
    ...at(835, 1105),
    description: "Les marinas de Coconut Grove, au bord de la baie de Biscayne, point de départ de nombreuses sorties en mer.",
  },
  {
    slug: "miami-international-airport",
    name: "Aéroport international de Miami",
    neighborhood: "Ouest de Miami",
    ...at(395, 400),
    description: "Le principal aéroport de la ville, à l'ouest du centre-ville.",
  },
  {
    slug: "rickenbacker-causeway",
    name: "Rickenbacker Causeway",
    neighborhood: "Virginia Key",
    ...at(1340, 955),
    description: "Route qui relie Brickell à Virginia Key et Key Biscayne, avec une vue dégagée sur les tours du centre-ville.",
  },
  {
    slug: "domino-park",
    name: "Domino Park",
    neighborhood: "Little Havana",
    ...at(760, 690),
    description: "Petit parc de Calle Ocho, à Little Havana, où les habitués se retrouvent pour jouer aux dominos.",
  },
  {
    slug: "vizcaya",
    name: "Vizcaya Museum and Gardens",
    neighborhood: "Coconut Grove",
    ...at(930, 950),
    description: "Villa du début du XXe siècle et ses jardins, au bord de la baie, entre Brickell et Coconut Grove.",
  },
];

const wiki = (title: string, label: string) => ({ label: `Wikipédia (en anglais) : ${label}`, url: `https://en.wikipedia.org/wiki/${title}` });

/**
 * Rapprochements de DÉMONSTRATION : la carte VICE ATLAS actuelle est fictive,
 * ces liens montrent comment le comparateur fonctionnera avec la vraie carte.
 */
export const demoCorrespondences: Correspondence[] = [
  {
    placeSlug: "phare-du-port-neon",
    miamiSlug: "cape-florida-light",
    summary: "Un phare isolé qui garde l'entrée d'un port, comme celui de Cape Florida à l'entrée de la baie.",
    status: "demo",
    sources: [wiki("Cape_Florida_Light", "Cape Florida Light")],
    isDemo: true,
  },
  {
    placeSlug: "marche-flottant-des-docks",
    miamiSlug: "bayside-marketplace",
    summary: "Un marché animé au bord de l'eau, avec boutiques et pontons.",
    status: "demo",
    sources: [wiki("Bayside_Marketplace", "Bayside Marketplace")],
    isDemo: true,
  },
  {
    placeSlug: "galerie-murale-de-corail",
    miamiSlug: "wynwood",
    summary: "Une ruelle couverte de fresques, dans l'esprit des murs peints de Wynwood.",
    status: "demo",
    sources: [wiki("Wynwood", "Wynwood")],
    isDemo: true,
  },
  {
    placeSlug: "corniche-de-la-marina",
    miamiSlug: "ocean-drive",
    summary: "Une promenade en bord de mer, comme Ocean Drive face à la plage de South Beach.",
    status: "demo",
    sources: [wiki("Ocean_Drive", "Ocean Drive")],
    isDemo: true,
  },
  {
    placeSlug: "club-nautique",
    miamiSlug: "dinner-key",
    summary: "Le point de départ des sorties en mer, comme les marinas de Coconut Grove.",
    status: "demo",
    sources: [wiki("Coconut_Grove", "Coconut Grove")],
    isDemo: true,
  },
  {
    placeSlug: "piste-de-l-aerodrome",
    miamiSlug: "miami-international-airport",
    summary: "Les pistes d'un aéroport, à l'écart du centre.",
    status: "demo",
    sources: [wiki("Miami_International_Airport", "Miami International Airport")],
    isDemo: true,
  },
  {
    placeSlug: "belvedere-de-la-palmeraie",
    miamiSlug: "rickenbacker-causeway",
    summary: "Un point de vue panoramique sur la ville, comme depuis la Rickenbacker Causeway.",
    status: "demo",
    sources: [wiki("Rickenbacker_Causeway", "Rickenbacker Causeway")],
    isDemo: true,
  },
  {
    placeSlug: "salle-d-arcade-neon",
    miamiSlug: "domino-park",
    summary: "Un lieu de jeu de quartier où l'on se retrouve entre amis, comme Domino Park à Little Havana.",
    status: "demo",
    sources: [wiki("Little_Havana", "Little Havana")],
    isDemo: true,
  },
  {
    placeSlug: "jardin-du-quartier-corail",
    miamiSlug: "vizcaya",
    summary: "Un grand jardin au bord de l'eau, comme ceux de Vizcaya.",
    status: "demo",
    sources: [wiki("Vizcaya_Museum_and_Gardens", "Vizcaya Museum and Gardens")],
    isDemo: true,
  },
];

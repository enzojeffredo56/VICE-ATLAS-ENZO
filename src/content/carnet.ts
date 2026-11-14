import type { ProgressItem } from "@/lib/content/schemas";

/**
 * Éléments de carnet de DÉMONSTRATION. Ils sont volontairement génériques :
 * la liste réelle sera ajoutée après la sortie du jeu, avec des sources.
 * Les catégories « lieu » et « collectible » viennent de la carte (lieux visités).
 */
export const demoProgressItems: ProgressItem[] = [
  { id: "mission-introduction", category: "mission", title: "Terminer la mission d'introduction", isDemo: true },
  { id: "mission-deuxieme-quartier", category: "mission", title: "Débloquer un deuxième quartier", isDemo: true },
  { id: "mission-premier-allie", category: "mission", title: "Recruter un premier allié", isDemo: true },
  { id: "mission-discretion", category: "mission", title: "Réussir une mission sans déclencher d'alerte", isDemo: true },
  { id: "mission-secondaires-quartier", category: "mission", title: "Finir toutes les missions secondaires d'un quartier", isDemo: true },
  { id: "mission-histoire", category: "mission", title: "Terminer l'histoire principale", isDemo: true },

  { id: "activite-course", category: "activite", title: "Gagner une course de rue", isDemo: true },
  { id: "activite-arcade", category: "activite", title: "Finir une partie à la salle d'arcade", placeSlug: "salle-d-arcade-neon", isDemo: true },
  { id: "activite-bateau", category: "activite", title: "Faire une sortie en bateau", placeSlug: "club-nautique", isDemo: true },
  { id: "activite-record-rampe", category: "activite", title: "Battre ton record de saut à la Rampe des Docks", placeSlug: "rampe-des-docks", isDemo: true },
  { id: "activite-roulette", category: "activite", title: "Relever un défi GTA Roulette avec ta crew", isDemo: true },

  { id: "decouverte-point-de-vue", category: "decouverte", title: "Trouver un point de vue caché", placeSlug: "belvedere-de-la-palmeraie", isDemo: true },
  { id: "decouverte-fresque", category: "decouverte", title: "Repérer une fresque murale", placeSlug: "galerie-murale-de-corail", isDemo: true },
  { id: "decouverte-tour-ile", category: "decouverte", title: "Faire le tour complet de l'île", isDemo: true },
  { id: "decouverte-marche-nuit", category: "decouverte", title: "Visiter le marché flottant de nuit", placeSlug: "marche-flottant-des-docks", isDemo: true },
];

import type { Difficulty } from "@/lib/roulette/demo-challenges";

export type ChallengeCategory = "conduite" | "exploration" | "cascade" | "style" | "photo";

export type OfficialChallenge = {
  slug: string;
  title: string;
  description?: string;
  category: ChallengeCategory;
  difficulty: Difficulty;
};

export const CHALLENGE_CATEGORIES: { id: ChallengeCategory; label: string; color: string }[] = [
  { id: "conduite", label: "Conduite", color: "#8B5CF6" },
  { id: "exploration", label: "Exploration", color: "#00D4FF" },
  { id: "cascade", label: "Cascade", color: "#2DD4BF" },
  { id: "style", label: "Style", color: "#FF3D91" },
  { id: "photo", label: "Photo", color: "#FFB36B" },
];

/**
 * Défis officiels VICE ATLAS : génériques, sans triche ni argent réel.
 * Invérifiables entre amis → aucune XP (sauf défi de la semaine prouvé par vidéo).
 */
export const OFFICIAL_CHALLENGES: OfficialChallenge[] = [
  { slug: "vehicules-roses", title: "Ne conduis que des véhicules roses pendant 15 minutes", category: "style", difficulty: "facile" },
  { slug: "coucher-de-soleil", title: "Photographie un coucher de soleil depuis la plage", category: "photo", difficulty: "facile" },
  { slug: "saut-moto", title: "Réussis le plus long saut possible à moto", category: "cascade", difficulty: "facile" },
  { slug: "tenue-assortie", title: "Assortis ta tenue à la couleur de ton véhicule", category: "style", difficulty: "facile" },
  { slug: "tour-du-port", title: "Fais le tour complet du port sans t'arrêter", category: "conduite", difficulty: "facile" },
  { slug: "toit-le-plus-haut", title: "Prends une photo depuis le toit le plus haut que tu trouves", category: "photo", difficulty: "facile" },
  { slug: "trois-quartiers", title: "Traverse trois quartiers différents en moins de 5 minutes", category: "exploration", difficulty: "facile" },
  { slug: "radio-unique", title: "Garde la même station de radio pendant toute la session", category: "style", difficulty: "facile" },
  { slug: "point-culminant", title: "Atteins le point le plus haut de la ville à pied", category: "exploration", difficulty: "moyenne" },
  { slug: "sans-frein-a-main", title: "Termine une course sans utiliser le frein à main", category: "conduite", difficulty: "moyenne" },
  { slug: "sans-gps", title: "Rejoins ta crew en moins de 3 minutes, sans GPS", category: "exploration", difficulty: "moyenne" },
  { slug: "photo-de-groupe", title: "Réalise une photo de groupe avec toute ta crew dans le cadre", category: "photo", difficulty: "moyenne" },
  { slug: "convoi", title: "Roulez en convoi à travers la ville sans vous perdre de vue", category: "conduite", difficulty: "moyenne" },
  { slug: "tremplin-improvise", title: "Trouve un tremplin naturel et réussis un saut propre", category: "cascade", difficulty: "moyenne" },
  { slug: "lieu-inconnu", title: "Trouve un lieu qu'aucun membre de la crew ne connaissait", category: "exploration", difficulty: "moyenne" },
  { slug: "photo-nuit-neon", title: "Capture une photo de nuit éclairée uniquement par des néons", category: "photo", difficulty: "moyenne" },
  { slug: "derapage-controle", title: "Enchaîne un dérapage contrôlé sur trois virages", category: "conduite", difficulty: "moyenne" },
  { slug: "triple-cascade", title: "Enchaîne trois cascades sans t'arrêter", category: "cascade", difficulty: "difficile" },
  { slug: "sans-contact", title: "Traverse la ville sans toucher un seul véhicule", category: "conduite", difficulty: "difficile" },
  { slug: "atterrissage-parfait", title: "Atterris un saut sur les quatre roues sans rebond", category: "cascade", difficulty: "difficile" },
  { slug: "course-cote", title: "Longe toute la côte en un seul trajet, sans quitter la route", category: "conduite", difficulty: "difficile" },
  { slug: "photo-action", title: "Prends une photo nette d'un véhicule en plein saut", category: "photo", difficulty: "difficile" },
  { slug: "tour-des-iles", title: "Visite toutes les îles de la carte en une session", category: "exploration", difficulty: "difficile" },
  { slug: "style-signature", title: "Crée une tenue signature et garde-la toute la semaine", category: "style", difficulty: "difficile" },
];

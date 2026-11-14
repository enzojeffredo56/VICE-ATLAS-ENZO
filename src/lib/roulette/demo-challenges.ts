/**
 * Défis de DÉMONSTRATION pour l'aperçu de la roue sur l'accueil.
 * Ils ne rapportent aucune XP (défis invérifiables). La vraie base de défis
 * sera stockée dans Supabase et gérée depuis l'administration (phase 6).
 */
export type Difficulty = "facile" | "moyenne" | "difficile";

export type DemoChallenge = {
  id: string;
  label: string;
  category: "Conduite" | "Exploration" | "Cascade" | "Style";
  difficulty: Difficulty;
  color: string;
};

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "facile", label: "Facile" },
  { value: "moyenne", label: "Moyenne" },
  { value: "difficile", label: "Difficile" },
];

export const DEMO_CHALLENGES: DemoChallenge[] = [
  { id: "rose", label: "Ne conduis que des véhicules roses pendant 15 minutes", category: "Style", difficulty: "facile", color: "#FF3D91" },
  { id: "sommet", label: "Atteins le point le plus haut de la ville à pied", category: "Exploration", difficulty: "moyenne", color: "#00D4FF" },
  { id: "sans-frein", label: "Termine une course sans utiliser le frein à main", category: "Conduite", difficulty: "moyenne", color: "#8B5CF6" },
  { id: "triple", label: "Enchaîne trois cascades sans t'arrêter", category: "Cascade", difficulty: "difficile", color: "#2DD4BF" },
  { id: "coucher", label: "Photographie un coucher de soleil depuis la plage", category: "Exploration", difficulty: "facile", color: "#FF3D91" },
  { id: "sans-contact", label: "Traverse la ville sans toucher un seul véhicule", category: "Conduite", difficulty: "difficile", color: "#00D4FF" },
  { id: "sans-gps", label: "Rejoins ta crew en moins de 3 minutes, sans GPS", category: "Exploration", difficulty: "moyenne", color: "#8B5CF6" },
  { id: "saut", label: "Réussis le plus long saut possible à moto", category: "Cascade", difficulty: "facile", color: "#2DD4BF" },
];

/** Choisit un défi (index dans DEMO_CHALLENGES), filtré par difficulté si fournie. */
export function pickChallengeIndex(difficulty: Difficulty | null, random: () => number = Math.random): number {
  const pool = DEMO_CHALLENGES.map((c, i) => ({ c, i })).filter(({ c }) => !difficulty || c.difficulty === difficulty);
  const choice = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  return choice.i;
}

/**
 * Rotation finale de la roue (en degrés, sens horaire) pour amener le
 * segment `index` sous le pointeur situé en haut, après `turns` tours complets.
 */
export function targetRotation(current: number, index: number, segments: number, turns = 5): number {
  const size = 360 / segments;
  const center = index * size + size / 2;
  const desired = (360 - center) % 360;
  const delta = (desired - (current % 360) + 360) % 360;
  return current + turns * 360 + delta;
}

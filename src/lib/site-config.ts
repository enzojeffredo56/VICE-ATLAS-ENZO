import {
  BookOpenText,
  Compass,
  Dices,
  Flame,
  Map as MapIcon,
  NotebookPen,
  ScanEye,
  Star,
  Trophy,
  Crown,
  HandHeart,
  type LucideIcon,
} from "lucide-react";

export const siteConfig = {
  name: "VICE ATLAS",
  slogan: "Explore. Découvre. Relève les défis.",
  description:
    "VICE ATLAS, la plateforme indépendante des joueurs de GTA 6 : carte interactive, carnet de progression, guide, comparateur Miami, STUNT ARENA et GTA Roulette.",
  disclaimer:
    "VICE ATLAS est un projet de fans indépendant et non officiel. Il n'est ni affilié, ni approuvé, ni sponsorisé par Rockstar Games ou Take-Two Interactive. Les marques citées appartiennent à leurs propriétaires respectifs.",
} as const;

export type ModuleAccent = "pink" | "cyan" | "violet" | "turquoise";

export type SiteModule = {
  id: string;
  href: `/${string}`;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  accent: ModuleAccent;
  /** Phase de développement où le module devient fonctionnel. */
  phase: number;
};

/** Modules principaux, dans l'ordre d'affichage. */
export const modules: SiteModule[] = [
  {
    id: "carte",
    href: "/carte",
    label: "Carte interactive",
    short: "Carte",
    description: "Zoome, filtre et marque les lieux visités sur une carte pensée pour l'exploration.",
    icon: MapIcon,
    accent: "cyan",
    phase: 2,
  },
  {
    id: "carnet",
    href: "/carnet",
    label: "Carnet de progression",
    short: "Carnet",
    description: "Missions, activités, collectibles et objectifs perso : ta progression, privée par défaut.",
    icon: NotebookPen,
    accent: "turquoise",
    phase: 2,
  },
  {
    id: "guide",
    href: "/guide",
    label: "Guide interactif",
    short: "Guide",
    description: "Fiches pas à pas, sources et dates de mise à jour, reliées directement à la carte.",
    icon: BookOpenText,
    accent: "violet",
    phase: 2,
  },
  {
    id: "comparateur",
    href: "/comparateur",
    label: "Comparateur Miami",
    short: "Comparateur",
    description: "La carte VICE ATLAS face à Miami : satellite, Street View et inspirations vérifiées.",
    icon: ScanEye,
    accent: "cyan",
    phase: 3,
  },
  {
    id: "stunts",
    href: "/stunts",
    label: "STUNT ARENA",
    short: "Stunts",
    description: "Un concours de cascades par spot, chaque semaine. Poste ta vidéo, vote, grimpe au classement.",
    icon: Flame,
    accent: "pink",
    phase: 7,
  },
  {
    id: "roulette",
    href: "/roulette",
    label: "GTA Roulette",
    short: "Roulette",
    description: "Fais tourner la roue, crée un salon privé et lance le même défi à tous tes amis.",
    icon: Dices,
    accent: "violet",
    phase: 6,
  },
];

export type NavItem = { href: `/${string}`; label: string; icon: LucideIcon };

export const mainNav: NavItem[] = modules.map((m) => ({ href: m.href, label: m.short, icon: m.icon }));

export const secondaryNav: NavItem[] = [
  { href: "/classements", label: "Classements", icon: Trophy },
  { href: "/communaute", label: "Communauté", icon: HandHeart },
  { href: "/avis", label: "Avis", icon: Star },
  { href: "/plus", label: "VICE ATLAS PLUS", icon: Crown },
  { href: "/a-propos", label: "À propos", icon: Compass },
];

/** Barre d'onglets mobile (style application). */
export const mobileTabs: NavItem[] = [
  { href: "/", label: "Accueil", icon: Compass },
  { href: "/carte", label: "Carte", icon: MapIcon },
  { href: "/stunts", label: "Stunts", icon: Flame },
  { href: "/roulette", label: "Roulette", icon: Dices },
  { href: "/carnet", label: "Carnet", icon: NotebookPen },
];

export const accentClasses: Record<ModuleAccent, { text: string; bg: string; hoverGlow: string; hex: string }> = {
  pink: { text: "text-pink", bg: "bg-pink/15", hoverGlow: "group-hover:shadow-[0_0_40px_-8px_rgb(255_61_145/0.7)]", hex: "#FF3D91" },
  cyan: { text: "text-cyan", bg: "bg-cyan/15", hoverGlow: "group-hover:shadow-[0_0_40px_-8px_rgb(0_212_255/0.7)]", hex: "#00D4FF" },
  violet: { text: "text-violet", bg: "bg-violet/15", hoverGlow: "group-hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.7)]", hex: "#8B5CF6" },
  turquoise: { text: "text-turquoise", bg: "bg-turquoise/15", hoverGlow: "group-hover:shadow-[0_0_40px_-8px_rgb(45_212_191/0.7)]", hex: "#2DD4BF" },
};

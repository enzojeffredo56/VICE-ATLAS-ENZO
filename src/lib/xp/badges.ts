import { Award, BadgeCheck, Compass, Crown, Flame, HandHeart, Map as MapIcon, Star, Trophy, type LucideIcon } from "lucide-react";

/** Catalogue des badges (identique à la table public.badges). */
export const BADGES: { id: string; name: string; description: string; icon: LucideIcon; color: string }[] = [
  { id: "premier-avis", name: "Premier avis", description: "A donné son avis sur VICE ATLAS.", icon: Star, color: "#FF3D91" },
  { id: "premier-stunt", name: "Premier Stunt", description: "Première participation validée à STUNT ARENA.", icon: Flame, color: "#FFB36B" },
  { id: "champion-du-spot", name: "Champion du spot", description: "A remporté un concours STUNT ARENA.", icon: Trophy, color: "#00D4FF" },
  { id: "legende-du-stunt", name: "Légende du Stunt", description: "A remporté trois concours STUNT ARENA.", icon: Crown, color: "#8B5CF6" },
  { id: "explorateur", name: "Explorateur", description: "A visité 10 lieux de la carte.", icon: Compass, color: "#2DD4BF" },
  { id: "grand-explorateur", name: "Grand explorateur", description: "A visité tous les lieux de la carte.", icon: MapIcon, color: "#00D4FF" },
  { id: "contributeur", name: "Contributeur", description: "Première découverte approuvée par la communauté.", icon: HandHeart, color: "#FF3D91" },
  { id: "expert-communautaire", name: "Expert communautaire", description: "Dix découvertes approuvées.", icon: BadgeCheck, color: "#8B5CF6" },
];

export const fallbackBadgeIcon = Award;

/** Libellés lisibles des motifs du registre d'XP. */
export const XP_REASON_LABELS: Record<string, string> = {
  profile_completed: "Profil complété",
  review_approved: "Avis VICE ATLAS approuvé",
  discovery_approved: "Découverte approuvée",
  stunt_participation: "Participation STUNT ARENA",
  stunt_first: "1re place STUNT ARENA",
  stunt_second: "2e place STUNT ARENA",
  stunt_third: "3e place STUNT ARENA",
  weekly_challenge: "Défi hebdomadaire validé",
  admin_adjustment: "Ajustement de l'équipe",
  reversal: "Correction",
};

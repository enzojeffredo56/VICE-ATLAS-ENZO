"use client";

import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { userData, useUserData } from "@/lib/user-data/use-user-data";
import { cn } from "@/lib/utils";

export function FavoriteGuideButton({ slug, title, compact = false }: { slug: string; title: string; compact?: boolean }) {
  const data = useUserData();
  const fav = data.guideFavorites.includes(slug);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={() => {
        userData.toggleGuideFavorite(slug);
        toast.success(fav ? "Retiré de tes favoris" : "Ajouté à tes favoris");
      }}
      aria-pressed={fav}
      aria-label={fav ? `Retirer « ${title} » des favoris` : `Ajouter « ${title} » aux favoris`}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border transition",
        compact ? "size-10 justify-center" : "h-11 px-4 text-sm font-semibold",
        fav ? "border-pink/50 bg-pink/15 text-white" : "border-white/12 bg-night/60 text-ink/70 hover:text-white",
      )}
    >
      <Heart className={cn("size-4", fav && "fill-pink text-pink")} aria-hidden />
      {!compact && (fav ? "Dans tes favoris" : "Ajouter aux favoris")}
    </motion.button>
  );
}

"use client";

import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Code et lien de parrainage, avec copie et partage natif. */
export function ReferralShare({ code }: { code: string }) {
  const link = typeof window !== "undefined" ? `${window.location.origin}/inscription?parrain=${code}` : `/inscription?parrain=${code}`;
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible", { description: text });
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "VICE ATLAS", text: "Rejoins-moi sur VICE ATLAS, la plateforme des joueurs de GTA 6 !", url: link });
      } catch {
        /* partage annulé */
      }
    } else void copy(link, "Lien");
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => copy(code, "Code")} className="cursor-pointer rounded-2xl border border-pink/40 bg-pink/10 px-5 py-3 font-mono text-2xl tracking-[0.3em] text-white transition hover:bg-pink/20" aria-label={`Copier le code ${code}`}>
          {code}
        </button>
        <Button variant="outline" onClick={() => copy(link, "Lien")}>
          <Copy /> Copier le lien
        </Button>
        <Button onClick={share}>
          <Share2 /> Partager
        </Button>
      </div>
      <p className="break-all font-mono text-xs text-muted-foreground">{link}</p>
    </div>
  );
}

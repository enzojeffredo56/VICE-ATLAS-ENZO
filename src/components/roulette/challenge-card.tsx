import { CHALLENGE_CATEGORIES } from "@/content/challenges";
import { Badge } from "@/components/ui/badge";
import type { Challenge } from "@/lib/roulette/engine";

const DIFF = { facile: "turquoise", moyenne: "cyan", difficile: "pink" } as const;

export function ChallengeCard({ challenge, by }: { challenge: Challenge; by?: string }) {
  const cat = CHALLENGE_CATEGORIES.find((c) => c.id === challenge.category);
  return (
    <div className="neon-border glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={DIFF[challenge.difficulty]}>{challenge.difficulty}</Badge>
        <Badge>
          <span className="size-2 rounded-full" style={{ background: cat?.color }} /> {cat?.label}
        </Badge>
        {challenge.isCustom && <Badge variant="violet">Défi perso</Badge>}
        {by && <span className="ml-auto text-xs text-muted-foreground">tiré par {by}</span>}
      </div>
      <p className="mt-3 font-display text-xl font-semibold sm:text-2xl">{challenge.title}</p>
      {challenge.description && <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>}
    </div>
  );
}

import { cn } from "@/lib/utils";

const WORDS = ["Carte interactive", "Carnet", "Guide", "Comparateur Miami", "STUNT ARENA", "GTA Roulette", "XP & badges", "Classements"];

function Row({ reverse = false, className }: { reverse?: boolean; className?: string }) {
  const items = [...WORDS, ...WORDS];
  return (
    <div className={cn("group flex overflow-hidden", className)}>
      <ul
        className={cn(
          "flex w-max shrink-0 animate-marquee items-center gap-8 pr-8 group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {[...items, ...items].map((w, i) => (
          <li key={i} className="flex items-center gap-8 font-display text-2xl font-bold whitespace-nowrap uppercase sm:text-4xl">
            <span className="transition-colors duration-300 hover:text-pink">{w}</span>
            <span className="text-cyan" aria-hidden>
              ✦
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bandeau défilant incliné (pause au survol). */
export function Marquee() {
  return (
    <div aria-hidden className="relative z-10 -my-6 overflow-hidden py-10">
      <div className="-rotate-2 border-y border-pink/40 bg-gradient-to-r from-pink/90 via-violet/90 to-cyan/90 py-3 text-night shadow-[0_0_60px_-10px_rgb(255_61_145/0.7)]">
        <Row />
      </div>
      <div className="mt-[-6px] rotate-1 border-y border-white/10 bg-surface py-3 text-ink/40">
        <Row reverse />
      </div>
    </div>
  );
}

"use client";

import { CHALLENGE_CATEGORIES, type ChallengeCategory } from "@/content/challenges";
import { DIFFICULTIES, type Difficulty } from "@/lib/roulette/demo-challenges";
import { cn } from "@/lib/utils";

export function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200",
        active ? "border-pink/60 bg-pink/15 text-white shadow-[0_0_20px_-6px_rgb(255_61_145/0.8)]" : "border-white/12 text-ink/70 hover:border-white/30 hover:text-white",
      )}
    >
      {color && <span className="size-2.5 rounded-full" style={{ background: color }} aria-hidden />}
      {children}
    </button>
  );
}

export function RouletteFilters({
  difficulty,
  setDifficulty,
  categories,
  toggleCategory,
}: {
  difficulty: Difficulty | null;
  setDifficulty: (d: Difficulty | null) => void;
  categories: Set<ChallengeCategory>;
  toggleCategory: (c: ChallengeCategory) => void;
}) {
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Difficulté">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-ink/50 uppercase">Difficulté</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={difficulty === null} onClick={() => setDifficulty(null)}>
            Toutes
          </Chip>
          {DIFFICULTIES.map((d) => (
            <Chip key={d.value} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </div>
      <div role="group" aria-label="Catégories">
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-ink/50 uppercase">Catégories {categories.size === 0 && "(toutes)"}</p>
        <div className="flex flex-wrap gap-2">
          {CHALLENGE_CATEGORIES.map((c) => (
            <Chip key={c.id} active={categories.has(c.id)} onClick={() => toggleCategory(c.id)} color={c.color}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

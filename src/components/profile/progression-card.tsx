import { getLevelInfo, LEVEL_THRESHOLDS } from "@/lib/xp/levels";
import { BADGES } from "@/lib/xp/badges";
import { cn } from "@/lib/utils";

export type Progression = {
  xp: number;
  level: number;
  badges: { id: string; name: string; awardedAt: string }[];
  progress?: { visited: number; places: number; done: number; items: number } | null;
};

/** Niveau, barre d'XP et badges (profil privé comme public). */
export function ProgressionCard({ data, showLocked = true }: { data: Progression; showLocked?: boolean }) {
  const info = getLevelInfo(data.xp);
  const earned = new Set(data.badges.map((b) => b.id));
  const pct = Math.round(info.progress * 100);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="font-display text-3xl font-bold">
            Niveau <span className="text-neon">{info.level}</span>
          </p>
          <p className="font-mono text-sm text-cyan tabular-nums">
            {data.xp.toLocaleString("fr-FR")} XP
            {info.nextThreshold !== null && <span className="text-muted-foreground"> / {info.nextThreshold.toLocaleString("fr-FR")}</span>}
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progression vers le niveau suivant">
          <div className="h-full rounded-full bg-gradient-to-r from-pink via-violet to-cyan transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {info.nextThreshold === null ? "Niveau maximum atteint." : `Encore ${(info.nextThreshold - data.xp).toLocaleString("fr-FR")} XP pour le niveau ${info.level + 1}. Niveaux : ${LEVEL_THRESHOLDS.length}.`}
        </p>
      </div>

      {data.progress && (
        <p className="text-sm text-ink/85">
          Carnet : {data.progress.visited}/{data.progress.places} lieux visités · {data.progress.done}/{data.progress.items} objectifs terminés
        </p>
      )}

      <div id="badges" className="scroll-mt-28">
        <h3 className="mb-3 text-sm font-semibold">
          Badges <span className="text-muted-foreground">({earned.size}/{BADGES.length})</span>
        </h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BADGES.filter((b) => showLocked || earned.has(b.id)).map((b) => {
            const Icon = b.icon;
            const has = earned.has(b.id);
            return (
              <li
                key={b.id}
                title={b.description}
                className={cn("flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition", has ? "border-white/15 bg-white/[0.04]" : "border-dashed border-white/10 opacity-40 grayscale")}
              >
                <span className="grid size-12 place-items-center rounded-full border-2" style={{ borderColor: `${b.color}80`, background: `${b.color}1f`, color: b.color }}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-xs font-semibold">{b.name}</span>
                <span className="sr-only">{has ? "obtenu" : "pas encore obtenu"}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

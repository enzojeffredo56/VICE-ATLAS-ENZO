import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/** État vide réutilisable (listes sans résultat, modules à venir…). */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative grid size-16 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-cyan/20" aria-hidden />
        <span className="relative grid size-14 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
          <Icon className="size-6" aria-hidden />
        </span>
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

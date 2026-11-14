import { cn } from "@/lib/utils";

/** Indicateur de chargement : boussole qui tourne. */
export function Spinner({ className, label = "Chargement…" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-3 text-sm text-muted-foreground", className)}>
      <svg viewBox="0 0 48 48" className="size-8 animate-spin [animation-duration:1.4s]" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(248 250 252 / 0.1)" strokeWidth="3" />
        <path d="M24 4a20 20 0 0 1 20 20" fill="none" stroke="url(#sp)" strokeWidth="3" strokeLinecap="round" />
        <path d="M24 12 28 24 24 36 20 24Z" fill="#FF3D91" />
        <defs>
          <linearGradient id="sp" x1="0" x2="1">
            <stop offset="0" stopColor="#FF3D91" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
      </svg>
      <span>{label}</span>
    </span>
  );
}

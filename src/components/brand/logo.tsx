import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="VICE ATLAS, retour à l'accueil"
      className={cn("group inline-flex items-center gap-2.5 rounded-full", className)}
    >
      <LogoMark className="size-9 transition-transform duration-700 ease-out group-hover:rotate-[360deg]" />
      {!compact && (
        <span className="font-display text-lg leading-none font-bold tracking-[0.14em]">
          VICE <span className="text-neon">ATLAS</span>
        </span>
      )}
    </Link>
  );
}

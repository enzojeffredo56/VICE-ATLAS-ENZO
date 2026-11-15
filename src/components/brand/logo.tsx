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
        <span className="text-sunset font-brand pr-1 text-[1.9rem] leading-none transition-[filter] duration-300 group-hover:brightness-125">
          Vice Atlas
        </span>
      )}
    </Link>
  );
}

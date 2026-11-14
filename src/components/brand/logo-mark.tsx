import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Emblème VICE ATLAS : rose des vents néon dans un anneau de repère
 * cartographique. Création originale, sans élément de marque tiers.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-9", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF3D91" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#00D4FF" />
        </linearGradient>
        <linearGradient id={`n-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF6FB0" />
          <stop offset="1" stopColor="#FF3D91" />
        </linearGradient>
        <linearGradient id={`s-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      {/* Anneau extérieur + graduations */}
      <circle cx="32" cy="32" r="28" fill="none" stroke={`url(#ring-${id})`} strokeWidth="3" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="rgb(248 250 252 / 0.18)" strokeWidth="1" strokeDasharray="2 3.5" />
      {[45, 135, 225, 315].map((a) => (
        <line
          key={a}
          x1="32"
          y1="6"
          x2="32"
          y2="10"
          stroke="rgb(248 250 252 / 0.55)"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {/* Aiguilles secondaires (est / ouest) */}
      <path d="M32 32 L52 32 L36 28 Z M32 32 L12 32 L28 36 Z" fill="#8B5CF6" opacity="0.9" />
      <path d="M32 32 L52 32 L36 36 Z M32 32 L12 32 L28 28 Z" fill="#B49CFF" opacity="0.55" />
      {/* Aiguille nord (rose) et sud (cyan) */}
      <path d="M32 6 L37 30 L32 32 L27 30 Z" fill={`url(#n-${id})`} />
      <path d="M32 58 L27 34 L32 32 L37 34 Z" fill={`url(#s-${id})`} />
      <circle cx="32" cy="32" r="3.2" fill="#0B1020" stroke="#F8FAFC" strokeWidth="1.6" />
    </svg>
  );
}

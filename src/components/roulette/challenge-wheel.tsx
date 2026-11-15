"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect, useRef } from "react";
import { WHEEL_SEGMENTS } from "@/lib/roulette/engine";
import { targetRotation } from "@/lib/roulette/demo-challenges";

const N = WHEEL_SEGMENTS.length;
const R = 150;

function segmentPath(i: number) {
  const a0 = ((i * 360) / N - 90) * (Math.PI / 180);
  const a1 = (((i + 1) * 360) / N - 90) * (Math.PI / 180);
  return `M160 160 L${(160 + R * Math.cos(a0)).toFixed(2)} ${(160 + R * Math.sin(a0)).toFixed(2)} A${R} ${R} 0 0 1 ${(160 + R * Math.cos(a1)).toFixed(2)} ${(160 + R * Math.sin(a1)).toFixed(2)} Z`;
}

/**
 * Roue des catégories. Quand `target` change (nouvel identifiant de tirage),
 * elle tourne et s'arrête sur le segment demandé, puis appelle onDone.
 */
export function ChallengeWheel({
  target,
  onDone,
  onHubClick,
  disabled,
}: {
  target: { key: string; index: number } | null;
  onDone?: () => void;
  onHubClick?: () => void;
  disabled?: boolean;
}) {
  const [scope, animate] = useAnimate();
  const rotation = useRef(0);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!target || target.key === lastKey.current) return;
    lastKey.current = target.key;
    const next = targetRotation(rotation.current, target.index, N);
    rotation.current = next;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    void animate(scope.current, { rotate: next }, { duration: reduce ? 0 : 4, ease: [0.12, 0.8, 0.18, 1] }).then(() => onDone?.());
  }, [target, animate, scope, onDone]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      <div aria-hidden className="absolute inset-[6%] rounded-full bg-gradient-to-br from-pink/40 to-cyan/40 blur-3xl" />
      <div aria-hidden className="absolute top-[1%] left-1/2 z-20 -translate-x-1/2">
        <svg viewBox="0 0 40 48" className="w-10 drop-shadow-[0_0_10px_rgb(255_255_255/0.6)]">
          <path d="M20 46 L4 10 A16 16 0 1 1 36 10 Z" fill="#F8FAFC" />
          <circle cx="20" cy="16" r="6" fill="#FF3D91" />
        </svg>
      </div>
      <motion.div ref={scope} className="relative size-full">
        <svg viewBox="0 0 320 320" className="size-full" role="img" aria-label="Roue des catégories de défis">
          <defs>
            <linearGradient id="cw-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FF3D91" />
              <stop offset="1" stopColor="#00D4FF" />
            </linearGradient>
          </defs>
          <circle cx="160" cy="160" r="158" fill="#0B1020" stroke="url(#cw-ring)" strokeWidth="4" />
          {WHEEL_SEGMENTS.map((s, i) => (
            <g key={s.key}>
              <path d={segmentPath(i)} fill={s.color} opacity={i % 2 ? 0.85 : 0.6} stroke="#0B1020" strokeWidth="2" />
              <text x="160" y="52" textAnchor="middle" transform={`rotate(${((i + 0.5) * 360) / N} 160 160)`} className="fill-white font-display text-[12px] font-bold">
                {s.label.toUpperCase()}
              </text>
            </g>
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={i} cx={160 + 154 * Math.cos((i * 12 * Math.PI) / 180)} cy={160 + 154 * Math.sin((i * 12 * Math.PI) / 180)} r="2" fill={i % 2 ? "#00D4FF" : "#FF3D91"} />
          ))}
        </svg>
      </motion.div>
      <button
        type="button"
        onClick={onHubClick}
        disabled={disabled}
        aria-label="Lancer la roue"
        className="absolute top-1/2 left-1/2 z-10 grid size-[22%] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-4 border-night bg-gradient-to-br from-pink to-violet font-display text-sm font-bold text-white shadow-[0_0_40px_rgb(255_61_145/0.7)] transition-transform hover:scale-110 active:scale-95 disabled:cursor-wait disabled:opacity-80"
      >
        GO
      </button>
    </div>
  );
}

"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

/** Halo néon qui suit la souris (souris uniquement, jamais au tactile). */
export function CursorGlow() {
  const x = useSpring(useMotionValue(-400), { stiffness: 120, damping: 22, mass: 0.6 });
  const y = useSpring(useMotionValue(-400), { stiffness: 120, damping: 22, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX - 200);
      y.set(e.clientY - 200);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed top-0 left-0 z-0 hidden size-[400px] pointer-fine:block motion-reduce:hidden rounded-full bg-[radial-gradient(circle,rgb(139_92_246/0.16),transparent_65%)] mix-blend-screen"
    />
  );
}

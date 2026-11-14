"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Fournit :
 *  - MotionConfig reducedMotion="user" : les animations de transformation
 *    sont neutralisées si l'utilisateur a activé « réduire les animations » ;
 *  - Lenis : défilement fluide (désactivé au tactile et en mouvement réduit).
 */
export function MotionProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

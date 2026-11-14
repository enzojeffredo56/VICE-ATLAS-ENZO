"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Fine barre néon en haut de page indiquant l'avancée du scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-pink via-violet to-cyan shadow-[0_0_12px_rgb(255_61_145/0.8)]"
    />
  );
}

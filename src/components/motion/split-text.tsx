"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Titre révélé mot par mot (masque + glissement vertical). */
export function SplitText({
  text,
  className,
  wordClassName,
  delay = 0,
  inView = true,
}: {
  text: string;
  className?: string;
  wordClassName?: (word: string, index: number) => string | undefined;
  delay?: number;
  inView?: boolean;
}) {
  const words = text.split(" ");
  const animate = { y: "0%", rotate: 0, opacity: 1 };
  return (
    <span className={cn("inline", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName?.(word, i))}
            initial={{ y: "110%", rotate: 6, opacity: 0 }}
            {...(inView
              ? { whileInView: animate, viewport: { once: true } }
              : { animate })}
            transition={{ duration: 0.9, delay: delay + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

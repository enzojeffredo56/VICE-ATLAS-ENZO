"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, MapPin } from "lucide-react";
import type { GuideStep } from "@/lib/content/schemas";
import { userData, useUserData } from "@/lib/user-data/use-user-data";
import { cn } from "@/lib/utils";

/** Étapes cochables d'un guide ; la progression est sauvegardée automatiquement. */
export function GuideSteps({ slug, steps, placeNames }: { slug: string; steps: GuideStep[]; placeNames: Record<string, string> }) {
  const data = useUserData();
  const done = new Set(data.guideSteps[slug] ?? []);
  const percent = Math.round((done.size / steps.length) * 100);

  return (
    <section aria-labelledby="steps-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="steps-title" className="text-2xl font-bold">
          Étapes
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums" role="status">
          {done.size} / {steps.length} terminée{done.size > 1 ? "s" : ""}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <motion.div className="h-full rounded-full bg-gradient-to-r from-pink via-violet to-cyan" animate={{ width: `${percent}%` }} transition={{ duration: 0.6 }} />
      </div>

      <ol className="relative mt-8 space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[1.2rem] before:w-px before:bg-gradient-to-b before:from-pink/60 before:via-violet/40 before:to-cyan/20">
        {steps.map((step, i) => {
          const checked = done.has(i);
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5, delay: 0.04 * i }}
              className="relative flex gap-4"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={`Étape ${i + 1} : ${step.title}`}
                onClick={() => userData.toggleGuideStep(slug, i)}
                className={cn(
                  "relative z-10 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-2 font-display text-sm font-bold transition-all duration-300 active:scale-90",
                  checked
                    ? "border-turquoise bg-turquoise text-night shadow-[0_0_20px_-4px_rgb(45_212_191/0.9)]"
                    : "border-white/20 bg-night text-ink/80 hover:border-pink",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {checked ? (
                    <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="size-5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <div className={cn("glass flex-1 rounded-2xl p-5 transition-opacity", checked && "opacity-70")}>
                <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-ink/80">{step.body}</p>
                {step.placeSlug && placeNames[step.placeSlug] && (
                  <Link
                    href={`/carte?lieu=${step.placeSlug}`}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-sm font-medium text-cyan transition hover:bg-cyan/20"
                  >
                    <MapPin className="size-4" aria-hidden /> {placeNames[step.placeSlug]} sur la carte
                  </Link>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

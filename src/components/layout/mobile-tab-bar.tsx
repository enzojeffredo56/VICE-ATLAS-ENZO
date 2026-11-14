"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { mobileTabs } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { isActivePath } from "./site-header";

/** Barre d'onglets façon application, visible sur mobile uniquement. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation de l'application"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)] lg:hidden"
    >
      <ul className="mx-auto grid border border-white/10 bg-surface/92 backdrop-blur-xl max-w-md grid-cols-5 rounded-3xl p-1.5 shadow-[0_-10px_50px_-20px_rgb(0_0_0/0.9)]">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActivePath(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium transition-colors",
                  active ? "text-white" : "text-ink/60 active:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-pink/25 to-violet/15 ring-1 ring-pink/30"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <motion.span whileTap={{ scale: 0.85 }} className="relative">
                  <Icon className={cn("size-5", active && "text-pink drop-shadow-[0_0_8px_rgb(255_61_145/0.8)]")} aria-hidden />
                </motion.span>
                <span className="relative">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { MobileAccountButtons, UserMenu } from "@/components/auth/user-menu";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNav, secondaryNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 480 && y > prev + 4 && !open);
    if (y < prev - 4) setHidden(false);
  });

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: hidden ? -96 : 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5"
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-full px-3 pl-4 transition-all duration-500 sm:px-4 sm:pl-5",
          scrolled
            ? "border border-white/10 bg-night/85 shadow-[0_20px_60px_-25px_rgb(0_0_0/0.9)] backdrop-blur-xl"
            : "border border-transparent bg-transparent",
        )}
      >
        <Logo />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1" onPointerLeave={() => setHovered(null)}>
            {mainNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={() => setHovered(item.href)}
                    onFocus={() => setHovered(item.href)}
                    className={cn(
                      "relative z-10 block rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      active ? "text-white" : "text-ink/70 hover:text-white",
                    )}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-pink to-cyan"
                      />
                    )}
                  </Link>
                  {hovered === item.href && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 rounded-full bg-white/[0.07]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <div className="flex items-center justify-between border-b border-white/10 p-4 pl-5">
                <SheetTitle asChild>
                  <span className="text-sunset font-brand pr-1 text-3xl leading-none">Vice Atlas</span>
                </SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Fermer le menu">
                    <X className="size-5" />
                  </Button>
                </SheetClose>
              </div>
              <SheetDescription className="sr-only">{siteConfig.slogan}</SheetDescription>
              <MobileMenuLinks pathname={pathname} onNavigate={() => setOpen(false)} open={open} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}

function MobileMenuLinks({
  pathname,
  onNavigate,
  open,
}: {
  pathname: string;
  onNavigate: () => void;
  open: boolean;
}) {
  const all = [...mainNav, ...secondaryNav];
  return (
    <nav aria-label="Menu mobile" className="flex flex-1 flex-col overflow-y-auto p-3">
      <AnimatePresence>
        {open && (
          <ul className="flex flex-col gap-1">
            {all.map((item, i) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.035, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-base font-medium transition-colors",
                      active ? "bg-white/[0.08] text-white" : "text-ink/80 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-xl border",
                        active ? "border-pink/40 bg-pink/15 text-pink" : "border-white/10 bg-white/[0.04] text-cyan",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {item.label}
                  </Link>
                  {i === mainNav.length - 1 && <div className="mx-3 my-2 h-px bg-white/10" />}
                </motion.li>
              );
            })}
          </ul>
        )}
      </AnimatePresence>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-6 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <MobileAccountButtons onNavigate={onNavigate} />
      </div>
    </nav>
  );
}

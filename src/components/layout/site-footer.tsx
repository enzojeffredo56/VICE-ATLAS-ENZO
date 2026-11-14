import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { mainNav, secondaryNav, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-gradient-to-b from-transparent to-black/30 pb-28 lg:pb-10">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <span className="font-display text-xl font-bold tracking-[0.14em]">
              VICE <span className="text-neon">ATLAS</span>
            </span>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">{siteConfig.slogan}</p>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground/80">{siteConfig.disclaimer}</p>
        </div>
        <FooterColumn title="Explorer" items={mainNav} />
        <FooterColumn title="VICE ATLAS" items={secondaryNav} />
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 px-5 text-xs text-muted-foreground/70 sm:flex-row sm:justify-between sm:px-8">
        <p>© {2026} VICE ATLAS — projet indépendant.</p>
        <p>Par et pour les joueurs · Thème Miami Neon</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-ink/50 uppercase">{title}</h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 text-sm text-ink/75 transition-colors hover:text-white"
            >
              <span className="h-px w-0 bg-gradient-to-r from-pink to-cyan transition-all duration-300 group-hover:w-4" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { isSupabaseConfigured } from "@/lib/env";

/** Cadre commun des pages de connexion / inscription. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="relative isolate grid min-h-[100svh] place-items-center px-5 pt-28 pb-28">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_30%,rgb(255_61_145/0.18),transparent_70%),radial-gradient(ellipse_40%_40%_at_70%_70%,rgb(0_212_255/0.12),transparent_70%)]" />
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" aria-label="Retour à l'accueil">
            <LogoMark className="size-14 animate-spin-slow" />
          </Link>
          <h1 className="mt-4 text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="glass rounded-3xl p-6 sm:p-8">
          {!isSupabaseConfigured && (
            <p className="mb-5 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-3 text-sm text-ink/85">
              Aperçu : les comptes joueurs seront actifs dès que la base de données sera branchée.
            </p>
          )}
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </section>
  );
}

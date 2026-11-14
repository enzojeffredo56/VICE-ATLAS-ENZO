import type { Metadata } from "next";
import { Download, Scale, ShieldCheck, Smartphone } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-36 pb-16 sm:px-8">
      <Reveal>
        <h1 className="text-4xl font-bold sm:text-6xl">
          À propos de <span className="text-neon">VICE ATLAS</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">{siteConfig.description}</p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <Scale className="size-6 text-pink" aria-hidden />
              <CardTitle>Projet indépendant</CardTitle>
              <CardDescription>{siteConfig.disclaimer}</CardDescription>
            </CardHeader>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <CardHeader>
              <ShieldCheck className="size-6 text-turquoise" aria-hidden />
              <CardTitle>Contenus originaux</CardTitle>
              <CardDescription>
                Cartes et visuels sont originaux ou utilisés légalement. Aucune information n&apos;est présentée comme
                officielle sans source vérifiée.
              </CardDescription>
            </CardHeader>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <section id="installer" className="glass mt-12 scroll-mt-28 rounded-3xl p-7 sm:p-9">
          <h2 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
            <Smartphone className="size-7 text-cyan" aria-hidden /> Installer l&apos;application
          </h2>
          <p className="mt-3 text-muted-foreground">
            VICE ATLAS est une application web installable (PWA) : pas besoin de store.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-5">
              <h3 className="font-semibold">iPhone / iPad (Safari)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Ouvre VICE ATLAS dans Safari.</li>
                <li>Touche le bouton Partager.</li>
                <li>Choisis « Sur l&apos;écran d&apos;accueil ».</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 p-5">
              <h3 className="font-semibold">Android (Chrome)</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Ouvre VICE ATLAS dans Chrome.</li>
                <li>Touche le menu ⋮.</li>
                <li>Choisis « Installer l&apos;application ».</li>
              </ol>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="size-3.5" aria-hidden /> Le mode hors ligne limité arrive en phase 9.
          </p>
        </section>
      </Reveal>
    </div>
  );
}

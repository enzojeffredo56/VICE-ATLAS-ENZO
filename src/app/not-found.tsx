import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="grid min-h-[80svh] place-items-center px-5 pt-28 text-center">
      <div>
        <p className="font-display text-[clamp(6rem,24vw,14rem)] leading-none font-bold text-neon">404</p>
        <div className="mx-auto mt-2 flex w-fit items-center gap-2 text-muted-foreground">
          <Compass className="size-5 animate-spin-slow text-cyan" aria-hidden />
          Hors de la carte
        </div>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Ce lieu n&apos;existe pas (encore).</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">La page demandée est introuvable. Reviens au point de départ pour reprendre l&apos;exploration.</p>
        <Button asChild className="mt-8">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </section>
  );
}

"use client";

import { toast } from "sonner";
import { ArrowRight, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/states/empty-state";
import { Spinner } from "@/components/states/spinner";
import { LogoMark } from "@/components/brand/logo-mark";

const COLORS = [
  { name: "Fond", hex: "#0B1020" },
  { name: "Rose", hex: "#FF3D91" },
  { name: "Cyan", hex: "#00D4FF" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Turquoise", hex: "#2DD4BF" },
  { name: "Texte", hex: "#F8FAFC" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** Vitrine interne des composants (non indexée). */
export function DesignSystemDemo() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 px-5 pt-36 pb-16 sm:px-8">
      <div className="flex items-center gap-4">
        <LogoMark className="size-16" title="Emblème VICE ATLAS" />
        <div>
          <h1 className="text-4xl font-bold">Design system</h1>
          <p className="text-muted-foreground">Thème Miami Neon · Space Grotesk &amp; Inter</p>
        </div>
      </div>

      <Block title="Palette">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          {COLORS.map((c) => (
            <div key={c.hex} className="overflow-hidden rounded-2xl border border-white/10">
              <div className="h-16" style={{ background: c.hex }} />
              <div className="p-3 text-xs">
                <p className="font-semibold">{c.name}</p>
                <p className="font-mono text-muted-foreground">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Boutons">
        <div className="flex flex-wrap gap-3">
          <Button>Principal</Button>
          <Button variant="cyan">Cyan</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="destructive">Danger</Button>
          <Button variant="link">Lien</Button>
          <Button disabled>Désactivé</Button>
          <Button size="icon" aria-label="Suivant">
            <ArrowRight />
          </Button>
        </div>
      </Block>

      <Block title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutre</Badge>
          <Badge variant="pink">Rose</Badge>
          <Badge variant="cyan">Cyan</Badge>
          <Badge variant="violet">Violet</Badge>
          <Badge variant="turquoise">Turquoise</Badge>
        </div>
      </Block>

      <Block title="Cartes et panneaux">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Panneau verre</CardTitle>
              <CardDescription>Surface translucide avec flou d&apos;arrière-plan.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-ink/80">Contenu de la carte.</CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <div className="neon-border glass rounded-2xl p-6">
            <p className="font-display text-lg font-semibold">Bordure néon animée</p>
            <p className="mt-1 text-sm text-muted-foreground">Pour les éléments mis en avant (Premium, défi tiré…).</p>
          </div>
        </div>
      </Block>

      <Block title="Chargement">
        <div className="grid items-center gap-6 sm:grid-cols-2">
          <Spinner />
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Block>

      <Block title="État vide">
        <EmptyState
          icon={Inbox}
          title="Aucune découverte pour l'instant"
          description="Propose un lieu à la communauté : il apparaîtra ici après modération."
          action={<Button size="sm">Proposer un lieu</Button>}
        />
      </Block>

      <Block title="Notifications et confirmation">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success("Lieu ajouté aux favoris")}>
            Succès
          </Button>
          <Button variant="outline" onClick={() => toast.error("Impossible d'enregistrer", { description: "Vérifie ta connexion." })}>
            Erreur
          </Button>
          <Button variant="outline" onClick={() => toast.info("Nouveau concours STUNT ARENA ouvert")}>
            Info
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <Trash2 /> Supprimer
              </Button>
            }
            title="Supprimer ce favori ?"
            description="Le lieu sera retiré de tes favoris. Tu pourras l'ajouter à nouveau plus tard."
            confirmLabel="Supprimer"
            destructive
            onConfirm={() => {
              toast.success("Favori supprimé");
            }}
          />
        </div>
      </Block>
    </div>
  );
}

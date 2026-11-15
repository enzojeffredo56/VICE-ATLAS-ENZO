import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, ExternalLink, Lock, UserRound } from "lucide-react";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { ProfileExtras } from "@/components/profile/profile-extras";
import { EmptyState } from "@/components/states/empty-state";
import { Spinner } from "@/components/states/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = { title: "Mon profil", robots: { index: false } };

export default function ProfilPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-16 sm:px-8">
      <Suspense fallback={<Spinner label="Chargement de ton profil…" />}>
        <Profile />
      </Suspense>
    </div>
  );
}

async function Profile() {
  if (!isSupabaseConfigured) {
    return (
      <EmptyState
        icon={UserRound}
        title="Les profils joueurs arrivent bientôt"
        description="Dès que la base de données sera branchée, tu pourras créer ton compte, choisir ton pseudo et synchroniser ta progression."
        action={
          <Button asChild>
            <Link href="/carnet">Voir mon carnet en attendant</Link>
          </Button>
        }
      />
    );
  }
  const session = await getSession();
  if (!session) redirect("/connexion?suite=/profil");
  const p = session.profile;
  if (!p) return <EmptyState icon={UserRound} title="Profil introuvable" description="Déconnecte-toi puis reconnecte-toi. Si le problème persiste, contacte-nous." />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
            <Lock className="size-3.5" aria-hidden /> Mon compte
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">{p.username}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Membre depuis le {formatDateFr(p.created_at)}
            </span>
            <Badge variant={p.is_public ? "turquoise" : "default"}>{p.is_public ? "Profil public" : "Profil privé"}</Badge>
          </p>
        </div>
        {p.is_public && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/joueurs/${p.username}`}>
              <ExternalLink /> Voir mon profil public
            </Link>
          </Button>
        )}
      </div>
      <ProfileEditor profile={p} />
      <ProfileExtras userId={session.userId} referralCode={p.referral_code} />
    </div>
  );
}

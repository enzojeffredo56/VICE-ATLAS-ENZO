import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarDays, UserRoundX } from "lucide-react";
import { Avatar } from "@/components/auth/user-menu";
import { PublicProfileExtras } from "@/components/profile/public-profile-extras";
import { EmptyState } from "@/components/states/empty-state";
import { Spinner } from "@/components/states/spinner";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = { title: "Profil joueur" };

export function generateStaticParams() {
  return [{ pseudo: "exemple" }];
}

export default function JoueurPage({ params }: PageProps<"/joueurs/[pseudo]">) {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32 pb-16 sm:px-8">
      <Suspense fallback={<Spinner label="Chargement du profil…" />}>
        <PublicProfile params={params} />
      </Suspense>
    </div>
  );
}

async function PublicProfile({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = await params;
  const unavailable = (
    <EmptyState icon={UserRoundX} title="Profil privé ou introuvable" description="Ce joueur n'existe pas ou a choisi de garder son profil privé." />
  );
  if (!isSupabaseConfigured || !/^[A-Za-z0-9_]{3,20}$/.test(pseudo)) return unavailable;

  const sb = await createSupabaseServerClient();
  // La base ne renvoie que les profils publics (RLS)
  const { data: p } = await sb
    .from("profiles")
    .select("id,username,avatar_url,bio,show_progress,created_at,is_public")
    .ilike("username", pseudo)
    .eq("is_public", true)
    .maybeSingle();
  if (!p) return unavailable;

  return (
    <div className="space-y-8">
      <div className="glass flex flex-col items-center gap-5 rounded-3xl p-8 text-center sm:flex-row sm:text-left">
        <Avatar url={p.avatar_url} name={p.username} className="size-28 text-4xl" />
        <div>
          <h1 className="text-4xl font-bold">{p.username}</h1>
          {p.bio && <p className="mt-2 max-w-xl text-ink/85">{p.bio}</p>}
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden /> Membre depuis le {formatDateFr(p.created_at)}
          </p>
        </div>
      </div>
      <PublicProfileExtras userId={p.id} showProgress={p.show_progress} />
    </div>
  );
}

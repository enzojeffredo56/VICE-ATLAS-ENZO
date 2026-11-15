import type { Metadata } from "next";
import { Suspense } from "react";
import { MessageSquareHeart, Star } from "lucide-react";
import { ReviewForm } from "@/components/reviews/review-form";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/states/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";
import type { ReviewStats } from "@/lib/reviews/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata: Metadata = {
  title: "Avis sur VICE ATLAS",
  description: "Les avis des joueurs sur la plateforme VICE ATLAS. Donne le tien : +20 XP après vérification, quelle que soit ta note.",
};

export default function AvisPage() {
  return (
    <div className="relative isolate mx-auto max-w-5xl px-5 pt-32 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgb(255_61_145/0.2),transparent_70%)]" />
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.25em] text-cyan uppercase">Ton avis compte</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Que penses-tu de <span className="text-sunset font-brand pr-2 font-normal">Vice Atlas</span> ?
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Les avis portent sur la plateforme VICE ATLAS, pas sur les lieux du jeu. Un avis par joueur, modifiable à tout moment.
        </p>
      </Reveal>
      <Suspense fallback={<Skeleton className="mt-10 h-96 rounded-3xl" />}>
        <Reviews />
      </Suspense>
    </div>
  );
}

async function Reviews() {
  let stats: ReviewStats = { count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  let reviews: { id: string; rating: number; comment: string; updated_at: string; profiles: { username: string; is_public: boolean } | null }[] = [];
  let mine: { rating: number; comment: string; status: string } | null = null;

  if (isSupabaseConfigured) {
    const sb = await createSupabaseServerClient();
    const [{ data: s }, { data: list }, { data: auth }] = await Promise.all([
      sb.rpc("review_stats"),
      sb.from("reviews").select("id,rating,comment,updated_at,profiles(username,is_public)").eq("status", "approved").order("updated_at", { ascending: false }).limit(50),
      sb.auth.getUser(),
    ]);
    if (s) stats = s as ReviewStats;
    reviews = (list ?? []) as unknown as typeof reviews;
    if (auth.user) {
      const { data } = await sb.from("reviews").select("rating,comment,status").eq("user_id", auth.user.id).maybeSingle();
      mine = data;
    }
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-6">
        <section aria-label="Note moyenne" className="glass rounded-3xl p-6">
          <div className="flex items-end gap-3">
            <p className="font-display text-6xl font-bold tabular-nums">{stats.count ? stats.average.toFixed(1).replace(".", ",") : "—"}</p>
            <p className="pb-2 text-muted-foreground">/ 5 · {stats.count} avis</p>
          </div>
          <ul className="mt-5 space-y-2">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const count = stats.distribution[String(n) as keyof ReviewStats["distribution"]] ?? 0;
              const pct = stats.count ? Math.round((count / stats.count) * 100) : 0;
              return (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="flex w-10 items-center gap-1 tabular-nums">
                    {n} <Star className="size-3.5 fill-pink text-pink" aria-hidden />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-gradient-to-r from-pink to-violet" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-8 text-right text-muted-foreground tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>
        <section aria-label="Donner mon avis" className="glass rounded-3xl p-6">
          <ReviewForm existing={mine} />
        </section>
      </div>

      <section aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="text-xl font-bold">
          Avis publiés
        </h2>
        {reviews.length === 0 ? (
          <EmptyState className="mt-4" icon={MessageSquareHeart} title="Aucun avis pour l'instant" description="Sois le premier à donner ton avis sur VICE ATLAS." />
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex" aria-label={`${r.rating} sur 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={n <= r.rating ? "size-4 fill-pink text-pink" : "size-4 text-ink/20"} aria-hidden />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.profiles?.is_public ? r.profiles.username : "Joueur anonyme"} · {formatDateFr(r.updated_at)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-ink/90">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

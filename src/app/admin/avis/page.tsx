import { Suspense } from "react";
import { Info } from "lucide-react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { ReviewModerationList } from "@/components/reviews/moderation-list";
import { Spinner } from "@/components/states/spinner";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Modération des avis" };

export default function AdminAvisPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Modération des avis</h1>
      <p className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
        Une note basse n&apos;est jamais un motif de refus. Les critiques respectueuses sont publiées et rapportent les mêmes +20 XP. On ne
        refuse que les propos irrespectueux, le spam, les données personnelles d&apos;un tiers ou les avis hors sujet.
      </p>
      <div className="mt-6">
        <Suspense fallback={<Spinner label="Chargement des avis…" />}>
          <Queue />
        </Suspense>
      </div>
    </>
  );
}

async function Queue() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="text-muted-foreground">Base de données non configurée : aucun avis à modérer.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  const sb = await createSupabaseServerClient();
  const { data } = await sb
    .from("reviews")
    .select("id,rating,comment,updated_at,profiles(username)")
    .eq("status", "pending")
    .order("updated_at", { ascending: true })
    .limit(100);
  const items = (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    updated_at: r.updated_at,
    username: (r.profiles as unknown as { username: string } | null)?.username ?? "Joueur",
  }));
  return <ReviewModerationList items={items} />;
}

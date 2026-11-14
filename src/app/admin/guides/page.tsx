import Link from "next/link";
import { Suspense } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { Spinner } from "@/components/states/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoGuides, guideCategories } from "@/content/guides";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata = { title: "Guides" };

type Row = { key: string; href: string; title: string; status: "draft" | "published" | "archived"; category: string; updatedAt: string };

const STATUS = {
  draft: { label: "Brouillon", variant: "default" },
  published: { label: "Publié", variant: "turquoise" },
  archived: { label: "Archivé", variant: "violet" },
} as const;

export default function AdminGuidesPage() {
  return (
    <Suspense fallback={<Spinner label="Vérification de ton accès…" />}>
      <GuidesList />
    </Suspense>
  );
}

async function GuidesList() {
  const ctx = await getEditorContext();
  if (ctx.status === "anonymous" || ctx.status === "forbidden") return <AdminAccessDenied ctx={ctx} />;

  let rows: Row[];
  if (ctx.status === "unconfigured") {
    rows = demoGuides.map((g) => ({ key: g.slug, href: `/admin/guides/${g.slug}`, title: g.title, status: g.status, category: g.category, updatedAt: g.updatedAt }));
  } else {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.from("guides").select("id,title,status,category_id,updated_at").order("updated_at", { ascending: false });
    if (error) throw new Error("Impossible de charger les guides.");
    rows = (data ?? []).map((g) => ({
      key: g.id,
      href: `/admin/guides/${g.id}`,
      title: g.title,
      status: g.status,
      category: g.category_id,
      updatedAt: String(g.updated_at).slice(0, 10),
    }));
  }
  const label = (id: string) => guideCategories.find((c) => c.id === id)?.label ?? id;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Guides</h1>
        <Button asChild>
          <Link href="/admin/guides/nouveau">
            <Plus /> Nouveau guide
          </Link>
        </Button>
      </div>
      {ctx.status === "unconfigured" && (
        <p className="mt-4 flex items-center gap-2 rounded-2xl border border-cyan/25 bg-cyan/[0.06] p-3 text-sm">
          <Eye className="size-4 shrink-0 text-cyan" aria-hidden /> Mode aperçu : guides de démonstration, base de données non configurée.
        </p>
      )}
      <ul className="mt-6 divide-y divide-white/8 overflow-hidden rounded-3xl border border-white/10">
        {rows.map((r) => (
          <li key={r.key}>
            <Link href={r.href} className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-white/[0.04]">
              <span className="min-w-0 flex-1 font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground">{label(r.category)}</span>
              <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>
              <span className="w-36 text-right text-xs text-muted-foreground">{formatDateFr(r.updatedAt)}</span>
              <Pencil className="size-4 text-ink/40 transition group-hover:text-pink" aria-label="Modifier" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

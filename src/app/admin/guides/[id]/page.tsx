import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { GuideEditor } from "@/components/admin/guide-editor";
import { Spinner } from "@/components/states/spinner";
import { demoGuides, guideCategories } from "@/content/guides";
import { getEditorContext } from "@/lib/auth/editor";
import { getPlaces } from "@/lib/content/repository";
import { guideSchema, type Guide } from "@/lib/content/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Modifier un guide" };

export function generateStaticParams() {
  return [{ id: "nouveau" }, ...(isSupabaseConfigured ? [] : demoGuides.map((g) => ({ id: g.slug })))];
}

export default function AdminGuideEditPage({ params }: PageProps<"/admin/guides/[id]">) {
  return (
    <>
      <Link href="/admin/guides" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> Tous les guides
      </Link>
      <Suspense fallback={<Spinner label="Chargement du guide…" />}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getEditorContext();
  if (ctx.status === "anonymous" || ctx.status === "forbidden") return <AdminAccessDenied ctx={ctx} />;
  const places = (await getPlaces()).map((p) => ({ slug: p.slug, name: p.name }));

  let guide: (Guide & { id?: string }) | null = null;
  if (id !== "nouveau") {
    if (ctx.status === "unconfigured") {
      guide = demoGuides.find((g) => g.slug === id) ?? null;
    } else {
      if (!z.uuid().safeParse(id).success) notFound();
      const sb = await createSupabaseServerClient();
      const { data } = await sb
        .from("guides")
        .select("id,slug,title,category_id,summary,intro,steps,sources,cover,status,is_demo,updated_at,guide_places(position,places(slug))")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const links = (data.guide_places as unknown as { position: number; places: { slug: string } | null }[]).sort((a, b) => a.position - b.position);
        guide = {
          id: data.id,
          ...guideSchema.parse({
            slug: data.slug,
            title: data.title,
            category: data.category_id,
            summary: data.summary,
            intro: data.intro,
            steps: data.steps,
            sources: data.sources,
            cover: data.cover ?? undefined,
            placeSlugs: links.map((l) => l.places?.slug).filter(Boolean),
            updatedAt: String(data.updated_at).slice(0, 10),
            status: data.status,
            isDemo: data.is_demo,
          }),
        };
      }
    }
    if (!guide) notFound();
  }

  return (
    <>
      <h1 className="mt-4 mb-8 text-3xl font-bold sm:text-4xl">{guide ? guide.title : "Nouveau guide"}</h1>
      <GuideEditor
        key={guide?.id ?? guide?.slug ?? "nouveau"}
        guide={guide}
        categories={guideCategories}
        places={places}
        readOnly={ctx.status === "unconfigured"}
        canDelete={ctx.status === "ok" && ctx.role === "admin"}
      />
    </>
  );
}

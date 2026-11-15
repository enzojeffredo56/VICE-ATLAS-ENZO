import { Suspense } from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { PlaceAdmin, type AdminPlace } from "@/components/admin/place-editor";
import { Spinner } from "@/components/states/spinner";
import { placeCategories } from "@/content/map";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Lieux" };

export default function LieuxPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Lieux de la carte</h1>
      <p className="mt-2 text-muted-foreground">Les découvertes acceptées arrivent ici en brouillon : vérifie-les, complète le quartier, puis publie.</p>
      <div className="mt-6">
        <Suspense fallback={<Spinner label="Chargement…" />}>
          <Places />
        </Suspense>
      </div>
    </>
  );
}

async function Places() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="text-muted-foreground">Base de données non configurée.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  const sb = await createSupabaseServerClient();
  const { data } = await sb.from("places").select("id,slug,name,category_id,x,y,district,description,tags,status").order("status").order("name");
  return <PlaceAdmin places={((data ?? []) as AdminPlace[]).map((p) => ({ ...p, x: Number(p.x), y: Number(p.y) }))} categories={placeCategories} />;
}

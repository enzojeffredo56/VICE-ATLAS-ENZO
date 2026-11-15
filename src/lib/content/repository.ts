import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { demoPlaces, placeCategories } from "@/content/map";
import { demoGuides } from "@/content/guides";
import { demoProgressItems } from "@/content/carnet";
import { demoCorrespondences, miamiSpots } from "@/content/comparateur";
import { publicEnv } from "@/lib/env";
import {
  correspondenceSchema,
  guideSchema,
  miamiSpotSchema,
  placeSchema,
  progressItemSchema,
  type Correspondence,
  type Guide,
  type MiamiSpot,
  type Place,
  type ProgressItem,
} from "./schemas";

/**
 * Accès au contenu public (lieux, guides, éléments du carnet).
 * Si Supabase est configuré, le contenu publié vient de la base ;
 * sinon, on utilise le contenu de démonstration embarqué.
 */
function publicClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export { placeCategories };

export async function getGuides(): Promise<Guide[]> {
  "use cache";
  cacheTag("guides");
  cacheLife("hours");
  const sb = publicClient();
  if (!sb) return demoGuides.filter((g) => g.status === "published");
  const { data, error } = await sb
    .from("guides")
    .select("slug,title,category_id,summary,intro,steps,sources,cover,updated_at,status,is_demo,guide_places(places(slug))")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Lecture des guides impossible : ${error.message}`);
  return (data ?? []).map((row) =>
    guideSchema.parse({
      slug: row.slug,
      title: row.title,
      category: row.category_id,
      summary: row.summary,
      intro: row.intro,
      steps: row.steps,
      sources: row.sources,
      cover: row.cover ?? undefined,
      placeSlugs: (row.guide_places as unknown as { places: { slug: string } | null }[])
        .map((gp) => gp.places?.slug)
        .filter(Boolean),
      updatedAt: String(row.updated_at).slice(0, 10),
      status: row.status,
      isDemo: row.is_demo,
    }),
  );
}

export async function getGuide(slug: string): Promise<Guide | null> {
  const guides = await getGuides();
  return guides.find((g) => g.slug === slug) ?? null;
}

export async function getPlaces(): Promise<Place[]> {
  "use cache";
  cacheTag("places");
  cacheLife("hours");
  const sb = publicClient();
  if (!sb) return demoPlaces;
  const [{ data, error }, guides] = await Promise.all([
    sb.from("places").select("slug,name,category_id,x,y,district,description,tags,is_demo").eq("status", "published"),
    getGuides(),
  ]);
  if (error) throw new Error(`Lecture des lieux impossible : ${error.message}`);
  return (data ?? []).map((row) =>
    placeSchema.parse({
      slug: row.slug,
      name: row.name,
      category: row.category_id,
      x: Number(row.x),
      y: Number(row.y),
      district: row.district,
      description: row.description,
      tags: row.tags ?? [],
      guideSlugs: guides.filter((g) => g.placeSlugs.includes(row.slug)).map((g) => g.slug),
      isDemo: row.is_demo,
    }),
  );
}

export async function getProgressItems(): Promise<ProgressItem[]> {
  "use cache";
  cacheTag("progress-items");
  cacheLife("hours");
  const sb = publicClient();
  if (!sb) return demoProgressItems;
  const { data, error } = await sb
    .from("progress_items")
    .select("slug,category,title,is_demo,places(slug)")
    .eq("status", "published")
    .order("sort_order");
  if (error) throw new Error(`Lecture du carnet impossible : ${error.message}`);
  return (data ?? []).map((row) =>
    progressItemSchema.parse({
      id: row.slug,
      category: row.category,
      title: row.title,
      placeSlug: (row.places as unknown as { slug: string } | null)?.slug,
      isDemo: row.is_demo,
    }),
  );
}

export async function getComparator(): Promise<{ spots: MiamiSpot[]; correspondences: Correspondence[] }> {
  "use cache";
  cacheTag("comparateur");
  cacheLife("hours");
  const sb = publicClient();
  if (!sb) return { spots: miamiSpots, correspondences: demoCorrespondences };
  const [spotsRes, corrRes] = await Promise.all([
    sb.from("miami_spots").select("slug,name,neighborhood,x,y,description"),
    sb
      .from("place_correspondences")
      .select("summary,status,sources,is_demo,places(slug),miami_spots(slug)")
      .eq("publication", "published"),
  ]);
  if (spotsRes.error) throw new Error(`Lecture du plan de Miami impossible : ${spotsRes.error.message}`);
  if (corrRes.error) throw new Error(`Lecture des correspondances impossible : ${corrRes.error.message}`);
  const spots = (spotsRes.data ?? []).map((r) => miamiSpotSchema.parse({ ...r, x: Number(r.x), y: Number(r.y) }));
  const correspondences = (corrRes.data ?? []).map((r) =>
    correspondenceSchema.parse({
      placeSlug: (r.places as unknown as { slug: string } | null)?.slug,
      miamiSlug: (r.miami_spots as unknown as { slug: string } | null)?.slug,
      summary: r.summary,
      status: String(r.status).replace("_", "-"),
      sources: r.sources,
      isDemo: r.is_demo,
    }),
  );
  return { spots, correspondences };
}

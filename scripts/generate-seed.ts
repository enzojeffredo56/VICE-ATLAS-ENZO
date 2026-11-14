/**
 * Génère supabase/seed.sql à partir du contenu de démonstration TypeScript
 * (une seule source de vérité). Usage : npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { demoProgressItems } from "../src/content/carnet";
import { guideCategories, demoGuides } from "../src/content/guides";
import { demoPlaces, placeCategories } from "../src/content/map";

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
const arr = (v: string[]) => (v.length ? `array[${v.map(q).join(", ")}]` : "'{}'::text[]");

const lines: string[] = [
  "-- Fichier généré par scripts/generate-seed.ts : ne pas modifier à la main.",
  "-- Contenu de DÉMONSTRATION (is_demo = true), jamais présenté comme officiel.",
  "begin;",
  "",
  "insert into public.map_categories (id, label, color, sort_order) values",
  placeCategories.map((c, i) => `  (${q(c.id)}, ${q(c.label)}, ${q(c.color)}, ${i})`).join(",\n"),
  "on conflict (id) do update set label = excluded.label, color = excluded.color, sort_order = excluded.sort_order;",
  "",
  "insert into public.places (slug, name, category_id, x, y, district, description, tags, status, is_demo) values",
  demoPlaces
    .map(
      (p) =>
        `  (${q(p.slug)}, ${q(p.name)}, ${q(p.category)}, ${p.x}, ${p.y}, ${q(p.district)}, ${q(p.description)}, ${arr(p.tags)}, 'published', true)`,
    )
    .join(",\n"),
  "on conflict (slug) do update set name = excluded.name, category_id = excluded.category_id, x = excluded.x, y = excluded.y,",
  "  district = excluded.district, description = excluded.description, tags = excluded.tags, status = excluded.status, is_demo = true;",
  "",
  "insert into public.guide_categories (id, label, sort_order) values",
  guideCategories.map((c, i) => `  (${q(c.id)}, ${q(c.label)}, ${i})`).join(",\n"),
  "on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;",
  "",
  "insert into public.guides (slug, title, category_id, summary, intro, steps, sources, status, is_demo, published_at, updated_at) values",
  demoGuides
    .map(
      (g) =>
        `  (${q(g.slug)}, ${q(g.title)}, ${q(g.category)}, ${q(g.summary)}, ${q(g.intro)}, ${json(g.steps)}, ${json(g.sources)}, 'published', true, ${q(g.updatedAt)}, ${q(g.updatedAt)})`,
    )
    .join(",\n"),
  "on conflict (slug) do update set title = excluded.title, category_id = excluded.category_id, summary = excluded.summary,",
  "  intro = excluded.intro, steps = excluded.steps, sources = excluded.sources, status = excluded.status, is_demo = true;",
  "",
  "delete from public.guide_places gp using public.guides g where gp.guide_id = g.id and g.is_demo;",
  "insert into public.guide_places (guide_id, place_id, position)",
  "select g.id, p.id, s.ord - 1 from (values",
  demoGuides.flatMap((g) => g.placeSlugs.map((s, i) => `  (${q(g.slug)}, ${q(s)}, ${i + 1})`)).join(",\n"),
  ") as s (guide_slug, place_slug, ord)",
  "join public.guides g on g.slug = s.guide_slug join public.places p on p.slug = s.place_slug;",
  "",
  "insert into public.progress_items (slug, category, title, place_id, sort_order, status, is_demo)",
  "select s.slug, s.category::public.progress_category, s.title, p.id, s.ord, 'published', true from (values",
  demoProgressItems
    .map((it, i) => `  (${q(it.id)}, ${q(it.category)}, ${q(it.title)}, ${it.placeSlug ? q(it.placeSlug) : "null"}, ${i})`)
    .join(",\n"),
  ") as s (slug, category, title, place_slug, ord)",
  "left join public.places p on p.slug = s.place_slug",
  "on conflict (slug) do update set category = excluded.category, title = excluded.title, place_id = excluded.place_id,",
  "  sort_order = excluded.sort_order, status = excluded.status, is_demo = true;",
  "",
  "commit;",
  "",
];

writeFileSync(resolve(__dirname, "../supabase/seed.sql"), lines.join("\n"), "utf8");
console.log("supabase/seed.sql généré");

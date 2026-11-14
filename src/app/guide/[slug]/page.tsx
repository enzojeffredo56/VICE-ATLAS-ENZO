import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ExternalLink, Info, Link2, MapPin } from "lucide-react";
import { FavoriteGuideButton } from "@/components/guide/favorite-guide-button";
import { GuideSteps } from "@/components/guide/guide-steps";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { guideCategories } from "@/content/guides";
import { getGuide, getGuides, getPlaces } from "@/lib/content/repository";
import { formatDateFr } from "@/lib/text";

export async function generateStaticParams() {
  const guides = await getGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  return guide ? { title: guide.title, description: guide.summary } : { title: "Guide introuvable" };
}

export default async function GuideDetailPage({ params }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const [guide, places] = await Promise.all([getGuide(slug), getPlaces()]);
  if (!guide) notFound();

  const placeNames = Object.fromEntries(places.map((p) => [p.slug, p.name]));
  const linkedPlaces = guide.placeSlugs.filter((s) => placeNames[s]);
  const category = guideCategories.find((c) => c.id === guide.category)?.label ?? guide.category;

  return (
    <article className="relative isolate mx-auto max-w-3xl px-5 pt-32 pb-16 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgb(255_61_145/0.18),transparent_70%)]" />
      <Reveal>
        <Link href="/guide" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-white">
          <ArrowLeft className="size-4" aria-hidden /> Tous les guides
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="cyan">{category}</Badge>
          {guide.isDemo && <Badge>Contenu de démonstration</Badge>}
        </div>
        <h1 className="mt-4 text-4xl leading-tight font-bold sm:text-5xl">{guide.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{guide.intro}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <FavoriteGuideButton slug={guide.slug} title={guide.title} />
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden />
            Mis à jour le <time dateTime={guide.updatedAt}>{formatDateFr(guide.updatedAt)}</time>
          </p>
        </div>
      </Reveal>

      {guide.cover && (
        <figure className="mt-10 overflow-hidden rounded-3xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- image autorisée, dimensions inconnues */}
          <img src={guide.cover.src} alt={guide.cover.alt} className="w-full" />
          <figcaption className="px-4 py-2 text-xs text-muted-foreground">Crédit : {guide.cover.credit}</figcaption>
        </figure>
      )}

      <div className="mt-12">
        <GuideSteps slug={guide.slug} steps={guide.steps} placeNames={placeNames} />
      </div>

      {linkedPlaces.length > 0 && (
        <section aria-labelledby="places-title" className="mt-14">
          <h2 id="places-title" className="text-2xl font-bold">
            Lieux liés
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {linkedPlaces.map((s) => (
              <li key={s}>
                <Link
                  href={`/carte?lieu=${s}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm transition hover:border-cyan/50 hover:text-cyan"
                >
                  <MapPin className="size-4 text-cyan" aria-hidden /> {placeNames[s]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sources-title" className="mt-14 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <h2 id="sources-title" className="flex items-center gap-2 text-lg font-bold">
          <Link2 className="size-5 text-turquoise" aria-hidden /> Sources
        </h2>
        {guide.sources.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune source externe.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {guide.sources.map((s) => (
              <li key={s.label}>
                {s.url ? (
                  <a
                    href={s.url}
                    {...(s.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex items-center gap-1.5 text-cyan underline-offset-4 hover:underline"
                  >
                    {s.label}
                    {s.url.startsWith("http") && <ExternalLink className="size-3.5" aria-hidden />}
                  </a>
                ) : (
                  <span className="text-ink/80">{s.label}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {guide.isDemo && (
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Ce guide s&apos;appuie sur la carte fictive de démonstration. Il ne décrit aucun contenu officiel de GTA 6.
          </p>
        )}
      </section>
    </article>
  );
}

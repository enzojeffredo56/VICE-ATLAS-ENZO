"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeftRight, BadgeCheck, ExternalLink, Info, LocateFixed, MapPin, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/states/spinner";
import demoMap from "@/content/maps/demo-island.svg";
import miamiPlan from "@/content/maps/miami-plan.svg";
import { verificationLabels } from "@/content/comparateur";
import { buildPairs, findPair, type Pair } from "@/lib/comparateur/pairs";
import type { Correspondence, MiamiSpot, Place, PlaceCategory, VerificationStatus } from "@/lib/content/schemas";
import { formatCoord } from "@/lib/map/search";
import { cn } from "@/lib/utils";

const PlanMap = dynamic(() => import("@/components/map/plan-map"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center">
      <Spinner label="Chargement du plan…" />
    </div>
  ),
});

type Props = {
  places: Place[];
  categories: PlaceCategory[];
  spots: MiamiSpot[];
  correspondences: Correspondence[];
};

const STATUS_VARIANT: Record<VerificationStatus, "default" | "cyan" | "violet" | "turquoise"> = {
  demo: "default",
  "a-verifier": "violet",
  probable: "cyan",
  verifie: "turquoise",
};

function readInitial(pairs: Pair[]) {
  if (typeof window === "undefined") return { pair: null as Pair | null, missing: null as string | null };
  const params = new URLSearchParams(window.location.search);
  const placeSlug = params.get("lieu");
  const miamiSlug = params.get("reel");
  const pair = findPair(pairs, { placeSlug, miamiSlug });
  return { pair: pair ?? pairs[0] ?? null, missing: !pair && placeSlug ? placeSlug : null };
}

function writeUrl(pair: Pair) {
  const url = new URL(window.location.href);
  url.searchParams.set("lieu", pair.place.slug);
  url.searchParams.delete("reel");
  window.history.replaceState(window.history.state, "", url);
}

export default function CompareExplorer({ places, categories, spots, correspondences }: Props) {
  const pairs = useMemo(() => buildPairs(correspondences, places, spots), [correspondences, places, spots]);
  const [initial] = useState(() => readInitial(pairs));
  const [selected, setSelected] = useState<Pair | null>(initial.pair);
  const [missing, setMissing] = useState<string | null>(initial.missing);
  const [focus, setFocus] = useState(() => (initial.pair ? { id: initial.pair.id, nonce: 1 } : null));

  const colors = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.color])), [categories]);
  const missingName = missing ? places.find((p) => p.slug === missing)?.name ?? missing : null;

  const select = useCallback((pair: Pair | null) => {
    if (!pair) return;
    setSelected(pair);
    setMissing(null);
    setFocus((f) => ({ id: pair.id, nonce: (f?.nonce ?? 0) + 1 }));
    writeUrl(pair);
  }, []);

  const gameMarkers = useMemo(
    () => pairs.map((p) => ({ id: p.id, x: p.place.x, y: p.place.y, color: colors[p.place.category] ?? "#00D4FF", label: p.place.name })),
    [pairs, colors],
  );
  const realMarkers = useMemo(
    () => pairs.map((p) => ({ id: p.id, x: p.spot.x, y: p.spot.y, color: "#FF3D91", label: p.spot.name })),
    [pairs],
  );

  if (pairs.length === 0) {
    return (
      <p className="glass flex items-center gap-3 rounded-2xl p-5 text-muted-foreground">
        <SearchX className="size-5" aria-hidden /> Aucune correspondance publiée pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {missingName && (
        <p role="status" className="flex items-start gap-3 rounded-2xl border border-violet/30 bg-violet/10 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-[#b49cff]" aria-hidden />
          Pas encore de correspondance à Miami pour « {missingName} ». Voici un autre rapprochement en attendant.
        </p>
      )}

      {/* Les deux plans */}
      <div className="relative grid gap-4 lg:grid-cols-2">
        <MapPanel label="VICE ATLAS" sub="Carte fictive de démonstration" tone="neon">
          <PlanMap
            imageUrl={demoMap.src}
            markers={gameMarkers}
            selectedId={selected?.id ?? null}
            focus={focus}
            onSelect={(id) => select(pairs.find((p) => p.id === id) ?? null)}
            ariaLabel="Carte VICE ATLAS"
            background="#070b1a"
          />
        </MapPanel>
        <MapPanel label="Miami" sub="Plan schématique, non à l'échelle" tone="day">
          <PlanMap
            imageUrl={miamiPlan.src}
            markers={realMarkers}
            selectedId={selected?.id ?? null}
            focus={focus}
            onSelect={(id) => select(pairs.find((p) => p.id === id) ?? null)}
            ariaLabel="Plan schématique de Miami"
            background="#7fb9d4"
          />
        </MapPanel>

        {/* Connecteur central (ordinateur) */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 z-[700] hidden -translate-x-1/2 -translate-y-1/2 lg:block">
          <motion.div
            key={selected?.id}
            initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="grid size-14 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-pink to-violet text-white shadow-[0_0_40px_rgb(255_61_145/0.8)]"
          >
            <ArrowLeftRight className="size-6" />
          </motion.div>
        </div>
      </div>

      {/* Fiche de la correspondance */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.section
            key={selected.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Correspondance sélectionnée"
            className="glass rounded-3xl p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant={STATUS_VARIANT[selected.correspondence.status]} title={verificationLabels[selected.correspondence.status].description}>
                <BadgeCheck /> {verificationLabels[selected.correspondence.status].label}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => select(selected)}>
                <LocateFixed /> Recentrer les deux plans
              </Button>
            </div>

            <div className="mt-5 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-2xl border border-cyan/25 bg-cyan/[0.05] p-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-cyan uppercase">Dans VICE ATLAS</p>
                <h2 className="mt-2 font-display text-xl font-bold">{selected.place.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.place.district} · X {formatCoord(selected.place.x)} · Y {formatCoord(selected.place.y)}
                </p>
                <Link
                  href={`/carte?lieu=${selected.place.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-cyan underline-offset-4 hover:underline"
                >
                  <MapPin className="size-4" aria-hidden /> Ouvrir sur la carte
                </Link>
              </div>
              <div className="grid place-items-center text-pink" aria-hidden>
                <ArrowLeftRight className="size-6 rotate-90 md:rotate-0" />
              </div>
              <div className="rounded-2xl border border-pink/25 bg-pink/[0.05] p-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-pink uppercase">À Miami</p>
                <h2 className="mt-2 font-display text-xl font-bold">{selected.spot.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.spot.neighborhood}</p>
                <p className="mt-2 text-sm text-ink/85">{selected.spot.description}</p>
              </div>
            </div>

            <p className="mt-5 text-ink/90">
              <span className="font-semibold">Pourquoi ce rapprochement : </span>
              {selected.correspondence.summary}
            </p>

            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold">Sources</h3>
              {selected.correspondence.sources.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Aucune source pour le moment.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {selected.correspondence.sources.map((s) => (
                    <li key={s.label}>
                      {s.url ? (
                        <a
                          href={s.url}
                          {...(s.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="inline-flex items-center gap-1.5 text-cyan underline-offset-4 hover:underline"
                        >
                          {s.label} {s.url.startsWith("http") && <ExternalLink className="size-3.5" aria-hidden />}
                        </a>
                      ) : (
                        s.label
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {selected.correspondence.isDemo && (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  La carte VICE ATLAS actuelle est fictive : ce rapprochement est un exemple, pas une information sur GTA 6.
                </p>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Toutes les correspondances */}
      <section aria-labelledby="pairs-title">
        <h2 id="pairs-title" className="text-xl font-bold">
          Toutes les correspondances <span className="text-sm font-normal text-muted-foreground">({pairs.length})</span>
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((p) => {
            const active = p.id === selected?.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    select(p);
                    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
                  }}
                  aria-pressed={active}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5",
                    active ? "border-pink/50 bg-pink/10" : "border-white/10 bg-white/[0.02] hover:border-white/25",
                  )}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[p.place.category] }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.place.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">↔ {p.spot.name}</span>
                  </span>
                  <ArrowLeftRight className="size-4 shrink-0 text-ink/30 transition group-hover:text-pink" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Statuts de vérification" className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold">Statuts de vérification</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {(Object.keys(verificationLabels) as VerificationStatus[]).map((s) => (
            <li key={s} className="flex items-start gap-2">
              <Badge variant={STATUS_VARIANT[s]} className="shrink-0">
                {verificationLabels[s].label}
              </Badge>
              <span className="text-muted-foreground">{verificationLabels[s].description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MapPanel({ label, sub, tone, children }: { label: string; sub: string; tone: "neon" | "day"; children: React.ReactNode }) {
  return (
    <div data-lenis-prevent className="relative isolate h-[42dvh] min-h-72 overflow-hidden rounded-3xl border border-white/10 lg:h-[58dvh]">
      {children}
      <div
        className={cn(
          "pointer-events-none absolute top-3 left-3 z-[600] rounded-2xl px-3 py-2 shadow-lg backdrop-blur",
          tone === "neon" ? "bg-night/85 text-white" : "bg-white/90 text-[#26304a]",
        )}
      >
        <p className={cn("font-display text-sm font-bold", tone === "neon" && "text-neon")}>{label}</p>
        <p className="text-[11px] opacity-75">{sub}</p>
      </div>
    </div>
  );
}

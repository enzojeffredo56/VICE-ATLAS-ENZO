"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { ImageOverlay, MapContainer, Marker, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import demoMap from "@/content/maps/demo-island.svg";
import { MAP_HEIGHT, MAP_WIDTH, type Place } from "@/lib/content/schemas";
import type { PlaceMarks } from "@/lib/map/search";
import { markerIcon } from "./marker-icon";

const BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];
const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [-300, -400],
  [MAP_HEIGHT + 300, MAP_WIDTH + 400],
];

export type FocusRequest = { slug: string; nonce: number } | null;

type Props = {
  places: Place[];
  colors: Record<string, string>;
  marks: PlaceMarks;
  selectedSlug: string | null;
  focus: FocusRequest;
  onSelect: (slug: string | null) => void;
  onPointer: (coords: { x: number; y: number } | null) => void;
};

/** Carte Leaflet en repère simple (CRS.Simple) : 1 unité = 1 unité de carte, origine en bas à gauche. */
export default function LeafletMap({ places, colors, marks, selectedSlug, focus, onSelect, onPointer }: Props) {
  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={BOUNDS}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={0.85}
      minZoom={-3}
      maxZoom={2}
      zoomSnap={0.25}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={90}
      zoomControl={false}
      attributionControl={false}
      className="va-map size-full"
      aria-label="Carte interactive VICE ATLAS (carte fictive de démonstration)"
    >
      <ImageOverlay url={demoMap.src} bounds={BOUNDS} />
      <ZoomControl position="bottomright" zoomInTitle="Zoomer" zoomOutTitle="Dézoomer" />
      <MapEvents onSelect={onSelect} onPointer={onPointer} />
      <FlyTo places={places} focus={focus} />
      <AutoResize />
      {places.map((p) => {
        const mark = marks[p.slug];
        const selected = p.slug === selectedSlug;
        return (
          <Marker
            key={p.slug}
            position={[p.y, p.x]}
            icon={markerIcon(colors[p.category] ?? "#00D4FF", {
              visited: Boolean(mark?.visitedAt),
              favorite: Boolean(mark?.favorite),
              selected,
            })}
            title={p.name}
            alt={p.name}
            keyboard
            riseOnHover
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{
              click: () => onSelect(p.slug),
              keypress: (e) => {
                const key = (e.originalEvent as KeyboardEvent).key;
                if (key === "Enter" || key === " ") onSelect(p.slug);
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}

function MapEvents({ onSelect, onPointer }: Pick<Props, "onSelect" | "onPointer">) {
  useMapEvents({
    click: () => onSelect(null),
    mousemove: (e) => onPointer({ x: e.latlng.lng, y: e.latlng.lat }),
    mouseout: () => onPointer(null),
  });
  return null;
}

function FlyTo({ places, focus }: { places: Place[]; focus: FocusRequest }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const place = places.find((p) => p.slug === focus.slug);
    if (!place) return;
    const zoom = Math.max(map.getZoom(), 0.5);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) map.setView([place.y, place.x], zoom);
    else map.flyTo([place.y, place.x], zoom, { duration: 0.8 });
  }, [focus, map, places]);
  return null;
}

/** Recalcule la taille quand le conteneur change (menu ouvert, rotation…). */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

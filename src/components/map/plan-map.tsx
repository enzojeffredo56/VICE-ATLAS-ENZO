"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { ImageOverlay, MapContainer, Marker, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/content/schemas";
import { markerIcon } from "./marker-icon";

export type PlanMarker = { id: string; x: number; y: number; color: string; label: string };

const BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

type Props = {
  imageUrl: string;
  markers: PlanMarker[];
  selectedId: string | null;
  focus: { id: string; nonce: number } | null;
  onSelect: (id: string | null) => void;
  ariaLabel: string;
  background: string;
};

/** Carte simple sur une image (repère CRS.Simple, origine en bas à gauche). */
export default function PlanMap({ imageUrl, markers, selectedId, focus, onSelect, ariaLabel, background }: Props) {
  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={BOUNDS}
      maxBounds={[
        [-300, -400],
        [MAP_HEIGHT + 300, MAP_WIDTH + 400],
      ]}
      maxBoundsViscosity={0.85}
      minZoom={-3}
      maxZoom={2}
      zoomSnap={0.25}
      zoomDelta={0.5}
      zoomControl={false}
      attributionControl={false}
      className="va-map size-full"
      style={{ background }}
      aria-label={ariaLabel}
    >
      <ImageOverlay url={imageUrl} bounds={BOUNDS} />
      <ZoomControl position="bottomright" zoomInTitle="Zoomer" zoomOutTitle="Dézoomer" />
      <Deselect onSelect={onSelect} />
      <Focus markers={markers} focus={focus} />
      <AutoResize />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.y, m.x]}
          icon={markerIcon(m.color, { visited: false, favorite: false, selected: m.id === selectedId })}
          title={m.label}
          alt={m.label}
          keyboard
          riseOnHover
          zIndexOffset={m.id === selectedId ? 1000 : 0}
          eventHandlers={{
            click: () => onSelect(m.id),
            keypress: (e) => {
              const key = (e.originalEvent as KeyboardEvent).key;
              if (key === "Enter" || key === " ") onSelect(m.id);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}

function Deselect({ onSelect }: { onSelect: Props["onSelect"] }) {
  useMapEvents({ click: () => onSelect(null) });
  return null;
}

function Focus({ markers, focus }: { markers: PlanMarker[]; focus: Props["focus"] }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const m = markers.find((x) => x.id === focus.id);
    if (!m) return;
    const zoom = Math.max(map.getZoom(), 0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) map.setView([m.y, m.x], zoom);
    else map.flyTo([m.y, m.x], zoom, { duration: 0.9 });
  }, [focus, map, markers]);
  return null;
}

function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

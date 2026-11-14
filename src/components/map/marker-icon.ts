import L from "leaflet";

const cache = new Map<string, L.DivIcon>();

/** Marqueur néon (épingle) : couleur de catégorie, coche si visité, étoile si favori. */
export function markerIcon(color: string, opts: { visited: boolean; favorite: boolean; selected: boolean }) {
  const key = `${color}|${+opts.visited}|${+opts.favorite}|${+opts.selected}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = opts.selected ? 46 : 34;
  const inner = opts.visited
    ? `<path d="M11 17.5l3.2 3.2 6.6-7.2" fill="none" stroke="#0B1020" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="16" cy="16" r="5" fill="#0B1020"/>`;
  const star = opts.favorite
    ? `<span class="va-pin-star" aria-hidden="true">★</span>`
    : "";
  const html = `<span class="va-pin${opts.selected ? " va-pin--selected" : ""}" style="--pin:${color};width:${size}px;height:${size * 1.25}px">
    <span class="va-pin-pulse"></span>
    <svg viewBox="0 0 32 40" width="${size}" height="${size * 1.25}" aria-hidden="true">
      <path d="M16 39C9 30 3 24 3 16a13 13 0 1 1 26 0c0 8-6 14-13 23z" fill="${color}" stroke="#0B1020" stroke-width="2.5"/>
      ${inner}
    </svg>${star}</span>`;
  const icon = L.divIcon({
    html,
    className: "va-pin-wrap",
    iconSize: [size, size * 1.25],
    iconAnchor: [size / 2, size * 1.25 - 2],
    popupAnchor: [0, -size],
  });
  cache.set(key, icon);
  return icon;
}

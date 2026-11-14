#!/usr/bin/env python3
"""
Génère la carte FICTIVE de démonstration de VICE ATLAS (création originale).

Sorties :
  src/content/maps/demo-island.svg        image utilisée par Leaflet (CRS.Simple)
  src/content/maps/demo-island.land.json  polygones des terres (repère SVG, y vers le bas)

Repère : 2000 x 1500 unités. Les coordonnées affichées aux joueurs (X, Y)
ont l'origine en BAS à gauche : Y_joueur = 1500 - y_svg.
Usage : python3 scripts/generate-demo-map.py
"""
import json
import math
import random
from pathlib import Path

W, H = 2000, 1500
random.seed(20261115)
OUT = Path(__file__).resolve().parent.parent / "src" / "content" / "maps"


def blob(cx, cy, rx, ry, rough=0.12, n=96, harmonics=5, rot=0.0):
    """Contour organique : ellipse perturbée par quelques harmoniques."""
    phases = [(random.uniform(0, 2 * math.pi), random.uniform(0.3, 1.0)) for _ in range(harmonics)]
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        r = 1.0
        for k, (ph, amp) in enumerate(phases, start=2):
            r += rough * amp / k * math.sin(k * t + ph)
        x = rx * r * math.cos(t)
        y = ry * r * math.sin(t)
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        pts.append((round(cx + xr, 1), round(cy + yr, 1)))
    return pts


def smooth_path(pts):
    """Chemin fermé lissé (Catmull-Rom -> Bézier)."""
    n = len(pts)
    d = [f"M{pts[0][0]} {pts[0][1]}"]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]} {p2[1]}")
    return " ".join(d) + "Z"


# --- Terres (fictives) -------------------------------------------------------
LAND = {
    "ile-principale": blob(930, 760, 560, 420, rough=0.16, rot=-0.15),
    "palmeraie": blob(760, 360, 330, 210, rough=0.18, rot=0.2),
    "pointe-turquoise": blob(1530, 640, 300, 170, rough=0.2, rot=-0.35),
    "marina-sud": blob(1300, 1210, 250, 150, rough=0.18, rot=0.1),
    "ilots-corail-1": blob(300, 1040, 120, 85, rough=0.25),
    "ilots-corail-2": blob(180, 1200, 70, 55, rough=0.25),
    "ile-aerodrome": blob(1700, 1060, 160, 110, rough=0.15, rot=0.4),
}
LAGOON = blob(1000, 780, 120, 85, rough=0.2)

DISTRICTS = [
    ("PORT NÉON", 640, 900, "#FF3D91"),
    ("QUARTIER CORAIL", 1010, 600, "#8B5CF6"),
    ("PALMERAIE", 760, 330, "#2DD4BF"),
    ("POINTE TURQUOISE", 1560, 630, "#00D4FF"),
    ("MARINA SUD", 1300, 1215, "#FF3D91"),
    ("LES DOCKS", 1180, 980, "#8B5CF6"),
    ("ÎLOTS CORAIL", 270, 1110, "#2DD4BF"),
    ("AÉRODROME", 1705, 1060, "#00D4FF"),
]

ROADS_MAIN = [
    "M430 820 C 600 760, 820 700, 1010 640 S 1380 600, 1700 610",
    "M760 260 C 790 420, 800 560, 860 700 S 1000 1000, 1230 1150",
    "M520 1000 C 700 1010, 900 1060, 1150 1000 S 1500 860, 1600 760",
]
ROADS_SMALL = [
    "M600 520 C 700 560, 840 520, 980 470",
    "M560 680 C 620 800, 610 920, 700 1040",
    "M1080 520 C 1120 640, 1180 720, 1300 760",
    "M880 900 C 960 960, 1060 940, 1120 880",
    "M1250 620 C 1300 520, 1380 480, 1460 520",
    "M1500 1000 C 1560 1030, 1620 1050, 1680 1060",
    "M380 1000 C 420 1020, 460 1030, 520 1000",
]
BRIDGES = [
    "M1600 760 C 1620 860, 1650 960, 1690 1010",  # vers l'aérodrome
    "M1230 1150 C 1250 1170, 1270 1185, 1290 1200",  # vers la marina
    "M520 1000 C 470 1020, 420 1035, 380 1040",  # vers les îlots
]


def svg():
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
        "<defs>",
        '<radialGradient id="sea" cx="50%" cy="50%" r="75%">'
        '<stop offset="0" stop-color="#101a3c"/><stop offset="1" stop-color="#070b1a"/></radialGradient>',
        '<linearGradient id="land" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#1e2752"/><stop offset="1" stop-color="#151b3d"/></linearGradient>',
        '<pattern id="waves" width="60" height="26" patternUnits="userSpaceOnUse">'
        '<path d="M0 13 Q 15 5 30 13 T 60 13" fill="none" stroke="#00D4FF" stroke-opacity="0.07" stroke-width="1.4"/></pattern>',
        '<pattern id="blocks" width="34" height="34" patternUnits="userSpaceOnUse">'
        '<rect x="4" y="4" width="26" height="26" rx="3" fill="#F8FAFC" fill-opacity="0.035"/></pattern>',
        '<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>',
        '<clipPath id="landclip">' + "".join(f'<path d="{smooth_path(p)}"/>' for p in LAND.values()) + "</clipPath>",
        "</defs>",
        f'<rect width="{W}" height="{H}" fill="url(#sea)"/>',
        f'<rect width="{W}" height="{H}" fill="url(#waves)"/>',
    ]
    # Quadrillage + graduations (repère joueur : origine en bas à gauche)
    grid = ['<g stroke="#F8FAFC" stroke-opacity="0.05" stroke-width="1">']
    for x in range(0, W + 1, 100):
        grid.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
    for y in range(0, H + 1, 100):
        grid.append(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
    grid.append("</g>")
    labels = ['<g font-family="ui-monospace, Menlo, monospace" font-size="16" fill="#F8FAFC" fill-opacity="0.28">']
    for x in range(200, W, 200):
        labels.append(f'<text x="{x + 6}" y="{H - 10}">{x}</text>')
    for y in range(200, H, 200):
        labels.append(f'<text x="8" y="{y - 6}">{H - y}</text>')
    labels.append("</g>")
    parts += grid + labels

    # Contours néon sous les terres (les bords internes sont recouverts)
    parts.append('<g fill="none" stroke="#00D4FF" stroke-width="10" stroke-opacity="0.35" filter="url(#glow)">')
    parts += [f'<path d="{smooth_path(p)}"/>' for p in LAND.values()]
    parts.append("</g>")
    parts.append('<g fill="none" stroke="#00D4FF" stroke-width="5" stroke-opacity="0.9">')
    parts += [f'<path d="{smooth_path(p)}"/>' for p in LAND.values()]
    parts.append("</g>")
    parts.append('<g fill="url(#land)">')
    parts += [f'<path d="{smooth_path(p)}"/>' for p in LAND.values()]
    parts.append("</g>")

    # Quartiers (halos colorés) + îlots urbains, découpés aux terres
    parts.append('<g clip-path="url(#landclip)">')
    for _, x, y, c in DISTRICTS:
        parts.append(f'<circle cx="{x}" cy="{y}" r="190" fill="{c}" fill-opacity="0.09"/>')
    parts.append(f'<rect width="{W}" height="{H}" fill="url(#blocks)"/>')
    parts.append("</g>")

    # Lagune
    parts.append(
        f'<path d="{smooth_path(LAGOON)}" fill="#0b1430" stroke="#2DD4BF" stroke-width="3" stroke-opacity="0.8"/>'
    )

    # Routes
    parts.append('<g fill="none" stroke-linecap="round">')
    for d in BRIDGES:
        parts.append(f'<path d="{d}" stroke="#F8FAFC" stroke-opacity="0.35" stroke-width="7" stroke-dasharray="2 12"/>')
    for d in ROADS_SMALL:
        parts.append(f'<path d="{d}" stroke="#F8FAFC" stroke-opacity="0.16" stroke-width="5"/>')
    for d in ROADS_MAIN:
        parts.append(f'<path d="{d}" stroke="#FF3D91" stroke-opacity="0.22" stroke-width="16" filter="url(#glow)"/>')
        parts.append(f'<path d="{d}" stroke="#FF8CC0" stroke-opacity="0.55" stroke-width="6"/>')
    parts.append("</g>")

    # Noms des quartiers
    parts.append(
        '<g font-family="Space Grotesk, Arial, sans-serif" font-weight="700" font-size="30" '
        'letter-spacing="7" text-anchor="middle" fill="#F8FAFC" fill-opacity="0.5">'
    )
    for name, x, y, _ in DISTRICTS:
        parts.append(f'<text x="{x}" y="{y - 70}">{name}</text>')
    parts.append("</g>")

    # Rose des vents + cartouche
    parts.append(
        '<g transform="translate(150 150)" opacity="0.8">'
        '<circle r="70" fill="none" stroke="#8B5CF6" stroke-width="3"/>'
        '<path d="M0 -66 L10 -6 L0 0 L-10 -6Z" fill="#FF3D91"/><path d="M0 66 L-10 6 L0 0 L10 6Z" fill="#00D4FF"/>'
        '<path d="M-66 0 L-6 -8 L0 0 L-6 8Z M66 0 L6 8 L0 0 L6 -8Z" fill="#8B5CF6"/>'
        '<text y="-82" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#F8FAFC">N</text>'
        "</g>"
    )
    parts.append(
        f'<g transform="translate({W - 560} {H - 90})">'
        '<rect width="520" height="56" rx="28" fill="#0B1020" fill-opacity="0.85" stroke="#F8FAFC" stroke-opacity="0.15"/>'
        '<text x="260" y="36" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="3" '
        'fill="#F8FAFC" fill-opacity="0.75">CARTE FICTIVE DE DÉMONSTRATION</text></g>'
    )
    parts.append("</svg>")
    return "\n".join(parts)


OUT.mkdir(parents=True, exist_ok=True)
(OUT / "demo-island.svg").write_text(svg(), encoding="utf-8")
(OUT / "demo-island.land.json").write_text(
    json.dumps({"width": W, "height": H, "land": LAND, "water": {"lagune": LAGOON}}, separators=(",", ":")),
    encoding="utf-8",
)
print("ok", (OUT / "demo-island.svg").stat().st_size, "octets")

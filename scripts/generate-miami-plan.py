#!/usr/bin/env python3
"""
Génère un PLAN SCHÉMATIQUE de Miami (création originale, non à l'échelle),
dessiné à la main à partir de la géographie générale de la ville.

Sorties :
  src/content/maps/miami-plan.svg        image utilisée par Leaflet (CRS.Simple)
  src/content/maps/miami-plan.land.json  polygones des terres (repère SVG, y vers le bas)
Usage : python3 scripts/generate-miami-plan.py
"""
import json
import math
from pathlib import Path

W, H = 2000, 1500
OUT = Path(__file__).resolve().parent.parent / "src" / "content" / "maps"


def smooth(pts, closed=True):
    n = len(pts)
    d = [f"M{pts[0][0]} {pts[0][1]}"]
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0, p1 = pts[i - 1] if (closed or i > 0) else pts[0], pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]} {p2[1]}")
    return " ".join(d) + ("Z" if closed else "")


def ellipse(cx, cy, rx, ry, rot=0.0, n=40):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((round(cx + x * math.cos(rot) - y * math.sin(rot), 1), round(cy + x * math.sin(rot) + y * math.cos(rot), 1)))
    return pts


# --- Terres ------------------------------------------------------------------
# Continent : la côte ouest de la baie de Biscayne, du nord au sud.
MAINLAND = [
    (-20, -20), (1085, -20), (1080, 150), (1070, 300), (1062, 420), (1080, 500),
    (1112, 545), (1108, 600), (1095, 640), (1092, 700), (1075, 780), (1030, 860),
    (975, 950), (920, 1020), (860, 1090), (800, 1160), (760, 1260), (720, 1380),
    (700, 1520), (-20, 1520),
]
# Île-barrière de Miami Beach (nord → South Beach)
MIAMI_BEACH = [
    (1545, -20), (1690, -20), (1675, 200), (1650, 420), (1628, 600), (1612, 720),
    (1585, 770), (1528, 758), (1508, 640), (1515, 470), (1528, 260), (1538, 80),
]
PORT = ellipse(1320, 625, 120, 26, rot=0.08)          # Dodge Island (port)
FISHER = ellipse(1505, 820, 38, 26)                   # Fisher Island
VIRGINIA_KEY = ellipse(1350, 960, 80, 62, rot=0.5)
KEY_BISCAYNE = [
    (1405, 1040), (1470, 1035), (1510, 1100), (1505, 1220), (1480, 1330),
    (1450, 1395), (1418, 1380), (1400, 1270), (1395, 1150),
]
VENETIAN = [ellipse(1180 + i * 62, 478 + (i % 2) * 6, 22, 11) for i in range(5)]

LAND = {
    "continent": MAINLAND,
    "miami-beach": MIAMI_BEACH,
    "port": PORT,
    "fisher-island": FISHER,
    "virginia-key": VIRGINIA_KEY,
    "key-biscayne": KEY_BISCAYNE,
    **{f"venetian-{i}": v for i, v in enumerate(VENETIAN)},
}

PARKS = [
    ellipse(955, 955, 42, 30, rot=0.6),     # Vizcaya
    ellipse(1440, 1340, 34, 40),            # Bill Baggs Cape Florida
    ellipse(1592, 700, 18, 50, rot=0.1),    # Lummus Park
    ellipse(1350, 965, 40, 30, rot=0.5),    # Virginia Key
]

CAUSEWAYS = [
    ("Julia Tuttle", "M1070 300 L1530 300"),
    ("Venetian", "M1062 478 L1510 482"),
    ("MacArthur", "M1110 560 C 1250 575, 1380 600, 1512 650"),
    ("Rickenbacker", "M1092 760 C 1180 820, 1260 880, 1300 925 S 1400 1010, 1420 1045"),
]
HIGHWAYS = [
    "M980 -20 L975 300 C 972 450, 990 560, 1010 650 L1040 760",     # I-95
    "M-20 640 C 300 630, 600 625, 1000 640",                        # Dolphin Expressway (836)
    "M1040 760 C 980 900, 860 1040, 760 1180 L630 1520",            # US-1
]
STREETS = [
    ("Calle Ocho", "M380 700 L1060 700"),
    ("Flagler", "M300 600 L1100 600"),
]
RIVER = "M1100 615 C 980 600, 860 560, 760 540 S 560 500, 470 470"

AIRPORT = (250, 330, 290, 150)  # x, y, largeur, hauteur

LABELS = [
    ("WYNWOOD", 900, 365, 26, 0),
    ("DOWNTOWN", 990, 530, 26, 0),
    ("BRICKELL", 985, 735, 26, 0),
    ("LITTLE HAVANA", 720, 670, 26, 0),
    ("COCONUT GROVE", 760, 1090, 24, 0),
    ("AÉROPORT (MIA)", 395, 310, 22, 0),
    ("MIAMI BEACH", 1600, 260, 24, 84),
    ("SOUTH BEACH", 1560, 600, 20, 84),
    ("KEY BISCAYNE", 1455, 1200, 20, 74),
    ("VIRGINIA KEY", 1350, 905, 18, 0),
    ("PORTMIAMI", 1320, 590, 18, 0),
]
WATER_LABELS = [
    ("Baie de Biscayne", 1270, 380, 30, 0),
    ("Océan Atlantique", 1830, 760, 34, 90),
]


def svg():
    p = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
        "<defs>",
        '<linearGradient id="sea" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fc3da"/><stop offset="1" stop-color="#6fb0cf"/></linearGradient>',
        '<pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="46" height="46" fill="none" stroke="#d8cfba" stroke-width="2"/></pattern>',
        '<clipPath id="mainclip"><path d="' + smooth(MAINLAND) + '"/></clipPath>',
        "</defs>",
        f'<rect width="{W}" height="{H}" fill="url(#sea)"/>',
    ]
    # Terres
    p.append('<g fill="#efe7d4" stroke="#c9b892" stroke-width="3">')
    p += [f'<path d="{smooth(pts)}"/>' for pts in LAND.values()]
    p.append("</g>")
    # Quadrillage des rues sur le continent
    p.append(f'<rect width="{W}" height="{H}" fill="url(#grid)" clip-path="url(#mainclip)" opacity="0.8"/>')
    # Parcs
    p.append('<g fill="#bfdcab" stroke="#9cc489" stroke-width="2">')
    p += [f'<path d="{smooth(pts)}"/>' for pts in PARKS]
    p.append("</g>")
    # Aéroport
    x, y, w, h = AIRPORT
    p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="#e3dccb" stroke="#c9b892" stroke-width="3"/>')
    for i, dy in enumerate((40, 80, 120)):
        p.append(f'<line x1="{x + 20}" y1="{y + dy}" x2="{x + w - 20}" y2="{y + dy - 10 + i * 4}" stroke="#a9a08c" stroke-width="10" stroke-linecap="round"/>')
    # Rivière
    p.append(f'<path d="{RIVER}" fill="none" stroke="#7fb8d3" stroke-width="12" stroke-linecap="round"/>')
    # Routes
    p.append('<g fill="none" stroke-linecap="round">')
    for d in HIGHWAYS:
        p.append(f'<path d="{d}" stroke="#d2a64a" stroke-width="14"/><path d="{d}" stroke="#f3cf73" stroke-width="8"/>')
    for _, d in STREETS:
        p.append(f'<path d="{d}" stroke="#ffffff" stroke-width="8"/>')
    for _, d in CAUSEWAYS:
        p.append(f'<path d="{d}" stroke="#b8ab90" stroke-width="13"/><path d="{d}" stroke="#ffffff" stroke-width="7"/>')
    p.append("</g>")
    # Étiquettes
    p.append('<g font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#3a4560" text-anchor="middle" letter-spacing="4">')
    for text, lx, ly, size, rot in LABELS:
        tr = f' transform="rotate({rot} {lx} {ly})"' if rot else ""
        p.append(f'<text x="{lx}" y="{ly}" font-size="{size}"{tr}>{text}</text>')
    p.append("</g>")
    p.append('<g font-family="Georgia, serif" font-style="italic" fill="#2f6f8f" text-anchor="middle" letter-spacing="2" opacity="0.85">')
    for text, lx, ly, size, rot in WATER_LABELS:
        tr = f' transform="rotate({rot} {lx} {ly})"' if rot else ""
        p.append(f'<text x="{lx}" y="{ly}" font-size="{size}"{tr}>{text}</text>')
    p.append("</g>")
    p.append('<g font-family="Arial, sans-serif" font-size="16" fill="#5d6b84" text-anchor="middle">')
    p.append('<text x="1300" y="292">Julia Tuttle Causeway</text><text x="1290" y="470">Venetian Causeway</text>')
    p.append('<text x="1250" y="555" transform="rotate(5 1250 555)">MacArthur Causeway</text>')
    p.append('<text x="1190" y="820" transform="rotate(36 1190 820)">Rickenbacker Causeway</text>')
    p.append('<text x="720" y="722">Calle Ocho</text>')
    p.append("</g>")
    # Nord + cartouche
    p.append(
        '<g transform="translate(150 150)"><circle r="62" fill="#ffffff" fill-opacity="0.7" stroke="#3a4560" stroke-width="3"/>'
        '<path d="M0 -54 L12 0 L0 -8 L-12 0Z" fill="#e2445c"/><path d="M0 54 L12 0 L0 8 L-12 0Z" fill="#3a4560"/>'
        '<text y="-72" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#3a4560">N</text></g>'
    )
    p.append(
        f'<g transform="translate({W - 640} {H - 90})"><rect width="600" height="56" rx="28" fill="#ffffff" fill-opacity="0.85" stroke="#3a4560" stroke-opacity="0.3"/>'
        '<text x="300" y="36" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" letter-spacing="2" fill="#3a4560">'
        "PLAN SCHÉMATIQUE DE MIAMI · NON À L'ÉCHELLE</text></g>"
    )
    p.append("</svg>")
    return "\n".join(p)


OUT.mkdir(parents=True, exist_ok=True)
(OUT / "miami-plan.svg").write_text(svg(), encoding="utf-8")
(OUT / "miami-plan.land.json").write_text(json.dumps({"width": W, "height": H, "land": LAND}, separators=(",", ":")), encoding="utf-8")
print("ok", (OUT / "miami-plan.svg").stat().st_size, "octets")

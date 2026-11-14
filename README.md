# VICE ATLAS

> Explore. Découvre. Relève les défis.

Plateforme **indépendante et non officielle** pour les joueurs de GTA 6 : carte interactive, carnet de progression,
guide, comparateur Miami, STUNT ARENA et GTA Roulette. Site web + application mobile installable (PWA).

VICE ATLAS n'est ni affilié, ni approuvé, ni sponsorisé par Rockstar Games ou Take-Two Interactive.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide ·
Motion (animations) · Lenis (défilement fluide) · Zod · Supabase (`@supabase/ssr`) · Vitest + Testing Library.
Prévus dans les phases suivantes : Leaflet / React Leaflet, Google Maps, Stripe.

## Démarrage

Prérequis : Node.js 20.9 ou plus récent (testé avec Node 22).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvre http://localhost:3000.

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Build et serveur de production |
| `npm test` | Tests unitaires et de composants (Vitest) |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run check` | Les trois à la suite |

## Structure

```
src/
  app/                  routes (accueil, pages modules, manifest PWA, 404, erreur…)
  components/
    brand/              logo boussole original
    home/               sections animées de l'accueil
    layout/             en-tête, menu mobile, barre d'onglets, pied de page
    motion/             effets réutilisables (apparition au scroll, tilt 3D, magnétique…)
    states/             chargement, état vide, « bientôt disponible »
    ui/                 composants shadcn/ui
  lib/                  config du site, env (Zod), Supabase, XP, roulette
supabase/migrations/    migrations SQL versionnées
tests/                  tests Vitest
```

Page interne de démonstration des composants : `/design-system` (non indexée).

## Accessibilité et animations

Toutes les animations respectent « Réduire les animations » du système. Le défilement fluide et les effets
de survol sont désactivés au tactile. Navigation complète au clavier, lien « Aller au contenu ».

## Feuille de route

1. ✅ Configuration, architecture, design et accueil
2. Carte, carnet et guide
3. Comparateur Miami
4. Comptes et profils
5. Avis VICE ATLAS, XP et badges
6. GTA Roulette et salons
7. STUNT ARENA
8. Communauté, classements et administration
9. Tests, sécurité, optimisation et PWA (service worker, hors ligne)
10. VICE ATLAS PLUS, Stripe et parrainage Premium

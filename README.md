# VICE ATLAS

> Explore. Découvre. Relève les défis.

Plateforme **indépendante et non officielle** pour les joueurs de GTA 6 : carte interactive, carnet de progression,
guide, comparateur Miami, STUNT ARENA et GTA Roulette. Site web + application mobile installable (PWA).

VICE ATLAS n'est ni affilié, ni approuvé, ni sponsorisé par Rockstar Games ou Take-Two Interactive.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide ·
Motion (animations) · Lenis (défilement fluide) · Zod · Supabase (`@supabase/ssr`) · Vitest + Testing Library.
Leaflet / React Leaflet (cartes en `CRS.Simple` sur des plans dessinés par VICE ATLAS). Prévu ensuite : Stripe.

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
| `npm run test:db` | Migrations, seed et règles d'accès (RLS) testés sur un PostgreSQL local jetable |
| `npm run db:seed:generate` | Régénère `supabase/seed.sql` depuis le contenu de démo |
| `npm run map:generate` | Régénère la carte fictive et le plan schématique de Miami (SVG) |

## Base de données (Supabase)

Sans Supabase, le site fonctionne avec le contenu de démonstration et enregistre la progression du joueur
dans le navigateur. Pour brancher la base :

1. Crée un projet sur https://supabase.com (offre gratuite).
2. Copie l'URL et la clé « anon » (Project Settings → API) dans `.env.local`.
3. Applique les migrations puis le contenu de démo :

```bash
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Pour donner le rôle d'administrateur à un compte (dans l'éditeur SQL de Supabase) :

```sql
insert into public.user_roles (user_id, role) values ('<id-du-compte>', 'admin');
```

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
Administration des guides : `/admin/guides` (mode aperçu tant que Supabase n'est pas configuré).

## Accessibilité et animations

Toutes les animations respectent « Réduire les animations » du système. Le défilement fluide et les effets
de survol sont désactivés au tactile. Navigation complète au clavier, lien « Aller au contenu ».

## Feuille de route

1. ✅ Configuration, architecture, design et accueil
2. ✅ Carte, carnet et guide
3. ✅ Comparateur Miami (plans dessinés par VICE ATLAS, sans Google)
4. Comptes et profils
5. Avis VICE ATLAS, XP et badges
6. GTA Roulette et salons
7. STUNT ARENA
8. Communauté, classements et administration
9. Tests, sécurité, optimisation et PWA (service worker, hors ligne)
10. VICE ATLAS PLUS, Stripe et parrainage Premium

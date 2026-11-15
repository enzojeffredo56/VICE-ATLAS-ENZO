# Base de données VICE ATLAS (Supabase / PostgreSQL)

Les migrations SQL sont versionnées dans `supabase/migrations/` (horodatage `AAAAMMJJHHMMSS_nom.sql`).

| Migration | Phase | Contenu |
|---|---|---|
| `20261114000000_init.sql` | 1 | Extensions, schéma `private`, type `app_role`, trigger `updated_at` |
| `20261115000000_phase2_carte_carnet_guide.sql` | 2 | Rôles, lieux, guides, carnet, données joueur privées, RLS, fonction `save_guide` |
| `20261116000000_phase3_comparateur.sql` | 3 | Lieux réels de Miami, correspondances, statut de vérification (preuve obligatoire pour « vérifié ») |

`seed.sql` contient le contenu de démonstration (généré, idempotent). Les tests de permissions sont dans
`tests/` et se lancent avec `npm run test:db` (PostgreSQL local requis).

Règles appliquées à toutes les tables métier (phases 2 et suivantes) :
- RLS activé systématiquement (`alter table … enable row level security`) ;
- clés étrangères, index et contraintes `check` / `unique` ;
- XP, récompenses et parrainages attribués uniquement côté serveur, de façon idempotente.

Appliquer les migrations (Supabase CLI) :

```bash
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

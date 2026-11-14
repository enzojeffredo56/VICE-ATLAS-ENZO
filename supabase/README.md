# Base de données VICE ATLAS (Supabase / PostgreSQL)

Les migrations SQL sont versionnées dans `supabase/migrations/` (horodatage `AAAAMMJJHHMMSS_nom.sql`).

| Migration | Phase | Contenu |
|---|---|---|
| `20261114000000_init.sql` | 1 | Extensions, schéma `private`, type `app_role`, trigger `updated_at` |

Règles appliquées à toutes les tables métier (phases 2 et suivantes) :
- RLS activé systématiquement (`alter table … enable row level security`) ;
- clés étrangères, index et contraintes `check` / `unique` ;
- XP, récompenses et parrainages attribués uniquement côté serveur, de façon idempotente.

Appliquer les migrations (Supabase CLI) :

```bash
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

#!/usr/bin/env bash
# Teste les migrations, le seed et les règles RLS sur un PostgreSQL local jetable.
# Prérequis : PostgreSQL 15+ installé (initdb, pg_ctl, psql dans le PATH ou /usr/lib/postgresql/*/bin).
set -euo pipefail
cd "$(dirname "$0")/.."

PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
export PATH="${PG_BIN:+$PG_BIN:}$PATH"
command -v initdb >/dev/null || { echo "PostgreSQL introuvable : installe-le pour lancer ces tests."; exit 1; }

DATA="$(mktemp -d)"
SOCK="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  id pgtest >/dev/null 2>&1 || useradd -M pgtest
  chown -R pgtest "$DATA" "$SOCK"
  RUN_AS=(runuser -u pgtest --)
fi
cleanup() { "${RUN_AS[@]}" pg_ctl -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA" "$SOCK"; }
trap cleanup EXIT

"${RUN_AS[@]}" initdb -D "$DATA" -U postgres -A trust --locale=C.UTF-8 -E UTF8 >/dev/null
"${RUN_AS[@]}" pg_ctl -D "$DATA" -o "-k $SOCK -p $PORT -c listen_addresses=''" -w start >/dev/null

PSQL=("${RUN_AS[@]}" psql -X -q -v ON_ERROR_STOP=1 -h "$SOCK" -p "$PORT" -U postgres -d postgres)
"${PSQL[@]}" -f supabase/tests/00_supabase_shim.sql
for f in supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "→ seed"
"${PSQL[@]}" -f supabase/seed.sql
echo "→ seed rejoué (idempotence)"
"${PSQL[@]}" -f supabase/seed.sql
"${PSQL[@]}" -f supabase/tests/helpers.sql
for t in supabase/tests/*.test.sql; do
  echo "→ $(basename "$t")"
  "${PSQL[@]}" -f "$t"
done

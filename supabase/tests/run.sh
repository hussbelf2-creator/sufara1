#!/usr/bin/env bash
# Applies the migrations to a throwaway PostgreSQL database and runs the
# behavioural checks. Usage: PGHOST=... PGPORT=... PGUSER=... supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="safeer_check_$$"
psql -q -v ON_ERROR_STOP=1 -c "create database $DB" >/dev/null
trap 'psql -q -c "drop database if exists $DB" >/dev/null' EXIT
for f in supabase/tests/00_supabase_stub.sql supabase/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null 2>&1 || { echo "failed applying $f"; psql -v ON_ERROR_STOP=1 -d "$DB" -f "$f"; exit 1; }
done
for t in supabase/tests/[0-9][0-9]_*.sql; do [ "${t##*/}" = 00_supabase_stub.sql ] && continue; psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$t" 2>&1 | grep -E "PASSED|ERROR|FAIL|CONTEXT"; done

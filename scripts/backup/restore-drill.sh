#!/usr/bin/env bash
# Restore drill: proves a backup can be restored and is complete.
#
#   scripts/backup/restore-drill.sh <backup folder>
#
# 1. checks the SHA-256 of the encrypted files against the manifest;
# 2. decrypts and restores the database into a NEW scratch database;
# 3. compares row counts and the ledger total with the manifest, and checks
#    the ledger balances to zero and the invoice hash chain is unbroken;
# 4. prints the time it took (your measured RTO) and drops the scratch DB.
#
# Required: DRILL_DB_URL       admin URL of a scratch server — NEVER production
#                              (e.g. postgres://postgres:…@localhost:5432/postgres
#                              or a separate staging Supabase project)
#           BACKUP_PASSPHRASE
# Optional: SUPABASE_DB_URL    production URL, only to record the drill result
#                              in job_runs ('restore_drill'); KEEP_DRILL=1 keeps the DB.
set -euo pipefail
cd "$(dirname "$0")/../.."
SRC="${1:?usage: restore-drill.sh <backup folder>}"
: "${DRILL_DB_URL:?set DRILL_DB_URL (a scratch server, never production)}"
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"
T0=$(date +%s)
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

fail() { echo "✖ $*" >&2; [ -n "${SUPABASE_DB_URL:-}" ] && psql "$SUPABASE_DB_URL" -q -c "select public.record_job('restore_drill', 'failed', '{}'::jsonb, '$(echo "$*" | tr -d "'")')" >/dev/null 2>&1; exit 1; }

echo "→ checksums"
want="$(node -e "console.log(require(process.argv[1]).db_sha256)" "$(realpath "$SRC/manifest.json")")"
have="$(sha256sum "$SRC/db.dump.enc" | cut -d' ' -f1)"
[ "$want" = "$have" ] || fail "db.dump.enc checksum mismatch (file damaged or replaced)"

echo "→ decrypt"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$SRC/db.dump.enc" -out "$TMP/db.dump" \
  || fail "cannot decrypt — wrong BACKUP_PASSPHRASE?"

DB="safeer_drill_$(date +%s)"
echo "→ restore into $DB"
psql "$DRILL_DB_URL" -q -v ON_ERROR_STOP=1 -c "create database $DB" >/dev/null
# same server and credentials, database name swapped (works with host or ?host= socket URLs)
DRILL="$(printf '%s' "$DRILL_DB_URL" | sed -E "s#^(postgres(ql)?://[^/]*)/[^?]*#\1/$DB#")"
psql "$DRILL" -q -c "select 1" >/dev/null || fail "cannot connect to the scratch database"
# Supabase roles referenced by policies and grants (no-op where they exist).
psql "$DRILL" -q -c "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end \$\$; create extension if not exists pgcrypto;" >/dev/null 2>&1 || true
set +e
pg_restore --no-owner --no-acl -d "$DRILL" "$TMP/db.dump" 2> "$TMP/restore.log"
set -e
grep -q "could not connect\|connection to server" "$TMP/restore.log" && fail "pg_restore could not connect"
ERRS=$(grep -c "ERROR" "$TMP/restore.log" || true)
echo "  restore warnings/errors: $ERRS (extension objects absent outside Supabase are expected; data checks below decide)"

echo "→ compare with manifest"
psql "$DRILL" -q -At -f scripts/backup/manifest.sql > "$TMP/counts.json" || fail "restored schema incomplete (manifest query failed) — see restore log"
node -e "
  const m = require(process.argv[1]).counts, r = require(process.argv[2]);
  const bad = Object.keys(m).filter((k) => String(m[k]) !== String(r[k]));
  if (bad.length) { console.error('mismatch: ' + bad.map((k) => k + ' ' + m[k] + ' → ' + r[k]).join(', ')); process.exit(1); }
  console.log('  ' + Object.keys(m).length + ' counts match');
" "$(realpath "$SRC/manifest.json")" "$TMP/counts.json" || fail "restored data differs from the manifest"

echo "→ integrity"
LEDGER="$(psql "$DRILL" -q -At -c "select coalesce(sum(debit) - sum(credit), 0) from public.ledger_entries")"
[ "$LEDGER" = "0" ] || [ "$LEDGER" = "0.00" ] || fail "ledger does not balance after restore ($LEDGER)"
BREAKS="$(psql "$DRILL" -q -At -c "select public.invoice_chain_breaks()")"
[ "$BREAKS" = "0" ] || fail "invoice chain broken after restore ($BREAKS)"
echo "  ledger balanced · invoice chain intact"

SECS=$(( $(date +%s) - T0 ))
[ "${KEEP_DRILL:-0}" = "1" ] && echo "  kept: $DRILL" || psql "$DRILL_DB_URL" -q -c "drop database $DB" >/dev/null
[ -n "${SUPABASE_DB_URL:-}" ] && psql "$SUPABASE_DB_URL" -q -c "select public.record_job('restore_drill', 'ok', '{\"seconds\": $SECS, \"backup\": \"$(basename "$SRC")\"}'::jsonb)" >/dev/null 2>&1 || true
echo "✓ restore drill passed in ${SECS}s"

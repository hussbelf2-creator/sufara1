#!/usr/bin/env bash
# Nightly off-site backup of the Safeer database (and, optionally, storage).
#
# Produces in $BACKUP_DIR/<UTC timestamp>/:
#   db.dump.enc        pg_dump (custom format) of the app schemas, AES-256 encrypted
#   storage.tar.enc    every file in the storage buckets (if SUPABASE_URL/KEY set)
#   manifest.json      row counts + ledger total + invoice head + SHA-256 of each file
# then records the run in public.job_runs (job 'backup'), which the health
# check watches: no successful backup in 26 h → alert.
#
# Required: SUPABASE_DB_URL     postgres://postgres:…@db.<ref>.supabase.co:5432/postgres
#           BACKUP_PASSPHRASE   long random secret, stored OUTSIDE the project (password manager)
# Optional: BACKUP_DIR (default ./backups), SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (storage),
#           BACKUP_UPLOAD  command run with the folder path appended, e.g.
#                          "aws s3 cp --recursive --sse AES256" + " s3://safeer-backups/<ts>/" is added by you
#           BACKUP_KEEP_DAYS (default 30) local retention.
set -euo pipefail
cd "$(dirname "$0")/../.."

: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL}"
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"
[ "${#BACKUP_PASSPHRASE}" -ge 20 ] || { echo "BACKUP_PASSPHRASE must be at least 20 characters" >&2; exit 1; }
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP_DAYS:-30}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/$TS"
mkdir -p "$OUT"
STARTED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

record() {  # record <ok|failed> <details-json> <error>
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -At \
    -c "select public.record_job('backup', '$1', '$2'::jsonb, nullif('$3', ''), '$STARTED'::timestamptz)" >/dev/null 2>&1 || true
}
trap 'record failed "{}" "backup script failed at line $LINENO"' ERR

enc() { openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -in "$1" -out "$2"; }

echo "→ database"
pg_dump "$SUPABASE_DB_URL" -Fc --no-owner --no-acl -n public -n auth -n storage -f "$OUT/db.dump"
enc "$OUT/db.dump" "$OUT/db.dump.enc"

echo "→ manifest"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -At -f scripts/backup/manifest.sql > "$OUT/counts.json"
rm -f "$OUT/db.dump"

if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "→ storage"
  node scripts/backup/storage-backup.mjs "$OUT/storage"
  tar -C "$OUT" -cf "$OUT/storage.tar" storage
  rm -rf "$OUT/storage"
  enc "$OUT/storage.tar" "$OUT/storage.tar.enc"
  rm -f "$OUT/storage.tar"
fi

sha() { sha256sum "$1" | cut -d' ' -f1; }
{
  echo "{"
  echo "  \"created_at\": \"$TS\","
  echo "  \"db_sha256\": \"$(sha "$OUT/db.dump.enc")\","
  [ -f "$OUT/storage.tar.enc" ] && echo "  \"storage_sha256\": \"$(sha "$OUT/storage.tar.enc")\","
  echo "  \"counts\": $(cat "$OUT/counts.json")"
  echo "}"
} > "$OUT/manifest.json"
rm -f "$OUT/counts.json"

if [ -n "${BACKUP_UPLOAD:-}" ]; then
  echo "→ upload"
  # shellcheck disable=SC2086
  $BACKUP_UPLOAD "$OUT"
fi

find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP" -exec rm -rf {} + 2>/dev/null || true

BYTES="$(du -sb "$OUT" | cut -f1)"
record ok "{\"folder\": \"$TS\", \"bytes\": $BYTES}" ""
trap - ERR
echo "✓ backup $OUT ($BYTES bytes)"

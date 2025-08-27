#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
ts=$(date -u +"%Y%m%dT%H%M%SZ")
pg_dump "$DATABASE_URL" | gzip > "backup_${ts}.sql.gz"
echo "Backup written to backup_${ts}.sql.gz"
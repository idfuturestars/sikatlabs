#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
: "${1:?Backup file required as first argument}"

backup_file="$1"
if [[ ! -f "$backup_file" ]]; then
  echo "Error: Backup file '$backup_file' not found"
  exit 1
fi

echo "WARNING: This will overwrite the current database!"
echo "Backup file: $backup_file"
echo "Database: $DATABASE_URL"
read -p "Are you sure? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "Restore cancelled"
  exit 0
fi

echo "Restoring database from $backup_file..."
if [[ "$backup_file" == *.gz ]]; then
  gunzip -c "$backup_file" | psql "$DATABASE_URL"
else
  psql "$DATABASE_URL" < "$backup_file"
fi
echo "Database restore completed"
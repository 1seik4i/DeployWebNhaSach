#!/bin/sh
set -eu
echo "Restoring repository database snapshot..."
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set ON_ERROR_STOP=1 --single-transaction --file /seed-snapshot/current.sql
echo "Repository database snapshot restored."

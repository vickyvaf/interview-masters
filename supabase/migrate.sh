#!/bin/bash
set -e

# Determine which env file to use (default to .env.local)
ENV_FILE="../.env.local"
if [ "$1" == "production" ]; then
  ENV_FILE="../.env.production"
  echo "Using production environment..."
else
  echo "Using local/development environment..."
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found."
  exit 1
fi

# Load environment variables
# Exporting variables so they are accessible
set -o allexport
source "$ENV_FILE"
set +o allexport

# Validate variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "Error: SUPABASE_URL or SUPABASE_DB_PASSWORD is not set in $ENV_FILE"
  exit 1
fi

# Extract project ref from SUPABASE_URL (e.g., https://xyz.supabase.co -> xyz)
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://||' | sed -E 's|\.supabase\.co||')
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_USER="postgres"
DB_PORT="5432"
DB_NAME="postgres"

CONNECTION_STRING="postgresql://${DB_USER}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "Connecting to Supabase Database: ${DB_HOST}..."

# Execute SQL file
psql "$CONNECTION_STRING" -f migrations/schema.sql

echo "Migration completed successfully!"

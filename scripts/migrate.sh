#!/bin/bash
# Run Prisma migrations against the production database
# Usage: ./scripts/migrate.sh [docker-compose-file]

COMPOSE_FILE=${1:-docker-compose.local.yml}

echo "Running migrations using $COMPOSE_FILE..."

# Run migrations using a temporary container with full node_modules
docker compose -f "$COMPOSE_FILE" run --rm \
  -e DATABASE_URL \
  --entrypoint "" \
  app sh -c "cd /app && npx prisma migrate deploy"

#!/bin/bash
# This is the entrypoint script for the web docker container. It is responsible for running database migrations and launching the production server.

set -e

# Import environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Create required directories
dirs="assets/clothing_item assets/outfits"
for dir in $dirs; do
  mkdir -p "$dir"
done

port=${POSTGRES_PORT:-5432}
host=${POSTGRES_HOST:-db}
retries=0
echo "Checking database connection to $host:$port..."
until nc -z "$host" "$port"; do
  retries=$((retries + 1))
  echo "Waiting for database to be ready ($retries)..."
  if [ $retries -ge 30 ]; then
    echo "Error: Unable to connect to database at $host:$port after 30 attempts."
    exit 1
  fi
  sleep 2
done
# Run database migrations
bun run db:migrate

# Launch prod server
node build/index.js

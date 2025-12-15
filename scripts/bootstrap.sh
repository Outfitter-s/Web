#!/usr/bin/env bash

# Get the .zip archive in root/sql/bootstrap.zip, unzip in in tmp, run the sql script against local postgres and move images in root/assets/clothing_items
root="$(builtin cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
unzip_dir="$(mktemp -d)"
bootstrap_zip="$root/sql/bootstrap.zip"
images_dir="$root/assets/clothing_item"
env_location="$root/.env"
echo "Using temporary directory: $unzip_dir"

# Load environment variables from .env file if it exists
if [[ -f "$env_location" ]]; then
  export $(grep -v '^#' "$env_location" | xargs)
fi

if [[ ! -f "$bootstrap_zip" ]]; then
  echo "Error: Bootstrap zip file not found at $bootstrap_zip"
  exit 1
fi
mkdir -p "$images_dir"
mkdir "$root/assets/profile_pictures"
unzip -q "$bootstrap_zip" -d "$unzip_dir"
if [[ $? -ne 0 ]]; then
  echo "Error: Failed to unzip $bootstrap_zip"
  exit 1
fi
sql_file="$unzip_dir/dump.sql"
if [[ ! -f "$sql_file" ]]; then
  echo "Error: SQL file not found in the unzipped content"
  exit 1
fi
echo "Running SQL script against local PostgreSQL database..."
export PGPASSWORD="${POSTGRES_PASSWORD:-}"
psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -f "$sql_file"
if [[ $? -ne 0 ]]; then
  echo "Error: Failed to execute SQL script"
  exit 1
fi
rm -rf "$unzip_dir/dump.sql"
echo "SQL script executed successfully."
echo "Moving images to $images_dir..."
mv "$unzip_dir/"* "$images_dir/"
if [[ $? -ne 0 ]]; then
  echo "Error: Failed to move images"
  exit 1
fi

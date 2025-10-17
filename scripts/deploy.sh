#!/usr/bin/env bash

# Get the .env variables if they exist, else trow an error
here=$(dirname "$0")
envLocation="$here/../.env"
if [ -f "$envLocation" ]; then
  export $(cat "$envLocation" | xargs)
else
  echo "Error: .env file not found."
  exit 1
fi

# SSH into the server and run the deployment commands
ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" << EOF
  pct enter $SSH_CONTAINER_ID
  cd "$SSH_PROJECT_DIR" || exit
  docker compose pull
  git pull origin main
  docker compose down
  docker compose up -d
  echo "Deployment completed successfully."
EOF

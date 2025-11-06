#!/usr/bin/env bash

tag="${1:-latest}"
echo "Building and pushing Docker image with tag: $tag"

# Build the Docker image for the application
docker build -t anguspllg/outfitter_web:$tag .
# Push the image to the Docker registry
docker push anguspllg/outfitter_web:$tag

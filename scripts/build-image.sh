#!/usr/bin/env bash

tag=${$1:-latest}

# Build the Docker image for the application
docker build -t anguspllg/outffitter:$tag .
# Push the image to the Docker registry
docker push anguspllg/outffitter:$tag

#!/usr/bin/env bash

root="$(builtin cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bootstrap_zip="$root/sql/bootstrap.zip"
input_dir="$root/assets/clothing_item"

zip -r "$bootstrap_zip" "$input_dir/"*

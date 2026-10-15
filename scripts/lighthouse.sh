#!/usr/bin/env bash
# Runs Lighthouse (mobile preset, 3 runs per page) on /, the first project's case
# study and /resume, writing JSON reports to OUT_DIR. Used by lighthouse.yml.
#
# Usage: scripts/lighthouse.sh <base-url> <out-dir> [extra lighthouse flags...]
set -euo pipefail

BASE="${1%/}"
OUT="$2"
shift 2

CASE_STUDY=$(node -e "const p=require('./data/projects.json').projects;process.stdout.write(p[0]?('/projects/'+p[0].slug):'')")
mkdir -p "$OUT"

for path in "/" "$CASE_STUDY" "/resume"; do
  [ -z "$path" ] && continue
  name=$(echo "$path" | tr '/' '_')
  for run in 1 2 3; do
    echo "Lighthouse $BASE$path (run $run)"
    npx --yes lighthouse@12 "$BASE$path" \
      --quiet --output=json --output-path="$OUT/page${name}-${run}.json" \
      --only-categories=performance,accessibility,best-practices,seo \
      --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
      "$@" || echo "::warning::Lighthouse run $run failed for $path"
  done
done

ls -la "$OUT"

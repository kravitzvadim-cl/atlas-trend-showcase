#!/bin/sh
# One controlled live research run against a running app (npm run dev). Spends real OpenRouter credit.
# Usage: scripts/live-run.sh "liquid glass" [port]
set -eu
keyword="$1"; port="${2:-3100}"
out="docs/runs/$(date +%Y-%m-%d-%H%M)-$(echo "$keyword" | tr ' A-Z' '-a-z' | tr -cd 'a-z0-9-').ndjson"
curl -sN -X POST "http://localhost:$port/api/research" -H 'content-type: application/json' \
  --data "$(printf '{"keyword":%s}' "$(printf '%s' "$keyword" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')")" | tee "$out"
echo "\nSaved to $out"

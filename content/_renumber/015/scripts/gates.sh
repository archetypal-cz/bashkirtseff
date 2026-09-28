#!/bin/bash
# gates.sh REPO OUT : verify-carnet + splicescan for 015-030 in all trees
cd "$1"
for c in 015 016 017 018 019 020 021 022 023 024 025 026 027 028 029 030; do
  for l in _original cz uk en fr; do
    [ -d content/$l/$c ] || continue
    v=$(npx tsx src/scripts/verify-carnet.ts $l $c 2>&1 | tail -3 | tr '\n' ' ')
    s=$(awk -f src/scripts/splicescan.awk content/$l/$c/[0-9]*.md | wc -l)
    echo "$c $l splice_hits=$s | $v"
  done
done > "$2"
echo gates-done >> "$2"

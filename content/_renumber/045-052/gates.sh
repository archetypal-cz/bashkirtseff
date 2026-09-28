#!/bin/bash
# usage: gates.sh <repo root> <out file> carnets...
R=$1; OUT=$2; shift 2
cd $R
: > $OUT
for c in "$@"; do
  for l in _original cz uk en fr; do
    v=$(timeout 300 just verify-carnet $l $c 2>&1 | grep -E "RESULT|PASS|FAIL" | tail -1)
    s=$(timeout 300 just splicescan $l $c 2>&1 | grep -v "^just\|^npx\|^uv\|^python" | wc -l)
    echo "$c $l verify=[$v] splicescan_lines=$s" >> $OUT
  done
done
echo DONE >> $OUT

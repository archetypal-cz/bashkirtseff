#!/usr/bin/env bash
# gates for 001-014 in repo root $1; logs in $2
R=$1; L=$2; mkdir -p $L; cd $R
for c in 001 002 003 004 005 006 007 008 009 010 011 012 013 014; do
  npx tsx src/scripts/rebuild-carnet.ts --check $c > $L/check-$c.out 2>&1; echo "renumber-check $c rc=$? $(grep RESULT $L/check-$c.out)"
  for t in _original cz uk en fr es; do
    [ -d content/$t/$c ] || continue
    npx tsx src/scripts/verify-carnet.ts $t $c > $L/verify-$t-$c.out 2>&1; v=$?
    hits=$(awk -f src/scripts/splicescan.awk content/$t/$c/[0-9]*.md | wc -l)
    echo "  $t $c verify rc=$v $(grep -m1 -E 'PASS|FAIL' $L/verify-$t-$c.out | cut -c1-80) splice=$hits"
  done
done

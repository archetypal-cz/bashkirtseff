#!/bin/bash
# runbatch.sh ROOT CHECKED.json carnet...  — rebuild + postfix per carnet; prints gate failures
ROOT=$1; CH=$2; shift 2; cd $ROOT
for c in "$@"; do
  before=$(ls content/_renumber/$c-$(date +%Y-%m-%d)*.json 2>/dev/null | wc -l)
  just rebuild-carnet $c ~/rebuild-state/plan-sourcefix/pagebreak/plan-pb-$c.json --write >/dev/null 2>&1 || { echo "REBUILD FAIL $c"; continue; }
  map=$(ls -t content/_renumber/$c-$(date +%Y-%m-%d)*.json | head -1)
  python3 ~/rebuild-state/plan-sourcefix/pagebreak/postfix.py $ROOT $map $CH $c | grep -v 'no issues'
  python3 ~/rebuild-state/plan-sourcefix/pagebreak/fnfix.py $ROOT $map $c
done
python3 ~/rebuild-state/plan-sourcefix/pagebreak/textcheck.py $ROOT "$@" | grep -v SAME
for c in "$@"; do for t in _original cz uk en fr; do r=$(just verify-carnet $t $c 2>&1 | grep -o 'RESULT: [A-Z]* ([0-9]* fail'); s=$(just splicescan $t $c 2>&1 | grep -vc '^npx\|^tsx\|^uv\|^python'); case "$r|$s" in *"PASS (0 fail|0") ;; *) echo "$c $t $r $s";; esac; done; r=$(just renumber-check $c 2>&1 | grep RESULT); case "$r" in *"0 fail"*) ;; *) echo "renumber $c $r";; esac; done
just check-comments 2>&1 | tail -1

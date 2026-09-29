#!/bin/bash
# bash validate.sh REPO TAG [apply]  — prereqs, dry runs, --write per carnet, post-apply, gates
W=/home/coder/rebuild-state/plan-tome08
R=$1; T=$2; CS="060 061 062 063 064"
V=$W/$T; mkdir -p $V
cd $R || exit 2
python3 $W/tools/prereq.py . > $V/prereq.out || { echo PREREQ FAILED; exit 3; }
for c in $CS; do npx tsx src/scripts/rebuild-carnet.ts $c $W/final/plan-$c.json > $V/dry-$c.out 2>&1 || { echo "DRY $c FAILED"; exit 5; }; done
echo DRY_OK
for c in $CS; do
  npx tsx src/scripts/rebuild-carnet.ts $c $W/final/plan-$c.json --write > $V/write-$c.out 2>&1; echo "WRITE $c EXIT=$?"
  grep -E "REJECTED|ERROR|FAIL" $V/write-$c.out | head -5
done
python3 $W/tools/post_apply08.py . $(date +%F) > $V/post_apply.out 2>&1; echo "POST_APPLY EXIT=$?"; tail -3 $V/post_apply.out
for c in $CS; do echo "== renumber-check $c"; just renumber-check $c 2>&1 | grep -E "FAIL|RESULT" | head -12; done
for l in _original cz uk en fr; do for c in $CS; do r=$(just verify-carnet $l $c 2>&1 | grep "^RESULT"); s=$(just splicescan $l $c 2>&1 | grep -v "^$" | wc -l); echo "GATE $l $c | $r | splice $s"; done; done
for l in _original cz uk en fr; do just check-comments $l 2>&1 | tail -1; done
just glossary-missing 2>&1 | tail -3
COMPLETENESS_WORK=$V/compl-work COMPLETENESS_REPORT=$V/compl-report.md just source-completeness $CS 2>&1 | tail -30
echo ALLDONE

#!/bin/bash
# Apply on main (Coder workspace): bash apply_main.sh REPO TAG  (prereqs, dry run at HEAD, write, post-fixes, gates)
W=/home/coder/rebuild-state/plan-tome1213
R=$1; T=$2; CS="081 082 083 084 085 086 087 088 089"
V=$W/$T; mkdir -p $V
cd $R || exit 2
for s in prereq_082.py prereq_1213.py prereq_fr0812.py prereq_084.py prereq_089.py; do python3 $W/tools/$s . > /dev/null || { echo "PREREQ $s FAILED"; exit 3; }; done
for c in $CS; do npx tsx src/scripts/rebuild-carnet.ts $c $W/final/plan-$c.json > $V/dry-$c.out 2>&1 || { echo "DRY $c FAILED"; exit 5; }; grep -qE "REJECTED" $V/dry-$c.out && { echo "DRY $c REJECTED"; exit 5; }; done
echo DRY_OK
for c in $CS; do
  npx tsx src/scripts/rebuild-carnet.ts $c $W/final/plan-$c.json --write > $V/write-$c.out 2>&1; echo "WRITE $c EXIT=$?"
  grep -E "REJECTED|ERROR" $V/write-$c.out | head -5
done
python3 $W/tools/post_apply_d.py .
python3 $W/tools/post_apply.py . $CS || { echo POST_APPLY_FAILED; exit 4; }
python3 $W/tools/post_echo.py . $CS --force=082.0139,082.0180
for c in $CS; do echo "== renumber-check $c"; just renumber-check $c 2>&1 | grep -E "FAIL|RESULT" | head -12; done
for l in _original cz uk en fr; do for c in $CS; do r=$(just verify-carnet $l $c 2>&1 | grep "^RESULT"); s=$(just splicescan $l $c 2>&1 | grep -v "^$" | wc -l); echo "GATE $l $c | $r | splice $s"; done; done
for l in _original cz uk en fr; do just check-comments $l 2>&1 | tail -1; done
just glossary-missing 2>&1 | tail -3
COMPLETENESS_WORK=$W/$T/compl-work COMPLETENESS_REPORT=$W/$T/compl-report.md just source-completeness $CS 2>&1 | tail -30
echo ALLDONE

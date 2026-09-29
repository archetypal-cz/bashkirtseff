#!/bin/bash
# on main, lock held, after git pull: pre_fix, dry runs, write, add_rsr, post_fix, post_fix2, gates, completeness
R=/home/coder/bashkirtseff; P=/home/coder/rebuild-state/plan-tome0102; F=$P/final2; L=$P/main
mkdir -p $L; cd $R
python3 $P/pre_fix.py . || exit 1
for c in 001 002 003 004 005 006 007 010 013 014; do npx tsx src/scripts/rebuild-carnet.ts $c $F/plan-$c.json > $L/dry-$c.out 2>&1 || { echo "DRY FAIL $c"; exit 1; }; done
npx tsx src/scripts/rebuild-carnet.ts --multi $F/plan-008.json $F/plan-009.json > $L/dry-0809.out 2>&1 || { echo "DRY FAIL 0809"; exit 1; }
npx tsx src/scripts/rebuild-carnet.ts --multi $F/plan-011.json $F/plan-012.json > $L/dry-1112.out 2>&1 || { echo "DRY FAIL 1112"; exit 1; }
echo DRY_OK; grep -h "outside the carnet" $L/dry-*.out
for c in 001 002 003 004 005 006 007 010 013 014; do
  npx tsx src/scripts/rebuild-carnet.ts $c $F/plan-$c.json --write > $L/write-$c.out 2>&1; echo "$c write rc=$?"
done
npx tsx src/scripts/rebuild-carnet.ts --multi $F/plan-008.json $F/plan-009.json --write > $L/write-0809.out 2>&1; echo "0809 write rc=$?"
npx tsx src/scripts/rebuild-carnet.ts --multi $F/plan-011.json $F/plan-012.json --write > $L/write-1112.out 2>&1; echo "1112 write rc=$?"
python3 $P/add_rsr.py . ; echo "add_rsr rc=$?"
python3 $P/post_fix.py . ; echo "post_fix rc=$?"
python3 $P/post_fix2.py . ; echo "post_fix2 rc=$?"
bash $P/gates.sh . $L/gates
just check-comments _original cz uk en fr es 2>&1 | tail -1
just glossary-missing 2>&1 | tail -2
COMPLETENESS_WORK=$L/compl-work COMPLETENESS_REPORT=$L/compl-report.md just source-completeness 001 002 003 004 005 006 007 008 009 010 011 012 013 014 > $L/compl.out 2>&1; grep -E "^0[01][0-9]:" $L/compl.out
echo ALLDONE

#!/bin/bash
# usage: validate7.sh <repo root> <tag>   (prereqs, --write, post_apply, gates)
R=$1; T=$2; P=/home/coder/rebuild-state/plan-tome10
cd $R
python3 $P/prereq_fix.py . || exit 1
sed -i 's/071\.1010/071.0241/g' content/_original/_glossary/people/recurring/WALITSKY.md
F=$P/final3
npx tsx src/scripts/rebuild-carnet.ts --multi $F/plan-069.json $F/plan-070.json $F/plan-071.json $F/plan-072.json $F/plan-073.json $F/plan-074.json --write > $P/write-$T.out 2>&1
echo WRITE_EXIT=$?
[ -f content/_renumber/069-2026-09-28.json ] || exit 1
python3 $P/tools/post_apply.py . 2026-09-28
python3 $P/tools/fix_fn_070.py .
python3 $P/tools/rsr_headings.py . 2026-09-28
for c in 069 070 071 072 073 074; do echo "== renumber-check $c"; just renumber-check $c 2>&1 | grep -E "FAIL|WARN|RESULT" ; done
for l in _original cz uk en fr; do for c in 069 070 071 072 073 074; do r=$(just verify-carnet $l $c 2>&1 | grep "^RESULT"); s=$(just splicescan $l $c 2>&1 | grep -v "^$" | wc -l); echo "GATE $l $c | $r | splice $s"; done; done
for l in _original cz uk en fr; do just check-comments $l 2>&1 | tail -1; done


echo ALLDONE

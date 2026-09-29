#!/bin/bash
# validate.sh REPO TAG — --write of final/ plans in REPO, post-fixes, gates. Output in v-TAG/
R=$1; T=$2; P=/home/coder/rebuild-state/plan-tome05; O=$P/v-$T; mkdir -p $O
cd $R || exit 1
C="031 032 033 034 035 036 037 038 039 040 041 042 043 044"
python3 $P/prefix5.py . > $O/prefix.out 2>&1
npx tsx src/scripts/rebuild-carnet.ts --multi $(for c in $C; do echo $P/final/plan-$c.json; done) > $O/dry.out 2>&1; echo DRY_EXIT=$?
npx tsx src/scripts/rebuild-carnet.ts --multi $(for c in $C; do echo $P/final/plan-$c.json; done) --write > $O/write.out 2>&1; echo WRITE_EXIT=$?
D=$(ls content/_renumber/031-*.json | sed 's/.*031-//; s/\.json//' | sort | tail -1); echo DATE=$D
python3 $P/postfix5.py . $D > $O/postfix.out 2>&1; echo POSTFIX_EXIT=$?
uv run -q --with pillow python3 $P/add_drawings5.py . > $O/drawings.out 2>&1; echo DRAWINGS_EXIT=$?
for c in $C; do echo "== renumber-check $c"; just renumber-check $c 2>&1 | grep -E "FAIL|RESULT|^\s*\(c\)|WARN" | head -8; done > $O/renumber.out
for c in $C; do for l in _original cz uk en fr; do [ -d content/$l/$c ] || continue
  v=$(npx tsx src/scripts/verify-carnet.ts $l $c 2>&1 | grep -E "^RESULT|FAIL" | head -3 | tr '\n' ' ')
  s=$(awk -f src/scripts/splicescan.awk content/$l/$c/[0-9]*.md | wc -l)
  echo "$c $l splice=$s | $v"; done; done > $O/gates.out
for l in _original cz uk en fr; do echo "$l: $(just check-comments $l 2>&1 | tail -1)"; done > $O/comments.out
just glossary-missing > $O/glossary-missing.out 2>&1
COMPLETENESS_WORK=$O/compl-work COMPLETENESS_REPORT=$O/compl-report.md just source-completeness $C > $O/compl.out 2>&1; echo COMPL_EXIT=$?
git status --short content/ src/ | grep -v "^?? content/_renumber\|^ M content/\(_original\|cz\|uk\|en\|fr\)/0\(3[1-9]\|4[0-4]\)/" > $O/other-changes.out
echo ALLDONE

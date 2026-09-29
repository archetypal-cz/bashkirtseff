#!/bin/bash
R=$1; P=/home/coder/rebuild-state/plan-tome1116
cd $R
for c in 075 076 077 078 079 080 101 102 103 104 105 106; do just renumber-check $c 2>&1 | grep -E "FAIL\]|WARN\]|RESULT" | sed "s/^/rc $c: /"; done
for t in _original cz uk en fr; do for c in 075 076 077 078 079 080 101 102 103 104 105 106; do
  r=$(just verify-carnet $t $c 2>&1 | grep -E "RESULT" | tail -1); echo "verify $t $c: $r"
  s=$(just splicescan $t $c 2>&1 | grep -v "^just\|^uv\|^npx\|splicescan" | head -5); [ -n "$s" ] && echo "SPLICE $t $c: $s"
done; done
for t in _original cz uk en fr; do echo "check-comments $t: $(just check-comments $t 2>&1 | tail -1)"; done
echo "== checkheads_t11"; (cd $P/final11 && python3 checkheads_t11.py $R 2>&1 | tail -15)
echo "== headcheck16"; (cd $P/final16 && python3 headcheck.py $R 2>&1 | tail -15)
echo "== completeness"; just source-completeness 075 076 077 078 079 080 101 102 103 104 105 106 2>&1 | tail -40
echo GATESDONE

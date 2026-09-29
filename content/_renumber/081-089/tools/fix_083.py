"""common/plan-083.json -> final/plan-083.json (worker B)."""
import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tk
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
C = '083'
p = json.load(open(f'{W}/common/plan-{C}.json'))
exec(open(f'{W}/tools/fixlib_b.py').read())
strip_drafter_completions(p)
dash_lines(p)
EDITS_083 = os.path.join(W, 'tools', 'edits_083.py')
if os.path.exists(EDITS_083): exec(open(EDITS_083).read())
finish(p, 1578, 2177)
apply_subs(p)
apply_typos(p, 1578, 2177)
json.dump(p, open(f'{W}/final/plan-{C}.json', 'w'), ensure_ascii=False, indent=1)
print('wrote final/plan-083.json')

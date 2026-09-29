"""common/plan-084.json -> final/plan-084.json (worker B)."""
import json, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tk
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
C = '084'
p = json.load(open(f'{W}/common/plan-{C}.json'))
exec(open(f'{W}/tools/fixlib_b.py').read())
strip_drafter_completions(p)
dash_lines(p)
EDITS_084 = os.path.join(W, 'tools', 'edits_084.py')
if os.path.exists(EDITS_084): exec(open(EDITS_084).read())
finish(p, 2178, 2958)
apply_subs(p)
apply_typos(p, 2178, 2958)
json.dump(p, open(f'{W}/final/plan-{C}.json', 'w'), ensure_ascii=False, indent=1)
print('wrote final/plan-084.json')

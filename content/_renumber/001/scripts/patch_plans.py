"""Post-finalize patch (resume session 2026-09-28): drop the entry `heading` where the first
paragraph's set_french already opens with a `#` heading. At HEAD ec6fa6163 the tool otherwise
inserts a second embedded heading + `# TODO` in translations whose heading line had no `#`
(010/1873-10-01, 012/1873-11-01)."""
import json
W = '/home/coder/rebuild-state/plan-tome0102/final'
for c in range(1, 15):
    fn = f'{W}/plan-{c:03d}.json'
    p = json.load(open(fn)); n = 0
    for e in p['entries']:
        q = e['paragraphs'][0] if e['paragraphs'] else {}
        if 'heading' in e and q.get('set_french', '').startswith('#'):
            del e['heading']; n += 1
    if n:
        json.dump(p, open(fn, 'w'), ensure_ascii=False, indent=1); print(f'{c:03d}: heading removed from {n} entr(y/ies)')

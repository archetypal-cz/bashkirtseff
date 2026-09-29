"""Common post-processing of tiled/plan-CCC.json -> common/plan-CCC.json.
- cover entries removed: their new paragraphs are recorded in common/withdrawn-CCC.json,
  their old paragraphs dropped with the owner's reason;
- quotes normalised in every new French / set_french (’ -> ', “ ” -> ");
- kind guesses 'other' on «[Aucun texte…]» / «[Pas d'entrée…]» / «[Aucune entrée…]» placeholders removed.
python3 fix_common.py CCC
"""
import json, sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tk
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
c = sys.argv[1]
p = json.load(open(f'{W}/tiled/plan-{c}.json'))
WITHDRAW = 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)'

def q(s):
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')

withdrawn = []
p.setdefault('drop', [])
keep = []
O = {}
for cc in {x['old'][:3] for e in p['entries'] for x in e['paragraphs'] if 'old' in x}: O.update(tk.orig(cc))
for e in p['entries']:
    if e['file'].endswith('-cover.md'):
        for x in e['paragraphs']:
            if 'new' in x:
                withdrawn.append({'french': x['new']['french'], 'rsr': x['new']['rsr']})
            else:
                p['drop'].append({'id': x['old'], 'reason': WITHDRAW})
                withdrawn.append({'old': x['old']})
        continue
    keep.append(e)
p['entries'] = keep
PLACEHOLDER = re.compile(r"\[(Aucun texte|Pas d'entr|Aucune entr)", re.I)
for e in p['entries']:
    for x in e['paragraphs']:
        if 'new' in x:
            x['new']['french'] = q(x['new']['french'])
        if 'set_french' in x:
            x['set_french'] = q(x['set_french'])
        if x.get('kind') == 'other' and 'old' in x:
            t = ' '.join(O.get(x['old'], ['', []])[1])
            if PLACEHOLDER.search(t):
                del x['kind']; x.pop('_kind_guess_reason', None)
        if 'new' in x and x['new'].get('kind') == 'other' and PLACEHOLDER.search(x['new']['french']):
            del x['new']['kind']
# dialogue dashes: docx list numbering «-» is lost in the drafter's text
TOME = '12' if c < '085' else '13'
NUM = json.load(open(f'{W}/tools/numpr{TOME}.json'))
DX = tk.docx(TOME)
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import para_text
ndash = 0; numbered = []
for e in p['entries']:
    for x in e['paragraphs']:
        if 'new' not in x: continue
        for m in re.finditer(r'¶(\d+)(?:[–-](\d+))?', x['new']['rsr']):
            lo = int(m.group(1)); hi = int(m.group(2) or lo)
            for k in range(lo, hi + 1):
                lv = NUM.get(str(k))
                if not lv: continue
                if lv != '-':
                    numbered.append((k, lv, x['new']['french'][:60])); continue
                head = q(para_text(DX[k]))[:30].strip()
                f = x['new']['french']
                j = f.find(head) if head else -1
                if j < 0: numbered.append((k, 'dash not placed', head)); continue
                before = f[:j].rstrip(' ')
                if before.endswith(('-', '—', '–')): continue
                x['new']['french'] = f[:j] + '- ' + f[j:]
                ndash += 1
print(c, 'dashes restored', ndash, 'unplaced/numbered', numbered)
os.makedirs(f'{W}/common', exist_ok=True)
json.dump(p, open(f'{W}/common/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
json.dump(withdrawn, open(f'{W}/common/withdrawn-{c}.json', 'w'), ensure_ascii=False, indent=1)
print(c, 'withdrawn', len(withdrawn), 'entries', len(p['entries']))

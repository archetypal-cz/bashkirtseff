"""Common post-processing for tome 08: draft/plan-CCC.json -> common/plan-CCC.json (+ common/withdrawn-CCC.json, common/log-CCC.md).
- cover entries removed (text recorded as withdrawn; old cover paragraphs dropped with the owner's reason);
- quotes normalised in new French / set_french (’ -> ', “ ” -> ") as in _original;
- «[Aucun texte…]» placeholders lose a guessed kind;
- the drafter's `other` guess on «[annotation]» markers (the printed edition's «[ANNOTATION]» label) -> `editorial`;
  the italic run after the marker (Marie's later annotation, printed in italics) -> `margin`, source «Annotation de Marie»
  (+ year when the text opens with one); old clusters holding marker + text -> `margin`;
- dialogue dashes: docx list numbering «-» is lost in the drafter's text -> «— » (the _original convention of 060–064);
- stray new paragraphs that are the tail of a two-day date line («- jeudi 11 mai 1876») removed.
python3 common08.py CCC
"""
import json, sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tk
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import para_text  # noqa
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
c = sys.argv[1]
p = json.load(open(f'{W}/draft/plan-{c}.json'))
WITHDRAW = 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)'
log = []

def q(s):
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')

withdrawn = []
p.setdefault('drop', [])
O = {}
for cc in {x['old'][:3] for e in p['entries'] for x in e['paragraphs'] if 'old' in x}: O.update(tk.orig(cc))
keep = []
for e in p['entries']:
    if e['file'].endswith('-cover.md'):
        for x in e['paragraphs']:
            if 'new' in x: withdrawn.append({'french': x['new']['french'], 'rsr': x['new']['rsr']})
            else:
                p['drop'].append({'id': x['old'], 'reason': WITHDRAW}); withdrawn.append({'old': x['old']})
        log.append(f'- cover entry {e["file"]} removed ({len(e["paragraphs"])} paragraph(s))')
        continue
    keep.append(e)
p['entries'] = keep

PLACEHOLDER = re.compile(r"\[(Aucun texte|Pas d'entr|Aucune entr)", re.I)
MARK = re.compile(r'^\s*\[\s*annotation\s*\]\s*$', re.I)
DAYTAIL = re.compile(r'^\s*[-–—]\s*(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d+\S*\s+\w+\s+18\d\d\s*$', re.I)

def text_of(x):
    if 'new' in x: return x['new']['french']
    if 'set_french' in x: return x['set_french']
    return '\n'.join(l for l in O.get(x['old'], ['', []])[1] if not l.startswith('#'))

def italic(t):
    t = re.sub(r'\[\^[^\]]+\]', '', t).strip()
    t = re.sub(r'^\[\s*annotation\s*\]\s*', '', t, flags=re.I).strip()
    return len(t) > 1 and t.startswith('*') and t.rstrip(' .!?…»').endswith('*') and t.count('*') == 2

def setkind(x, kind, source=None):
    tgt = x['new'] if 'new' in x else x
    tgt['kind'] = kind
    if source: tgt['source'] = source
    else: tgt.pop('source', None)
    x.pop('_kind_guess_reason', None)

def ann_source(t):
    m = re.match(r'^\W*(18[78]\d)\b', re.sub(r'^\[\s*annotation\s*\]\s*', '', t.strip(), flags=re.I).lstrip('*'))
    return 'Annotation de Marie' + (f', {m.group(1)}' if m else '')

for e in p['entries']:
    P = e['paragraphs']
    kept = []
    for x in P:
        if 'new' in x and DAYTAIL.match(x['new']['french']):
            log.append(f'- {e["file"]}: stray date-line tail removed «{x["new"]["french"]}» ({x["new"]["rsr"][:40]})'); continue
        kept.append(x)
    e['paragraphs'] = P = kept
    for k, x in enumerate(P):
        if 'new' in x:
            x['new']['french'] = q(x['new']['french'])
        if 'set_french' in x:
            x['set_french'] = q(x['set_french'])
        t = text_of(x)
        if x.get('kind') == 'other' and 'old' in x and PLACEHOLDER.search(t):
            del x['kind']; x.pop('_kind_guess_reason', None)
        if 'new' in x and x['new'].get('kind') == 'other' and PLACEHOLDER.search(t):
            del x['new']['kind']
        if MARK.match(t):
            setkind(x, 'editorial')
            j = k + 1; n = 0
            while j < len(P) and italic(text_of(P[j])) and not MARK.match(text_of(P[j])):
                setkind(P[j], 'margin', ann_source(text_of(P[j]))); n += 1; j += 1
            log.append(f'- {e["file"]} {x.get("old") or x["new"]["rsr"][14:40]}: [annotation] marker -> editorial; {n} italic paragraph(s) after it -> margin'
                       + ('  **CHECK: no italic run follows**' if n == 0 else ''))
        elif re.match(r'^\s*\[\s*annotation\s*\]\s*\S', t, re.I):
            setkind(x, 'margin', ann_source(t))
            log.append(f'- {e["file"]} {x.get("old") or "new"}: marker + text in one paragraph -> margin')
        elif re.search(r'\[\s*annotation\s*\]', t, re.I):
            log.append(f'- {e["file"]} {x.get("old") or "new"}: **inline [annotation] inside a paragraph — CHECK (split?)**')

# ID-less stubs in _original (empty_in_source days): the rebuilt entry of the same name replaces them
from pathlib import Path
newfiles = {e['file'] for e in p['entries']}
for f in sorted(Path(f'/home/coder/bashkirtseff/content/_original/{c}').glob('18*.md')):
    if '%% ' + c + '.' in f.read_text() : continue
    if f.name in newfiles and not any(d['file'] == f.name for d in p.get('drop_files', [])):
        p.setdefault('drop_files', []).append({'file': f.name, 'reason': 'empty stub (no paragraph IDs); the day is rebuilt from tome08.docx as a new entry of the same name (2026-09-29 rebuild)'})
        log.append(f'- drop_files {f.name} (ID-less stub, rebuilt entry of the same name)')
    elif f.name not in newfiles:
        tgt = next((e for e in p['entries'] if e['file'] == f.name[:10] + '.md'), None)
        if tgt is None:
            log.append(f'- **ID-less stub {f.name} has no entry of the same name — CHECK**'); continue
        p.setdefault('drop_files', []).append({'file': f.name, 'reason': f'empty stub (no paragraph IDs) for a range; the days are rebuilt from tome08.docx, the URL redirects to {tgt["file"]} (2026-09-29 rebuild)'})
        tgt.setdefault('redirect_from', []).append(f.name)
        log.append(f'- drop_files {f.name} (ID-less range stub) + redirect_from on {tgt["file"]}')

# dialogue dashes
NUM = json.load(open(f'{W}/tools/numpr08.json'))
DX = tk.docx('08')
ndash = 0
for e in p['entries']:
    for x in e['paragraphs']:
        if 'new' not in x: continue
        for m in re.finditer(r'¶(\d+)(?:[–-](\d+))?', x['new']['rsr']):
            lo = int(m.group(1)); hi = int(m.group(2) or lo)
            for k in range(lo, hi + 1):
                if NUM.get(str(k)) != '-': continue
                head = q(para_text(DX[k]))[:30].strip()
                f = x['new']['french']
                j = f.find(head) if head else -1
                if j < 0: log.append(f'- dash not placed ¶{k} «{head}»'); continue
                before = f[:j].rstrip(' >')
                if before.endswith(('-', '—', '–')): continue
                x['new']['french'] = f[:j] + '— ' + f[j:]
                ndash += 1
log.append(f'- dialogue dashes restored: {ndash}')
os.makedirs(f'{W}/common', exist_ok=True)
json.dump(p, open(f'{W}/common/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
json.dump(withdrawn, open(f'{W}/common/withdrawn-{c}.json', 'w'), ensure_ascii=False, indent=1)
open(f'{W}/common/log-{c}.md', 'w').write(f'# common08 {c}\n\n' + '\n'.join(log) + '\n')
print(c, 'withdrawn', len(withdrawn), 'entries', len(p['entries']), 'dashes', ndash)

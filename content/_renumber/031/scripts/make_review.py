"""make_review.py → final/REVIEW.md (tome 5, carnets 031–044) from final/plan-*.json, log/withdrawn/questions and notes_CCC.md."""
import collections, json
from pathlib import Path
W = Path('/home/coder/rebuild-state/plan-tome05'); F = W / 'final'
import sys; sys.path.insert(0, str(W))
from fixlib5 import ORIG, CARNETS
P = {c: json.load(open(F / f'plan-{c}.json')) for c in CARNETS}
LOG = json.load(open(F / 'log.json')); WD = json.load(open(F / 'withdrawn.json')); Q = json.load(open(F / 'questions.json'))
out = ['# Rebuild review: carnets 031–044 (tome 5, 2026-09-28/29)', '',
       'Plans built by `fix5.py` from the drafter\'s `d2/` plans: a generic pass (fix5.py) and per-carnet reviews '
       '(`fix_CCC.py`, Opus reviewers, notes below). Source: `content/_raw/tome05.docx` (OCR of *Mon Journal* t.5); '
       'no scan exists for tome 5, so RSR notes cite docx ¶ only. Owner policies as in the 2026-09-28 handoff.', '',
       '## Summary', '',
       '| Carnet | Old IDs | Carried | Moved in | Moved out | New | Dropped | Total | Entries (old→new) | set_french | Kinds set |',
       '|---|---|---|---|---|---|---|---|---|---|---|']
placed = {}
for c, p in P.items():
    for e in p['entries']:
        for q in e['paragraphs']:
            if 'old' in q: placed[q['old']] = c
for c, p in P.items():
    old = len(ORIG[c]); dropped = len(p['drop'])
    mi = sum(1 for k, v in placed.items() if v == c and k[:3] != c)
    mo = sum(1 for k, v in placed.items() if k[:3] == c and v != c)
    carried = sum(1 for k, v in placed.items() if k[:3] == c and v == c)
    new = sum(1 for e in p['entries'] for q in e['paragraphs'] if 'new' in q)
    tot = sum(len(e['paragraphs']) for e in p['entries'])
    sf = sum(1 for e in p['entries'] for q in e['paragraphs'] if 'set_french' in q)
    kinds = collections.Counter((q.get('kind') or q.get('new', {}).get('kind')) for e in p['entries'] for q in e['paragraphs'])
    kinds.pop(None, None)
    oldent = len({x['file'] for x in ORIG[c].values()})
    out.append(f"| {c} | {old} | {carried} | {mi} | {mo} | {new} | {dropped} | {tot} | {oldent}→{len(p['entries'])} | {sf} | "
               + ', '.join(f'{k}×{v}' for k, v in sorted(kinds.items())) + ' |')
out += ['', '## Withdrawn cover pages', '',
        'Title pages are not included (KRR 2026-09-28: no cover pages until the manuscript is scanned). Their text as printed: '
        '«H[is] G[race] t[he] D[uke] o[f] H[amilton]» (dedication formula), «Livre N», «commencé le … terminé le …» / '
        '«depuis le … jusqu\'au …», the address/hotel lines and «Écrit sur papier à en-tête…». Old `_original` paragraphs '
        'holding title-page text are dropped with that reason. Marie\'s own note on the annotated front page of Livre 31 '
        '(«Journal commencé le 6 août 1872» and a list of 1872–1873 dates, docx ¶52–69) is NOT withdrawn: it goes in as a '
        '`margin` paragraph at 031/1875-04-03 (owner policy, 080 «Femme nue» pattern). No other title page of tome 5 carries '
        'a note by Marie.', '']
for c, src, t in WD:
    out.append(f"- {c}: {src}: «{t.replace(chr(10), ' / ')}»")
out += ['', '## Owner questions (conservative default applied)', '']
for c, t in Q:
    out.append(f'- {c}: {t}')
out += ['- 031: ¶70–74 (end of Friday 2 April) stand after the Livre 31 title page in the manuscript but are already in carnet 030 '
        '(030.0456–0458, rebuilt with tome 4). Default: left in 030.',
        '- 032/035/037: drawings reproduced in the printed edition (docx images) are added as drawings; no scan exists to cut them '
        'at better resolution.', '']
out += ['## Per-carnet review notes', '']
for c in CARNETS:
    f = W / f'notes_{c}.md'
    if f.exists():
        out += [f.read_text().rstrip(), '']
out += ['## Decision log (generated)', '']
by = collections.defaultdict(list)
for c, cat, t in LOG:
    by[c].append(f'- [{cat}] {t}')
for c in sorted(by):
    out += [f'### {c}', ''] + by[c] + ['']
(F / 'REVIEW.md').write_text('\n'.join(out) + '\n')
print('REVIEW.md', len(out), 'lines')

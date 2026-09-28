"""make_review.py OUT.md — decision log of the 015–030 rebuild, from final/log.json and final/withdrawn.json,
appended to the hand-written head (review_head.md)."""
import json, sys, collections
from pathlib import Path

W = Path('/home/coder/rebuild-state/plan-tome0304')
L = json.load(open(W / 'final/log.json'))
WD = json.load(open(W / 'final/withdrawn.json'))
head = (W / 'review_head.md').read_text()
out = [head.rstrip(), '']

out += ['## Withdrawn cover pages', '',
        'Owner decision (KRR, 2026-09-28): no cover or title-page entries until the manuscript is scanned; the printed edition alone cannot show which lines are Marie\'s. '
        'Nothing below is in `_original`. Lines that `_original` already had are dropped from it (their IDs are in the maps as `DROPPED`); the others were never added. '
        'Restore from here once the manuscript can be checked.', '']
by = collections.defaultdict(list)
for c, src, t in WD:
    by[c].append((src, t))
for c in sorted(by):
    out.append(f'### Livre {int(c)}')
    out.append('')
    for src, t in by[c]:
        out.append(f'- {src}:')
        out.append('')
        out.append('  ```')
        out += ['  ' + l for l in t.split('\n')]
        out.append('  ```')
    out.append('')

cats = [('restored', 'Entries kept as in `_original` (drafter misread a date line)'),
        ('entry', 'Entry decisions'),
        ('moved', 'Paragraphs moved by hand'),
        ('set_french', '`set_french` (completions, date lines, struck words)'),
        ('set_french-rejected', 'Drafter completions rejected (they duplicated a neighbouring paragraph)'),
        ('old-dropped', 'Old paragraphs dropped (invented date lines)'),
        ('new-added', 'New paragraphs added by hand'),
        ('new-edited', 'New paragraphs edited'),
        ('new-dropped', 'Drafter "new" text dropped (page numbers, OCR debris, page-break repeats, printed footnotes)'),
        ('kind', 'Kinds set'),
        ('kind-removed', 'Kind guesses removed'),
        ('kept', 'Empty clusters kept'),
        ('cover', 'Cover handling (per carnet)')]
out += ['## Decision log (per carnet)', '', 'Generated from the plan-review script (`fix.py`, kept next to the plans).', '']
for cat, title in cats:
    rows = [(c, t) for c, k, t in L if k == cat]
    if not rows:
        continue
    out.append(f'### {title} ({len(rows)})')
    out.append('')
    for c, t in rows:
        out.append(f'- **{c}** {t}')
    out.append('')
Path(sys.argv[1]).write_text('\n'.join(out) + '\n')
print('written', sys.argv[1])

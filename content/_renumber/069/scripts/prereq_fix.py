"""Prerequisite fixes for the tome-10 rebuild (069-074). Usage: prereq_fix.py <repo root>
1. _original/070/1877-04-03.md: legacy tome-10 separator lines `[//]: # ( 10.802 )`..`( 10.885 )`
   inside cluster 070.0001 become blank lines (paragraph breaks kept); the orphan `( 10.886 )`
   after the footnotes is deleted.
2. fr/073/1877-07-24.md: the cluster labelled `%% 10.0126 %%` is 073.0126 (visible French, no
   tag, no embedded copy) -> relabel, add the Rome tag, turn the visible line into the embedded
   copy like every other paragraph of this unedited fr file.
"""
import re, sys
from pathlib import Path
root = Path(sys.argv[1])
f = root / 'content/_original/070/1877-04-03.md'
lines = f.read_text().split('\n')
out = []
for i, l in enumerate(lines):
    m = re.fullmatch(r'\[//\]: # \( 10\.(\d+) \)', l.strip())
    if m:
        if m.group(1) == '886':
            continue
        out.append('')
        continue
    out.append(l)
# the orphan 886 was the last line after the footnotes; drop a trailing blank duplicate
text = '\n'.join(out)
f.write_text(text)
f = root / 'content/fr/073/1877-07-24.md'
s = f.read_text()
old = '%% 10.0126 %%\n###### Et si mon père voulait pourtant nous pourrions vivre à Rome !! Même à présent !!!!!!\n'
new = ('%% 073.0126 %%\n%% [#Rome](../../_original/_glossary/places/cities/ROME.md) %%\n'
       '%% ###### Et si mon père voulait pourtant nous pourrions vivre à Rome !! Même à présent !!!!!! %%\n')
assert s.count(old) == 1, 'fr 073 pattern not found'
f.write_text(s.replace(old, new))
print('ok')
# 3. fr: clusters whose embedded French is one multi-line %% block, where the plan has a
#    set_french (the rebuild refuses those): split the block into one `%% line %%` per line,
#    the shape renderSourceComment writes, so set_french can replace it.
import re as _re
ML = {'069': ['069.0437', '069.0455', '069.0459'], '070': ['070.0001']}
for c, ids in ML.items():
    for f in sorted((root / 'content/fr' / c).glob('*.md')):
        L = f.read_text().split('\n'); changed = False
        for i_ in ids:
            if f'%% {i_} %%' not in L: continue
            k = L.index(f'%% {i_} %%') + 1
            while k < len(L) and _re.fullmatch(r'%% .* %%', L[k]) and not L[k].startswith('%% [#'): k += 1
            assert L[k].startswith('%% ') and not L[k].rstrip().endswith('%%'), (i_, L[k][:60])
            j = k
            while not L[j].rstrip().endswith('%%'): j += 1
            body = [L[k][3:]] + L[k + 1:j] + [L[j].rstrip()[:-2]]
            L[k:j + 1] = [f'%% {b.strip()} %%' for b in body if b.strip()]
            changed = True; ids = [x for x in ids if x != i_]
        if changed: f.write_text('\n'.join(L))
    assert not ids or all(False for _ in ids), f'fr multi-line clusters not found: {ids}'
print('ok fr multi-line')

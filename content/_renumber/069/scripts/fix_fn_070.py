"""_original/070 3 April after the tome-10 rebuild: the split left the footnote definitions in
070.0001 while their markers now sit in the new split paragraphs; each definition moves to the
end of the first cluster that uses its marker (docs/REBUILD_CARNET.md: "move its definition by
hand"). python3 fix_fn_070.py <repo root>"""
import re, sys
from pathlib import Path
R = Path(sys.argv[1])
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
errs = []

def cluster(L, nid):
    i = L.index(f'%% {nid} %%'); j = i + 1
    while j < len(L) and not ID.match(L[j]): j += 1
    return i, j
f = R / 'content/_original/070/1877-04-03.md'
L = f.read_text().split('\n')
DEFL = re.compile(r'^\[\^([^\]]+)\]:')
i, j = cluster(L, '070.0001')
own = '\n'.join(l for l in L[i:j] if not DEFL.match(l))
moving = []
k = i
while k < j:
    m = DEFL.match(L[k])
    if m and f'[^{m.group(1)}]' not in own:
        moving.append((m.group(1), L[k])); del L[k]; j -= 1
        if k < j and L[k] == '' and (k == i + 1 or L[k - 1] == ''): del L[k]; j -= 1
        continue
    k += 1
for lab, line in moving:
    ids = [(n, m.group(1)) for n, l in enumerate(L) if (m := ID.match(l))]
    tgt = None
    for n, l in enumerate(L):
        if f'[^{lab}]' in l and not l.startswith(f'[^{lab}]:') and not l.startswith('%%'):
            tgt = [x for x in ids if x[0] < n][-1][1]; break
    if not tgt: errs.append(f'070 3 April: no marker for [^{lab}]'); continue
    a, b = cluster(L, tgt)
    while b > a and L[b - 1] == '': b -= 1
    L[b:b] = ['', line]
f.write_text('\n'.join(L))
print('070 3 April footnotes moved:', len(moving))
print('errors:', errs or 'none')

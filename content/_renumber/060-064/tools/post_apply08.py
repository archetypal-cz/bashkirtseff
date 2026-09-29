"""Post-apply fixes after the tome-8 rebuild --write. python3 post_apply08.py <repo root> <date>
1. `_rsr` notes on old paragraphs of the final plans -> `RSR:` comments in _original (set_french reasons: OCR/typo fixes,
   heading changes, splits, kind changes);
2. translated headings the plans changed in French (visible heading lines in cz/uk/en, and fr where it shows visible text):
   a. headings removed from a paragraph that moved into the previous day (062.0264/0286/0509/0553/0614/0636, 063.0049):
      the translated heading leaves the cluster and replaces the `# TODO` scaffold heading of its own day's entry;
   b. two-day headings split (064.0417 5/6 Aug, 064.0452 8/9 Aug, 064.0522 11/12 Aug): the translated heading keeps its first day; the second
      day goes to that day's entry `# TODO` when there is one;
   c. 064.0464 «[Mercredi, 9 août 1876 (28 juillet)]» loses its brackets; 060.0156 «## Dimanche 14 mai» becomes `#`;
   fr: visible heading lines of these clusters are set to _original's.
Idempotent enough to re-run (a heading already moved is not found again)."""
import json, re, sys
from datetime import datetime
from pathlib import Path
R = Path(sys.argv[1]); DATE = sys.argv[2]
B = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
CARNETS = ['060', '061', '062', '063', '064']
idmap = {}
for c in CARNETS:
    idmap.update(json.load(open(R / f'content/_renumber/{c}-{DATE}.json'))['id_map'])
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
errs = []; log = []
MONTHS = {m: i + 1 for i, m in enumerate('janvier février mars avril mai juin juillet août septembre octobre novembre décembre'.split())}

def cluster(L, nid):
    i = L.index(f'%% {nid} %%'); j = i + 1
    while j < len(L) and not ID.match(L[j]): j += 1
    return i, j

def find(tree, nid):
    for f in sorted((R / 'content' / tree / nid[:3]).glob('18*.md')):
        if f'%% {nid} %%\n' in f.read_text(): return f
    return None

def orig_heads(nid):
    f = find('_original', nid); L = f.read_text().split('\n'); i, j = cluster(L, nid)
    return [l for l in L[i:j] if l.startswith('#')]

# 1. RSR notes
n1 = 0
for c in CARNETS:
    plan = json.load(open(B / f'final/plan-{c}.json'))
    for e in plan['entries']:
        for x in e['paragraphs']:
            if 'old' in x and x.get('_rsr'):
                nid = idmap[x['old']]; f = find('_original', nid)
                if not f: errs.append(f'rsr: {nid} not found'); continue
                L = f.read_text().split('\n'); i, j = cluster(L, nid)
                note = f'%% {TS} RSR: {x["_rsr"].strip()} %%'
                if any(l.startswith('%%') and x['_rsr'].strip()[:60] in l for l in L[i:j]): continue
                k = i + 1
                while k < j and L[k].startswith('%%'): k += 1
                L.insert(k, note); f.write_text('\n'.join(L)); n1 += 1
log.append(f'RSR notes added: {n1}')

def first_cluster_todo(tree, carnet, fname):
    f = R / 'content' / tree / carnet / fname
    if not f.exists(): return None, None, None
    L = f.read_text().split('\n')
    k = next((x for x, l in enumerate(L) if ID.match(l)), None)
    if k is None: return None, None, None
    k2 = k + 1
    while k2 < len(L) and not ID.match(L[k2]): k2 += 1
    t = [x for x in range(k, k2) if L[x] == '# TODO']
    return f, L, (t[0] if len(t) == 1 else None)

def date_file(carnet, frhead):
    m = re.search(r'(\d+)(?:er)?\s+(' + '|'.join(MONTHS) + r')\s+(18\d\d)', frhead)
    if not m: return None
    d = f'{m.group(3)}-{MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}'
    fs = sorted((R / 'content/_original' / carnet).glob(d + '*.md'))
    return fs[0].name if fs else None

# 2a. removed headings -> own day's TODO
REMOVED = {'062.0264': 'Mercredi 7 juin 1876', '062.0286': 'Jeudi 8 juin 1876', '062.0509': 'Jeudi 22 juin 1876',
           '062.0553': 'Samedi 24 juin 1876', '062.0614': 'Mardi 27 juin 1876', '062.0636': 'Mercredi 28 juin 1876',
           '063.0049': 'Jeudi 6 juillet 1876'}
for old, frh in REMOVED.items():
    nid = idmap[old]; target = date_file(nid[:3], frh)
    for tree in ['cz', 'uk', 'en', 'fr']:
        f = find(tree, nid)
        if not f: continue
        L = f.read_text().split('\n'); i, j = cluster(L, nid)
        hs = [k for k in range(i, j) if L[k].startswith('# ')]
        if not hs: continue
        if len(hs) != 1: errs.append(f'{tree} {nid}: {len(hs)} visible headings'); continue
        moved = L[hs[0]]; del L[hs[0]]
        if hs[0] < len(L) and L[hs[0]] == '' and L[hs[0] - 1] == '': del L[hs[0]]
        f.write_text('\n'.join(L))
        g, M, t = first_cluster_todo(tree, nid[:3], target) if target else (None, None, None)
        if t is not None:
            M[t] = moved; g.write_text('\n'.join(M)); log.append(f'{tree} {nid}: heading «{moved}» -> {target}')
        else:
            log.append(f'{tree} {nid}: heading «{moved}» removed (no TODO heading in {target})')

# 2b. two-day headings split
SPLIT = {'064.0417': '1876-08-06', '064.0452': None, '064.0522': '1876-08-12'}
DASH = re.compile(r'\s+[-–—]\s+(?=\S)')
for old, second in SPLIT.items():
    nid = idmap[old]; oh = orig_heads(nid)
    for tree in ['cz', 'uk', 'en', 'fr']:
        f = find(tree, nid)
        if not f: continue
        L = f.read_text().split('\n'); i, j = cluster(L, nid)
        hs = [k for k in range(i, j) if L[k].startswith('# ')]
        if len(hs) != 1: errs.append(f'{tree} {nid}: {len(hs)} visible headings'); continue
        h = L[hs[0]]
        if tree == 'fr':
            L[hs[0]] = oh[0]; f.write_text('\n'.join(L)); continue
        parts = DASH.split(h, maxsplit=1)
        if len(parts) != 2: errs.append(f'{tree} {nid}: cannot split «{h}»'); continue
        L[hs[0]] = parts[0]; f.write_text('\n'.join(L)); log.append(f'{tree} {nid}: «{h}» -> «{parts[0]}»')
        if second:
            fs = sorted((R / 'content' / tree / nid[:3]).glob(second + '*.md'))
            if fs:
                g, M, t = first_cluster_todo(tree, nid[:3], fs[0].name)
                if t is not None:
                    M[t] = '# ' + parts[1]; g.write_text('\n'.join(M)); log.append(f'{tree}: «# {parts[1]}» -> {fs[0].name}')

# 2c. brackets / heading level
for old, fix in {'064.0464': lambda h: re.sub(r'^# \[(.*)\]\s*$', r'# \1', h), '060.0156': lambda h: re.sub(r'^## ', '# ', h)}.items():
    nid = idmap[old]; oh = orig_heads(nid)
    for tree in ['cz', 'uk', 'en', 'fr']:
        f = find(tree, nid)
        if not f: continue
        L = f.read_text().split('\n'); i, j = cluster(L, nid)
        for k in range(i, j):
            if L[k].startswith('#'):
                L[k] = oh[0] if tree == 'fr' and oh else fix(L[k])
        f.write_text('\n'.join(L))

print('\n'.join(log))
print('errors:', errs or 'none')
sys.exit(1 if errs else 0)

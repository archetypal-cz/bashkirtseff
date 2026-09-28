"""Post-apply fixes after the tome-10 rebuild --write. python3 post_apply.py <repo root> <date>
The plan's set_french now fixes the French headings itself (toolsmith d08a2fb03/cac96e6cd);
this script does what a plan cannot:
1. translated headings whose French label changed (visible heading lines in cz/uk/en);
2. «Samedi 11 août»: the translated heading moves from the last cluster of 10 Aug (old 073.0371)
   to the first of 11 Aug, replacing the scaffold `# TODO`;
3. 072.0094 + 0106 merged: 0106's translation carried into the merged paragraph (cz/uk/en);
4. RSR notes for old paragraphs whose French got a printed-typo correction;
5. drawings and facsimiles: images to src/frontend/public/images/marie/drawings/CCC/,
   `drawings:` in the _original entry frontmatter, localized captions in cz/uk/en;
6. carnet README «Paragraph range» lines (071–073 carried stale tome numbering);
7. fr/070 3 April split: _original's footnote markers the fr tree has no definitions for."""
import json, re, shutil, sys
from datetime import datetime
from pathlib import Path
R = Path(sys.argv[1]); DATE = sys.argv[2]
B = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
CARNETS = ['069', '070', '071', '072', '073', '074']
idmap = {}
for c in CARNETS:
    idmap.update(json.load(open(R / f'content/_renumber/{c}-{DATE}.json'))['id_map'])
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
errs = []

def cluster(L, nid):
    i = L.index(f'%% {nid} %%'); j = i + 1
    while j < len(L) and not ID.match(L[j]): j += 1
    return i, j

def find(tree, nid):
    for f in sorted((R / 'content' / tree / nid[:3]).glob('*.md')):
        if f'%% {nid} %%\n' in f.read_text(): return f
    return None

def replace_line(tree, nid, old, new):
    f = find(tree, nid)
    if not f: return
    L = f.read_text().split('\n'); i, j = cluster(L, nid)
    hits = [k for k in range(i, j) if L[k] == old]
    if len(hits) != 1: errs.append(f'{tree} {nid}: {len(hits)} hits for {old!r}'); return
    L[hits[0]] = new; f.write_text('\n'.join(L))

# 1. translated headings
TH = {
 '069.0604': {'cz': ('# Neděle 1. dubna 1877', '# Neděle 1. dubna 1877 – Velikonoce'), 'uk': ('# Неділя, 1 квітня 1877', '# Неділя, 1 квітня 1877 — Великдень'), 'en': ('# Sunday, 1 April 1877', '# Sunday, 1 April 1877 – Easter')},
 '070.0037': {'cz': ('# Neděle 8. dubna 1877', '# Neděle 8. dubna 1877 – Velikonoce'), 'uk': ('# Неділя, 8 квітня 1877', '# Неділя, 8 квітня 1877 — Великдень'), 'en': ('# Sunday, 8 April 1877', '# Sunday, 8 April 1877 – Easter')},
 '073.0285': {'cz': ('# Pondělí 6. srpna 1877', '# Neděle 6. srpna 1877'), 'uk': ('# Понеділок 6 серпня 1877', '# Неділя 6 серпня 1877'), 'en': ('# Monday, 6 August 1877', '# Sunday, 6 August 1877')},
 '073.0287': {'cz': ('# Úterý 7. srpna 1877', '# Pondělí 7. srpna 1877'), 'uk': ('# Вівторок 7 серпня 1877', '# Понеділок 7 серпня 1877'), 'en': ('# Tuesday, 7 August 1877', '# Monday, 7 August 1877')},
}
for old, per in TH.items():
    for tree, (a, b) in per.items(): replace_line(tree, idmap[old], a, b)

# 2. «Samedi 11 août» heading move in translations
src = idmap['073.0371']; dst = f'073.{int(src[4:]) + 1:04d}'
for tree in ['cz', 'uk', 'en']:
    f = find(tree, src); L = f.read_text().split('\n'); i, j = cluster(L, src)
    heads = [k for k in range(i, j) if L[k].startswith('# ')]
    if len(heads) != 1: errs.append(f'{tree} {src}: {len(heads)} headings'); continue
    moved = L[heads[0]]; del L[heads[0]]; f.write_text('\n'.join(L))
    g = find(tree, dst); M = g.read_text().split('\n'); a, b = cluster(M, dst)
    t = [k for k in range(a, b) if M[k] == '# TODO']
    if len(t) != 1: errs.append(f'{tree} {dst}: {len(t)} TODO headings'); continue
    M[t[0]] = moved; g.write_text('\n'.join(M))

# 3. merged 072.0094 + 0106: translations by hand (0106's text carried over)
MERGE = {
 'cz': ('Bože můj, nikdy ani v Nice, ani v Římě nikdo neřekl jediné slovo, jež by mohlo zranit stydlivost dítěte. Je pravda, že v Neapoli on',
        'Bože můj, nikdy ani v Nice, ani v Římě nikdo neřekl jediné slovo, jež by mohlo zranit stydlivost dítěte. Je pravda, že v Neapoli to byli jen Larderei a Melissano. Melissano proto, že je cynik, neutrální zvíře, šašek. A Alexandre — jednou jedinkrát — protože byl opilý.'),
 'uk': ('Боже мій, ніколи — ні в Ніцці, ні в Римі — ніхто не вимовив слова, яке могло б вразити цнотливість дитини. Правда, в Неаполі він',
        'Боже мій, ніколи — ні в Ніцці, ні в Римі — ніхто не вимовив слова, яке могло б вразити цнотливість дитини. Правда, в Неаполі були лише Лардереї і Меліссано. Меліссано — бо він цинік, тварюка нейтральна, блазень. І Алессандро — один раз і тому що був п\'яний.'),
 'en': ('My God, never either at Nice or in Rome did anyone say a word that could wound the modesty of a child. It is true that at Naples he —',
        'My God, never either at Nice or in Rome did anyone say a word that could wound the modesty of a child. It is true that at Naples there had been only Larderei and Melissano. Melissano because he is a cynic, a neuter animal, a buffoon. And Alexandre — once, and because he was drunk.'),
}
nid = idmap['072.0094']
for tree, (a, b) in MERGE.items():
    replace_line(tree, nid, a, b)
    f = find(tree, nid)
    if f:
        L = f.read_text().split('\n'); i, j = cluster(L, nid)
        L.insert(j - 1 if L[j - 1] == '' else j, f'%% {TS} ED: rebuild-carnet tome 10: 072.0106 merged into this paragraph (one sentence split by the page swap of printed pp.218–219, owner decision 2026-09-28); its translation carried over by hand. %%')
        f.write_text('\n'.join(L))

# 4. RSR notes for printed-typo corrections in old paragraphs
for old, note in json.load(open(B / 'final2/rsr_add.json')):
    nid = idmap[old]; f = find('_original', nid); L = f.read_text().split('\n'); i, j = cluster(L, nid)
    k = i + 1
    while k < j and L[k].startswith('%%'): k += 1
    L.insert(k, f'%% {TS} RSR: {note} %%'); f.write_text('\n'.join(L))

# 5. drawings and facsimiles
CAP = json.load(open(B / 'tools/drawing_captions.json'))
FAX = json.load(open(B / 'tools/facsimiles.json'))
q = lambda v: '"' + v.replace('"', '\\"') + '"'
def add_item(c, file, name, pid, caps):
    dest = R / 'src/frontend/public/images/marie/drawings' / c / name
    dest.parent.mkdir(parents=True, exist_ok=True); shutil.copy(B / 'final/images' / name, dest)
    for tree, cap in caps.items():
        f = R / 'content' / tree / c / file
        if not f.exists(): continue
        s = f.read_text(); parts = s.split('---\n', 2)
        item = f'  - src: /images/marie/drawings/{c}/{name}\n    caption: {q(cap["caption"])}\n'
        if cap.get('alt'): item += f'    alt: {q(cap["alt"])}\n'
        item += f'    source: {q(cap["source"])}\n    paragraph: "{pid}"\n'
        fm = parts[1]
        fm = fm + 'drawings:\n' + item if 'drawings:' not in fm else fm.rstrip('\n') + '\n' + item
        f.write_text(parts[0] + '---\n' + fm + '---\n' + parts[2])
def para_after_docx(c, file, n):
    pid = None; cur = None
    for l in (R / 'content/_original' / c / file).read_text().split('\n'):
        m = ID.match(l)
        if m: cur = m.group(1)
        if re.search(rf'¶{n}(?!\d)', l): pid = cur
    return pid
for c in ['070', '072']:
    for d in json.load(open(B / f'final/post-{c}.json')).get('drawings', []):
        name = Path(d['src']).name
        pid = idmap[d['after_old']] if d.get('after_old') else para_after_docx(c, d['file'], d['after_docx'])
        if not pid: errs.append(f'no anchor for {name}'); continue
        caps = {'_original': {'caption': d['caption'], 'alt': d['alt'], 'source': d['source']}}
        caps.update(CAP[name])
        add_item(c, d['file'], name, pid, caps)
for name, (c, file, fr, cz, uk, en, page) in FAX.items():
    last = None; cur = None; kind = None
    for l in (R / 'content/_original' / c / file).read_text().split('\n'):
        m = ID.match(l)
        if m: cur = m.group(1); continue
        if l.startswith('%% kind: clipping'): last = cur
    if not last: errs.append(f'no clipping in {c}/{file} for {name}'); continue
    add_item(c, file, name, last, {
        '_original': {'caption': fr, 'source': f'Mon Journal, t. 10, p. {page} (fac-similé)'},
        'cz': {'caption': cz, 'source': f'Mon Journal, sv. 10, s. {page} (faksimile)'},
        'uk': {'caption': uk, 'source': f'Mon Journal, т. 10, с. {page} (факсиміле)'},
        'en': {'caption': en, 'source': f'Mon Journal, vol. 10, p. {page} (facsimile)'}})

# 6. README ranges
for c in ['071', '072', '073']:
    f = R / 'content/_original' / c / 'README.md'
    last = json.load(open(R / f'content/_renumber/{c}-{DATE}.json')).get('last_id')
    f.write_text(re.sub(r'\*\*Paragraph range\*\*: .*', f'**Paragraph range**: {c}.0001-{last} (renumbered by the 2026-09-27 tome-10 rebuild)', f.read_text()))

# 7. fr/070: markers without definitions in the fr tree
DEF = re.compile(r'^\[\^([^\]]+)\]:')
f = R / 'content/fr/070/1877-04-03.md'
L = f.read_text().split('\n'); defs = {m.group(1) for l in L if (m := DEF.match(l))}
L = [l if l.startswith('%%') else re.sub(r'\[\^([^\]]+)\](?!:)', lambda m: m.group(0) if m.group(1) in defs else '', l) for l in L]
f.write_text('\n'.join(L))
print('errors:', errs or 'none')

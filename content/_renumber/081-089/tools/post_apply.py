"""Post-apply for the tome 12/13 rebuild (run in the repo root that got --write):
  python3 post_apply.py REPO CCC [CCC…]
1. _original: an RSR note on every old cluster whose French the plan changed with provenance
   (`_rsr`, `_tiler_para`, `_restored`), placed after the ID / kind / tag lines, before the text.
2. clipping clusters (kind: clipping) without the [#Press_clipping] tag get it (and the newspaper's
   tag when the source names one), in _original and every tree.
3. drawings: WebP copied to src/frontend/public/images/marie/drawings/CCC/, `drawings:` added to the
   _original entry frontmatter (French) and to cz/uk/en (localised captions from drawing_i18n.json).
Idempotent: a note / tag / drawing already present is not added twice.
"""
import sys, os, re, json, glob, shutil, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
R = sys.argv[1]
CARNETS = sys.argv[2:]
NOW = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from scanlib import printed_pages  # noqa
import tk

PAPERS = {'figaro': ('Le_Figaro', 'LE_FIGARO'), 'gaulois': ('Le_Gaulois', 'LE_GAULOIS'), 'sport': ('Le_Sport', 'LE_SPORT')}
I18N = json.load(open(f'{W}/final/drawing_i18n.json')) if os.path.exists(f'{W}/final/drawing_i18n.json') else {}

def idmap(c):
    f = sorted(glob.glob(f'{R}/content/_renumber/{c}-*.json'))[-1]
    return json.load(open(f))['id_map']

def insert_after_header(lines, i, newline):
    """i = index of the ID line; insert after the kind/tag/comment lines that follow it"""
    j = i + 1
    while j < len(lines) and re.match(r'^%% (kind:|\[#)', lines[j]):
        j += 1
    lines.insert(j, newline)

def files_of(tree, c):
    return sorted(glob.glob(f'{R}/content/{tree}/{c}/*.md'))

stats = {}
for c in CARNETS:
    tome = '12' if c < '085' else '13'
    pm = tk.pagemap(tome)
    plan = json.load(open(f'{W}/final/plan-{c}.json'))
    m = idmap(c)
    notes = {}
    for e in plan['entries']:
        for q in e['paragraphs']:
            if 'old' not in q or 'set_french' not in q: continue
            nid = m[q['old']]
            if q.get('_tiler_para') is not None and not (q.get('_rsr') or '').startswith('French completed'):
                # provenance of the completion first, then any _rsr sentences (typos, labels, joins)
                pp = q['_tiler_para']
                pg = printed_pages(pm, pp, pp)
                notes[nid] = (f"French completed from tome{tome}.docx ¶{pp}" + (f", Mon Journal t.{tome} {pg}" if pg else '')
                              + " (text cut short in the original extraction, 2026-09-28 rebuild).")
                if q.get('_restored'):
                    notes[nid] = notes[nid][:-1] + '; restored ' + ', '.join('«' + x + '»' for x in q['_restored']) + '.'
                if q.get('_rsr'): notes[nid] += ' ' + q['_rsr']
            elif q.get('_rsr'):
                notes[nid] = q['_rsr']
            elif q.get('_tiler_para') is not None:
                pp = q['_tiler_para']
                pg = printed_pages(pm, pp, pp)
                notes[nid] = f"French completed from tome{tome}.docx ¶{pp}" + (f", Mon Journal t.{tome} {pg}" if pg else '') + " (text cut short in the original extraction, 2026-09-28 rebuild)."
                if q.get('_restored'):
                    notes[nid] = notes[nid][:-1] + '; restored ' + ', '.join('«' + x + '»' for x in q['_restored']) + '.'
            elif q.get('_restored'):
                notes[nid] = f"Restored from tome{tome}.docx: " + ', '.join('«' + x + '»' for x in q['_restored']) + " (dropped in the original extraction, 2026-09-28 rebuild)."
    # footnote refs inside set_french keep the old label while the tool renumbered the definitions
    n_fn = 0
    for f in files_of('_original', c):
        t = open(f, encoding='utf-8').read()
        defs = set(re.findall(r'^\[\^([^\]]+)\]:', t, re.M))
        refs = set(re.findall(r'\[\^([^\]]+)\](?!:)', t))
        t2 = t
        for r in refs - defs:
            mm = re.fullmatch(r'(\d{2,3})\.(\d+)\.(\d+)', r)
            if not mm: continue
            old = f'{c}.{int(mm.group(2)):04d}'
            if old not in m: continue
            cand = f'{mm.group(1)}.{int(m[old][4:])}.{mm.group(3)}'
            if cand in defs and cand not in refs:
                t2 = re.sub(r'\[\^' + re.escape(r) + r'\](?!:)', f'[^{cand}]', t2); n_fn += 1
        if t2 != t: open(f, 'w', encoding='utf-8').write(t2)
    print(c, 'footnote refs repaired', n_fn)
    newids = [x['id'] for x in json.load(open(sorted(glob.glob(f'{R}/content/_renumber/{c}-*.json'))[-1]))['new_paragraphs']]
    newplan = [q['new'] for e in plan['entries'] for q in e['paragraphs'] if 'new' in q]
    bydocx = {}
    if len(newids) == len(newplan):
        for nid, q in zip(newids, newplan):
            for mm in re.finditer(r'¶(\d+)(?:[–-](\d+))?', q.get('rsr', '')):
                for k in range(int(mm.group(1)), int(mm.group(2) or mm.group(1)) + 1): bydocx.setdefault(k, nid)
    n_notes = n_tags = 0
    for f in files_of('_original', c):
        L = open(f, encoding='utf-8').read().split('\n'); ch = False
        for i in range(len(L) - 1, -1, -1):
            mm = re.match(r'^%% (\d{3}\.\d{4}) %%$', L[i])
            if mm and mm.group(1) in notes:
                note = notes[mm.group(1)]
                blk = '\n'.join(L[i:i + 12])
                if note.replace('%', '') in blk: continue
                insert_after_header(L, i, f'%% {NOW} RSR: {note} %%'); n_notes += 1; ch = True
        if ch: open(f, 'w', encoding='utf-8').write('\n'.join(L))
    # clipping tags, all trees
    for tree in ['_original', 'cz', 'uk', 'en', 'fr', 'es']:
        pre = '../_glossary' if tree == '_original' else '../../_original/_glossary'
        for f in files_of(tree, c):
            L = open(f, encoding='utf-8').read().split('\n'); ch = False
            for i in range(len(L) - 2, -1, -1):
                if not re.match(r'^%% \d{3}\.\d{4} %%$', L[i]): continue
                km = re.match(r'^%% kind: clipping(?: source="([^"]*)")? %%$', L[i + 1])
                if not km: continue
                j = i + 2; tags = []
                while j < len(L) and L[j].startswith('%% [#'): tags.append(L[j]); j += 1
                add = []
                if not any('#Press_clipping' in t for t in tags):
                    add.append(f'%% [#Press_clipping]({pre}/culture/newspapers/PRESS_CLIPPING.md) %%')
                src = (km.group(1) or '').lower()
                for k, (tag, fn) in PAPERS.items():
                    if k in src and not any(f'#{tag}]' in t for t in tags):
                        add.append(f'%% [#{tag}]({pre}/culture/newspapers/{fn}.md) %%')
                for a in reversed(add): L.insert(i + 2, a)
                if add: ch = True; n_tags += len(add)
            if ch: open(f, 'w', encoding='utf-8').write('\n'.join(L))
    # drawings
    n_dr = 0
    dfile = f'{W}/final/drawings-{c}.json'
    for d in (json.load(open(dfile)) if os.path.exists(dfile) else []):
        src = f'{W}/{d["file"]}'; name = os.path.basename(d['file'])
        dst = f'{R}/src/frontend/public/images/marie/drawings/{c}/{name}'
        os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(src, dst)
        para = m[d['anchor_old']] if d.get('anchor_old') else bydocx.get(d.get('anchor_docx'))
        if not para: print('drawing anchor unresolved', c, d); continue
        for tree in ['_original', 'cz', 'uk', 'en']:
            f = f'{R}/content/{tree}/{c}/{d["entry"]}'
            if not os.path.exists(f): continue
            if tree == '_original':
                cap, alt = d['caption'], d['alt']; source = d['source']
            else:
                t = I18N.get(name, {}).get(tree)
                if not t: continue
                cap, alt, source = t['caption'], t['alt'], t['source']
            s = open(f, encoding='utf-8').read()
            if f'/drawings/{c}/{name}' in s: continue
            fm_end = s.index('\n---\n', 4)
            block = (f'  - src: /images/marie/drawings/{c}/{name}\n    caption: "{cap}"\n    alt: "{alt}"\n'
                     f'    source: "{source}"\n    paragraph: "{para}"\n')
            head = s[:fm_end + 1]
            if '\ndrawings:\n' in head:
                s = s[:fm_end + 1] + block + s[fm_end + 1:]
            else:
                s = s[:fm_end + 1] + 'drawings:\n' + block + s[fm_end + 1:]
            open(f, 'w', encoding='utf-8').write(s); n_dr += 1
    stats[c] = (n_notes, n_tags, n_dr)
print('post_apply notes/tags/drawings:', stats)

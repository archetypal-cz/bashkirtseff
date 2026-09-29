"""(Since d08a2fb03 _original headings are handled by set_french; this script only fixes the translation trees.)
After `just rebuild-carnets plan-101…106 --write` (tome 16): repair the translated day headings
that the rebuild could not move by itself (headmoves.json, written by build16.py).

- promote: an old paragraph that was only a plain date line («Jeudi 1 7 avril 1 884») is now the
  French «# Jeudi 17 avril 1884» heading of its entry: the translated date line gets «# », and the
  ED «SOURCE CHANGED» note goes when only the formatting changed.
- trails: a date line stripped from the end of a paragraph (the next day's heading glued to it):
  the translated line leaves the paragraph and becomes the heading of that day's entry when the
  entry shows «# TODO», otherwise it is dropped (the entry already has its heading).
- inner: a date line in the middle of a paragraph that now opens with it: the translated date line
  moves to the top as «# …»; a short translated line before it (now its own new paragraph) goes.
- headmoves: «# heading» lines stripped from paragraphs whose day moved (as in tome 11).

Usage: python3 postfix16.py <repo root>
"""
import glob, json, os, re, sys

root = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
H = json.load(open(os.path.join(here, 'headmoves.json')))
CARNETS = ['101', '102', '103', '104', '105', '106']
IDMAP = {}
for c in CARNETS:
    m = json.load(open(max(glob.glob(f'{root}/content/_renumber/{c}-2026-09-2*.json'))))
    IDMAP.update(m['id_map'])
IDL = re.compile(r'^%% \d{3}\.\d{4} %%$')
report = []


def vis(l):
    return l.strip() and not l.startswith('%%') and not l.startswith('[^') and not l.startswith('[//]')


def vlines(L, i, j):
    """indexes of reader-visible lines in L[i+1:j] (multi-line comment blocks skipped)"""
    out, inb = [], False
    for k in range(i + 1, j):
        s = L[k].strip()
        if inb:
            if s.endswith('%%'):
                inb = False
            continue
        if s.startswith('%%'):
            if not (len(s) >= 4 and s.endswith('%%')):
                inb = True
            continue
        if vis(L[k]):
            out.append(k)
    return out


def cluster(L, nid):
    i = L.index(f'%% {nid} %%')
    j = i + 1
    while j < len(L) and not IDL.match(L[j]) and L[j] != '---':
        j += 1
    return i, j


def is_date(s, date):
    """a translated date line for YYYY-MM-DD: short, has the day number and the year"""
    y, m, d = date.split('-')
    s = s.strip().lstrip('#').strip()
    return len(s) < 70 and y in s and re.search(rf'(?<!\d){int(d)}(?!\d)', s.replace(y, '')) is not None


def drop_ed(L, i, j):
    return {k for k in range(i + 1, j) if 'SOURCE CHANGED' in L[k] and ' ED: rebuild-carnet 101+' in L[k]}


def target_todo(files, date, heading):
    tg = [f for f in files if os.path.basename(f) == date + '.md']
    if len(tg) != 1:
        return f'target {date}.md not found ({len(tg)})'
    T = files[tg[0]]
    ids = [k for k, l in enumerate(T) if IDL.match(l)]
    f0, f1 = ids[0], (ids[1] if len(ids) > 1 else len(T))
    todo = [k for k in range(f0, f1) if T[k].strip() == '# TODO']
    if todo:
        T[todo[0]] = heading
        return f'«{heading}» → {os.path.basename(tg[0])} (replaces # TODO)'
    return f'{os.path.basename(tg[0])} already has a heading — «{heading}» dropped'


for lang in ('cz', 'uk', 'en', 'fr'):
    files = {f: open(f).read().split('\n') for c in CARNETS for f in glob.glob(f'{root}/content/{lang}/{c}/*.md')}

    def find(nid):
        hits = [f for f, L in files.items() if f'%% {nid} %%' in L]
        return hits[0] if len(hits) == 1 else None

    # ---- promote
    for p in H['promote']:
        nid = IDMAP[p['old']]
        src = find(nid)
        if not src:
            continue
        L = files[src]
        i, j = cluster(L, nid)
        vl = vlines(L, i, j)
        if not vl:
            report.append(f'{lang} {p["old"]}→{nid}: no visible text')
            continue
        k = vl[0]
        if not L[k].startswith('#'):
            L[k] = '# ' + L[k].strip()
        dels = drop_ed(L, i, j) if p['same'] else set()
        files[src] = [l for n, l in enumerate(L) if n not in dels]
        report.append(f'{lang} {p["old"]}→{nid}: «{L[k]}» promoted' + (' (ED note dropped)' if dels else ''))
    # ---- inner
    for p in H['inner']:
        nid = IDMAP[p['old']]
        src = find(nid)
        if not src:
            continue
        L = files[src]
        i, j = cluster(L, nid)
        vl = vlines(L, i, j)
        dl = [k for k in vl if is_date(L[k], p['date'])]
        if not dl:
            report.append(f'{lang} {p["old"]}→{nid}: translated date line for {p["date"]} not found — left')
            continue
        k = dl[0]
        head = '# ' + L[k].strip().lstrip('#').strip()
        before = [b for b in vl if b < k]
        dels = {k} | {b for b in before if len(L[b].strip()) <= 14}
        rest = [n for n in range(i + 1, j) if n not in dels]
        first = next((n for n in rest if n in set(vl) - dels), None)
        L2 = [l for n, l in enumerate(L) if n not in dels]
        pos = first - sum(1 for d in dels if d < first) if first is not None else i + 1
        L2.insert(pos, head)
        files[src] = L2
        report.append(f'{lang} {p["old"]}→{nid}: «{head}» moved to the top; dropped {[L[b] for b in dels if b != k]}')
    # ---- trails
    for p in H['trails']:
        nid = IDMAP[p['old']]
        src = find(nid)
        if not src:
            continue
        L = files[src]
        i, j = cluster(L, nid)
        vl = vlines(L, i, j)
        dl = [k for k in vl if is_date(L[k], p['date'])]
        # the paragraph's own heading (first line) is never the trailing one
        if dl and dl[0] == vl[0] and len(dl) == 1 and len(vl) > 1 and L[vl[0]].startswith('#') and p['old'] not in ('104.0018',):
            dl = []
        if not dl:
            report.append(f'{lang} {p["old"]}→{nid}: no translated «{p["line"]}» in the paragraph — nothing to move')
            continue
        k = dl[-1] if p['old'] != '104.0018' else dl[0]
        heading = '# ' + L[k].strip().lstrip('#').strip()
        dels = {k} | (drop_ed(L, i, j) if p.get('same') else set())
        files[src] = [l for n, l in enumerate(L) if n not in dels]
        report.append(f'{lang} {p["old"]}→{nid}: ' + target_todo(files, p['date'], heading))
    # ---- headmoves (tome 11 logic)
    for m in H['headmoves']:
        nid = IDMAP[m['old']]
        src = find(nid)
        if not src:
            continue
        L = files[src]
        i, j = cluster(L, nid)
        h = m['heading']
        dels = {k for k in range(i + 1, j) if L[k].strip() in (f'%% # {h} %%', f'%% {h} %%')}
        vl = vlines(L, i, j)
        th = None
        if vl and m['heading_date'] and len(vl) > 1:
            s = L[vl[0]].strip()
            if s.startswith('#') or is_date(s, m['heading_date']):
                th = vl[0]
        if th is None:
            report.append(f'{lang} {m["old"]}→{nid}: no translated heading found — left')
            files[src] = [l for n, l in enumerate(L) if n not in dels]
            continue
        heading = '# ' + L[th].strip().lstrip('#').strip()
        if m.get('first'):
            L[th] = '# TODO'      # the paragraph opens its entry: the day's own heading is still to be translated
        else:
            dels.add(th)
        if m.get('heading_only'):
            dels |= drop_ed(L, i, j)
        files[src] = [l for n, l in enumerate(L) if n not in dels]
        report.append(f'{lang} {m["old"]}→{nid}: ' + target_todo(files, m['heading_date'], heading))
    # footnote definitions the rebuild copied along with a moved cluster (102 → 103): drop the ones
    # without a reference in their file, and exact duplicates
    for f, L in files.items():
        body = '\n'.join(l for l in L if not re.match(r'^\[\^[^\]]+\]:', l))
        seen, dels = set(), set()
        for k, l in enumerate(L):
            m = re.match(r'^\[\^([^\]]+)\]:', l)
            if not m:
                continue
            lab = m.group(1)
            if f'[^{lab}]' not in body or l in seen:
                dels.add(k)
                if k + 1 < len(L) and not L[k + 1].strip() and k > 0 and not L[k - 1].strip():
                    dels.add(k + 1)
                report.append(f'{lang} {os.path.basename(f)}: footnote definition [^{lab}] removed ({"duplicate" if l in seen else "no reference in this file"})')
            seen.add(l)
        if dels:
            files[f] = [l for k, l in enumerate(L) if k not in dels]
    for f, L in files.items():
        new = '\n'.join(L)
        if new != open(f).read():
            open(f, 'w').write(new)
print('\n'.join(report))

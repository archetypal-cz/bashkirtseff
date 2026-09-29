"""After `just rebuild-carnets plan-075…080 --write` (tome 11): move each translated day heading
that the rebuild left inside a paragraph whose French lost its heading (plan set_french) to the
entry of that day, replacing the scaffold heading there («# TODO»). Headings of days that do not
exist in the manuscript (078 «Dimanche 24 février 1878») are deleted. «###### » lines of former
level-6 pseudo-headings become plain lines (or «# » for the 23 Dec 1877 date).
Also drops the stale embedded heading comment, and the ED «SOURCE CHANGED» note of paragraphs
whose only source change was losing the heading.

Usage: python3 postfix_headings_t11.py <repo root>   (reads headmoves.json next to this script)
"""
import glob, json, os, re, sys

root = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
_HM = json.load(open(os.path.join(here, 'headmoves.json')))
MOVES = [] if '--only-promote' in sys.argv else _HM['headmoves']  # --only-promote: re-run only the last pass (testing)
HEADFIX = [] if '--only-promote' in sys.argv else _HM['headfix']
CARNETS = ['075', '076', '077', '078', '079', '080']
IDMAP = {}
for c in CARNETS:
    m = json.load(open(max(glob.glob(f'{root}/content/_renumber/{c}-2026-09-2*.json'))))
    IDMAP.update(m['id_map'])
ORIG = {}
for c in CARNETS:
    for f in glob.glob(f'{root}/content/_original/{c}/*.md'):
        for l in open(f):
            mm = re.match(r'^%% (\d{3}\.\d{4}) %%$', l.strip())
            if mm:
                ORIG[mm.group(1)] = (c, os.path.basename(f))
IDL = re.compile(r'^%% \d{3}\.\d{4} %%$')
report = []


def cluster(L, nid):
    i = L.index(f'%% {nid} %%')
    j = i + 1
    while j < len(L) and not IDL.match(L[j]) and L[j] != '---':
        j += 1
    return i, j


def vis(l):
    return l.strip() and not l.startswith('%%') and not l.startswith('[^') and not l.startswith('[//]')


# ---- headfix, part 1: _original heading lines (rebuild-carnet keeps an old paragraph's «#» lines; see build11.py),
# and the embedded French copy of those lines in the translations. Runs before the translated-heading moves.
import datetime
TS = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
HMOLD = {m['old'] for m in MOVES}
for p in (HEADFIX if '--legacy-headfix' in sys.argv else []):  # rebuild-carnet ≥ d08a2fb03 edits _original headings itself
    nid = IDMAP[p['old']]
    for lang in ('_original', 'cz', 'uk', 'en', 'fr'):
        fs = [f for c in CARNETS for f in glob.glob(f'{root}/content/{lang}/{c}/*.md') if f'%% {nid} %%' in open(f).read().split('\n')]
        if len(fs) != 1:
            report.append(f'{lang} {p["old"]}→{nid}: cluster not found ({len(fs)})')
            continue
        L = open(fs[0]).read().split('\n')
        i, j = cluster(L, nid)
        if lang == '_original':
            hk = [k for k in range(i + 1, j) if L[k].strip() == p['from']]
            if len(hk) != 1:
                report.append(f'_original {p["old"]}→{nid}: «{p["from"]}» found {len(hk)}×')
                continue
            if p['to']:
                L[hk[0]] = p['to']
            else:
                del L[hk[0]]
            report.append(f'_original {p["old"]}→{nid}: «{p["from"]}» → «{p["to"]}»')
        else:
            ek = [k for k in range(i + 1, j) if L[k].strip() == f'%% {p["from"]} %%']
            if p['from'].startswith('###### '):
                for k in ek:
                    L[k] = f'%% {p["to"]} %%'
                report.append(f'{lang} {p["old"]}→{nid}: embedded «{p["from"]}» → «{p["to"]}» ({len(ek)})')
            elif p['to'] and p['old'] not in HMOLD:
                for k in ek:
                    L[k] = f'%% {p["to"]} %%'
                L.insert(i + 1, f'%% {TS} ED: rebuild-carnet 075+076+077+078+079+080 (tome11.docx): SOURCE HEADING CHANGED — the French heading now reads «{p["to"].lstrip("#").strip()}» (was «{p["from"].lstrip("#").strip()}»); adjust the translated heading. %%')
                report.append(f'{lang} {p["old"]}→{nid}: heading-change note added')
            else:
                continue
        open(fs[0], 'w').write('\n'.join(L))


for lang in ('cz', 'uk', 'en', 'fr'):
    files = {f: open(f).read().split('\n') for c in CARNETS for f in glob.glob(f'{root}/content/{lang}/{c}/*.md')}

    def find(nid):
        hits = [f for f, L in files.items() if f'%% {nid} %%' in L]
        return hits[0] if len(hits) == 1 else None

    for m in MOVES:
        nid = IDMAP[m['old']]
        src = find(nid)
        if not src:
            report.append(f'{lang} {m["old"]}→{nid}: not in this tree')
            continue
        L = files[src]
        i, j = cluster(L, nid)
        h = m['heading']
        dels = set()
        # stale embedded heading comment
        for k in range(i + 1, j):
            s = L[k].strip()
            if s in (f'%% # {h} %%', f'%% {h} %%', f'%% ###### {h} %%'):
                dels.add(k)
        vlines = [k for k in range(i + 1, j) if vis(L[k])]
        if m['heading_date'] is None:
            # former «###### text» pseudo-heading: keep the text, drop the hashes
            for k in vlines:
                if L[k].startswith('###### '):
                    L[k] = L[k][7:]
            report.append(f'{lang} {m["old"]}→{nid}: «###### » stripped')
            files[src] = [l for k, l in enumerate(L) if k not in dels]
            continue
        # the translated heading: first visible line, a markdown heading or a short date line
        year = m['heading_date'][:4]
        th = None
        if vlines:
            k = vlines[0]
            s = L[k].strip()
            if (s.startswith('#') or (len(s) < 70 and year in s)) and len(vlines) > 1:
                th = k
        inline = None
        if th is None and vlines:
            k = vlines[0]
            q = '> ' if L[k].startswith('> ') else ''
            mm = re.match(r'^(\S[^.!?]{3,45}?\b' + year + r'(?: р\.)?)[.,]?\s+(\S.*)$', L[k][len(q):])
            if mm and re.search(r'\d', mm.group(1).replace(year, '')):
                inline = (k, mm.group(1), q + mm.group(2))
        if th is None and inline:
            k, pre, rest = inline
            L[k] = rest
            L.insert(k, '# ' + pre.strip())
            j += 1
            dels = {d + 1 if d >= k else d for d in dels}
            th = k
            report.append(f'{lang} {m["old"]}→{nid}: inline heading «{pre}» split off the text')
        if th is None:
            report.append(f'{lang} {m["old"]}→{nid}: no translated heading found in {os.path.basename(src)} — left as is')
            files[src] = [l for k, l in enumerate(L) if k not in dels]
            continue
        heading = '# ' + L[th].strip().lstrip('#').strip()
        dels.add(th)
        # the ED note, when losing the heading was the only change of the French
        for k in range(i + 1, j):
            if 'SOURCE CHANGED' in L[k] and ' ED: rebuild-carnet 075+076' in L[k] and m.get('heading_only'):
                dels.add(k)
        files[src] = [l for k, l in enumerate(L) if k not in dels]
        if m['heading_date'] == '1878-02-24':
            report.append(f'{lang} {m["old"]}→{nid}: «{heading}» deleted (no such day in the manuscript)')
            continue
        # target: the entry file of that day, in any of the carnets; its first cluster
        tgts = [f for f in files if os.path.basename(f) == m['heading_date'] + '.md']
        if len(tgts) != 1:
            report.append(f'{lang} {m["old"]}→{nid}: target {m["heading_date"]}.md not found ({len(tgts)}) — heading «{heading}» dropped')
            continue
        T = files[tgts[0]]
        ids = [k for k, l in enumerate(T) if IDL.match(l)]
        f0 = ids[0]
        f1 = ids[1] if len(ids) > 1 else len(T)
        todo = [k for k in range(f0, f1) if T[k].strip() == '# TODO']
        hs = [k for k in range(f0, f1) if vis(T[k]) and T[k].startswith('#') and T[k].strip() != '# TODO']
        if todo:
            T[todo[0]] = heading
            report.append(f'{lang} {m["old"]}→{nid}: «{heading}» → {os.path.basename(tgts[0])} (replaces # TODO)')
        elif hs:
            report.append(f'{lang} {m["old"]}→{nid}: target {os.path.basename(tgts[0])} already has «{T[hs[0]].strip()}» — moved heading dropped')
        elif lang == 'fr':
            report.append(f'{lang} {m["old"]}→{nid}: fr target without visible heading — moved heading dropped')
        else:
            pos = next((k for k in range(f0 + 1, f1) if vis(T[k])), None)
            if pos is None:
                pos = f0 + 1
                while pos < f1 and T[pos].startswith('%%'):
                    pos += 1
            T.insert(pos, heading)
            report.append(f'{lang} {m["old"]}→{nid}: «{heading}» inserted at the top of {os.path.basename(tgts[0])}')
    # 077.0005 (now «# Dimanche 23 décembre 1877»): uk/en show it as a level-6 heading
    f = [x for x in files if x.endswith('/077/1877-12-23.md')]
    if f and '--only-promote' not in sys.argv:
        L = files[f[0]]
        for k, l in enumerate(L):
            if l.startswith('###### ') and ('1877' in l):
                L[k] = '# ' + l[7:]
                report.append(f'{lang} 077/1877-12-23: «######» date heading → «#»')
                break
    # a first paragraph that is only a date line (078 «Dimanche 3 février 1878 - suite», now a French heading):
    # the tool added «# TODO» next to the translated date line; promote the translated line to the heading
    for f, L in files.items():
        ids = [k for k, l in enumerate(L) if IDL.match(l)]
        if not ids:
            continue
        f0, f1 = ids[0], (ids[1] if len(ids) > 1 else len(L))
        todo = [k for k in range(f0, f1) if L[k].strip() == '# TODO']
        other = [k for k in range(f0, f1) if vis(L[k]) and L[k].strip() != '# TODO']
        if len(todo) == 1 and len(other) == 1 and len(L[other[0]]) < 70 and re.search(r'18[78]\d', L[other[0]]):
            L[todo[0]] = '# ' + L[other[0]].strip().lstrip('#').strip()
            dels = {other[0]}
            emb = [k for k in range(f0 + 1, f1) if L[k].startswith('%% ') and L[k].endswith(' %%') and 'ED:' not in L[k] and '[#' not in L[k]]
            seen = set()
            for k in emb:
                if L[k] in seen:
                    dels.add(k)
                seen.add(L[k])
            dels |= {k for k in range(f0, f1) if 'SOURCE CHANGED' in L[k] and ' ED: rebuild-carnet 075+076' in L[k]}
            files[f] = [l for k, l in enumerate(L) if k not in dels]
            report.append(f'{lang} {os.path.basename(f)}: date-line paragraph promoted to the heading «{files[f][todo[0]]}»')
    for f, L in files.items():
        new = '\n'.join(L)
        if new != open(f).read():
            open(f, 'w').write(new)
# ---- headfix, part 2 (after the moves): a paragraph whose old heading moved away but that now opens its
# entry gets the entry's own date as a scaffold heading in the translations (080.0185 → 17 May)
for p in HEADFIX:
    if not (p['to'] and p['old'] in HMOLD and not p['from'].startswith('###### ')):
        continue
    nid = IDMAP[p['old']]
    for lang in ('cz', 'uk', 'en', 'fr'):
        fs = [f for c in CARNETS for f in glob.glob(f'{root}/content/{lang}/{c}/*.md') if f'%% {nid} %%' in open(f).read().split('\n')]
        if len(fs) != 1:
            continue
        L = open(fs[0]).read().split('\n')
        i, j = cluster(L, nid)
        plain = p['to'].lstrip('#').strip()
        emb = [k for k in range(i + 1, j) if L[k].strip() in (f'%% {plain} %%', f'%% {p["to"]} %%')]
        if emb:  # the rebuild already wrote the embedded heading: only the scaffold line is missing
            if lang != 'fr' and L[emb[0] + 1].strip() != '# TODO':
                L.insert(emb[0] + 1, '# TODO')
        else:
            L[i + 1:i + 1] = [f'%% {p["to"]} %%'] + ([] if lang == 'fr' else ['# TODO'])
        open(fs[0], 'w').write('\n'.join(L))
        report.append(f'{lang} {p["old"]}→{nid}: scaffold heading «{p["to"]}» added')

# ---- RSR note for Marie's Livre 80 title-page annotation, kept as a margin paragraph (owner 2026-09-28)
nid = IDMAP['080.0010']
for f in glob.glob(f'{root}/content/_original/080/*.md'):
    L = open(f).read().split('\n')
    if f'%% {nid} %%' not in L:
        continue
    i, j = cluster(L, nid)
    note = (f'%% {TS} RSR: Marie\'s annotation on the title page of Livre 80 (tome11.docx ¶3691–3692, Mon Journal t.11 p.233), '
            'kept as a margin paragraph at the start of 4 May by owner decision (2026-09-28 rebuild); the rest of the title page '
            '(«Gloriae Cupididas / Livre 80ème / commencé le samedi 4 mai 1878 …») is withdrawn. %%')
    if not any('Livre 80 (tome11.docx ¶3691' in l for l in L[i:j]):
        k = i + 1
        while k < j and L[k].startswith('%%') and L[k].strip().endswith('%%'):
            k += 1
        L.insert(k, note)
        open(f, 'w').write('\n'.join(L))
        report.append(f'_original {nid}: RSR note for the Livre 80 annotation added')

print('\n'.join(report))

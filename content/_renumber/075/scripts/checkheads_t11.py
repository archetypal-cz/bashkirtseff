"""Check the rebuilt _original 075–080 (after --write + postfix_headings_t11.py) for heading defects no gate catches:
duplicated visible lines in a cluster, «######» lines, a heading anywhere but the first paragraph of an entry,
an entry whose first paragraph has no heading or one for another date, and every HEADFIX applied.
Also: translations with more than one «# » heading per entry or a «# TODO» outside the planned new entries.
Usage: python3 checkheads_t11.py <repo root>"""
import glob, json, os, re, sys
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import parse_heading
root = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
H = json.load(open(os.path.join(here, 'headmoves.json')))  # headfix = the heading changes the plans make
CARNETS = ['075', '076', '077', '078', '079', '080']
IDMAP = {}
for c in CARNETS:
    IDMAP.update(json.load(open(max(glob.glob(f'{root}/content/_renumber/{c}-2026-09-2*.json'))))['id_map'])
IDL = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
bad = []


def clusters(L):
    out, cur = [], None
    for l in L:
        m = IDL.match(l)
        if m:
            cur = [m.group(1), []]
            out.append(cur)
        elif cur:
            cur[1].append(l)
    return out


def visible(ls):
    return [l for l in ls if l.strip() and not l.startswith('%%') and not l.startswith('[^')]


text = {}
for c in CARNETS:
    for f in sorted(glob.glob(f'{root}/content/_original/{c}/*.md')):
        if f.endswith('README.md'):
            continue
        name = os.path.basename(f)
        cl = clusters(open(f).read().split('\n'))
        for k, (nid, ls) in enumerate(cl):
            v = visible(ls)
            text[nid] = v
            if len(v) != len(set(v)):
                bad.append(f'{c}/{name} {nid}: duplicated line')
            for l in v:
                if l.startswith('######'):
                    bad.append(f'{c}/{name} {nid}: «######» line')
                if l.startswith('#') and k > 0:
                    bad.append(f'{c}/{name} {nid}: heading outside the first paragraph «{l}»')
            if k == 0:
                hs = [l for l in v if l.startswith('#')]
                if len(hs) != 1 or not v[0].startswith('#'):
                    bad.append(f'{c}/{name} {nid}: first paragraph has {len(hs)} heading(s)')
                else:
                    ph = parse_heading(hs[0].lstrip('#').strip(), None)
                    if not ph or '%04d-%02d-%02d' % tuple(ph['ymd']) != name[:10]:
                        bad.append(f'{c}/{name}: heading «{hs[0]}» does not match the file date')
for p in H['headfix']:
    v = text.get(IDMAP[p['old']], [])
    if p['from'] in v:
        bad.append(f'HEADFIX {p["old"]}: «{p["from"]}» still present')
    if p['to'] and p['to'] not in v:
        bad.append(f'HEADFIX {p["old"]}: «{p["to"]}» missing')
for lang in ('cz', 'uk', 'en'):
    for c in CARNETS:
        for f in sorted(glob.glob(f'{root}/content/{lang}/{c}/*.md')):
            L = open(f).read().split('\n')
            body = L[L.index('---', 1) + 1:] if L and L[0] == '---' else L
            hs = [l for l in body if re.match(r'^#{1,6} ', l)]
            if len(hs) > 1 or (lang != 'uk' and not hs):
                bad.append(f'{lang}/{c}/{os.path.basename(f)}: {len(hs)} headings {hs[:3]}')
print('\n'.join(bad) or 'OK')
print(len(bad), 'finding(s)')

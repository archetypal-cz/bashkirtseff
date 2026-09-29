"""After a tome's `rebuild-carnets --write`: add the RSR note that records each old-text correction of the plan
(printed typesetting typos, accents lost at import; rsrnotes.json written by build11.py / build16.py) to the
_original cluster, under its ID, kind and tag lines. Plan paragraphs of kind `old` cannot carry an RSR note.
Idempotent.

Usage: python3 rsrpost.py <repo root> <plan dir> <tome number> CCC [CCC…]
"""
import glob, json, os, re, sys

root, pdir, tome, carnets = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
NOTES = json.load(open(os.path.join(pdir, 'rsrnotes.json')))
IDMAP = {}
for c in carnets:
    IDMAP.update(json.load(open(max(glob.glob(f'{root}/content/_renumber/{c}-2026-09-2*.json'))))['id_map'])
TS = '2026-09-28T21:00:00'
IDL = re.compile(r'^%% \d{3}\.\d{4} %%$')
files = {f: open(f).read().split('\n') for c in carnets for f in glob.glob(f'{root}/content/_original/{c}/*.md')}
done = 0
for old, items in sorted(NOTES.items()):
    nid = IDMAP[old]
    hits = [f for f, L in files.items() if f'%% {nid} %%' in L]
    assert len(hits) == 1, (old, nid, hits)
    L = files[hits[0]]
    i = L.index(f'%% {nid} %%')
    j = i + 1
    while j < len(L) and not IDL.match(L[j]) and L[j] != '---':
        j += 1
    text = f'%% {TS} RSR: Source correction in the {TS[:10]} rebuild (tome {tome}): ' + '; '.join(items) + '. %%'
    if any('Source correction in the 2026-09-28 rebuild' in l for l in L[i:j]):
        continue
    k = i + 1
    while k < j and L[k].startswith('%%') and L[k].strip().endswith('%%') and (
            L[k].startswith('%% kind:') or L[k].startswith('%% [#') or L[k].startswith('%% # ')):
        k += 1
    L.insert(k, text)
    done += 1
for f, L in files.items():
    s = '\n'.join(L)
    if s != open(f).read():
        open(f, 'w').write(s)
print(f'rsrpost: {done} RSR note(s) added in _original {"+".join(carnets)}')

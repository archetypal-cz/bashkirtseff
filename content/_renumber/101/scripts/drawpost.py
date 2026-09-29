"""After `rebuild-carnets --write`: link the drawings of drawings.json in the _original entries' frontmatter
(`drawings:`, as in 068), anchored on the new ID of `anchor_old`, and copy the WebP files into
src/frontend/public/images/marie/drawings/<carnet>/. Rows with "exclude": true are skipped. Idempotent.

Usage: python3 drawpost.py <repo root> <plan dir>
"""
import glob, json, os, shutil, sys

root, pdir = sys.argv[1], sys.argv[2]
for d in json.load(open(os.path.join(pdir, 'drawings.json'))):
    if d.get('exclude'):
        print(f'drawpost: {d["src"]} excluded ({d.get("note", "")[:80]})')
        continue
    c = d['carnet']
    nid = json.load(open(max(glob.glob(f'{root}/content/_renumber/{c}-2026-09-2*.json'))))['id_map'][d['anchor_old']]
    f = f'{root}/content/_original/{c}/{d["entry"]}'
    s = open(f).read()
    assert f'%% {nid} %%' in s, (f, nid)
    dest = os.path.join(root, d['dest'])
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copyfile(os.path.join(pdir, d['file']), dest)
    if d['src'] in s:
        continue
    q = lambda t: '"' + t.replace('"', '\\"') + '"'
    block = (f'  - src: {d["src"]}\n    caption: {q(d["caption"])}\n    alt: {q(d["alt"])}\n'
             f'    source: {q(d["source"])}\n    paragraph: "{nid}"\n')
    head, sep, body = s[4:].partition('\n---\n')
    head = head + ('\n' if 'drawings:' in head else '\ndrawings:\n') + block.rstrip('\n')
    open(f, 'w').write('---\n' + head + sep + body)
    print(f'drawpost: {d["src"]} → {c}/{d["entry"]} after {nid}')

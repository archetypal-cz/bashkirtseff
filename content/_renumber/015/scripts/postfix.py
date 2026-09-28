"""postfix.py REPO — after --write: the tool's own ED comment names the source of a cross-carnet move as
«024/1874-09-16.md», which renumber-check then reads as a link to the removed entry 024/1874-09-16.
Rewrite that mention inside the rebuild's ED comments as «024, 1874-09-16.md» (a note, not a link)."""
import json, re, sys
from pathlib import Path
R = Path(sys.argv[1])
removed = []
for c in [f'{i:03d}' for i in range(15, 31)]:
    m = json.load(open(max((R / 'content/_renumber').glob(f'{c}-20*.json'), key=lambda p: p.stat().st_mtime)))
    removed += [(c, f) for f in m['files_removed']]
changed = []
for tree in ('_original', 'cz', 'uk', 'en', 'fr', 'es'):
    for md in (R / 'content' / tree).glob('0[1-3][0-9]/*.md'):
        s = md.read_text()
        t = s
        for c, f in removed:
            t = re.sub(rf'(%% [0-9T:-]+ ED: rebuild-carnet [^\n]*?)\b{c}/{re.escape(f)}', rf'\g<1>{c}, {f}', t)
        if t != s:
            md.write_text(t)
            changed.append(str(md.relative_to(R)))
print('\n'.join(changed) or 'nothing')

"""postfix5.py REPO DATE — after the 031–044 --write:
1. ED-comment false positive: the tool's flag-reset ED comment names moved sources as «CCC/file.md», which
   renumber-check (c) reads as a link to a removed entry → «CCC, file.md»;
2. RSR notes on old paragraphs whose French the plan changed for a reason other than letter quoting.
3. Translations: headings the plan's set_french added to old paragraphs (043.0301, 043.0426) — the tool embeds the
   French heading; add a visible `# TODO` heading line where the tree shows none (scaffold shape)."""
import json, re, sys
from datetime import datetime
from pathlib import Path
R = Path(sys.argv[1]); DATE = sys.argv[2]
TS = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
C = [f'{i:03d}' for i in range(31, 45)]
idmap, removed = {}, []
for c in C:
    m = json.load(open(R / f'content/_renumber/{c}-{DATE}.json'))
    idmap.update(m['id_map']); removed += [(c, f) for f in m['files_removed']]
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
out = []
# 1
for tree in ('_original', 'cz', 'uk', 'en', 'fr', 'es'):
    for md in (R / 'content' / tree).glob('0[0-9][0-9]/*.md'):
        s = md.read_text(); t = s
        for c, f in removed:
            t = re.sub(rf'(%% [0-9T:-]+ ED: rebuild-carnet [^\n]*?)\b{c}/{re.escape(f)}', rf'\g<1>{c}, {f}', t)
        if t != s:
            md.write_text(t); out.append(f'ED mention fixed: {md.relative_to(R)}')

def find(tree, nid):
    for f in sorted((R / 'content' / tree / nid[:3]).glob('*.md')):
        if f'%% {nid} %%\n' in f.read_text(): return f
    return None

def add_comment(tree, nid, text):
    f = find(tree, nid); L = f.read_text().split('\n'); i = L.index(f'%% {nid} %%'); k = i + 1
    while k < len(L) and L[k].startswith('%%') and not ID.match(L[k]): k += 1
    L.insert(k, f'%% {TS} {text} %%'); f.write_text('\n'.join(L)); out.append(f'{tree} {nid}: {text[:60]}')
# 2
RSR = {
 '031.0019': 'RSR: «Eides et spes» (OCR slip, also in tome05.docx ¶95) corrected to the motto «Fides et spes», 2026-09-28 rebuild.',
 '039.0163': 'RSR: completed from tome05.docx ¶4249 (the sentence «Je suis même allée chez Mme Aleinikoff…» was missing from the original extraction), 2026-09-28 rebuild.',
 '043.0301': 'RSR: Marie\'s second date line «Lundi 20 septembre 1875» restored as a heading (tome05.docx ¶5252; dropped by the original extraction), 2026-09-28 rebuild.',
 '043.0426': 'RSR: Marie\'s date line «21 septembre 1875 -suite» that opens Livre 44 restored as the heading (tome05.docx ¶5385), 2026-09-28 rebuild.',
}
for old, note in RSR.items():
    add_comment('_original', idmap[old], note)
# 3
# 043.0426 «21 septembre 1875 -suite»: the translations already render the line (not as a heading) → make it one
nid = idmap['043.0426']
for tree in ('cz', 'uk', 'en'):
    f = find(tree, nid)
    L = f.read_text().split('\n'); i = L.index(f'%% {nid} %%'); j = i + 1
    while j < len(L) and not ID.match(L[j]): j += 1
    vis = [k for k in range(i + 1, j) if L[k].strip() and not L[k].startswith('%%')]
    if vis and not L[vis[0]].startswith('# '):
        L[vis[0]] = '# ' + L[vis[0]]; f.write_text('\n'.join(L)); out.append(f'{tree} {nid}: visible line made a heading')
for old in ('043.0301',):
    nid = idmap[old]
    for tree in ('cz', 'uk', 'en'):
        f = find(tree, nid)
        if not f: continue
        L = f.read_text().split('\n'); i = L.index(f'%% {nid} %%'); j = i + 1
        while j < len(L) and not ID.match(L[j]): j += 1
        body = L[i + 1:j]
        if any(l.startswith('# ') for l in body): continue
        k = i + 1
        while k < j and L[k].startswith('%%'): k += 1
        L.insert(k, '# TODO'); f.write_text('\n'.join(L)); out.append(f'{tree} {nid}: visible # TODO heading added')
print('\n'.join(out) or 'nothing')
# 4. duplicated footnote definitions (tool copies a definition with a cross-carnet move although the source cluster
#    that held it moved too): drop a later definition whose label and text repeat an earlier one in the same file
DEF = re.compile(r'^\[\^([^\]]+)\]:')
for tree in ('_original', 'cz', 'uk', 'en', 'fr'):
    for c in C:
        for f in sorted((R / 'content' / tree / c).glob('*.md')):
            L = f.read_text().split('\n'); seen = set(); keep = []; n = 0
            for l in L:
                m = DEF.match(l)
                if m and l in seen:
                    n += 1; continue
                if m: seen.add(l)
                keep.append(l)
            if n:
                # collapse a blank line left doubled by the removal
                s = re.sub(r'\n{3,}', '\n\n', '\n'.join(keep))
                f.write_text(s); out.append(f'{tree} {f.relative_to(R / "content" / tree)}: {n} duplicate footnote definition(s) removed')
print('\n'.join(out[-5:]))

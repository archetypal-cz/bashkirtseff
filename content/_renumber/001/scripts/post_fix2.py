"""After --write (repo root = argv[1]). Tool bug at 97785ab8f: when set_french turns an old plain date line into
the entry's heading (010.0153 «Mercredi 1er octobre 1873», 012.0001 «Samedi 1er novembre 1873 (suite)»), the
translation trees get a second, scaffolded heading pair (`%% H %%` + `# TODO`, fr `# H`) above the old embedded
line, plus a wrong «SOURCE CHANGED … must be trimmed» ED note. The French text did not change, only its form:
drop the scaffold pair and the ED note, and make the existing translation line the heading."""
import json, re, sys
from pathlib import Path
R = Path(sys.argv[1])
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
def new_id(old):
    for c in ('010', '011', '012'):
        m = json.load(open(max((R / 'content/_renumber').glob(f'{c}-2026-09-2*.json'))))['id_map']
        if old in m: return m[old] if isinstance(m[old], str) else m[old]['new']
TARGETS = {('010', '1873-10-01.md', new_id('010.0155')), ('012', '1873-11-01.md', new_id('011.0451'))}
for c, fn, pid in sorted(TARGETS):
    o = (R / 'content/_original' / c / fn).read_text().split('\n')
    i = o.index(f'%% {pid} %%'); j = i + 1
    while j < len(o) and not ID.match(o[j]): j += 1
    heads = [l for l in o[i:j] if l.startswith('# ')]
    assert len(heads) == 1, (c, pid, heads)
    fh = heads[0][2:]
    for t in ('cz', 'uk', 'en', 'fr'):
        f = R / 'content' / t / c / fn
        L = f.read_text().split('\n')
        i = L.index(f'%% {pid} %%'); j = i + 1
        while j < len(L) and not ID.match(L[j]): j += 1
        cl = L[i:j]
        assert cl[1].startswith('%% ') and cl[2].startswith('# '), (t, pid, cl[:3])
        ed = [k for k, l in enumerate(cl) if ' ED: rebuild-carnet ' in l and 'SOURCE CHANGED' in l]
        assert len(ed) == 1 and f'%% {fh} %%' in cl, (t, pid)
        del cl[ed[0]]; del cl[1:3]
        vis = [k for k, l in enumerate(cl) if k and l.strip() and not l.startswith('%%')]
        if vis:
            assert len(vis) == 1, (t, pid, vis)
            cl[vis[0]] = '# ' + cl[vis[0]].lstrip('# ')
        else:
            assert t == 'fr', (t, pid)
            k = cl.index(f'%% {fh} %%'); cl.insert(k + 1, f'# {fh}')
        L[i:j] = cl
        f.write_text('\n'.join(L)); print('heading fixed:', t, pid)

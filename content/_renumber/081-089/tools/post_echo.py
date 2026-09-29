"""Post-apply: drop stale page-overlap ECHO embeds in translation trees (python3 post_echo.py REPO CCC…).
The 2026-08-14 dedup of 082 left, in cz/uk/en/fr, an embedded French line in a cluster that repeats the
PRECEDING cluster's French (the translators rendered it comment-only). prereq_082 removed the echo from
_original, so renumber-check (d) FAILs «embedded French holds _original's French plus other text».
An embedded source line is deleted only when it is not part of this cluster's _original French (<50% of its
8-char shingles) and ≥80% of it is the preceding cluster's _original French (which a set_french may have extended). Every deletion is printed."""
import sys, os, re, glob
R = sys.argv[1]; CS = [a for a in sys.argv[2:] if not a.startswith('--force=')]
# clusters whose echo is glued to a copy that later changed: every embedded line is replaced by _original's French
FORCE = {x for a in sys.argv[2:] if a.startswith('--force=') for x in a[8:].split(',')}
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
def nz(s): return re.sub(r'[^\w]+', '', re.sub(r'\[\^[^\]]+\]', '', s.replace('’', "'")).lower())
def src_line(l):
    m = re.match(r'^%% (.*?)\s*%%$', l)
    if not m: return None
    b = m.group(1)
    if ID.match(l) or b.startswith('[#') or b.startswith('kind:') or re.match(r'^\d{4}-\d{2}-\d{2}', b) or re.match(r'^[A-Z]{2,4}( [A-Za-z ]+)?:', b): return None
    return b
def orig_french(f):
    out = {}; cur = None
    for l in open(f, encoding='utf-8').read().split('\n'):
        m = ID.match(l)
        if m: cur = m.group(1); out[cur] = ''; continue
        if cur and l.strip() and not l.startswith('%%') and not l.startswith('[^'): out[cur] += ' ' + l; LINES.setdefault(cur, []).append(l)
    return out
LINES = {}
def cover(a, b):
    k = [a[i:i + 8] for i in range(0, max(1, len(a) - 7), 4)]
    return sum(x in b for x in k) / len(k)
n = 0
for c in CS:
    for of in sorted(glob.glob(f'{R}/content/_original/{c}/*.md')):
        O = orig_french(of); ids = list(O)
        prev = {ids[i]: O[ids[i - 1]] for i in range(1, len(ids))}
        for t in ['cz', 'uk', 'en', 'fr', 'es']:
            tf = of.replace('/_original/', f'/{t}/')
            if not os.path.exists(tf): continue
            L = open(tf, encoding='utf-8').read().split('\n'); out = []; cur = None; ch = False; ch_force = {}
            for l in L:
                m = ID.match(l)
                if m: cur = m.group(1)
                b = src_line(l)
                if b and cur in FORCE:
                    if not ch_force.get(cur):
                        out += ['%% ' + x.strip() + ' %%' for x in LINES[cur]]; ch_force[cur] = True
                        print(f'{t}/{c}/{os.path.basename(tf)} {cur}: embed replaced by _original French (forced)'); n += 1; ch = True
                    continue
                if b and cur in prev:
                    nb = nz(b.lstrip('# >')); 
                    if len(nb) > 15 and nb not in nz(O[cur]) and cover(nb, nz(prev[cur])) >= 0.8 and cover(nb, nz(O[cur])) < 0.5:
                        print(f'{t}/{c}/{os.path.basename(tf)} {cur}: echo embed dropped «{b[:60]}…»'); n += 1; ch = True; continue
                    no = nz(O[cur])
                    if len(no) > 15 and no in nb and len(nb) - len(no) > 15 and cover(nb.replace(no, ''), nz(prev[cur])) >= 0.8:
                        out += ['%% ' + x.strip() + ' %%' for x in LINES[cur]]
                        print(f'{t}/{c}/{os.path.basename(tf)} {cur}: echo prefix/suffix cut from embed «{b[:60]}…»'); n += 1; ch = True; continue
                out.append(l)
            if ch: open(tf, 'w', encoding='utf-8').write('\n'.join(out))
print('post_echo: dropped', n)

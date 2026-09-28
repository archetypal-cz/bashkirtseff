"""Stale embedded French after the rebuild: in cz/uk/en/fr clusters of 069-074, an embedded
`%% French %%` line that shares its first 40 chars with a line of the _original cluster but is not
equal to any _original line (old copy left beside the new one, or not updated).
python3 stale_check.py <repo root>"""
import re, sys
from pathlib import Path
R = Path(sys.argv[1])
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
norm = lambda t: re.sub(r'\s+', ' ', re.sub(r'\[\^[^\]]+\]|\s*\^\d+\^|<[^>]+>|^#+ |^> ', '', t.strip())).strip()
def clusters(f):
    out = {}; cur = None; indef = False
    for l in f.read_text().split('\n'):
        m = ID.match(l.strip())
        if m: cur = m.group(1); out[cur] = []; indef = False; continue
        if cur: out[cur].append(l)
    return out
n = 0
for c in ['069', '070', '071', '072', '073', '074']:
    orig = {}
    for f in (R / 'content/_original' / c).glob('*.md'):
        for pid, L in clusters(f).items():
            orig[pid] = [norm(l) for l in L if l.strip() and not l.startswith('%%') and not l.startswith('[^') and not l.startswith('    ')]
    for t in ['cz', 'uk', 'en', 'fr']:
        for f in sorted((R / 'content' / t / c).glob('1*.md')):
            for pid, L in clusters(f).items():
                ol = [o for o in orig.get(pid, []) if o]
                if not ol: continue
                for l in L:
                    s = l.strip()
                    if not (s.startswith('%% ') and s.endswith(' %%')) or s.startswith('%% [#') or re.match(r'^%% \d{4}-\d\d-\d\dT', s): continue
                    e = norm(s[3:-3])
                    if e in ol or len(e) < 20: continue
                    if any(e[:40] == o[:40] or e[-40:] == o[-40:] for o in ol):
                        n += 1; print(f'{t}/{c}/{f.name} {pid}: {e[:70]}…{e[-50:]}')
print('STALE', n)

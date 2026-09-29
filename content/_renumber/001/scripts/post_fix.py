"""After --write and add_rsr.py (repo root = argv[1]).
1. Cross-carnet moves duplicated a footnote definition (tool bug, still at ec6fa6163): the definition
   was re-homed to the referring cluster AND kept in the source cluster. Drop the later copy.
2. en/009 009.0030 (old 009.0001): the embedded French was a line of the next paragraph, not the
   heading «Mardi 2 septembre 1873» (pre-existing; renumber-check FAILs on it since cac96e6cd)."""
import sys
from pathlib import Path
R = Path(sys.argv[1])
for rel, d in [('content/cz/009/1873-09-01.md', '[^1]: *V originále italsky:*'),
               ('content/en/012/1873-11-01.md', '[^5]: I am the author of the testimonial.')]:
    f = R / rel; lines = f.read_text().split('\n')
    idx = [i for i, l in enumerate(lines) if l.startswith(d)]
    if len(idx) == 1: print('no dup footnote (tool fixed?):', rel); continue
    assert len(idx) == 2 and lines[idx[0]] == lines[idx[1]], (rel, idx)
    del lines[idx[1]]
    if lines[idx[1] - 1] == '' and idx[1] < len(lines) and lines[idx[1]] == '':
        del lines[idx[1]]
    f.write_text('\n'.join(lines)); print('dup footnote removed:', rel)
f = R / 'content/en/009/1873-09-02.md'; s = f.read_text()
old = "%% 009.0030 %%\n%% [#Kernberger](../../_original/_glossary/culture/literature/KATHERINE_KERNBERGER.md) %%\n%% Le premier jour depuis l'interruption des études, je me lève à cinq heures. %%\n# Tuesday"
assert s.count(old) == 1, 'en/009 cluster not found'
f.write_text(s.replace(old, old.replace("Le premier jour depuis l'interruption des études, je me lève à cinq heures.", 'Mardi 2 septembre 1873')))
print('en/009 009.0030 embedded heading fixed')

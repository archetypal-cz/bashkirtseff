"""After postfix16.py (tome 16): the fr tree (unedited edition, no visible text in 102) never had a heading for
16 Oct 1883, so postfix16's headmove for old 102.0001 finds nothing there; but the rebuild left a spurious
«SOURCE CHANGED … must be trimmed» ED note on fr 102.0002 (old 102.0001), whose French only lost its heading
line to the new Livre 102 reading-notes margin paragraph. Drop that note. Idempotent. Usage: python3 post16b.py <root>"""
import re, sys
root = sys.argv[1]
f = f'{root}/content/fr/102/1883-10-16.md'
L = open(f).read().split('\n')
i = L.index('%% 102.0002 %%')
j = next(k for k in range(i + 1, len(L)) if re.match(r'^%% \d{3}\.\d{4} %%$', L[k]))
d = [k for k in range(i, j) if 'SOURCE CHANGED' in L[k] and ' ED: rebuild-carnet 101+' in L[k]]
L = [l for k, l in enumerate(L) if k not in d]
open(f, 'w').write('\n'.join(L))
print(f'post16b: {len(d)} spurious fr ED note(s) removed from 102.0002')

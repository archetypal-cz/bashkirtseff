"""Prerequisite for the 081/082 rebuild (worker A, 2026-09-28): fr embedded-French blocks.

python3 prereq_fr0812.py REPO_ROOT [--check]

Since cac96e6cd, rebuild-carnet refuses `set_french` on a cluster whose embedded French is a multi-line
comment block (opener on the first French line, closer on the last). In fr/081 and fr/082 (unedited:
edition_complete false) 16 clusters that the plans set_french have such blocks. Each block becomes one
single-line comment per French line (the `just scaffold` shape), text unchanged. Lossless and idempotent.
"""
import sys, re, os, glob
root = sys.argv[1]; check = '--check' in sys.argv
IDS = {'081.0032', '081.0061', '081.0062', '081.0063', '081.0066', '081.0432', '081.0445', '081.0450', '081.0453',
       '081.0460', '081.0461', '081.0484', '081.0485', '081.0486', '081.0487', '082.0076'}
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
M = '%' * 2
done = 0; errors = []
for c in ('081', '082'):
    for f in sorted(glob.glob(f'{root}/content/fr/{c}/*.md')):
        L = open(f, encoding='utf-8').read().split('\n')
        out = []; cur = None; i = 0; changed = False
        while i < len(L):
            l = L[i]; m = ID.match(l)
            if m: cur = m.group(1)
            s = l.strip()
            opener = s.startswith(M) and not (len(s) > 2 and s.endswith(M)) and not ID.match(l)
            if cur in IDS and opener:
                j = i + 1
                while j < len(L) and M not in L[j]: j += 1
                if j >= len(L) or not L[j].rstrip().endswith(M) or L[j].count(M) != 1:
                    errors.append(f'{f}:{i+1}: unclosed or odd block'); out.append(l); i += 1; continue
                block = [l.strip()[2:].strip()] + [x.strip() for x in L[i + 1:j]] + [L[j].rstrip()[:-2].strip()]
                out += [f'{M} {x} {M}' for x in block if x]
                done += 1; changed = True; i = j + 1; continue
            out.append(l); i += 1
        if changed and not check: open(f, 'w', encoding='utf-8').write('\n'.join(out))
if errors: print('REFUSED'); [print(' ', e) for e in errors]; sys.exit(1)
print(('would convert ' if check else 'converted ') + f'{done} multi-line block(s)')

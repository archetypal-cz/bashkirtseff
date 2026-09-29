"""Prerequisite for the tome 16 rebuild (mechanical, fr tree only): the unedited fr carnets 101–106 hold their
embedded French as multi-line %% blocks («%% line 1\\nline 2 %%»), which rebuild-carnet's set_french refuses
(cac96e6cd). Rewrite each such block as one «%% line %%» comment per line (the `just scaffold` shape); blank lines
inside a block are dropped. Nothing visible changes. Usage: python3 prereq16fr.py <repo root>"""
import glob, re, sys
root = sys.argv[1]
nb = nf = 0
for f in sorted(glob.glob(f'{root}/content/fr/10[1-6]/*.md')):
    L = open(f).read().split('\n')
    out, blk = [], None
    for l in L:
        s = l.strip()
        if blk is None:
            if s.startswith('%%') and not (len(s) >= 4 and s.endswith('%%')):
                assert not re.match(r'%% \d{4}-\d\d-\d\dT', s), (f, s)
                blk = [s[2:].strip()]
            else:
                out.append(l)
            continue
        if s.endswith('%%'):
            blk.append(s[:-2].strip())
            out += [f'%% {x} %%' for x in blk if x]
            blk = None
            nb += 1
        else:
            blk.append(s)
    assert blk is None, f
    s2 = '\n'.join(out)
    if s2 != '\n'.join(L):
        open(f, 'w').write(s2)
        nf += 1
print(f'prereq16fr: {nb} multi-line blocks split in {nf} fr files')

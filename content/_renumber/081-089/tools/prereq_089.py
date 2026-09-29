"""Prerequisite for the 089 rebuild (run on main before --write): python3 prereq_089.py REPO_ROOT
fr/089/1880-09-28.md holds 089.0623's embedded French as one multi-line comment block, which rebuild-carnet refuses
for a set_french. Rewrite it as one single-line embed per line (same text; fr 089 is unedited, embed-only)."""
import sys, os
p = os.path.join(sys.argv[1], 'content/fr/089/1880-09-28.md')
L = open(p, encoding='utf-8').read().split('\n')
k = L.index('%% 089.0623 %%') + 1
assert L[k].startswith('%% Cette bouffonnerie me vaut') and not L[k].endswith('%%')
j = k
while not L[j].endswith('%%'): j += 1
block = [L[k][3:]] + L[k + 1:j] + [L[j][:-3]]
L[k:j + 1] = ['%% ' + b.strip() + ' %%' for b in block]
open(p, 'w', encoding='utf-8').write('\n'.join(L))
print('prereq_089: fr 089.0623 block ->', len(block), 'single-line embeds')

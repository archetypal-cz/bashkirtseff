"""Prerequisite for the 084 rebuild (worker B): fr/084/1879-03-12.md, cluster 084.0340 holds its embedded
French as one multi-line comment block, which rebuild-carnet refuses with set_french. Split it into one
single-line comment per line (lossless). Usage: python3 prereq_084.py REPO_ROOT"""
import sys, pathlib
f = pathlib.Path(sys.argv[1]) / 'content/fr/084/1879-03-12.md'
s = f.read_text()
old = "%% Je me sens profondement malheureuse\nMadame Gavini est venue."
if old not in s:
    print('prereq_084: pattern not found (already applied?)'); sys.exit(0)
s = s.replace(old, "%% Je me sens profondement malheureuse %%\n%% Madame Gavini est venue.", 1)
f.write_text(s); print('prereq_084: fr/084/1879-03-12.md 084.0340 block split')

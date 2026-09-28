"""After --write: set_french on a cluster whose old French is (or starts with) a date heading keeps the old
heading line and adds the new one (rebuild-carnet-core applySetFrench replaces text lines only). This removes
the stale heading in _original and the stale/duplicate embedded heading in every translation tree.
usage: postfix_headings.py <repo root>"""
import os, re, sys
R = sys.argv[1]
# (carnet dir, file, new ID, target heading, stale heading(s) in _original)
FIX = [
    ("049", "1875-11-06.md", "049.0001", "# Samedi, 6 novembre 1875 (suite)", ["## (suite)"]),
    ("049", "1875-11-07.md", "049.0020", "# Samedi, 7 novembre 1875", ["# Samedi, 6 novembre 1875 (suite)"]),
    ("053", "1876-01-31.md", "053.0236", "# Lundi 31 janvier 1876", []),
    ("058", "1876-04-16.md", "058.0077", "# Dimanche 16 avril 1876 - Pâques", ["# Dimanche 16 avril 1876"]),
]
ID = re.compile(r"^%% \d{3}\.\d{4} %%$")
def bare(h):
    return h.lstrip("#").strip()
for c, fn, pid, target, stale in FIX:
    for tree in ("_original", "cz", "uk", "en", "fr"):
        f = f"{R}/content/{tree}/{c}/{fn}"
        if not os.path.exists(f):
            continue
        lines = open(f).read().split("\n")
        s = lines.index(f"%% {pid} %%")
        e = next((i for i in range(s + 1, len(lines)) if ID.match(lines[i])), len(lines))
        drop = []
        if tree == "_original":
            heads = [i for i in range(s + 1, e) if lines[i].startswith("#")]
            seen_target = False
            for i in heads:
                if lines[i] == target and not seen_target:
                    seen_target = True
                elif lines[i] in stale or lines[i] == target:
                    drop.append(i)
        else:
            emb = [i for i in range(s + 1, e) if lines[i].startswith("%% ") and lines[i].endswith(" %%")
                   and bare(lines[i][3:-3]) in {bare(target)} | {bare(x) for x in stale}]
            keep = next((i for i in emb if bare(lines[i][3:-3]) == bare(target)), None)
            drop = [i for i in emb if i != keep]
        if drop:
            print(tree, c, fn, pid, "removed:", [lines[i] for i in drop])
            lines = [l for i, l in enumerate(lines) if i not in drop]
            open(f, "w").write("\n".join(lines))

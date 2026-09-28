"""Pre-rebuild mechanical fix: en/098 lacks the ID of the «[Pas d'entree pour cette date]» paragraph
in 10 stub entries (its English note sits in the heading's cluster). Give it its own cluster, as in
_original/cz/uk/fr, so the translation tree has the same ID sequence.

Usage: python3 fix_pre.py ROOT
"""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) / "content"
DATES = ["1883-02-13", "1883-02-20", "1883-02-23", "1883-03-02", "1883-03-04",
         "1883-03-09", "1883-03-10", "1883-03-18", "1883-03-24", "1883-03-29"]
for d in DATES:
    orig = (ROOT / f"_original/098/{d}.md").read_text()
    ids = re.findall(r"^%% (098\.\d{4}) %%$", orig, re.M)
    assert len(ids) == 2, (d, ids)
    fr = [l for l in orig.split("\n") if l.startswith("[Pas d")]
    assert len(fr) == 1, (d, fr)
    p = ROOT / f"en/098/{d}.md"
    L = p.read_text().split("\n")
    assert f"%% {ids[1]} %%" not in L
    hit = [i for i, l in enumerate(L) if l.strip() == "[No entry for this date]"]
    assert len(hit) == 1, (d, hit)
    i = hit[0]
    L[i:i] = [f"%% {ids[1]} %%", f"%% {fr[0]} %%"]
    if L[i - 1].strip() != "":
        L.insert(i, "")
    p.write_text("\n".join(L))
print("en/098 stub IDs: OK")

# fr tree: 35 clusters that take set_french embed their French as one multi-line %% block, which
# rebuild-carnet refuses (cac96e6cd). Split each such block into one %% line per non-empty line, the
# form renderSourceComment writes; the tool then replaces the whole embedded copy. Comments only:
# no visible text changes.
import json
PLANS = Path(__file__).resolve().parent / "final2"
ids = set()
for pf in sorted(PLANS.glob("plan-*.json")):
    for e in json.load(open(pf))["entries"]:
        for q in e["paragraphs"]:
            if "old" in q and "set_french" in q:
                ids.add(q["old"])
n = 0
for c in sorted({i[:3] for i in ids}):
    for p in sorted((ROOT / f"fr/{c}").glob("*.md")):
        L = p.read_text().split("\n")
        out, cur, i, changed = [], None, 0, False
        while i < len(L):
            l = L[i]
            m = re.match(r"^%% (\d{3}\.\d{4}) %%$", l)
            if m:
                cur = m.group(1)
            if cur in ids and re.match(r"^%% ", l) and not re.match(r"^\s*%%.*%%\s*$", l):
                j = i
                while not L[j].rstrip().endswith("%%"):
                    j += 1
                body = "\n".join(L[i:j + 1]).strip()[2:-2]
                assert "%%" not in body, (p, cur)
                assert not re.match(r"\s*\d{4}-\d{2}-\d{2}T", body), (p, cur, "role note, not French")
                out += [f"%% {x.strip()} %%" for x in body.split("\n") if x.strip()]
                i, changed = j + 1, True
                n += 1
                continue
            out.append(l)
            i += 1
        if changed:
            p.write_text("\n".join(out))
assert n == 35, n
print(f"fr multi-line French blocks split: {n}")

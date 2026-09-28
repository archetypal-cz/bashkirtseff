"""Pre-rebuild fixes for stale embedded French that renumber-check (d) (cac96e6cd) FAILs on.
Comments only, except the en 092.0133/0134 boundary (see below).

Usage: python3 fix_pre2.py ROOT
"""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) / "content"
ID = re.compile(r"^%% (\d{3}\.\d{4}) %%$")
EMB = re.compile(r"^%%\s*(.*?)\s*%%$")


def is_french(b):
    return bool(b) and "%%" not in b and not (
        re.match(r"^\d{3}\.\d{4}$", b) or b.startswith("[#") or b.startswith("[//]")
        or re.match(r"^\d{4}-\d{2}-\d{2}", b) or re.match(r"^[A-Z]{2,4}:", b))


# 1. Duplicated embedded French: some clusters carry the whole French as a block of %% lines and
#    again line by line above each translated line. Keep the later (interleaved) copy of each line
#    (compared loosely: one copy may carry a footnote marker the other lacks).
def norm(t):
    """Loose comparison, as renumber-check's normFrench: no footnote refs, quote styles, case or spacing."""
    t = re.sub(r"\[\^[^\]]+\]", "", t).replace("’", "'").replace("‘", "'")
    t = re.sub(r"[“”«»]", '"', t)
    return re.sub(r"\s+", " ", t).strip().lower()


def dedupe(p, only=None):
    L = p.read_text().split("\n")
    cur, spans = None, {}
    for i, l in enumerate(L):
        m = ID.match(l)
        if m:
            cur = m.group(1)
            continue
        e = EMB.match(l.strip())
        if cur and e and is_french(e.group(1)):
            spans.setdefault(cur, []).append((i, norm(e.group(1))))
    drop = set()
    for cid, xs in spans.items():
        if only and cid not in only:
            continue
        for k, (i, t) in enumerate(xs):
            if any(t == u for _, u in xs[k + 1:]):
                drop.add(i)
    if drop:
        p.write_text("\n".join(l for i, l in enumerate(L) if i not in drop))
    return len(drop)


n = sum(dedupe(p) for p in sorted((ROOT / "uk/093").glob("*.md")))
n += dedupe(ROOT / "en/099/1883-05-23.md", {"099.0392"})
print(f"duplicate embedded French lines removed: {n}")

# 2. en 092.0133/0134: _original splits «… Très / bonnes femmes du reste …» at a page break (tome14
#    ¶1958/1959). en 0133 embeds that French correctly, but its translation of «Nous voici … vivre.»
#    sat in 0134, whose embedded French repeated the passage. Move the translated passage to 0133 and
#    trim 0134's French to its own paragraph.
p = ROOT / "en/092/1881-06-20.md"
L = p.read_text().split("\n")
s33, s34 = L.index("%% 092.0133 %%"), L.index("%% 092.0134 %%")
s35 = L.index("%% 092.0135 %%")
fr34 = [i for i in range(s34, s35) if L[i].startswith("%% Nous voici à la campagne")]
tr34 = [i for i in range(s34, s35) if L[i].startswith("We have been in the country")]
assert len(fr34) == 1 and len(tr34) == 1
FR_TAIL, FR_KEEP = L[fr34[0]][3:-3].split(" Très bonnes femmes du reste")
TR_TAIL, TR_KEEP = L[tr34[0]].split(" Very good women otherwise")
assert FR_KEEP == " et m'adorant. Mais elles sont ainsi faites." and TR_KEEP.startswith(",")
fr33 = [i for i in range(s33, s34) if L[i].startswith("%% Je me disais, plus souvent")]
tr33 = [i for i in range(s33, s34) if L[i].startswith("I tell myself")]
assert len(fr33) == 1 and len(tr33) == 1
L[fr34[0]] = "%% bonnes femmes du reste" + FR_KEEP + " %%"
L[tr34[0]] = "Very good women otherwise" + TR_KEEP
assert L[fr33[0]].endswith(FR_TAIL.split(". ")[-1] + " Très %%")  # 0133 already embeds the passage
L[tr33[0]] = L[tr33[0]] + " " + TR_TAIL
p.write_text("\n".join(L))
orig = (ROOT / "_original/092/1881-06-20.md").read_text()
assert "\n" + L[fr33[0]][3:-3] + "\n" in orig and "\n" + L[fr34[0]][3:-3] + "\n" in orig, "en 0133/0134 French must equal _original"
print("en 092.0133/0134 boundary: OK")

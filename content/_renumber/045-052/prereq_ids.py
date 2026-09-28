"""Prerequisite fixes on main before the tome 6-7 rebuild (mechanical, no text change to Marie's French).
1. Stale IDs from a pre-restructure numbering (046 started at 0354, 047 at 0667) in RSR comments, glossary
   citations and READMEs: 046 = old - 353, 047 = old - 666 (every citation checked against the quoted text).
   054.0698 (ROME.md, «furieuse gaieté d'un Mardi gras») is 054.0615.
2. 054/README.md history lines «054.0110 → 054.1100» get the rebuild-carnet keep pragma (they record a past fix).
3. en/053/1876-01-24.md 053.0001: the embedded French paragraph is there twice (before and after the heading);
   the copy after the heading goes.
4. fr/050/1875-12-02.md 050.0383: its embedded French is one multi-line comment block, which rebuild-carnet
   refuses for set_french; rewritten as one comment per line (same text).
usage: prereq_ids.py <repo root>"""
import re, sys
R = sys.argv[1] + "/content"
def sub(path, pairs):
    f = f"{R}/{path}"
    s = open(f).read()
    for a, b in pairs:
        assert s.count(a) >= 1, (path, a)
        s = s.replace(a, b)
    open(f, "w").write(s)
    print("fixed", path, len(pairs))
for tree in ("_original", "fr"):
    sub(f"{tree}/046/1875-10-04.md", [("Tiste (046.0411)", "Tiste (046.0058)")])
    sub(f"{tree}/046/1875-10-08.md", [("(046.0535-0555)", "(046.0182-0202)"), ("(046.0566-0569)", "(046.0213-0216)"),
                                     ("roman cérébral\" (cerebral novel, 046.0564)", "roman cérébral\" (cerebral novel, 046.0211)")])
    sub(f"{tree}/046/1875-10-10.md", [("(046.0613:", "(046.0260:"), ("(046.0616)", "(046.0263)")])
G = "_original/_glossary"
sub(f"{G}/people/recurring/SAETONE.md", [("046.0649", "046.0296"), ("046.0657", "046.0304"), ("046.0378", "046.0025")])
sub(f"{G}/people/mentioned/LORD_AUGUSTUS_LOFTUS.md", [("046.0643", "046.0290")])
sub(f"{G}/culture/theater/LA_GRANDE_DUCHESSE_DE_GEROLSTEIN.md", [("046.0509", "046.0156")])
sub(f"{G}/culture/literature/ISABELLE_DE_BAVIERE.md", [("046.0563", "046.0210"), ("046.0488", "046.0135")])
sub(f"{G}/culture/theater/ALICE_DE_NEVERS.md", [("047.0948", "047.0282")])
sub(f"{G}/culture/theater/FROU_FROU.md", [("047.0808", "047.0142")])
sub(f"{G}/culture/literature/CHARLOTTE_DE_MONTMORENCY.md", [("047.0792", "047.0126")])
sub(f"{G}/places/cities/ROME.md", [("(054.0698, Feb 29)", "(054.0615, Feb 29)")])
sub("_original/046/README.md", [("046.0354 - 046.0666", "046.0001 - 046.0313")])
sub("_original/047/README.md", [("047.0667 - 047.1106", "047.0001 - 047.0440")])
sub("_original/054/README.md", [("054.0110 → 054.1100 in 1876-02-29", "054.0110 → 054.1100 in 1876-02-29 <!-- rebuild-carnet: keep -->"),
                                ("- Fixed paragraph ID: 054.0110 → 054.1100\n", "- Fixed paragraph ID: 054.0110 → 054.1100 <!-- rebuild-carnet: keep -->\n")])
# 3. duplicated embed in en/053
f = f"{R}/en/053/1876-01-24.md"
L = open(f).read().split("\n")
h = L.index("# Monday, 24 January 1876")
assert L[h + 1].startswith("%% J'étais chez le photographe") and L[h + 1] in L[:h]
del L[h + 1]
open(f, "w").write("\n".join(L)); print("fixed en/053/1876-01-24.md duplicate embed")
# 4. fr/050 multi-line block
f = f"{R}/fr/050/1875-12-02.md"
L = open(f).read().split("\n")
a = L.index("%% 050.0383 %%") + 1
if L[a].startswith("%% ") and not L[a].endswith("%%"):
    b = a
    while not L[b].endswith(" %%"):
        b += 1
    text = [L[a][3:]] + L[a + 1:b] + [L[b][:-3]]
    L[a:b + 1] = [f"%% {t.strip()} %%" for t in text]
    open(f, "w").write("\n".join(L)); print("fixed fr/050 050.0383 block,", b - a + 1, "lines")

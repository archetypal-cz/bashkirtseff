"""Post-apply hand fixes for the 090–100 rebuild (things a plan cannot express).

Usage: python3 fix_post.py ROOT   (ROOT = repo or worktree root, after `rebuild-carnets --write`)
Each fix asserts its preconditions so a changed layout fails loudly instead of editing blind.
"""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) / "content"


def rd(p):
    return (ROOT / p).read_text().split("\n")


def wr(p, lines):
    (ROOT / p).write_text("\n".join(lines))


def cluster_span(lines, cid):
    s = lines.index(f"%% {cid} %%")
    e = s + 1
    while e < len(lines) and not re.match(r"^%% \d{3}\.\d{4} %%$", lines[e]):
        e += 1
    return s, e


def id_of(p, needle):
    """ID of the cluster in file p whose lines contain needle."""
    cur = None
    for l in rd(p):
        m = re.match(r"^%% (\d{3}\.\d{4}) %%$", l)
        if m:
            cur = m.group(1)
        elif needle in l:
            return cur
    raise SystemExit(f"{p}: {needle!r} not found")


# 2. 092: the Œdipe roi footnote definition follows its reference from 1881-08-07 to 1881-08-08.
a, b = "_original/092/1881-08-07.md", "_original/092/1881-08-08.md"
A, B = rd(a), rd(b)
defs = [i for i, l in enumerate(A) if l.startswith("[^1]: *Oedipus Rex*")]
assert len(defs) == 1 and not any(l.startswith("[^1]:") for l in B)
d = A.pop(defs[0])
if defs[0] > 0 and A[defs[0] - 1].strip() == "" and (defs[0] >= len(A) or A[defs[0]].strip() == ""):
    A.pop(defs[0] - 1)
ref = [i for i, l in enumerate(B) if "[^1]" in l and not l.startswith("%%")]
assert len(ref) == 1
s, e = cluster_span(B, re.match(r"^%% (\S+) %%", B[max(i for i in range(ref[0]) if re.match(r"^%% \d{3}\.\d{4} %%$", B[i]))]).group(1))
while e > s and B[e - 1].strip() == "":
    e -= 1
B[e:e] = ["", d]
wr(a, A)
wr(b, B)

# 3. 093: re-attach the Fontarabie footnote (was on old 0070, now the empty 26 Sept stub) to the 27 Sept text.
a, b = "_original/093/1881-09-26.md", "_original/093/1881-09-27.md"
A, B = rd(a), rd(b)
defs = [i for i, l in enumerate(A) if l.startswith("[^1]: Fontarabía")]
assert len(defs) == 1 and not any("[^1]" in l for l in B)
d = A.pop(defs[0])
while A and A[-1].strip() == "" and len(A) > 1 and A[-2].strip() == "":
    A.pop()
hit = [i for i, l in enumerate(B) if "Fontarabie" in l and not l.startswith("%%") and not l.startswith("    -")]
assert hit, "Fontarabie not in 27 Sept text"
i = hit[0]
B[i] = B[i].replace("Fontarabie", "Fontarabie[^1]", 1)
cid = [re.match(r"^%% (\S+) %%", B[k]).group(1) for k in range(i, -1, -1) if re.match(r"^%% \d{3}\.\d{4} %%$", B[k])][0]
s, e = cluster_span(B, cid)
while e > s and B[e - 1].strip() == "":
    e -= 1
B[e:e] = ["", d]
wr(a, A)
wr(b, B)

# 4. 099 (26 May 1883): the Gloriae Cupiditas note belonged to the Livre 100 title page, which was cut out.
p = "_original/099/1883-05-26.md"
L = rd(p)
defs = [i for i, l in enumerate(L) if l.startswith("[^4]: *Gloriae Cupiditas*")]
assert len(defs) == 1 and not any("[^4]" in l for i, l in enumerate(L) if i != defs[0])
del L[defs[0]]
if defs[0] > 0 and L[defs[0] - 1].strip() == "" and (defs[0] >= len(L) or L[defs[0]].strip() == ""):
    del L[defs[0] - 1]
wr(p, L)

# 6. fr edition: its trees carry no footnote definitions, so the verbatim French of the new 099 letter
#    paragraphs must not show markers (the embedded copies keep them).
for p in ["fr/099/1883-05-24.md", "fr/099/1883-05-25.md"]:
    L = rd(p)
    L = [l if l.startswith("%%") else re.sub(r"\[\^\d+\]", "", l) for l in L]
    wr(p, L)

# 7. NAPLES.md cited the Naples-serenade memory of 14 July 1883 as 100.0525, an ID 100 never had.
cid = id_of("_original/100/1883-07-14.md", "Je me souviens avoir, à Napl")
p = "_original/_glossary/places/cities/NAPLES.md"
L = rd(p)
hits = [i for i, l in enumerate(L) if "(July 14, 1883, 100.0525)" in l]
assert len(hits) == 1
L[hits[0]] = L[hits[0]].replace("100.0525", cid)
wr(p, L)

# 8. LOUISE_BRESLAU.md cites «090.1882-04-22»; that entry is now in 094.
p = "_original/_glossary/people/mentioned/LOUISE_BRESLAU.md"
t = (ROOT / p).read_text()
assert t.count("090.1882-04-22") == 1
(ROOT / p).write_text(t.replace("090.1882-04-22", "094.1882-04-22"))

# 10. RSR notes for old paragraphs whose French or heading the plan changed (typesetting typos, headings).
#     The plan format has no rsr field for old paragraphs; the id_map gives their new IDs.
import glob as _glob
import json as _json
from datetime import datetime as _dt
ts = _dt.now().strftime("%Y-%m-%dT%H:%M:%S")
notes = _json.load(open(Path(__file__).resolve().parent / "final2/old-notes.json"))
idmap = {}
for m in _glob.glob(str(ROOT / "_renumber/09?-2026-*.json")) + _glob.glob(str(ROOT / "_renumber/100-2026-*.json")):
    idmap.update(_json.load(open(m)).get("id_map", {}))
for old, note in notes.items():
    new = idmap[old]
    if isinstance(new, dict):
        new = new.get("new") or new.get("id")
    c = new[:3]
    hits = [f for f in _glob.glob(str(ROOT / f"_original/{c}/*.md")) if f"%% {new} %%" in open(f).read()]
    assert len(hits) == 1, (old, new, hits)
    L = open(hits[0]).read().split("\n")
    i = L.index(f"%% {new} %%") + 1
    while i < len(L) and L[i].startswith("%%"):
        i += 1
    L.insert(i, f"%% {ts} RSR: {note} %%")
    open(hits[0], "w").write("\n".join(L))

# 9. Drawings cut from Mon Journal t.15 (600 dpi, WebP), shown after their anchor paragraph.
import shutil
DRAW = Path(__file__).resolve().parent / "draw"
PUB = ROOT.parent / "src/frontend/public/images/marie/drawings"
for carnet, entry, needle, img, caption, alt, page in [
    ("095", "1882-06-08", "bout de tout ça", "tome15-p0022-1.webp",
     "Dessin de Marie : les convives de la soirée autour d'une forme ovale",
     "Une forme ovale hérissée de traits, d'où rayonnent les noms des invités écrits de la main de Marie : Fitz-James, Tony, Carolus, Gabriel Géry, Bojidar, Gavini et d'autres",
     22),
    ("096", "1882-08-29", "[Note de l'éd. : ici un plan de son atelier", "tome15-p0069-1.webp",
     "Plan de l'atelier de la rue Ampère, dessiné par Marie",
     "Plan à la plume de l'atelier et de ses pièces : chambre, cabinet de toilette, bibliothèque, balcon, avec la rue Ampère en haut et le jardin en bas",
     69),
    ("098", "1883-01-16", "[Note de l'éd. : ici un plan dessiné par Marie", "tome15-p0161-1.webp",
     "Plan de la chambre de Gambetta, dessiné par Marie",
     "Petit plan à la plume de la chambre où Gambetta est mort : le lit, marqué « lit », et l'emplacement des meubles",
     161),
]:
    (PUB / carnet).mkdir(parents=True, exist_ok=True)
    shutil.copy(DRAW / img, PUB / carnet / img)
    p = f"_original/{carnet}/{entry}.md"
    L = rd(p)
    assert L[0] == "---" and not any(l.startswith("drawings:") for l in L)
    end = L.index("---", 1)
    L[end:end] = ["drawings:", f"  - src: /images/marie/drawings/{carnet}/{img}", f'    caption: "{caption}"',
                  f'    alt: "{alt}"', f'    source: "Mon Journal, t. 15, p. {page}"',
                  f'    paragraph: "{id_of(p, needle)}"']
    wr(p, L)

print("post-apply fixes: OK")

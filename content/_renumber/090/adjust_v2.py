"""Adjust the final plans to (a) set_french now covering # heading lines (toolsmith d08a2fb03) and
(b) the owner's 2026-09-28 policy: obvious typesetting typos of Mon Journal are corrected.

Reads final/plan-*.json, writes final2/plan-*.json and final2/typo-notes.json (old-paragraph
corrections that need an RSR note added in _original after apply).
"""
import glob
import json
import re
from pathlib import Path

P = Path(__file__).resolve().parent
SRC, DST = P / "final", P / "final2"
DST.mkdir(exist_ok=True)
ORIG = Path("/home/krr/bashkirtseff/content/_original")
CARNETS = "090 091 092 093 094 095 096 097 098 099 100".split()
TODAY = "2026-09-28"

# old cluster → (heading lines, text lines)
clusters = {}
for c in CARNETS:
    for f in sorted(glob.glob(str(ORIG / c / "*.md"))):
        cur = None
        for l in open(f).read().split("\n"):
            m = re.match(r"^%% (\d{3}\.\d{4}) %%$", l)
            if m:
                cur = m.group(1); clusters[cur] = ([], []); continue
            if cur is None or not l.strip() or l.startswith("%%") or re.match(r"^\[\^[^\]]+\]:", l):
                continue
            (clusters[cur][0] if l.startswith("# ") else clusters[cur][1]).append(l)

# Headings: old heading lines corrected (typesetting typos / Julian dates the print has) or removed.
HEADING_SET = {
    "091.0434": ("# Jeudi 14 avril 1881", "Mon Journal t.14 p.115 prints «1181»"),
    "096.0209": ("# Mercredi 6 septembre 1882", "Mon Journal t.15 prints «septembe»"),
    "094.0063": ("# Vendredi 13 janvier 1882 - 1er janvier", "Julian date as printed, tome14.docx ¶3280"),
    "094.0247": ("# Dimanche 9 avril 1882 - Pâques", "as printed, tome14.docx ¶3614"),
    "094.0125": ("# Samedi 4 février 1882", "the 3 February date line is its own empty entry, tome14.docx ¶3385"),
    "095.0255": (None, "the «Jeudi 13 juillet 1882» heading was an extraction artefact on the 12 July cross-written note"),
}

# Typesetting typos of the printed edition: (wrong, right, tome, printed page)
TYPOS = [
    ("qautre", "quatre", 14, 54), ("quanrante", "quarante", 14, 55), ("comence", "commence", 14, 62),
    ("conditons", "conditions", 14, 60), ("bougeoises", "bourgeoises", 14, 63), ("aceptées", "acceptées", 14, 64),
    ("avns", "avons", 14, 73), ("séprarée", "séparée", 14, 74), ("ains", "mains", 14, 74),
    ("embrase", "embrasse", 14, 74), ("cinquantre", "cinquante", 14, 145), ("étangère", "étrangère", 14, 194),
    ("Remaquez", "Remarquez", 14, 58), ("Ls", "Les", 14, 53), ("faie", "faire", 15, 232), ("amité", "amitié", 15, 265),
    ("réuglièrement", "régulièrement", 15, 274), ("ving-neuf", "vingt-neuf", 15, 300), ("Expostions", "Expositions", 15, 211),
]
HEAD_TYPOS = [("Dimande", "Dimanche"), ("décembe", "décembre"), ("Vendreid", "Vendredi"), ("Mercedi", "Mercredi"),
              ("1182", "1882"), ("fvrier", "février")]


def fix_typos(t):
    done = []
    for wrong, right, tome, page in TYPOS:
        pat = r"(?<![\wÀ-ÿ])" + re.escape(wrong) + r"(?![\wÀ-ÿ])"
        if re.search(pat, t):
            t = re.sub(pat, right, t)
            done.append(f"printed «{wrong}» (Mon Journal t.{tome} p.{page}) corrected to «{right}», a typesetting typo")
    return t, done


old_notes = {}
stats = {"heading_kept": 0, "typo_new": 0, "typo_old": 0, "head_fix": 0}
for c in CARNETS:
    plan = json.load(open(SRC / f"plan-{c}.json"))
    for e in plan["entries"]:
        first = e["paragraphs"][0] if e["paragraphs"] else None
        if e.get("heading"):
            h = e["heading"]
            for w, r in HEAD_TYPOS:
                h = re.sub(r"(?<![\wÀ-ÿ])" + w + r"(?![\wÀ-ÿ])", r, h)
            if h != e["heading"]:
                note = f"Heading printed «{e['heading']}»; typesetting typo corrected to «{h}»"
                if "new" in first:
                    first["new"]["rsr"] += f" {note} ({TODAY} rebuild)."
                else:
                    assert not clusters[first["old"]][0], (c, e["file"], "old first paragraph has its own heading")
                    old_notes[first["old"]] = note + f" ({TODAY} rebuild)."
                e["heading"] = h
                stats["head_fix"] += 1
        for q in e["paragraphs"]:
            if "new" in q:
                t, done = fix_typos(q["new"]["french"])
                if done:
                    q["new"]["french"] = t
                    q["new"]["rsr"] += " " + "; ".join(done) + "."
                    stats["typo_new"] += 1
                continue
            oid = q["old"]
            heads, texts = clusters[oid]
            notes = []
            if oid in HEADING_SET:
                newh, why = HEADING_SET[oid]
                body = q.get("set_french", "\n".join(texts))
                body = "\n".join(l for l in body.split("\n") if not l.startswith("# "))
                q["set_french"] = (newh + "\n" + body).strip() if newh else body
                notes.append(f"heading {'set to «' + newh[2:] + '»' if newh else 'removed'}: {why}")
            elif "set_french" in q and heads and not any(l.startswith("# ") for l in q["set_french"].split("\n")):
                q["set_french"] = "\n".join(heads) + "\n" + q["set_french"]
                stats["heading_kept"] += 1
            if "set_french" in q:
                t, done = fix_typos(q["set_french"])
                if done:
                    q["set_french"] = t
                    notes += done
                    stats["typo_old"] += 1
            if notes:
                old_notes[oid] = (old_notes.get(oid, "") + " " + "; ".join(notes) + f" ({TODAY} rebuild).").strip()
    json.dump(plan, open(DST / f"plan-{c}.json", "w"), ensure_ascii=False, indent=1)
json.dump(old_notes, open(DST / "old-notes.json", "w"), ensure_ascii=False, indent=1)
print(stats, len(old_notes), "old-paragraph notes")

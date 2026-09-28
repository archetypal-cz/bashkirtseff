"""Turn the tome06 drafts (draft06/plan-053..059.json) into the final plans (final/plan-CCC.json).

Every correction is scripted here so a re-draft can be re-fixed. Decisions: final/REVIEW-07.md.
"""
import json, re, os, sys

W = os.path.dirname(os.path.abspath(__file__))
C = ["045", "046", "047", "048", "049", "050", "051", "052"]
DOCX = json.load(open(f"{W}/t06.json"))
PM = json.load(open(f"{W}/pm6.json"))
plans = {c: json.load(open(f"{W}/draft06/plan-{c}.json")) for c in C}
LOG = []
WITHDRAWN = "title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)"


def log(*a):
    LOG.append(" ".join(str(x) for x in a))


def page(i):
    for r in PM:
        s, e = r.get("docx_para_start"), r.get("docx_para_end")
        if s is not None and s <= i <= e:
            return r.get("printed_page") or r["pdf_page"]
    raise SystemExit(f"no page for ¶{i}")


def NEW(i, french=None, kind=None, source=None, j=None, note=""):
    fr = french if french is not None else DOCX[i]["text"].strip()
    rng = f"¶{i}" + (f"–{j}" if j else "")
    n = {"french": fr,
         "rsr": f"Restored from tome06.docx {rng}, Mon Journal t.6 p.{page(i)} (missing from original extraction, 2026-09-28 rebuild).{(' ' + note) if note else ''}"}
    if kind:
        n["kind"] = kind
    if source:
        n["source"] = source
    return {"new": n}


def docx_of(q):
    m = re.search(r"¶(\d+)", q["new"]["rsr"]) if "new" in q else None
    return int(m.group(1)) if m else None


def is_new(i):
    f = lambda q: "new" in q and docx_of(q) == i
    f.desc = f"new ¶{i}"
    return f


def is_old(pid):
    f = lambda q: q.get("old") == pid
    f.desc = f"old {pid}"
    return f


def locate(pred):
    hits = [(c, ei, pi) for c in C for ei, e in enumerate(plans[c]["entries"])
            for pi, q in enumerate(e["paragraphs"]) if pred(q)]
    if len(hits) != 1:
        raise SystemExit(f"locate: {len(hits)} hits for {getattr(pred, 'desc', pred)}")
    return hits[0]


def get(pred):
    c, ei, pi = locate(pred)
    return plans[c]["entries"][ei]["paragraphs"][pi]


def remove(pred, why):
    c, ei, pi = locate(pred)
    q = plans[c]["entries"][ei]["paragraphs"].pop(pi)
    log(f"- {c} removed {q.get('old') or '¶%s' % docx_of(q)}: {why}")
    return q


def replace(pred, newq, why):
    c, ei, pi = locate(pred)
    old = plans[c]["entries"][ei]["paragraphs"][pi]
    plans[c]["entries"][ei]["paragraphs"][pi] = newq
    log(f"- {c} {old.get('old') or '¶%s' % docx_of(old)} → {newq.get('old') or '¶%s' % docx_of(newq)}: {why}")


def insert_after(pred, newq, why=""):
    c, ei, pi = locate(pred)
    plans[c]["entries"][ei]["paragraphs"].insert(pi + 1, newq)
    if why:
        log(f"- {c} inserted {newq.get('old') or '¶%s' % docx_of(newq)}: {why}")


def insert_before(pred, newq, why=""):
    c, ei, pi = locate(pred)
    plans[c]["entries"][ei]["paragraphs"].insert(pi, newq)
    if why:
        log(f"- {c} inserted {newq.get('old') or '¶%s' % docx_of(newq)}: {why}")


def drop(c, pid, reason):
    try:
        remove(is_old(pid), "dropped")
    except SystemExit:
        pass
    plans[c].setdefault("drop", []).append({"id": pid, "reason": reason})


def entry(c, fname, nth=0):
    es = [e for e in plans[c]["entries"] if e["file"] == fname]
    return es[nth]


def keep(pid):
    """Letter already marked in HEAD by 1660b922e (kind-marker): leave the existing marker."""
    q = get(is_old(pid))
    for k in ("kind", "source", "_kind_guess_reason"):
        q.pop(k, None)


def setkind(pid, kind, source=None):
    q = get(is_old(pid))
    for k in ("kind", "source", "_kind_guess_reason"):
        q.pop(k, None)
    if kind:
        q["kind"] = kind
        if source:
            q["source"] = source


# ---------------------------------------------------------------- covers


def olds(c, a, b):
    return [{"old": f"{c}.{n:04d}"} for n in range(a, b + 1)]


def take(pid):
    """Remove an old paragraph wherever the draft put it, keeping its kind/set_french keys."""
    return remove(is_old(pid), "re-placed")


def set_entry(c, fname, paras, why, **fields):
    """Replace the paragraph list of an entry; the old paragraphs are pulled from wherever the draft had them."""
    newlist = []
    for q in paras:
        if "old" in q and len(q) == 1:
            try:
                got = remove(is_old(q["old"]), "re-placed")
            except SystemExit:
                got = q
            got.pop("_kind_guess_reason", None)
            newlist.append(got)
        else:
            newlist.append(q)
    es = [e for e in plans[c]["entries"] if e["file"] == fname]
    if es:
        es[0]["paragraphs"] = newlist
        es[0].update(fields)
    else:
        e = {"file": fname, "date": fname[:10], **fields, "paragraphs": newlist}
        plans[c]["entries"].append(e)
    log(f"- {c} {fname}: paragraph list set explicitly ({why})")


def fix_new(i, **kw):
    q = get(is_new(i))
    for k, v in kw.items():
        if v is None:
            q["new"].pop(k, None)
        else:
            q["new"][k] = v
    q["new"].pop("_kind_guess_reason", None)
    log(f"- ¶{i}: " + ", ".join(f"{k}={v!r}"[:80] for k, v in kw.items()))


def EMPTY(i, date_line):
    return {"new": {"french": "[Aucun texte - date seule mentionnée]",
                    "rsr": f"tome06.docx ¶{i} (Mon Journal t.6 p.{page(i)}): the date line «{date_line}» is followed directly by the next date line; empty-day note as in 068 (2026-09-28 rebuild)."}}


def sort_entries():
    for c in C:
        plans[c]["entries"].sort(key=lambda e: (e["date"], 0 if e["file"].endswith("-cover.md") else 1, e["file"][:-3]))


EDITORIAL = "editorial"
FABRICATED = ("text not in the printed integral edition (Mon Journal t.6 p.{p}, tome06.docx ¶{a}–{b} has other text here); "
              "provenance unknown, present since the first import; replaced by the printed text")

# ---------------------------------------------------------------- covers (withdrawn)
for c in C:
    p = plans[c]
    for e in [e for e in p["entries"] if e["file"].endswith("-cover.md")]:
        log(f"- {c} cover entry {e['file']} withdrawn")
        p["entries"].remove(e)
for i in (563, 567, 1036, 1543, 2231, 2232, 2780, 4818, 4822):
    remove(is_new(i), WITHDRAWN)
for n in range(2, 9):
    drop("050", f"050.{n:04d}", WITHDRAWN + "; Livre 50 title page, tome06.docx ¶2779–2785")
for n in (3, 4):
    pass

# ---------------------------------------------------------------- 045
fix_new(252, kind=EDITORIAL)
for i, why in ((302, "duplicate of 045.0163 (3rd line)"), (303, "duplicate of 045.0164"), (389, "OCR line-break fragment of 045.0246")):
    remove(is_new(i), why)
fix_new(550, kind=EDITORIAL)
remove(is_new(551), "re-set as verse from the printed page")
remove(is_new(558), "re-set as verse from the printed page")
insert_after(is_new(550), NEW(551, "Viens au théâtre Français à l’instant\nJe te cacherai dans le petit salon rose,\nViens sur ton front à l’instant que je pose\n"
                                   "Les cornes que l’Anglais me laissa en partant\nEcoute ma bête\nPour toi jour de fête\nEt chante ce jour\nLe retour de l’amour\nBis", j=555),
             "draft song, stanza 1, verse lines as printed p.35")
insert_after(is_new(551), NEW(556, "Ne te montre pas, tu auras des dragées\nRegarde en cachette les filles par moi délogées\nDe ton cœur indigne et vilain se liguât\n"
                                   "Surtout celle qui a en écharpe la main.\nEcoute ma bête etc.", j=558),
             "draft song, stanza 2")

# ---------------------------------------------------------------- 046
remove(is_new(940), "duplicate of 046.0249")
for pid in ("046.0023", "046.0065"):
    setkind(pid, None)
set_entry("046", "1875-10-06.md", olds("046", 100, 143),
          "the Cassandre poem is complete in _original; the draft confused it with the enlarged copy of 2 Dec (050)")
set_entry("046", "1875-10-10.md", olds("046", 239, 266), "046.0249 stays here (the draft moved it to 050 on a shared verse)")

# ---------------------------------------------------------------- 047
for pid in ("047.0012", "047.0349"):
    setkind(pid, None)

# ---------------------------------------------------------------- 048
drop("048", "048.0020", FABRICATED.format(p=page(1576), a=1576, b=1598))
drop("048", "048.0021", FABRICATED.format(p=page(1576), a=1576, b=1598))
remove(is_new(1598), "is 048.0022 (set_french)")
get(is_old("048.0022"))["set_french"] = (DOCX[1598]["text"].strip() + " " + DOCX[1599]["text"].strip())
fix_new(1583, french=DOCX[1583]["text"].strip().replace("! ..", "!.."))
for pid in ("048.0033", "048.0134", "048.0214"):
    setkind(pid, None)
setkind("048.0116", "margin")
setkind("048.0734", EDITORIAL)
# 31 Oct: the docx date line reads «Dimanche 21 octobre 1875» (¶1830); 048.0247 is its heading in _original
plans["048"]["entries"] = [e for e in plans["048"]["entries"] if e["file"] != "1875-10-21.md"]
set_entry("048", "1875-10-30.md", olds("048", 216, 246), "30 Oct")
set_entry("048", "1875-10-31.md", olds("048", 247, 347), "31 Oct; date line printed «Dimanche 21 octobre 1875»")
remove(is_new(1993), "part of 048.0404 (set_french)")
remove(is_new(1994), "part of 048.0404 (set_french)")
get(is_old("048.0404"))["set_french"] = "[Quatre lignes cancellées: Voyons, quoi ? lui dis-je.\nVous savez bie, ce que je vous dema\nJe sais bien ce ]"
news_1104 = [get(is_new(i)) for i in range(2115, 2122)]
for i in range(2115, 2122):
    remove(is_new(i), "re-placed")
set_entry("048", "1875-11-04.md", olds("048", 482, 519) + news_1104, "old order kept (the draft moved 048.0499 on a short match)")
fix_new(2121, kind=EDITORIAL)
set_entry("048", "1875-11-06.md", olds("048", 593, 624), "6 Nov, first part (Livre 48 ends here)")
plans["048"]["entries"] = [e for e in plans["048"]["entries"] if e["file"] != "1875-11-07.md"]

# ---------------------------------------------------------------- 049
remove(is_new(2235), "is 048.0625")
remove(is_new(2255), "is 048.0644")
p625 = {"old": "048.0625", "set_french": "# Samedi, 6 novembre 1875 (suite)"}
p644 = {"old": "048.0644", "set_french": "# Samedi, 7 novembre 1875"}
set_entry("049", "1875-11-06.md", [p625] + olds("048", 626, 643),
          "Livre 49 opens with «Samedi 6 novembre 1875 (suite)», tome06.docx ¶2235", frontmatter_from="1875-11-08.md")
for q in plans["049"]["entries"][0]["paragraphs"]:
    pass
set_entry("049", "1875-11-07.md", [p644] + olds("048", 645, 775),
          "«Samedi 7 novembe 1875», tome06.docx ¶2255 (heading-date sweep of 2026-09-26 had made it «6 novembre (suite)»)")
for pid, k in (("048.0626", "margin"), ("048.0632", "margin"), ("048.0723", "rayé"), ("048.0734", EDITORIAL)):
    setkind(pid, k)
drop("049", "049.0097", "stray «(suite)» heading at the manuscript date line «Jeudi 11 novembre 1875» (tome06.docx ¶2489); that heading is 049.0070, re-placed here")
drop("049", "049.0213", "stray «(suite)» heading at the manuscript date line «Samedi 13 novembre 1875» (tome06.docx ¶2610); that heading is 049.0194, re-placed here")
for pid in ("049.0176", "049.0245"):
    setkind(pid, None)
setkind("049.0358", "margin")

# ---------------------------------------------------------------- 050
e = entry("050", "1875-11-18.md")
set_entry("050", "1875-11-18.md", [{"old": "050.0001"}, {"old": "050.0009", "kind": "margin"}] + olds("050", 10, 21),
          "title-page lines 0002–0008 withdrawn; Marie's margin note 0009 on the title page kept")
drop("050", "050.0098", "false placeholder «[Pas d'entrée pour cette date]»: the manuscript has text for 21 Nov (tome06.docx ¶2879–2907, restored)")
for i in (2895, 2896, 2897):
    remove(is_new(i), "merged into one verse paragraph")
q249 = take("046.0249")
insert_before(is_old("050.0098") if False else is_new(2899),
              NEW(2895, "Connais-tu le pays où fleurit l'oranger.\nLe pays des fruits d’or et des roses vermeilles,\nOù la brise est plus douce et l’oiseau plus léger\n"
                        "Où dans toutes saisons butinent les abeilles\nOù rayonne et sourit comme un bienfait de Dieu\nUn éternel printemps sous un ciel toujours bleu.\n"
                        "Hélas que je puis-je te suivre\nVers ce pays lointain d’où le sort m’exila\nC’est là que je voudrais vivre,\nAimer, aimer et mourir !", j=2898),
              "Mignon's song (Thomas), verse lines as printed")
insert_after(is_old("046.0248"), q249, "046.0249 back to 046")
fix_new(2891, french=DOCX[2891]["text"].strip().replace("ma fille I]", "ma fille !]"))
set_entry("050", "1875-12-02.md", olds("050", 360, 408),
          "the enlarged Cassandre poem is complete in _original (accent-stripped); the draft confused it with 046's copy")
get(is_old("050.0383"))["set_french"] = "23 Son ouvrage admirera\nDans sa loge se pavanera\n[Rayé: Au deuxième acte se couchera]\nSur son siege s'endormira\nEt pourrira et pourrira."
remove(is_new(3501), "duplicate of 050.0605")
fix_new(3548, kind=EDITORIAL)
fix_new(3657, kind=None)
remove(is_new(3797), "fragment of 050.0758 (page-break hyphenation)")
remove(is_new(3945), "is 050.0801")
q801 = take("050.0801")
insert_after(is_new(3944), q801, "050.0801 after ¶3944, as in the docx")
remove(is_new(4095), "is 050.0937")
remove(is_new(4118), "is 050.0959")
for i in (4253, 4254, 4260, 4261, 4262, 4268, 4269, 4270, 4271):
    try:
        remove(is_new(i), "flyleaf / facsimile / Livre 52 flyleaf note: see REVIEW")
    except SystemExit:
        pass
for pid in ("050.0003", "050.0004"):
    try:
        take(pid)
    except SystemExit:
        pass
setkind("050.0152", EDITORIAL)
setkind("050.0995", None)

# ---------------------------------------------------------------- 051
remove(is_new(4292), "is 051.0016")
remove(is_new(4318), "is 051.0038")
q238 = take("051.0238")
insert_after(is_new(4445), NEW(4446, "Je pars dimanche à trois heures !!"), "¶4446 (the draft had matched it to 051.0238)")
insert_after(is_new(4447), NEW(4448, "Je pars dimanche à trois heures !!!!"), "¶4448 (idem)")
fix_new(4461, french=DOCX[4461]["text"].strip().replace("quei charmant", "quel charmant"))
fix_new(4482, french=DOCX[4482]["text"].strip().replace("endrois", "endroits"))
fix_new(4506, french=DOCX[4506]["text"].strip().replace("mal II me", "mal Il me"))
remove(is_new(4609), "smudged scan line = 051.0227")
remove(is_new(4610), "smudged scan lines = 051.0228")
remove(is_new(4621), "is 051.0238")
set_entry("051", "1876-01-02.md", [{"old": "051.0236"}, EMPTY(4619, "Dimanche 2 janvier 1876")], "empty day",
          heading="Dimanche 2 janvier 1876", redirect_from=["1876-01-02-03.md"])
insert_after(is_old("051.0237"), q238, "051.0238 back to 3 Jan")
setkind("051.0169", None)

# ---------------------------------------------------------------- 052
plans["052"]["entries"] = [e for e in plans["052"]["entries"] if e["file"] != "1875-01-11.md"]
set_entry("052", "1876-01-10.md",
          [{"old": "052.0001"},
           NEW(4269, kind=EDITORIAL, note="The printed edition sets this note and the next paragraph at the end of Livre 50 (p.268); the note itself places them on the flyleaf of Livre 52."),
           NEW(4270, kind="other", source="Écrit au verso de la page de garde du Livre 52")] + olds("052", 2, 60),
          "old order (052.0034 and 052.0041 are a sentence Marie wrote twice, ¶4859 and ¶4867); flyleaf note of Livre 52")
set_entry("052", "1876-01-11.md", olds("052", 61, 92), "date line printed «Mardi 11 janvier 1875» (¶4889); ¶4890 «+» is 052.0062",
          heading="Mardi 11 janvier 1876")

# ---------------------------------------------------------------- global OCR normalisation of new text
for c in C:
    for e in plans[c]["entries"]:
        for q in e["paragraphs"]:
            if "new" in q:
                fr = q["new"]["french"]
                new = re.sub(r"(\w)-\s+(\w)", r"\1-\2", fr).replace("mon-daine", "mondaine")
                if new != fr:
                    q["new"]["french"] = new
                    log(f"  - OCR {c} ¶{docx_of(q)}: hyphen/line-break join")

# ---------------------------------------------------------------- write
sort_entries()
os.makedirs(f"{W}/final", exist_ok=True)
for c in C:
    p = plans[c]
    p.pop("_draft", None)
    p["_fixed"] = "fix06.py 2026-09-28 (planner tome06/07); decisions in REVIEW-06.md"
    for e in p["entries"]:
        for q in e["paragraphs"]:
            q.pop("_note", None)
            if "new" in q:
                q["new"].pop("_kind_guess_reason", None)
    json.dump(p, open(f"{W}/final/plan-{c}.json", "w"), ensure_ascii=False, indent=1)
open(f"{W}/final/fix06.log", "w").write("\n".join(LOG) + "\n")
print(f"{len(LOG)} log lines; wrote final/plan-045..052.json")

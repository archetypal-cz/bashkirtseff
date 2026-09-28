"""Turn the tome07 drafts (draft07/plan-053..059.json) into the final plans (final/plan-CCC.json).

Every correction is scripted here so a re-draft can be re-fixed. Decisions: final/REVIEW-07.md.
"""
import json, re, os, sys

W = os.path.dirname(os.path.abspath(__file__))
C = ["053", "054", "055", "056", "057", "058", "059"]
DOCX = json.load(open(f"{W}/t07.json"))
PM = json.load(open(f"{W}/pm7.json"))
plans = {c: json.load(open(f"{W}/draft07/plan-{c}.json")) for c in C}
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
         "rsr": f"Restored from tome07.docx {rng}, Mon Journal t.7 p.{page(i)} (missing from original extraction, 2026-09-28 rebuild).{(' ' + note) if note else ''}"}
    if kind:
        n["kind"] = kind
    if source:
        n["source"] = source
    return {"new": n}


def docx_of(q):
    m = re.search(r"¶(\d+)", q["new"]["rsr"]) if "new" in q else None
    return int(m.group(1)) if m else None


def is_new(i):
    return lambda q: "new" in q and docx_of(q) == i


def is_old(pid):
    return lambda q: q.get("old") == pid


def locate(pred):
    hits = [(c, ei, pi) for c in C for ei, e in enumerate(plans[c]["entries"])
            for pi, q in enumerate(e["paragraphs"]) if pred(q)]
    if len(hits) != 1:
        raise SystemExit(f"locate: {len(hits)} hits for {pred}")
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
for c in C:
    p = plans[c]
    for e in [e for e in p["entries"] if e["file"].endswith("-cover.md")]:
        log(f"- {c} cover entry {e['file']} withdrawn")
        p["entries"].remove(e)

for i in (631, 1356, 3355, 3621, 3920):  # mottos, HGtDoH, title-page place lines
    remove(is_new(i), WITHDRAWN)
for pid in ("055.1175", "055.1176", "055.1177", "055.1178"):
    drop("055", pid, WITHDRAWN + "; Livre 55 closing motto and Livre 56 title page, tome07.docx ¶2659–2662")
for n in range(4, 12):
    drop("059", f"059.{n:04d}", WITHDRAWN + "; name list on the Livre 59 title page, tome07.docx ¶3925–3932")

# ---------------------------------------------------------------- 053
e = entry("053", "1876-01-24.md")
e.pop("heading", None)  # 053.0001 carries the heading; the title-page note comes first, as in the docx
q = get(is_new(46))
q["new"].pop("kind", None); q["new"].pop("source", None)
q["new"]["kind"] = "margin"
q["new"]["rsr"] += " Note in small type on the Livre 53 title page (Marie's later annotation)."
keep("053.0003")
for n in (4, 5, 6):
    keep(f"053.{n:04d}")
get(is_old("053.0004"))["set_french"] = "> [Mots cancellés: à M. Léon d'Audiffret.]"
for n in (75, 76, 77):
    keep(f"053.{n:04d}")
for n in (296, 297):
    keep(f"053.{n:04d}")
for n in (367, 368):
    keep(f"053.{n:04d}")
# 053.0235 = heading + a whole-paragraph marginal note: split
get(is_old("053.0235")).pop("kind", None)
get(is_old("053.0235")).pop("_kind_guess_reason", None)
get(is_old("053.0235"))["set_french"] = "# Lundi 31 janvier 1876"
insert_after(is_old("053.0235"), NEW(339, "[En travers: Je fais trois quarts d'heure de peinture deux fois par semaine]", kind="margin",
             note="Split off 053.0235, which held the date heading and this marginal note in one cluster."),
             "marginal note split off the heading cluster 053.0235")

# ---------------------------------------------------------------- 054
e = entry("054", "1876-02-12.md")
e.pop("heading", None)
q = get(is_new(635)); q["new"]["rsr"] += " Note on the Livre 54 title page."
# 13 Feb: the draft matched 054.0059 to the struck draft ¶694 and re-created ¶695/696
remove(is_new(695), "duplicate of 054.0053")
remove(is_new(696), "duplicate of 054.0054")
q59 = remove(is_old("054.0059"), "misplaced (matched to the struck draft)")
insert_after(is_old("054.0058"), q59, "054.0059 back after 054.0058 (letter signature, docx ¶701)")
q = get(is_new(692)); q["new"]["kind"] = "editorial"; q["new"].pop("_kind_guess_reason", None)
q = get(is_new(693))
q["new"]["french"] = "[Rayé: Monseigneur, pensez aux malheureux que vous allez faire ! Songez à la faillite de M. Krom !\nLes cireurs de bottes de la ville de Nice]"
q["new"]["kind"] = "rayé"
q["new"]["rsr"] = q["new"]["rsr"].replace("¶693,", "¶693–694,")
q = get(is_new(820)); q["new"]["kind"] = "editorial"
# 054.0501 belongs to 26 Feb (¶1163), not to 057 (¶3476 is a different short line)
q501 = remove(is_old("054.0501"), "wrongly moved to 057 on the short line «Ça ne vaut pas la peine»")
replace(is_new(1163), q501, "054.0501 is docx ¶1163")
insert_before(is_new(3477), NEW(3476), "¶3476 (057, 10 Apr)")
insert_after(is_new(3477), NEW(3478), "¶3478 (057, 10 Apr), left out by the draft")
LET = {
    (8, 11): "Lettre-farce de Marie à Audiffret, signée Les frères moineaux de Cimiez, 12 février 1876",
    (13, 15): "Lettre-farce de Marie à Audiffret, signée Votre oncle affectionné Audiffret, 12 février 1876",
    (48, 51): "Lettre-farce de Marie à Audiffret, signée Henri Fichu, 13 février 1876",
    (54, 59): "Lettre-farce de Marie à Audiffret, signée Les cireurs de bottes de la ville de Nice, 13 février 1876",
    (61, 66): "Lettre-farce de Marie à Saëtone, signée Les cireurs, 13 février 1876",
    (110, 115): "Lettre-farce en niçois, signée Le padri de Cimiès, 15 février 1876",
    (176, 179): "Lettre de Marie à Nice (copie), 16 février 1876",
    (196, 201): "Lettre-farce de Marie à Audiffret, signée Les frères moines de Cimiez, 17 février 1876",
    (356, 357): "Lettre de Marie à Nice (copie), 21 février 1876",
}
for (a, b), src in LET.items():
    for n in range(a, b + 1):
        keep(f"054.{n:04d}")
for pid in ("054.0231", "054.0265", "054.0287", "054.0481", "054.0560"):
    setkind(pid, None)

# ---------------------------------------------------------------- 055
q681 = remove(is_old("055.0681"), "moved to 1 Mar by a repeat on the title page (¶1361)")
replace(is_new(2082), q681, "055.0681 is docx ¶2082 (14 Mar)")
replace(is_new(1837), NEW(1837, "[Rayé: Jeudi 9 mars 1876]", kind="rayé",
        note="OCR «inayc. jcuui *v* mars IO4OJ»; read from the printed page (top line, partly cut in the scan)."),
        "OCR garbage → struck date line as printed")
for pid in ("055.0085", "055.0517", "055.0727", "055.0967"):
    setkind(pid, None)
for n in (158, 159, 160):
    keep(f"055.{n:04d}")
# 055.1170 + 1171 together are docx ¶2654: no completion; the letter is re-set as printed (bold was extraction markup)
q = get(is_old("055.1170")); q.pop("set_french", None)
LETTER_1876 = {
    "055.1166": "> Rome, Hôtel de la Ville, 10 mars.[^4]",
    "055.1167": "> Cher père.",
    "055.1168": "> Vous avez toujours été prévenu contre moi sans que j'eusse jamais rien fait pour justifier cette prévention. Je n'en ai pourtant perdu ni l'estime ni l'amour que doit à son père chaque fille bien née.",
    "055.1169": "> Je me crois obligée de vous consulter dans toutes les occasions graves et je suis persuadée que vous y prendrez l'intérêt que de pareilles matières comportent.",
    "055.1171": "> mais hier encore j'ai reçu la demande de M. le comte A., neveu du cardinal A...[^6]",
    "055.1172": "> Je me crois trop jeune pour le mariage, mais dans tous les cas je viens vous demander votre avis et j'espère que vous me le donnerez. Ces deux messieurs sont jeunes, riches, et ont tout ce qu'il faut pour plaire. Ils me sont indifférents.",
    "055.1173": "> En espérant une réponse à ma lettre, je me dis avec le plus profond respect et la plus grande estime.",
    "055.1174": "> Votre fille dévouée et obéissante.",
}
for pid, fr in LETTER_1876.items():
    get(is_old(pid))["set_french"] = fr
for n in range(1166, 1175):
    keep(f"055.{n:04d}")
# 1853–1854 etc.: two paragraphs joined by the draft because of the OCR «I» for «!»
SPLITS = {1853: 1854, 2350: 2351, 2360: 2361, 3696: 3697, 4151: 4152, 4511: 4512}

# ---------------------------------------------------------------- 056
e = entry("056", "1876-03-27.md")
e["heading"] = "Lundi 27 mars 1876 (suite)"
remove(is_new(2664), "date-line remainder «(suite)»; now the entry heading")
setkind("055.1179", "margin")
get(is_old("055.1179"))["_note"] = "note on the Livre 56 title page"
# the entry heading must not land inside the margin paragraph: the date line's first text paragraph goes first
q1179 = remove(is_old("055.1179"), "after 055.1180 so that the heading opens a text paragraph")
insert_after(is_old("055.1180"), q1179)
for i in (3051, 3073, 3183):
    remove(is_new(i), "page-break fragment of an old paragraph (056.0337 / 056.0358 / 056.0437)")
remove(is_new(3319), "OCR noise on an empty page")
q = get(is_new(3161)); q["new"].pop("kind", None); q["new"].pop("source", None)
for pid in ("056.0022", "056.0085"):
    setkind(pid, None)
for n in range(41, 45):
    keep(f"056.{n:04d}")
for n in range(411, 420):
    keep(f"056.{n:04d}")
drop("056", "056.0567", "Markdown heading underline from the raw conversion (docx ¶3413 is a Heading #2 line); not in the print")
setkind("056.0568", "margin")

# ---------------------------------------------------------------- 057
e = entry("057", "1876-04-09.md")
e["heading"] = "Dimanche 9 avril 1876 - suite"
remove(is_new(3357), "date-line remainder «- suite»; now the entry heading")
get(is_old("057.0132"))["set_french"] = "Non, non, ce n'est pas des tempêtes que je suis lasse, c'est des déceptions. Et qui ne le serait pas ? !"
# 057.0133 «[Suite]» stood for the date line «Jeudi 13 avril 1876 - suite» after the Livre 58 title page
q133 = remove(is_old("057.0133"), "moves to 058 as the date heading")
q133.pop("kind", None); q133.pop("_kind_guess_reason", None)
q133["set_french"] = "# Jeudi 13 avril 1876 - suite"

# ---------------------------------------------------------------- 058
e = entry("058", "1876-04-13.md")
e.pop("heading", None)
remove(is_new(3628), "date-line remainder «- suite»; 057.0133 now carries the heading")
for i in (3626, 3627):
    q = get(is_new(i)); q["new"].pop("source", None); q["new"]["kind"] = "margin"
    q["new"]["rsr"] += " Note in small type on the Livre 58 title page."
insert_after(is_new(3627), q133, "057.0133 as the 13 Apr (suite) heading")
remove(is_new(3705), "date-line remainder «- Pâques»; heading of 058.0053 completed")
get(is_old("058.0053"))["set_french"] = "# Dimanche 16 avril 1876 - Pâques"
q = get(is_new(3905)); q["new"]["french"] = "[En travers: Oh ! que c'est bête.]"; q["new"]["kind"] = "margin"

# ---------------------------------------------------------------- 059
e = entry("059", "1876-04-20.md")
e.pop("heading", None)
ps = e["paragraphs"]
# docx order: title-page note (0002–0003), date line (0001), text (0012 …)
for pid in ("059.0002", "059.0003"):
    setkind(pid, "margin")
q1 = remove(is_old("059.0001"), "reordered")
insert_after(is_old("059.0003"), q1)
q50 = remove(is_old("059.0050"), "matched to ¶3981 on «Il est si beau et si …»")
insert_before(is_new(3982), NEW(3981), "¶3981 (20 Apr)")
insert_after(is_old("059.0049"), q50, "059.0050 is docx ¶4012 (21 Apr)")
q104 = remove(is_old("059.0104"), "matched to ¶4153 (23 Apr)")
insert_after(is_new(4152) if False else is_new(4151), NEW(4153), "¶4153 (23 Apr)")
replace(is_new(4266), q104, "059.0104 is docx ¶4266 (25 Apr)")
q387 = remove(is_old("059.0387"), "matched to ¶4486 (27 Apr)")
insert_before(is_new(4487), NEW(4486), "¶4486 (27 Apr)")
replace(is_new(4725), q387, "059.0387 is docx ¶4725 (4 May)")
for i in (4665, 4826):
    remove(is_new(i), "page-break fragment of 059.0341 / 059.0480")
remove(is_new(4562), "page-top OCR noise; text is in 059.0250")
drop("059", "059.0097", "placeholder note inserted by c06a46bf7 for the image Tome7-15 (Marie's drawing of the hearts); the drawing is now linked in frontmatter")
q = get(lambda q: "new" in q and re.search(r"¶4256–4258", q["new"]["rsr"] or ""))
c_, ei_, pi_ = locate(lambda q: "new" in q and re.search(r"¶4256–4258", q["new"]["rsr"]))
plans[c_]["entries"][ei_]["paragraphs"][pi_:pi_ + 1] = [
    NEW(4256), NEW(4258, note="The sentence begins on no printed line: p.303 ends «…briser là ?», p.304 starts «dégourdit, …» under the drawing; kept verbatim.")]
log("- 059 ¶4256–4258 split: ¶4256 / ¶4258 (the fragment after the drawing)")
for i in (3999, 4355):
    q = get(is_new(i)); q["new"]["kind"] = "margin"
for pid in ("059.0191",):
    setkind(pid, "margin")
for i in (4090, 4466):
    q = get(is_new(i)); q["new"].pop("kind", None); q["new"].pop("source", None)
setkind("059.0368", None)
for n in range(331, 341):
    setkind(f"059.{n:04d}", "other", "Règlements de la société A.T.E., rédigés par Marie")
for n in range(342, 347):
    setkind(f"059.{n:04d}", "other", "Brevet de nomination de Plowden, société A.T.E., 1er mai 1876")

# ---------------------------------------------------------------- joined paragraphs → split
for a, b in SPLITS.items():
    c_, ei_, pi_ = locate(lambda q, a=a: "new" in q and docx_of(q) == a)
    old = plans[c_]["entries"][ei_]["paragraphs"][pi_]
    plans[c_]["entries"][ei_]["paragraphs"][pi_:pi_ + 1] = [NEW(a), NEW(b)]
    log(f"- {c_} ¶{a}–{b} split into two paragraphs")

# ---------------------------------------------------------------- OCR clean-up of new text
PRON = r"(moi|toi|vous|nous|je|tu|il|elle|ils|elles|on|là|ci|être|le|la|les|y|en|même|Joseph)"
FIX = [
    (r"[ \t]*[•■][ \t]*", " "), (r"\t।", ""), (r"\t", " "),
    (r"\bAh I\b", "Ah !"), (r"(?<=[a-zà-üA-Z,.]) I(?=$|\n|\]|\)| [A-ZÀ-ÜÉ])", " !"),
    (r"malheureuse ! II y", "malheureuse ! Il y"), (r"(?<=[a-zà-ü]) II(?= [A-ZÀ-Ü])", " !!"),
    (r"(?<=[a-z]) 1$", " !"), (r"(?<=\w)- " + PRON + r"\b", r"-\1"),
    (r"honnê- teté", "honnêteté"), (r"Walit- sky", "Walitsky"), (r"\(En travers:", "[En travers:"),
    (r"  +", " "),
]
for c in C:
    for e in plans[c]["entries"]:
        for q in e["paragraphs"]:
            if "new" not in q:
                continue
            fr = q["new"]["french"]
            new = fr
            for a, b in FIX:
                new = re.sub(a, b, new, flags=re.M)
            new = "\n".join(l.strip() for l in new.split("\n"))
            if new != fr:
                q["new"]["french"] = new
                log(f"  - OCR {c} ¶{docx_of(q)}: «{fr[:90]}» → «{new[:90]}»".replace("\n", " / "))

# ---------------------------------------------------------------- write
os.makedirs(f"{W}/final", exist_ok=True)
for c in C:
    p = plans[c]
    p.pop("_draft", None)
    p["_fixed"] = "fix07.py 2026-09-28 (planner tome06/07); decisions in REVIEW-07.md"
    for e in p["entries"]:
        for q in e["paragraphs"]:
            q.pop("_note", None)
            if "new" in q:
                q["new"].pop("_kind_guess_reason", None)
    json.dump(p, open(f"{W}/final/plan-{c}.json", "w"), ensure_ascii=False, indent=1)
open(f"{W}/final/fix07.log", "w").write("\n".join(LOG) + "\n")
print(f"{len(LOG)} log lines; wrote final/plan-053..059.json")

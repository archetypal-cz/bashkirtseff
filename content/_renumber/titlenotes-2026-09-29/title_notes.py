"""identity -> final: re-add Marie's own title-page / flyleaf notes that the 2026-09-28 rebuilds of the landed
tomes withdrew with the cover pages (owner policy, handoff 2026-09-28: Marie's own notes on title pages go in as
margin/other at the carnet's first entry; cf. plan-tome0102/title_notes.py). Findings: titlenotes-audit.md; lead's
selection 2026-09-29. Placement: right after the heading paragraph when it is heading-only; before the first paragraph
when the heading shares its paragraph with diary text (as 053.0001, 054.0001, 058.0001-0002 already are), so the
note never splits the narrative. Formal title lines and the mottos stay withdrawn."""
import json
from pathlib import Path
H = Path(__file__).resolve().parent
I, F = H / 'identity', H / 'final'
F.mkdir(exist_ok=True)
POL = "Restored in the 2026-09-29 title-notes pass (owner policy: Marie's own title-page notes go in; formal title lines stay withdrawn)."

def load(c): return json.load(open(I / f'plan-{c}.json'))
def save(c, p):
    p['source'] = p.get('source') or 'title-page notes (titlenotes-audit.md)'
    json.dump(p, open(F / f'plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
def entry(p, file): return next(e for e in p['entries'] if e['file'] == file)
def after(p, file, old, *paras):
    e = entry(p, file); k = next(i for i, x in enumerate(e['paragraphs']) if x.get('old') == old)
    e['paragraphs'][k + 1:k + 1] = [{'new': x} for x in paras]
def first(p, file, *paras):
    e = entry(p, file); e['paragraphs'][0:0] = [{'new': x} for x in paras]
def para(kind, source, french, rsr, tags=None):
    d = {'kind': kind, 'french': french, 'rsr': rsr + ' ' + POL}
    if source: d['source'] = source
    if tags: d['tags'] = tags
    return d

# 015 - Livre 15, crosswise milestone (tome03 ¶41, small type)
p = load('015')
after(p, '1874-01-02.md', '015.0001', para('margin', 'note de Marie en travers de la page de titre du Livre 15',
    "[En travers: J'ai déjà écrit deux mille sept cents pages !!!!]",
    "Marie's note written across the title page of Livre 15; tome03.docx ¶41, Mon Journal t.3 p.5 (small type = Marie's annotation, per the edition's convention). The docx OCR reads «II!!» for «!!!!» (reading of the 015 rebuild review). A milestone: the page count of her diary so far, at the start of 1874."))
save('015', p)

# 048 - Livre 48, fragmentary maxim (tome06 ¶1548-1554; scan p.101 checked: left-aligned small block under the title)
p = load('048')
after(p, '1875-10-24.md', '048.0001',
    para('editorial', None, "[Coin de page manquant ?]",
         "Editors' note in the printed edition above the maxim on the Livre 48 title page; tome06.docx ¶1548, Mon Journal t.6 p.101."),
    para('other', 'maxime sur la page de titre du Livre 48', "Sais tout,\nfais tout,\n[?] décide tout\n[?] tout\n[?] tout...\n[?] te",
         "Maxim or resolution Marie wrote on the title page of Livre 48, set apart from the title lines (scan Tome6.pdf p.101 checked: «[?] décide tout»; the docx OCR has «[7]»). tome06.docx ¶1549–1554, Mon Journal t.6 p.101. The page corner is missing, so the line starts are lost; the «[?]» are the editors'. Keep the gaps; do not complete the maxim."))
save('048', p)

# 050 - Livre 50 memo «T.P.L. / Alex. Dumas» (tome06 ¶2784-2785)
p = load('050')
after(p, '1875-11-18.md', '050.0002', para('other', 'mémo sur la page de titre du Livre 50', "T.P.L.\nAlex. Dumas",
    "Memo on the title page of Livre 50, below the title lines; tome06.docx ¶2784–2785, Mon Journal t.6 p.«Livre 50» title page. It points to Marie's anonymous letter to Alexandre Dumas fils of 22 November 1875, signed with the initials T.P.L. (050.0129, kind letter).",
    ['[#Alexandre_Dumas_fils](../_glossary/people/mentioned/ALEXANDRE_DUMAS_FILS.md)']))
save('050', p)

# 059 - Livre 59 name list (tome07 ¶3925-3932; was old 059.0004-0011 before the 2026-09-28 rebuild)
p = load('059')
after(p, '1876-04-20.md', '059.0003', para('other', 'liste de noms sur la page de titre du Livre 59',
    "Belmonte\nPandola\nOdescalchi\nPizzardi\nZucchini\nCesaro\nAntonelli\nAngelini",
    "List of names Marie wrote on the title page of Livre 59, below the title lines; tome07.docx ¶3925–3932, Mon Journal t.7 p.279. Her Roman and Neapolitan acquaintances and admirers of the spring of 1876 (Antonelli, Pizzardi, Odescalchi, Zucchini, Cesaro, Belmonte…). Was old 059.0004–0011 (one line each) before the 2026-09-28 rebuild; now one paragraph."))
save('059', p)

# 067 - Livre 67 maxims (tome09 ¶1690-1695; scan p.119 read «fauno», «Francsi»)
p = load('067')
first(p, '1876-10-12.md', para('other', 'maximes sur la page de titre du Livre 67',
    "Ment sana in corpore sano\nTutto fano nulla sauna\nTutto saumo, nulla fauno\nGara voit sa Francsi\nPiu gli pesi mon fi danus (Alfieri)\nMont sana in corpore sano",
    "Maxims Marie copied on the title page of Livre 67, set apart below the title lines; tome09.docx ¶1690–1695, Mon Journal t.9 p.119 (scan read «fauno», «Francsi»; the OCR has «fatino», «Francai»). Kept verbatim as printed, garbled as it is. Readings: Juvenal, Satires X.356 «Mens sana in corpore sano» (twice), and Alfieri's epigram on the French (Misogallo): «Tutto fanno, nulla sanno; / Tutto sanno, nulla fanno; / Gira volta, son Francesi: / Più li pesi, men ti danno». Placed before the heading, as a title-page item preceding the first date line.",
    ['[#Latin](../_glossary/culture/languages/LATIN.md)', '[#Italian](../_glossary/culture/languages/ITALIAN.md)']))
save('067', p)

# 068 - Livre 68 crosswise date (tome09 ¶3388; was old 068.0002 of the withdrawn cover entry)
p = load('068')
after(p, '1876-12-12.md', '068.0001', para('margin', 'note de Marie en travers de la page de titre du Livre 68', "[En travers: 23 mai 1875]",
    "Written across the title page of Livre 68; tome09.docx ¶3388 (small type, Body text (7)), Mon Journal t.9 p.225. The docx OCR reads «23 mail 875»; the print reads «23 mai1875» (spacing restored). A date eighteen months before the notebook opens; its purpose is unknown and nothing in the surrounding diary explains it (the first meeting with Audiffret recorded in the glossary is 28 May 1875). Translate the date only; do not interpret it. Was old 068.0002 in the cover entry withdrawn on 2026-09-28 (text and notes in _renumber/068/REVIEW.md)."))
save('068', p)

# 071 - Livre 71: Horace tag under the place lines, two Latin sayings set apart (tome10 ¶2363-2366; scan p.143)
p = load('071')
first(p, '1877-04-26.md',
    para('margin', 'note de Marie sur la page de titre du Livre 71', "desinit in piscen. Hir.",
         "Marie's note under the place lines of the Livre 71 title page; tome10.docx ¶2363 (2nd line), Mon Journal t.10 p.143 (scan checked). Printed so and kept: Horace, Ars poetica 4 «desinit in piscem» (it ends in a fish tail), «Hir.» probably for «Hor.». Her wry verdict on the notebook or the journey.",
         ['[#Latin](../_glossary/culture/languages/LATIN.md)']),
    para('other', 'maximes sur la page de titre du Livre 71',
         "Remittum ei peccata multa quoniam dilexit multum\n(Luc)\nDulciores sunt lacrymae orantium quam gaudia theatrorum\n(Augustin)",
         "Two Latin sayings Marie copied on the title page of Livre 71, set apart on the left; tome10.docx ¶2364–2366, Mon Journal t.10 p.143 (scan checked). Printed «Remittum» kept: Vulgate, Luke 7:47 «Remittuntur ei peccata multa, quoniam dilexit multum» (her many sins are forgiven, for she loved much). The second, «the tears of those who pray are sweeter than the joys of the theatres», is attributed by Marie to Augustine.",
         ['[#Latin](../_glossary/culture/languages/LATIN.md)']))
save('071', p)

# 090 - flyleaf before Livre 90: milestones, index pointers, maxim (tome14 ¶44-50, small type; scan p.5)
p = load('090')
first(p, '1880-10-03.md',
    para('margin', 'note de Marie sur la page de garde du Livre 90',
         "Dessin 3 octobre 1877\nPeinture 30 septembre 1878\nMédaille 14 janvier 1879\nPeinture 30 septembre 1878\npréd. d'Edmond, livre 75\npage 139, livre 89, arrangement sage",
         "Marie's notes on the flyleaf before the Livre 90 title page, in small type; tome14.docx ¶44–49, Mon Journal t.14 p.5 (scan checked). Her art milestones (drawing from 3 Oct 1877, when she began at the Académie Julian; painting from 30 Sept 1878; the medal of 14 Jan 1879) and pointers to earlier notebooks (Edmond's prediction in Livre 75; a sensible arrangement on p.139 of Livre 89). The same list, with other printed dates, is on the Livre 89 title page (089.0002: «Prédiction d'Edmond (livre 75…», «Résolution sage»). The «Peinture 30 septembre 1878» line is printed twice and kept twice. Typesetting typos corrected (owner policy): printed «septbembre» → «septembre», «arrangemement» → «arrangement». «préd.» is Marie's abbreviation of «prédiction» (spelled out on the Livre 89 title page); keep it abbreviated."),
    para('margin', 'note de Marie sur la page de garde du Livre 90',
         "Ceux que je choque et qui ne veulent pas de moi ne sont pas de l'espèce de ceux dont je voudrais.",
         "Maxim on the same flyleaf before the Livre 90 title page, small type; tome14.docx ¶50, Mon Journal t.14 p.5 (scan checked)."))
save('090', p)

# 091 - ¶908 working resolution, small type directly above the Livre 91 title (p.71)
p = load('091')
first(p, '1881-01-23.md', para('margin', 'note de Marie sur la page de garde du Livre 91',
    "Faire vite que du nu et en fin Décembre aller à Biarritz ou Nice et là en plein air peindre Aradnié, effet du soleil levant si Tony approuve.",
    "Marie's working note in small type directly above the Livre 91 title; tome14.docx ¶908, Mon Journal t.14 p.71. The print sets flyleaf notes above the title (as p.5 for Livre 90), so it is placed at the front of Livre 91; «fin Décembre» suggests it was written in autumn 1880 (alternative placement: end of 090/1881-01-22). «Aradnié» printed so (probably Ariane/Ariadne as a painting subject); «Tony» = Tony Robert-Fleury, her teacher at Julian's.",
    ['[#Tony_Robert_Fleury](../_glossary/people/mentioned/TONY_ROBERT_FLEURY.md)']))
save('091', p)

# 097 - maxim «[Sur une page]» on the Livre 97 title page (tome15 ¶1229)
p = load('097')
first(p, '1882-10-29.md',
    para('editorial', None, "[Sur une page]",
         "Editors' label in the printed edition for the maxim below, on the Livre 97 title page; tome15.docx ¶1229, Mon Journal t.15 p.107 (split off as 052.0002 is)."),
    para('other', 'écrit sur une page du Livre 97',
         "Dieu nous apprend le mépris des richesses par la façon dont il les distribue, (lu dans un roman feuilleton).",
         "Maxim Marie noted from her reading («lu dans un roman feuilleton») on a page of Livre 97, printed after the title lines; tome15.docx ¶1229, Mon Journal t.15 p.107. Printed comma before the parenthesis kept."))
save('097', p)
print('final written')

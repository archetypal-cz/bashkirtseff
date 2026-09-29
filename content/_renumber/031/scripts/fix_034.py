"""Carnet 034 (Livre 34, 7–25 June 1875) — reviewer B.
Old text 034.0001–0450 aligns 1:1 with docx ¶1695–2369; 15–18 June (¶2012–2144) and 21–24 June (¶2231–2325) are
restored as new text. Fixes: OCR slips in new text, the drafter's 1877/1881 annotation paragraph that swallowed the
rest of 24 June, and the «[Trois quarts de page enlevés]» kind."""
from fixlib5 import *

C = '034'


def rep(X, docx, pairs, why, c=C):
    t = X.get_new(c, docx)['french']
    for a, b in pairs:
        assert a in t, (c, docx, a)
        t = t.replace(a, b)
    X.edit_new(c, docx, why, french=t)


def fix(X):
    # --- kinds -----------------------------------------------------------------------------------------------
    X.kind('034.0110', 'editorial', "«[Trois quarts de page enlevés]»: editors' note about the physical manuscript "
           "(generic BRACKET_EDITORIAL regex misses «enlevés»)")

    # --- 24 June: the drafter merged the 1877/1881 annotation with the rest of the day (¶2316–2325) ----------
    X.split_new(C, 2316, [
        ("[Annotation: 1877. Toujours !!\n1881. Toujours les chansons et pas du tout Audiffret.]", 2316, 'margin',
         'annotation ultérieure de Marie, 1877 et 1881'),
        (dtext(2319), 2319), (dtext(2320), 2320), (dtext(2321), 2321), (dtext(2322), 2322), (dtext(2323), 2323),
        (dtext(2324), 2324), (dtext(2325), 2325),
    ], "only ¶2316–2317 are Marie's later annotation (closing «)» OCR for «]»); ¶2319–2325 are the diary text of "
       "24 June, one paragraph each")
    X.edit_new(C, 2316, rsr=rsr(2316, 2317, "Marie's later annotations (1877, 1881) on the preceding lines."))

    # --- OCR slips in new text ----------------------------------------------------------------------------------
    rep(X, 2021, [("comme c est", "comme c'est"), ("Ainsi c est", "Ainsi c'est"), ("car j ai", "car j'ai")],
        'OCR: missing apostrophes')
    rep(X, 2022, [("Giro'flé", "Giroflé")], 'OCR: stray apostrophe in «Giroflé»')
    rep(X, 2030, [("Philippe I,", "Philippe !")], 'OCR: «I,» for «!»')
    rep(X, 2034, [("bète", "bête")], 'OCR: «bète» for «bête»')
    rep(X, 2050, [("L écrire", "L'écrire"), ("qu'OIga ne s aperçoive", "qu'Olga ne s'aperçoive")],
        'OCR: missing apostrophes, «OIga»')
    rep(X, 2056, [("d'étre", "d'être")], 'OCR: «étre»')
    rep(X, 2058, [("d'étre", "d'être")], 'OCR: «étre»')
    rep(X, 2077, [("nous a chasses", "nous a chassés")], 'OCR: lost accent «chassés»')
    rep(X, 2086, [("dit- elle", "dit-elle")], 'OCR: split hyphenation')
    rep(X, 2093, [("tète", "tête")], 'OCR: «tète» for «tête»')
    rep(X, 2112, [("nous n avons", "nous n'avons")], 'OCR: missing apostrophe')
    rep(X, 2113, [("L homme", "L'homme")], 'OCR: missing apostrophe')
    rep(X, 2117, [("sur* le", "sur le")], 'stray «*» (printed-edition footnote mark, footnotes stay out)')
    rep(X, 2128, [("ne me croît pas", "ne me croit pas"), ("qu'OIga", "qu'Olga")], 'OCR: «croît», «OIga»')
    rep(X, 2130, [("C'est ùn", "C'est un")], 'OCR: «ùn»')
    rep(X, 2234, [("demi- heure", "demi-heure")], 'OCR: split hyphenation')
    rep(X, 2254, [("bête I)", "bête !)")], 'OCR: «I» for «!»')
    rep(X, 2284, [("qu'il m a vue", "qu'il m'a vue")], 'OCR: missing apostrophe')
    rep(X, 2315, [("qu il est parti", "qu'il est parti"), ("Moi-méme", "Moi-même")], 'OCR: apostrophe, «méme»')

    question(C, "Old _original text of 034–037 keeps OCR slips of the printed edition's scan («c est», «I» for «l'»/«!», "
                "«bète/tète», «1 875», «. mie ergo parce» in 037.0336). New text was cleaned; old text left untouched "
                "(set_french would reset approvals of whole entries). Default: leave; do a separate OCR-cleanup commit?")

"""Carnet 039 (Livre 39, 13–26 August 1875) — reviewer C."""
from fixlib5 import *
from fix_038 import rep


def fix(X):
    c = '039'
    # 13 August comes from 038 (moved there): its frontmatter should be 038/1875-08-13.md's (Schlangenbad,
    # entities of that day), which the tool picks from the first paragraph once frontmatter_from is gone.
    e = X.entry(c, '1875-08-13.md')
    if e.pop('frontmatter_from', None):
        log(c, 'entry', '1875-08-13.md: frontmatter_from 1875-08-15.md removed — base on 038/1875-08-13.md (first paragraph)')

    # 14 August (new day): OCR / printed typos
    rep(X, c, 4008, [('ancien I"', 'ancien !"')], 'OCR «I» for «!»')
    rep(X, c, 4016, [('blanc-et rose', 'blanc et rose')], 'printed typo «blanc-et rose»')
    rep(X, c, 4017, [("C'et charmant", "C'est charmant")], 'printed typo «C\'et»')
    # 18 August (first half new)
    rep(X, c, 4089, [('à son fils."', 'à son fils.')], 'stray closing quote (OCR)')
    rep(X, c, 4096, [("l'OIympe", "l'Olympe")], 'OCR «OI» for «Ol»')

    # 21 August: Marie's letter to her father (whole paragraph, italic in the print)
    X.letter(['039.0110'], 'Lettre de Marie à son père, 21 août 1875',
             '«je prends une feuille de papier et écris ceci:» — her reply to her father, copied in')
    # 039.0130 «[Une ligne cancellée]» spans 21/22 Aug only because both days have the same note: no split.

    # 22 August: 039.0163 is cut short — the docx ¶4249 has one more sentence (kept accent-less like the rest of 039)
    t = vis('039.0163')
    a = "Maintenant que je sais, c'est fini."
    assert a in t
    X.sf('039.0163', t.replace(a, "Je suis meme allee chez Mme Aleinikoff parce que son balcon et celui du prince se touchent. " + a),
         'completion: sentence «Je suis même allée chez Mme Aleinikoff…» missing from _original (docx ¶4249); accent-less like the rest of the carnet')

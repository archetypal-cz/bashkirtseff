"""Carnet 041 (Livre 41, 1–7 September 1875) — reviewer C."""
from fixlib5 import *
from fix_038 import rep


def fix(X):
    c = '041'
    # 1 Sept (suite): the draft split the date line into the entry heading + a new paragraph «- suite».
    X.drop_new(c, 4560.5, 'rest of the date line «Mercredi 1er septembre 1875 - suite»; carried by the entry heading')
    e = X.entry(c, '1875-09-01.md')
    e['heading'] = 'Mercredi 1er septembre 1875 - suite'
    e.pop('frontmatter_from', None)
    log(c, 'entry', '1875-09-01.md: heading «Mercredi 1er septembre 1875 - suite» as in the docx date line ¶4560; frontmatter from 040/1875-09-01.md (first paragraph), not 041/1875-09-02.md')
    rep(X, c, 4587, [("de'Mme", 'de Mme')], 'stray apostrophe (OCR)')

    # 2 Sept letters
    X.letter([f'041.{n:04d}' for n in range(3, 13)], 'Lettre de Marie à sa mère, 2 septembre 1875',
             '«Jugez de mon humeur par la lettre que j\'écris à Schlangenbad:» — salutation to the last line before «Ensuite j\'écris ceci:»')
    X.letter([f'041.{n:04d}' for n in range(14, 20)], 'Lettre de Marie à Saëtone, 2 septembre 1875',
             '«Ensuite j\'écris ceci:» — letter, signature and address')

    # 4–7 Sept (new days): OCR slips
    rep(X, c, 4657, [('un- affreux', 'un affreux')], 'OCR hyphen')
    rep(X, c, 4668, [('Tout s éclaircit', "Tout s'éclaircit")], 'OCR lost apostrophe')
    rep(X, c, 4685, [('qu il ne', "qu'il ne")], 'OCR lost apostrophe')
    rep(X, c, 4688, [('respirant.- Attendez', 'respirant. - Attendez')], 'OCR spacing')
    rep(X, c, 4707, [('je n aurai', "je n'aurai")], 'OCR lost apostrophe')
    rep(X, c, 4739, [('L après-midi', "L'après-midi")], 'OCR lost apostrophe')
    rep(X, c, 4740, [('[Rayé: d argent]', "[Rayé: d'argent]")], 'OCR lost apostrophe')
    rep(X, c, 4741, [('épouvé', 'éprouvé')], 'printed typo «épouvé»')
    rep(X, c, 4749, [('s.v.p.. !', 's.v.p. !')], 'OCR double full stop')
    rep(X, c, 4781, [('ce n est pas', "ce n'est pas"), ('c est une âme', "c'est une âme")], 'OCR lost apostrophes')
    rep(X, c, 4785, [('II doit', 'Il doit')], 'OCR «II» for «Il»')
    # ¶4803 (the aunt's outburst) and ¶4804 are two paragraphs the draft glued together
    t = X.get_new(c, 4803)['french']
    a, b = t.split('\n')
    assert a.endswith('vôtres I*') and b.startswith("Aujourd'hui")
    X.split_new(c, 4803, [(a.replace('vôtres I*', 'vôtres !*'), 4803), (b, 4804)],
                'two docx paragraphs (¶4803 the aunt\'s words, ¶4804) were glued; OCR «I» for «!»')
    rep(X, c, 4806, [('la tète', 'la tête')], 'OCR «tète»')
    rep(X, c, 4819, [("les' Niçois", 'les Niçois')], 'stray apostrophe (OCR)')
    rep(X, c, 4841, [('J ai I air', "J'ai l'air"), ("tout d un coup", "tout d'un coup"), ('que I air', "que l'air")],
        'OCR «I» for «l» and lost apostrophes')

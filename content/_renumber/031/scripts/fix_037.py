"""Carnet 037 (Livre 37, 15–31 July 1875) — reviewer B.
_original had 15–19 and 30–31 July, with 16 July cut short after 037.0160; the rest of 16 July (docx ¶3155–3196) and
20–29 July (¶3333–3541) are restored as new text. 037.0123 («Vraiment il n'y a que les chiens.», ¶3113) is not a
cluster spanning days: the line is repeated on 16 July as 037.0134 (¶3124)."""
from fixlib5 import *

C = '037'


def rep(X, docx, pairs, why, c=C):
    t = X.get_new(c, docx)['french']
    for a, b in pairs:
        assert a in t, (c, docx, a)
        t = t.replace(a, b)
    X.edit_new(c, docx, why, french=t)


def fix(X):
    # --- kinds / letters ---------------------------------------------------------------------------------------
    X.kind('037.0151', 'editorial', "«[Trois quarts de la page enlevés]»: editors' note about the physical manuscript "
           "(generic BRACKET_EDITORIAL regex misses «enlevés»)")
    X.letter(['037.0140'], 'Dépêche de Marie à Étienne Babanine, 16 juillet 1875',
             "telegram text copied into the diary («Ma tante est allée expédier la dépêche suivante:», signed Marie)")
    rep(X, 3388, [("[Deux lignes cancellées)", "[Deux lignes cancellées]")], 'OCR: «)» for «]»')
    X.kind_new(C, 3388, 'editorial', "«[Deux lignes cancellées]» without text: editors' note")
    # note to Saëtone («Mercure»), 26 July: ¶3455–3457
    X.drop_new(C, 3457, 'signature of the note to Saëtone, joined to the note paragraph (docx ¶3455–3457)')
    X.edit_new(C, 3455, "Marie's note to Saëtone («Mercure») copied into the diary, with its signature",
               french="Cher Monsieur,\nAyez l'obligeance de passer chez nous vers six heures. J'ai affaire à vous.\n"
                      "Marie Bashkirseff.",
               kind='letter', source='Billet de Marie à Saëtone, 26 juillet 1875',
               rsr=rsr(3455, 3457, "Marie's note to Saëtone («Mercure»), copied into the diary."))

    # --- 24 July: two paragraphs joined by the drafter (¶3426 ends with an OCR «_») ------------------------------
    X.split_new(C, 3426, [
        ("Plusieurs secondes de suite on ne peut se remettre de cette affreuse frayeur et nous partons.", 3426),
        (dtext(3427), 3427),
    ], 'two docx paragraphs; stray «_» (OCR) dropped')

    # --- OCR slips in new text ----------------------------------------------------------------------------------
    rep(X, 3156, [("d'étre bétonnée", "d'être bâtonnée"), ("m'étre", "m'être")],
        'OCR: «étre»; «bétonnée» for «bâtonnée» (to be beaten)')
    rep(X, 3167, [("bète", "bête")], 'OCR: «bète»')
    rep(X, 3172, [("il aurait parié.", "il aurait parlé.")], 'OCR: «parié» for «parlé» (cf. ¶3362 «il aurait parlé»)')
    rep(X, 3175, [("pouquoi", "pourquoi")], 'typo «pouquoi»')
    rep(X, 3181, [("regette", "regrette")], 'typo «regette»')
    rep(X, 3184, [("d'Au- diffret", "d'Audiffret")], 'OCR: word split at a line end')
    rep(X, 3351, [("pour sur.", "pour sûr.")], 'OCR: lost circumflex (cf. ¶3379 «pour sûr»)')
    rep(X, 3370, [("grand- amiral", "grand-amiral")], 'OCR: split hyphenation')
    rep(X, 3371, [("page prés de moi", "page près de moi")], 'OCR: «prés» for «près»')
    rep(X, 3408, [("la tète", "la tête")], 'OCR: «tète»')
    rep(X, 3409, [("une tète", "une tête")], 'OCR: «tète»')
    rep(X, 3412, [("Gaiuia", "Galula")], 'OCR: «Gaiuia» for «Galula»')
    rep(X, 3413, [("moi- même", "moi-même")], 'OCR: split hyphenation')
    rep(X, 3432, [("lui-méme", "lui-même")], 'OCR: «méme»')
    rep(X, 3435, [("[Rayé : terrible I]", "[Rayé: terrible !]")], 'OCR: «I» for «!», label spacing')
    rep(X, 3445, [("deU'illustrissimo", "dell'illustrissimo")], 'OCR: «deU\'» for «dell\'»')
    rep(X, 3453, [("faute I avait", "faute l'avait")], 'OCR: «I» for «l\'»')
    rep(X, 3454, [("C est I affaire", "C'est l'affaire")], 'OCR: missing apostrophe, «I» for «l\'»')
    rep(X, 3461, [("puis- je", "puis-je")], 'OCR: split hyphenation')
    rep(X, 3476, [("après- demain", "après-demain")], 'OCR: split hyphenation')
    rep(X, 3487, [("j ai la main", "j'ai la main"), ("j arrache", "j'arrache")], 'OCR: missing apostrophes')
    rep(X, 3514, [("Bienmiiller", "Bienmüller")], 'OCR: «ii» for «ü» (photographer\'s name; spelling unverified)')
    rep(X, 3519, [("profil- médaille", "profil-médaille")], 'OCR: split hyphenation')
    rep(X, 3527, [("[Rayé : il nous faut]", "[Rayé: il nous faut]")], 'label spacing as elsewhere')
    rep(X, 3536, [("de Jour en jour", "de jour en jour")], 'OCR: capital «J»')

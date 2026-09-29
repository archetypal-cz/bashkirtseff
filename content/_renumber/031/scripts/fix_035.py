"""Carnet 035 (Livre 35, 26 June – 8 July 1875) — reviewer B.
_original had only 1 and 8 July (035.0001–0096); 26–30 June and 2–7 July are restored as new text (docx ¶2375–2714).
Fixes: the Gioia floor-plan labels, the Figaro letter, Marie's letter to her mother (8 July), OCR slips."""
from fixlib5 import *

C = '035'


def rep(X, docx, pairs, why, c=C):
    t = X.get_new(c, docx)['french']
    for a, b in pairs:
        assert a in t, (c, docx, a)
        t = t.replace(a, b)
    X.edit_new(c, docx, why, french=t)


def fix(X):
    # --- 26 June: floor plan of the Gioia house (¶2377–2385) --------------------------------------------------
    X.split_new(C, 2377, [
        ("Je puis faire le plan des chambres si bien je les connais. Je sais aussi comment c'est meublé. "
         "Je voudrais pouvoir demander à Audiffret:", 2377),
        ("[Plan: nord / midi / chambre meublée de cretonne à ramages / salle à manger / antichambre / "
         "salon Pompadour / grande porte / salon de satin rouge et cuir de Russie]", 2379, 'other',
         'plan de la maison Gioia dessiné par Marie, légendes'),
        ("si c'est vraiment comme j'ai rêvé. Je ne me souviens pas du premier étage, je sais seulement "
         "(qu'en regardant de la Promenade) à droite il y a une longue pièce. J'en ai rêvé, mais dans ce rêve "
         "elle était démeublée et pleine de coffres.", 2383),
    ], "¶2379–2382 are the labels of Marie's drawn floor plan of the Gioia house, set inside her sentence "
       "(«demander à Audiffret: [plan] si c'est vraiment comme j'ai rêvé»); the drafter ran them into the prose. "
       "OCR «de mander», «révé», «cof fres» (page break, picture ¶2384) fixed")
    X.edit_new(C, 2377, rsr=rsr(2377, 2378))
    X.edit_new(C, 2379, rsr=rsr(2379, 2382, "Labels of the floor plan of the Gioia house that Marie drew in the "
               "notebook (the drawing itself is not reproduced in the text); the division of the OCR line ¶2382 "
               "into separate labels is inferred."))
    X.edit_new(C, 2383, rsr=rsr(2383, 2385))

    # --- 27 June: letter to the Figaro (¶2407–2410) -------------------------------------------------------------
    t = X.get_new(C, 2407)['french']
    assert t.startswith("Nous rentrons et après dîner rédigeons la lettre suivante: Monsieur,\n"), t
    X.split_new(C, 2407, [
        ("Nous rentrons et après dîner rédigeons la lettre suivante:", 2407),
        ("Monsieur,\n" + t.split('\n', 1)[1], 2408, 'letter', 'Lettre de Marie au rédacteur en chef du Figaro, 27 juin 1875'),
    ], "the letter Marie and the girls wrote to the Figaro is a copied letter: its own paragraphs, kind letter")
    X.edit_new(C, 2408, rsr=rsr(2407, 2408, "Letter to the Figaro copied into the diary."))
    t = X.get_new(C, 2409)['french']
    a, b = t.split('\n', 1)
    assert a.startswith("J'ai l'honneur") and 'enveloppe:' in a and b.startswith('Cela fera rire'), t
    k = a.index('enveloppe:')
    X.split_new(C, 2409, [
        (a[:k].strip(), 2409, 'letter', 'Lettre de Marie au rédacteur en chef du Figaro, 27 juin 1875'),
        (a[k:].strip(), 2410, 'letter', 'Lettre de Marie au rédacteur en chef du Figaro, 27 juin 1875'),
        (b, 2411),
    ], "closing and envelope address belong to the Figaro letter (kind letter); ¶2411 is diary text again")

    # --- 8 July: letter to her mother (035.0070–0071) -----------------------------------------------------------
    X.letter(['035.0070', '035.0071'], 'Lettre de Marie à sa mère, 8 juillet 1875',
             "«j'écris à maman:» — the unsigned letter she sent, copied into the diary")

    # --- kinds ----------------------------------------------------------------------------------------------------
    rep(X, 2716, [("cancelllée", "cancellée")], 'typo «cancelllée»')
    X.kind_new(C, 2716, 'editorial', "«[Une ligne cancellée]» without text: editors' note (generic regex missed the typo)")

    # --- OCR slips in new text ----------------------------------------------------------------------------------
    rep(X, 2401, [("jamais I avoir", "jamais l'avoir"), ("qu on déchiffre", "qu'on déchiffre"),
                  ("je n aurai", "je n'aurai")], 'OCR: «I» for «l\'», missing apostrophes')
    rep(X, 2423, [("demi- voix", "demi-voix")], 'OCR: split hyphenation')
    rep(X, 2433, [("que I air", "que l'air")], 'OCR: «I» for «l\'»')
    rep(X, 2436, [("d Italie", "d'Italie")], 'OCR: missing apostrophe')
    rep(X, 2439, [("coupé- lit", "coupé-lit")], 'OCR: split hyphenation')
    rep(X, 2461, [("à plaindre. *", "à plaindre.")], 'stray «*» (printed-edition footnote mark)')
    rep(X, 2467, [("vilai nement", "vilainement")], 'OCR: word split across a page break (¶2467–2468)')
    rep(X, 2527, [("à Nice .*", "à Nice.*")], 'OCR: space before full stop')
    rep(X, 2535, [("m'empécher", "m'empêcher")], 'OCR: «empécher»')
    rep(X, 2551, [("sommes- nous", "sommes-nous")], 'OCR: split hyphenation')
    rep(X, 2556, [("C est un jardin", "C'est un jardin")], 'OCR: missing apostrophe')
    rep(X, 2562, [("Comme lie is", "Comme he is")], 'OCR: «lie» for English «he»')
    rep(X, 2563, [("la tète", "la tête")], 'OCR: «tète»')
    rep(X, 2565, [("la tète", "la tête"), ("trace 0. S.", "trace O. S.")], 'OCR: «tète», zero for «O»')
    rep(X, 2589, [("J ai bien", "J'ai bien")], 'OCR: missing apostrophe')
    rep(X, 2590, [("de I humeur", "de l'humeur")], 'OCR: «I» for «l\'»')
    rep(X, 2603, [("ia plus", "la plus"), ("renconte", "rencontre")], 'OCR: «ia», «renconte»')
    rep(X, 2615, [("Girofla et Girofle", "Girofla et Giroflé")], 'OCR: lost accent (Olga\'s nickname «Giroflé»)')
    rep(X, 2632, [("C est un péché", "C'est un péché")], 'OCR: missing apostrophe')
    rep(X, 2640, [("une bète", "une bête")], 'OCR: «bète»')
    rep(X, 2642, [("la tète", "la tête")], 'OCR: «tète»')
    rep(X, 2644, [("vamtatum", "vanitatum")], 'OCR: «vamtatum»')
    rep(X, 2662, [("c est ce qui", "c'est ce qui")], 'OCR: missing apostrophe')
    rep(X, 2699, [("Ah I Mademoiselle", "Ah ! Mademoiselle")], 'OCR: «I» for «!»')

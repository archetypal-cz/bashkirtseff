"""Carnet 032 (Livre 32, 23 April – 16 May 1875) — reviewer A decisions (incl. the 032→033 move)."""
from fixlib5 import *  # noqa: F401,F403

C = '032'


def _rep(X, d, old, new, why):
    n = X.get_new(C, d)['french']
    assert old in n, (d, old)
    X.edit_new(C, d, why, french=n.replace(old, new))


def fix(X):
    # --- old paragraphs ---------------------------------------------------------------------
    X.kind('032.0216', 'editorial', 'note about the physical manuscript («[Bas de page supprimé]»), not a marginal note by Marie')
    X.drop_old('032.0300', 'placeholder «[Entrée vide ou perdue]»: the docx has the whole day of 9 May (¶870–900), restored as new paragraphs')

    # --- 23 April (docx ¶485–529) -----------------------------------------------------------
    # Russian speech is italic in the printed edition; markdown italics cannot span paragraphs
    X.edit_new(C, 518, 'italic run split per paragraph (Russian speech ¶518–521)',
               french="*Maria Constantinovna, Maria Constantinovna,* dit-il s'interrompant au milieu d'une phrase "
                      "et d'une voix mystérieuse, Audiffer *est arrivé*, Audiffer *est arrivé.*")
    X.insert_new(C, '1875-04-23.md', ('after', ('new', 518)), '*Où ?*', rsr(519),
                 'docx ¶519 «Où ?» was lost by the drafter (uncertain alignment to 032.0013)', docx=519)
    X.edit_new(C, 520, 'italic (Russian speech)', french='*Dans le jardin.*')
    X.edit_new(C, 521, 'italic (Russian speech), closing marker', french='*Mais...*')
    X.split_new(C, 512, [('Vin château Villegeorges de 1865', 512), ('Je pouvais bien chanter comme "La Périchole":', 513)],
                'last menu line and the next sentence are two docx paragraphs')
    _rep(X, 522, 'qui s y trouvait', "qui s'y trouvait", 'missing apostrophe (OCR)')
    _rep(X, 525, 'avec "femme', 'avec femme', 'stray quotation mark (OCR)')

    # --- 30 April (docx ¶693–708) -----------------------------------------------------------
    X.edit_new(C, 695, 'page-internal join: sentence + italic Russian speech; italic closed per paragraph',
               french="On se met à table. Walitsky en face de Nina, le potage est trop salé, "
                      "*Est-ce vous, Loukantchik qui avez salé ?*")
    X.edit_new(C, 697, 'italic (Russian speech) per paragraph',
               french="*Non c'est vous, Nina Alexandrovna,* répond Loukantchik.")
    X.edit_new(C, 698, 'italic (Russian speech) per paragraph',
               french="*Loukantchik,* reprend Nina, *nous avons mis trop de légumes*, et ainsi de suite.")
    _rep(X, 701, "c'es vie", "c'est vie", 'OCR «c\'es» → «c\'est»')
    _rep(X, 701, 'sa glante', 'sanglante', 'OCR split word «sa glante» → «sanglante»')
    _rep(X, 702, "Or m'a envoyé", "On m'a envoyé", 'OCR «Or» → «On»')
    X.edit_new(C, 703, 'a drawing (Marie\'s arms, docx picture ¶704) interrupts the sentence in the printed edition; '
               'marked [Croquis] as elsewhere in _original',
               french="Je n'ajouterai rien du tout, ce sont des [Croquis] Dieu pourrait se fâcher. J'ai ajouté mes "
                      "deux rêves, les cinq étoiles et les épis de blé. Je ne sais vraiment comment disposer tout cela. "
                      "On y songera.",
               rsr=rsr(703, 706, 'The printed edition prints a drawing (Marie\'s coat of arms) at ¶704 inside the '
                                 'sentence and another after it (¶707); the words hidden by the drawing, if any, are unknown.'))

    # --- 9 May (docx ¶870–900) --------------------------------------------------------------
    t = X.get_new(C, 877)['french']
    a, b = t.split('\n')
    X.split_new(C, 877, [(a, 877), (b, 878)], '¶877 and ¶878–880 are two paragraphs (only ¶878/880 is a page-break join)')
    X.edit_new(C, 878, rsr=rsr(878, 880))
    _rep(X, 872, 'la tète en bas', 'la tête en bas', 'OCR «tète» → «tête»')
    _rep(X, 886, '*oui,*', '*oui*,', 'italic marker moved off the comma')
    _rep(X, 888, 'Je n étais', "Je n'étais", 'missing apostrophe (OCR)')
    _rep(X, 889, "*l'accaparation des jeunes gens.*", "*l'accaparation des jeunes gens*.", 'italic marker moved off the period')
    _rep(X, 892, 'Audacler et amanter', 'Audacter et amanter', 'OCR «Audacler» → Latin «Audacter» (glossed «hardiment»)')
    X.edit_new(C, 898, 'OCR split word «fu rum» → Latin «furum» (plant of thieves)', french='*Planta furum*.')

    # --- 16 May: continuation after the Livre 33 title page ----------------------------------
    log(C, 'moved', '032.0474–0481 (16 May, after «(suite au prochain livre)») → 033/1875-05-16.md accepted: the docx '
                    'prints them under the Livre 33 title page as «Dimanche 16 mai 1875 (suite)» (¶1096–1104)')
    e = X.entry('033', '1875-05-16.md')
    e['heading'] = 'Dimanche 16 mai 1875 (suite)'
    log('033', 'heading', '1875-05-16.md: heading «Dimanche 16 mai 1875 (suite)» as in the docx date line ¶1096')

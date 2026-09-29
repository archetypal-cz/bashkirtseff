"""Carnet 031 (Livre 31, 3–22 April 1875) — reviewer A decisions."""
from fixlib5 import *  # noqa: F401,F403

C = '031'


def fix(X):
    # --- old paragraphs ---------------------------------------------------------------------
    X.drop_old('031.0218', 'printed-edition page number «20» (docx ¶316) extracted as a paragraph, not text')

    # letter to the Prince of Wales (docx ¶92–95, envelope address ¶97), copied into the notebook
    X.sf('031.0019', '> Fides et spes',
         'OCR/extraction slip «Eides et spes» → «Fides et spes» (the LAN note already reads it so); quoted as letter text')
    X.letter(['031.0016', '031.0017', '031.0018', '031.0019', '031.0021'],
             'Lettre anonyme de Marie au prince de Galles, Nice, 4 avril 1875',
             'the anonymous letter (and its envelope address) Marie copied into the notebook; docx ¶92–97')

    # --- new text (19 April, docx ¶397–407) ------------------------------------------------
    X.edit_new(C, 404, 'OCR «II» → «Il»',
               french='Je me fie à Dieu, Il fera comme Il voudra puisque je ne puis faire comme je veux.')
    n = X.get_new(C, 405)['french']
    X.edit_new(C, 405, 'stray italic markers around «bien)» (OCR run artefact; the docx text has none)',
               french=n.replace('(robe rose, *bien).*', '(robe rose, bien).'))
    n = X.get_new(C, 406)['french']
    X.edit_new(C, 406, 'stray italic on «ce» (OCR run artefact)', french=n.replace('*ce*', 'ce'))

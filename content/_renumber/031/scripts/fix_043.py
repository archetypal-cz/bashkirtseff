from fixlib5 import *

FOSTER = "Lettre d'A. Foster à Marie, 3 septembre 1875"


def fix(X):
    c = '043'
    # --- 10 Sept: Foster's letter pinned into the notebook (docx ¶4939–4945; Marie: «la voici attachée par une épingle»)
    X.letter([f'043.{i:04d}' for i in range(9, 16)], FOSTER, 'letter from A. Foster pinned into the notebook (docx ¶4939–4945)')
    # struck quatrain: keep the verse lines
    X.edit_new(c, 5010, french='[Rayé: Comment mes sens définir\nMa charmante et belle Nice\nJe te revois avec plaisir]',
               why='verse lines of the struck quatrain kept one per line (docx ¶5010–5012)')

    # --- 20 Sept: the marginal note written across the page, split by _original at the page break
    for oid in ('043.0265', '043.0266'):
        X.kind(oid, 'margin', 'whole «[En travers: … puis rien.]» note written across the page (split in two clusters at a page break)')
    # second date line «Lundi 20 septembre 1875» (docx ¶5252) inside the same entry: restore it as a heading
    X.sf('043.0301', '# Lundi 20 septembre 1875\n' + vis('043.0301'),
         "Marie's second date line «Lundi 20 septembre 1875» (docx ¶5252), dropped by the extraction; heading inside the entry")

    # --- 21 Sept: verse lines the drafter failed to align (accent-less old text); the old clusters are already in place
    for d in (5315, 5317, 5318, 5319):
        X.drop_new(c, d, 'duplicates 043.0360–0369 (same verse lines, one per cluster), already placed after 043.0359')
    # docx ¶5354–5356 are 043.0397–0399 (already placed after 043.0396); the draft aligned the Livre 44 copy
    # (043.0435/0436) there instead and duplicated ¶5356 as new text
    X.drop_new(c, 5356, 'duplicates 043.0399 «Vous voyez bien ce beau castel», already in place')
    X.move_old('043.0435', '044', '1875-09-21.md', ('after', '043.0434'),
               'Livre 44 fair copy of the Complainte (docx ¶5396); the draft aligned it to the Livre 43 draft line ¶5354 (043.0397)')
    X.move_old('043.0436', '044', '1875-09-21.md', ('after', '043.0435'),
               'Livre 44 fair copy of the Complainte (docx ¶5397); the draft aligned it to the Livre 43 draft lines ¶5355–5356')
    # «[Brouillon: …]» variant lines inside the poem: no kind (variants stay as they are)
    for oid in ('043.0373', '043.0381'):
        X.kind(oid, None, '«[Brouillon: …]» variant line inside the poem: stays as it is, no kind')
    # editors' note on the six struck draft pages at the end of cahier 43, then the struck draft verses
    for oid in ('043.0404', '043.0405'):
        X.kind(oid, 'editorial', "editors' note (two clusters) on the six struck draft pages at the end of cahier 43")
    for i in range(406, 421):
        X.kind(f'043.{i:04d}', 'rayé', 'draft verses of the Complainte on the struck pages at the end of cahier 43 (docx ¶5361–5378)',
               source='brouillon rayé, fin du cahier 43')

    # --- Livre 44 part of 21 Sept (moved to 044 by the draft; the docx has it after the Livre 44 title page ¶5381–5384):
    # its first cluster is Marie's date line «21 septembre 1875 -suite» — make it the heading
    X.sf('043.0426', '# 21 septembre 1875 -suite',
         "Marie's date line «21 septembre 1875 -suite» opens Livre 44 (docx ¶5385); made a heading")

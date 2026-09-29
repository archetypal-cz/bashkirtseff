"""Carnet 040 (Livre 40, 27 August – 1 September 1875) — reviewer C."""
from fixlib5 import *


def fix(X):
    c = '040'
    # The double date line «Vendredi 27, samedi 28 août 1875» (docx ¶4310) was missed by the drafter: it folded the
    # whole of 27–28 Aug into 1875-08-29.md (with 29 Aug's heading 040.0152 on top) and added the date line as a new
    # paragraph. Restore the old multi-day entry 1875-08-27-28.md (040.0001 heading, 040.0005–0144, summaries 0145–0151).
    e29 = X.entry(c, '1875-08-29.md')
    X.drop_new(c, 4310, 'date line «Vendredi 27, samedi 28 août 1875» = heading 040.0001 of the restored entry 1875-08-27-28.md')
    i0 = X._index(e29, '040.0001')
    i1 = X._index(e29, '040.0153')
    block = e29['paragraphs'][i0:i1]
    assert block[0]['old'] == '040.0001' and block[-1].get('old', '') in ('040.0145', '040.0151'), block[-1]
    del e29['paragraphs'][i0:i1]
    ne = X.add_entry(c, '1875-08-27-28.md', heading='Vendredi 27, samedi 28 août 1875',
                     why='old double-date entry restored (drafter missed the date line ¶4310)')
    ne['paragraphs'] = block
    assert X._index(e29, '040.0152') == 0

    # Letters
    X.letter([f'040.{n:04d}' for n in range(22, 28)], 'Lettre de Marie à sa mère, 28 août 1875',
             '«J\'ai écrit à maman ce qui suit.» — letter text, signature and postscript')
    X.letter([f'040.{n:04d}' for n in range(205, 214)], 'Lettre de Berthe Boyd à Marie, Royat, [août 1875]',
             'letter pinned into the notebook («La lettre est attachée à la page 102»)')
    X.letter([f'040.{n:04d}' for n in range(234, 244)], 'Lettre de Marie à Berthe Boyd, 1er septembre 1875',
             '«Je réponds à Berthe:» — letter text and signature')
    # 040.0204 «[Lettre de Berthe Boyd]» stays editorial (editors' label); 040.0245 «(Ecrit sur du papier à en-tête…)» editorial.

    # Cross-carnet move 040.0246–0261 (1 Sept, after the Livre 41 title page ¶4556–4559) → 041: accepted.
    log(c, 'moved', '040.0246–0261 (1 Sept «suite») → 041 accepted: the docx has the Livre 41 title page and «Mercredi 1er septembre 1875 - suite» before them')

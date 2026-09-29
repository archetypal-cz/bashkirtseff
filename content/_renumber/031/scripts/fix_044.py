from fixlib5 import *


def fix(X):
    # 044 (22–25 Sept, docx ¶5408–5667) aligns 1:1 with _original; the draft's kinds (two «[Dans la marge: …]» =
    # margin, «[DERNIERE PAGE NON NUMEROTEE: Neuf lignes cancellées]» = editorial) are right.
    # The 043→044 moves (21 Sept «-suite») are in fix_043.
    c = '044'
    question(c, "044.0222 «maman m'a dit qu'il me croyait folle de lui … à cette passion.]» (1875-09-25, docx ¶5643, small "
                "type) is the end of a bracketed note whose beginning is missing in the docx (empty ¶5642 before it). Probably "
                "a later annotation by Marie (margin); left without kind — check the printed page.")
    # planner: the 21 Sept «-suite» entry opens with its own heading (043.0426 set_french); the drafter's entry
    # heading «Mardi 21 septembre 1875» would add a second, invented heading in the translations
    X.entry(c, '1875-09-21.md').pop('heading', None)

"""088 final plan: letters (quoted already), mother's marginal annotation, 0283 split (letter end | diary)."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fixlib_d import *
p = load('088')
kind(p, ['088.0281', '088.0282', '088.0283'], 'letter', 'Lettre de Marie Bashkirtseff à sa mère, 22 mai 1880')
kind(p, ['088.0326', '088.0327'], 'letter', 'Lettre de Marie Bashkirtseff à sa mère, 24 mai 1880')
kind(p, ['088.0054', '088.0055'], 'other', 'annotation marginale de Mme Bashkirtseff mère')
setf(p, '088.0283', "> Ne pleurnichez pas sur mon manque de sentiments, la belle existence que je mène a tué tout espèce de sentiment excepté celui de l’exécration que je voue à ceux qui me tourmentent.”")
insert_after(p, '088.0283', [
    new("Au lieu de pleurer allons dormir. Si je suis parvenue à agacer Soutzo, dit Casimir, ce sera peut-être une petite consolation mais non, Antoine est trop laid, il n'y croira pas.",
        "Split off 088.0283, which had glued the diary text to the end of the copied letter; tome13.docx ¶3455, Mon Journal t.13 p.252 (2026-09-28 rebuild)."),
    new("J'étais couchée et je me lève pour dire que je suis en larmes. Si j'avais des invitations partout il est probable que je ne sortirais pas beaucoup, aimant le travail. Mais prisonnière forcée !!! Ce sera donc toujours comme cela !",
        "Split off 088.0283; tome13.docx ¶3458, Mon Journal t.13 p.253 (2026-09-28 rebuild). OCR «II!» read as «!!!»."),
])
save(p, '088')

"""089 final plan: kinds; 28 Sep 1880 spiral letter restored to manuscript order; 30 Sep / 1 Oct split."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fixlib_d import *
p = load('089')
kind(p, [f'089.{n:04d}' for n in range(285, 293)], 'letter', 'Lettre de Marie Bashkirtseff à sa mère, 3 août 1880')
kind(p, ['089.0561', '089.0562'], 'letter', 'Billet de Soutzo à Marie Bashkirtseff, reçu le 14 septembre 1880')
kind(p, ['089.0280', '089.0293', '089.0496', '089.0500', '089.0642'], 'rayé')
kind(p, ['089.0224', '089.0583'], 'margin')
kind(p, ['089.0365'], 'other', 'annotation marginale, peut-être de Mme Bashkirtseff mère')
kind(p, ['089.0479'], 'other', 'annotation marginale de Mme Bashkirtseff mère')
kind(p, ['089.0501'], 'editorial')

# the OCR «Ier» duplicate headings (0063 0272 0453) are removed by post_apply_d.py (no flag reset)

# 28 Sep 1880 (printed pp.352–353): the extraction scrambled the two-column facsimile layout.
MERGED = 'merged into the paragraph it continues (two-column/page-break fragment of the facsimile layout), 2026-09-28 rebuild'
setf(p, '089.0621', "Vous pouvez bien vous risquer chez vos trois pères, a dit Gabriel, le père Gavini, le père Saint Amand et le père Géry, car mon père est aussi votre père, il me désigne comme la fille de son père.")
setf(p, '089.0623', "Cette bouffonnerie me vaut une avalanche de compliments, et je suis ceci et cela et l’on formera cet hiver un cercle d’élite autour de moi, il m’amènera des célébrités, tous les *quelqu’un* etc. etc. etc ! Je n’avais pas même besoin de cela, je me suis éveillée en riant et ça n’a pas cessé. Du reste, voyez la folie du soir. Vers six heures et demie on sonne, c’est Saint-Amand encore et Gabriel qui viennent proposer quelque chose de fou pour s’amuser.")
drop(p, '089.0616', MERGED + ' (end of 089.0623)')
drop(p, '089.0624', MERGED + ' (end of 089.0621)')
drop(p, '089.0622', 'extraction artefact: a bare «|» from the facsimile column, no text in the manuscript (tome13.docx ¶4963)')
q23 = take(p, '089.0623')
insert_after(p, '089.0615', [
    new("Cher baron, nous allons ce soir au cirque avec M. Gavini. Je connais l'horreur que vous inspire cet endroit et les cabotins qu'il renferme mais je compte sur votre abnégation pour être des nôtres. Amenez aussi votre jeune subalterne s'il n'est pas parti. M.B.",
        "The letter Marie wrote in a spiral, as transcribed beside its facsimile; the extraction had glued it to the end of 089.0621. tome13.docx ¶4962, Mon Journal t.13 p.352 (2026-09-28 rebuild).",
        kind='letter', source='Lettre de Marie Bashkirtseff au baron de Saint-Amand, 28 septembre 1880, écrite en spirale'),
    q23,
])

# 30 Sep / 1 Oct 1880: two date lines (printed p.356); the text stands under Vendredi 1er octobre
e, k, _ = find(p, '089.0658')
setf(p, '089.0658', "# Jeudi 30 septembre 1880\n[Aucun texte - date seule mentionnée]")
rest = e['paragraphs'][k + 1:]
del e['paragraphs'][k + 1:]
i = p['entries'].index(e)
p['entries'].insert(i + 1, {'file': '1880-10-01.md', 'date': '1880-10-01', 'heading': 'Vendredi 1er octobre 1880',
                            'frontmatter_from': '1880-09-30.md', 'paragraphs': rest})
save(p, '089')

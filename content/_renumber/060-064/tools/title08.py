"""Owner policy (handoff 2026-09-28 + applier brief addendum): Marie's own notes on title pages go in as `margin`
paragraphs at the carnet's first entry. Tome 8: only the Livre 60 title page carries such a note (docx ¶70, and
«[en travers] retrouvé» ¶71, Mon Journal t.8 p.21). The drafter put both before the heading paragraph 060.0001;
they move after it. Title formulas (Gloriae cupiditate / H[is] G[race]… / Livre N / depuis… jusqu'au… / addresses /
itineraries / Latin and Italian mottos) stay withdrawn (see REVIEW «Withdrawn cover pages»).
Edits common/plan-060.json in place; idempotent."""
import json, os
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
f = f'{W}/common/plan-060.json'
p = json.load(open(f))
e = p['entries'][0]
assert e['file'] == '1876-05-10.md'
SRC = 'note de Marie sur la page de titre du Livre 60'
if any((x.get('new') or {}).get('source') == SRC for x in e['paragraphs']):
    print('060 title note already done'); raise SystemExit
e['paragraphs'] = [x for x in e['paragraphs'] if not ('new' in x and ('¶70,' in x['new']['rsr'] or '¶71,' in x['new']['rsr']))]
k = next(i for i, x in enumerate(e['paragraphs']) if x.get('old') == '060.0001')
POL = "Restored in the 2026-09-29 rebuild (owner policy: Marie's own title-page notes go in)."
notes = [
  ("[Le] livre 59 est égaré ! ! Je suis épouvantée qu'on ne me l'ait volé. Mais qui ? ? Je viens de m'en apercevoir en lisant (1882). Il s'agit de mon départ de Naples à Rome et de Rome à Nice, il manque du 19 avril au 10 mai. Grâce à Dieu, pendant ce temps là je n'ai pas vu Antonelli, autrement on penserait que, quelque chose de vilain s'étant passé, j'ai supprimé le cahier. Mais c'est si drôle, où cela peut-il être perdu ?",
   f"Marie's note (written in 1882) on the title page of Livre 60, below the title lines; tome08.docx ¶70, Mon Journal t.8 p.21. OCR «égaré I !» read from the scan as «égaré ! !». {POL}"),
  ("[en travers] *retrouvé*",
   f"Marie's later word written across the Livre 60 title-page note (Livre 59 found again); tome08.docx ¶71, Mon Journal t.8 p.21. {POL}"),
]
for j, (fr, rsr) in enumerate(notes):
    e['paragraphs'].insert(k + 1 + j, {'new': {'kind': 'margin', 'source': SRC, 'french': fr, 'rsr': rsr}})
e.pop('heading', None)
json.dump(p, open(f, 'w'), ensure_ascii=False, indent=1)
print('060 +2 margin after 060.0001')

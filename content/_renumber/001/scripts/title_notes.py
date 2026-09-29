"""final -> final2: owner policy (handoff 2026-09-28) «Marie's own notes on title pages go in as margin/other at
the first entry» (cf. 080 «Femme nue»). Marie's notes on the title pages of Livres 2, 10, 12, 13 become `margin`
paragraphs right after the heading paragraph of the Livre's first entry. Title formulas («appartenant à Moi, une
bête de quatorze ans»), addresses and her mother's 1901 note on Livre 3 stay withdrawn."""
import json
from pathlib import Path
D = Path(__file__).resolve().parent / 'final2'
def src(n): return f'note de Marie sur la page de titre du Livre {n}'
def load(c): return json.load(open(D / f'plan-{c}.json'))
def save(c, p): json.dump(p, open(D / f'plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
def insert(p, file, after_old, para):
    e = next(e for e in p['entries'] if e['file'] == file)
    k = next(i for i, x in enumerate(e['paragraphs']) if x.get('old') == after_old)
    e['paragraphs'].insert(k + 1, para)
def undrop(p, pid):
    n = len(p['drop']); p['drop'] = [d for d in p['drop'] if d['id'] != pid]; assert len(p['drop']) == n - 1, pid
p = load('002')
insert(p, '1873-02-16.md', '002.0001', {'new': {'kind': 'margin', 'source': src(2),
    'french': "[Annotation: 1880. Je prie l’Editeur de supprimer dans ce livre et les suivants les redites sur le duc de Hamilton.]",
    'rsr': "Marie's 1880 annotation on the title page of Livre 2; tome01.docx ¶278. Restored in the 2026-09-28 rebuild (owner policy: Marie's own title-page notes go in).",
    'tags': ['[#Duke_of_Hamilton](../_glossary/people/core/DUKE_OF_HAMILTON.md)']}})
save('002', p)
p = load('010')
insert(p, '1873-09-23.md', '010.0001', {'new': {'kind': 'margin', 'source': src(10),
    'french': "Jour de mon plus grand malheur jusqu’à présent, et toujours.\nEn ce jour mes espérances sont brisées et pour être heureuse... Dieu seul peut me rendre heureuse !",
    'rsr': "Marie's note on the title page of Livre 10, under «terminé le lundi 13 octobre 1873, 10 heures un quart»: the day refers to 13 October. tome02.docx ¶2756–2757. Restored in the 2026-09-28 rebuild (owner policy: Marie's own title-page notes go in)."}})
save('010', p)
p = load('011'); undrop(p, '011.0450'); save('011', p)
p = load('012'); insert(p, '1873-11-01.md', '011.0451', {'old': '011.0450', 'kind': 'margin', 'source': src(12)}); save('012', p)
p = load('013'); undrop(p, '013.0006')
insert(p, '1873-11-21.md', '013.0001', {'old': '013.0006', 'kind': 'margin', 'source': src(13)}); save('013', p)
print('final2 written')

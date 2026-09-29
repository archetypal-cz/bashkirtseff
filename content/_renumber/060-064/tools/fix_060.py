#!/usr/bin/env python3
"""fix_060.py — reviewer edits for carnet 060: common/plan-060.json -> final/plan-060.json (re-runnable).
Paragraphs are identified by old ID or by the docx ¶ in a new paragraph's rsr, never by list index.
Every decision is explained in final/REVIEW-060.md."""
import json, re, sys, os
W = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(W, 'tools'))
from tk import orig

C = '060'
p = json.load(open(f'{W}/common/plan-{C}.json'))
O = orig(C)
log = []
WITHDRAWN = "title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)"

def para_id(x):
    if 'old' in x: return x['old']
    m = re.search(r'¶(\d+)', x['new']['rsr']); return '¶' + m.group(1) if m else None

def find(key):
    hits = [(e, x) for e in p['entries'] for x in e['paragraphs'] if para_id(x) == key]
    assert len(hits) == 1, (key, len(hits))
    return hits[0]

def old_text(i):
    return '\n'.join(O[i][1])

def drop(i, reason):
    e, x = find(i)
    e['paragraphs'].remove(x)
    p['drop'] = [d for d in p['drop'] if d['id'] != i] + [{'id': i, 'reason': reason}]
    log.append(f'drop {i}: {reason}')

def remove_new(key, why):
    e, x = find(key)
    assert 'new' in x
    e['paragraphs'].remove(x); log.append(f'remove new {key}: {why}')

def setkind(key, kind, source=None):
    e, x = find(key)
    t = x['new'] if 'new' in x else x
    t['kind'] = kind
    if source: t['source'] = source
    else: t.pop('source', None)
    x.pop('_kind_guess_reason', None)
    log.append(f'kind {key} -> {kind}' + (f' «{source}»' if source else ''))

def unkind(key):
    e, x = find(key)
    x.pop('kind', None); x.pop('source', None); x.pop('_kind_guess_reason', None)
    log.append(f'kind removed {key}')

def set_french(i, new, rsr):
    e, x = find(i)
    assert 'old' in x
    if old_text(i) == new: return
    x['set_french'] = new; x['_rsr'] = rsr
    log.append(f'set_french {i}: {rsr}')

def fix_old(i, pairs, rsr):
    t = old_text(i)
    for a, b in pairs:
        assert a in t, (i, a)
        t = t.replace(a, b)
    set_french(i, t, rsr)

def fix_new(key, pairs, note):
    e, x = find(key)
    n = x['new']
    for a, b in pairs:
        if a in n['french']:
            n['french'] = n['french'].replace(a, b)
        else:
            assert b in n['french'], (key, a)   # already fixed (re-run)
    if note not in n['rsr']:
        n['rsr'] = n['rsr'].rstrip() + ' ' + note
    log.append(f'OCR new {key}: {pairs}')

# --- drops -------------------------------------------------------------------------------------------
drop('060.0012', "printed running header of Mon Journal t.8 («ROME, MERCREDI 10 MAI 1876 - JEUDI 11 MAI 1876»), "
                 "not manuscript text (extraction artefact)")
# Livre 61 title page (docx ¶1044–1049, Mon Journal t.8 p.87) — the part that _original filed at the end of 060
drop('060.0884', WITHDRAWN + "; «Gloriae cupiditate» = docx ¶1044, Livre 61 title page, Mon Journal t.8 p.87")
remove_new('¶1045', 'Livre 61 title page «H[is] G[race] t[he] D[uke] o[f] H[amilton]» (withdrawn cover text)')

# --- kinds -------------------------------------------------------------------------------------------
unkind('060.0535')   # «— Monsieur, je vous préviens…» is dialogue, not a letter
fix_old('060.0003', [("*Car enfin", "*Car enfin"), ("rusanité [sic] . Plus", "rusanité* [sic]. *Plus"),
                     ("des i*diots !", "des idiots !*")],
        "Italic markup repaired from Mon Journal t.8 p.21 (whole paragraph printed in italics = Marie's later "
        "annotation); kind margin (2026-09-29 rebuild).")
setkind('060.0003', 'margin', 'Annotation de Marie')
fix_old('060.0004', [("[en travers DE la page]", "[en travers de la page]"), ("Le Bon. Dieu", "Le Bon Dieu")],
        "OCR «Le Bon. Dieu» corrected from Mon Journal t.8 p.22; kind margin, annotation dated 1881 (2026-09-29 rebuild).")
setkind('060.0004', 'margin', 'Annotation de Marie, 1881')
set_french('060.0071', "*1881. Je suis agaçante.*",
           "Completed from tome08.docx ¶146 / Mon Journal t.8 p.27: the annotation after «[annotation]» reads "
           "«1881. Je suis agaçante.» in italics; kind margin (2026-09-29 rebuild).")
setkind('060.0071', 'margin', 'Annotation de Marie, 1881')
setkind('060.0151', 'margin')      # «[en travers de la page] Par des coups de poing ?»
setkind('¶388', 'editorial')       # the edition's label «[en travers de la page]»
setkind('060.0308', 'margin', 'Annotation de Marie')   # italic text written across the page, p.50
fix_old('060.0811', [("mots : Je vous aime* et je", "mots :* Je vous aime *et je"),
                     ("inconscients.", "inconscients.*")],
        "Italic markup repaired from Mon Journal t.8 p.81 (annotation printed in italics, «Je vous aime» in roman); "
        "kind margin (2026-09-29 rebuild).")
setkind('060.0811', 'margin', 'Annotation de Marie')
set_french('060.0880',
           "*Ce qu'il y a de* remarquable *et aussi* d'incroyable *c'est que ma tante ne se doutait pas de la "
           "signification de cette invitation de venir à Nice. Elle l'invitait* moitié *par politesse* moitié "
           "*comme un des nombreux malheureux que devait faire ma beauté triomphante. Ce petit épisode peut donner "
           "une idée de toute la conduite de ma primitive famille. Et puis lorsqu'on dira que... on s'étonnera. Zut !*",
           "Italic markup repaired from Mon Journal t.8 p.85 (annotation printed in italics, emphasised words in "
           "roman); OCR «c 'est» corrected; kind margin (2026-09-29 rebuild).")
setkind('060.0880', 'margin', 'Annotation de Marie')

# --- inline [annotation] inside 060.0572: kept inline (splitting would cut «il voulut me baiser … la main») --
fix_old('060.0572', [("vous voulez 1 Consentez", "vous voulez ! Consentez"),
                     ("baiser[ANNOTATION] *Ce n 'est", "baiser [annotation] *Ce n'est")],
        "OCR «1»→«!» and «n 'est» corrected from Mon Journal t.8 p.70; Marie's inline annotation kept inside the "
        "paragraph as printed (2026-09-29 rebuild).")

# --- 060.0156 opens the new entry 1876-05-14.md (split at docx ¶232): heading level ## -> # like every other day --
e, x = find('060.0156')
if x.get('set_french') != "# Dimanche 14 mai 1876":
    x['set_french'] = "# Dimanche 14 mai 1876"
    x['_rsr'] = ("Date line of docx ¶232 (Mon Journal t.8 p.34) now opens its own entry 1876-05-14.md: heading level "
                 "## raised to # (2026-09-29 rebuild).")
    log.append('set_french 060.0156: ## -> # (first heading of new entry 1876-05-14.md)')

# --- OCR slips in old text (printed reading checked) ----------------------------------------------------
OCR = "OCR slip corrected to the printed reading of Mon Journal t.8 p.{} (2026-09-29 rebuild)."
fix_old('060.0002', [("Tchemichoff", "Tchernichoff")], OCR.format(21))
fix_old('060.0033', [("Qn est", "On est")], OCR.format(25))
fix_old('060.0073', [("le monde 1 I !", "le monde ! ! !")], OCR.format(28))
fix_old('060.0250', [("com 'è", "com'è")], OCR.format(46))
fix_old('060.0346', [("Monsieur 1", "Monsieur !")], OCR.format(52))
fix_old('060.0365', [("Oui 1", "Oui !")], OCR.format(53))
fix_old('060.0504', [("qu 'est", "qu'est")], OCR.format(63))
fix_old('060.0514', [("n 'avoir", "n'avoir")], OCR.format(67))
fix_old('060.0751', [("n 'avais", "n'avais")], OCR.format(78))
fix_old('060.0780', [("jusqu 'à", "jusqu'à")], OCR.format(79))

# --- OCR slips in new text ---------------------------------------------------------------------------
fix_new('¶600', [("c'est de ' l'insensibilité", "c'est de l'insensibilité")],
        "Stray apostrophe (OCR) removed after Mon Journal t.8 p.63.")
fix_new('¶610', [("— Hé I Je", "— Hé ! Je")], "OCR «I»→«!» corrected from Mon Journal t.8 p.64.")

p.pop('_draft', None)
os.makedirs(f'{W}/final', exist_ok=True)
json.dump(p, open(f'{W}/final/plan-{C}.json', 'w'), ensure_ascii=False, indent=1)
open(f'{W}/final/fix-{C}.log', 'w').write('\n'.join(log) + '\n')
print(f'{C}: {len(log)} edits -> final/plan-{C}.json')

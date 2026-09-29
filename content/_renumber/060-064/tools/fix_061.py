#!/usr/bin/env python3
"""fix_060.py — reviewer edits for carnet 061: common/plan-061.json -> final/plan-061.json (re-runnable).
Paragraphs are identified by old ID or by the docx ¶ in a new paragraph's rsr, never by list index.
Every decision is explained in final/REVIEW-061.md."""
import json, re, sys, os
W = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(W, 'tools'))
from tk import orig

C = '061'
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

# --- first entry: two-day date line, keep the old range file name ------------------------------------
e0 = p['entries'][0] if p['entries'][0]['file'] in ('1876-05-21.md', '1876-05-21-22.md') else None
assert e0 is not None
e0['file'] = '1876-05-21-22.md'
e0['heading'] = 'Dimanche 21 mai 1876 - lundi 22 mai 1876'
log.append('entry 1876-05-21.md -> 1876-05-21-22.md (old _original name; docx ¶1050 two-day date line)')

# --- Livre 61 title page (docx ¶1046–1049, Mon Journal t.8 p.87): withdrawn -----------------------------
drop('061.0002', WITHDRAWN + "; «Depuis le dimanche 21 mai 1876 / jusqu'au dimanche 28 mai 1876 / Un jour à Gènes, "
                             "hôtel de Londres, puis Nice.» = docx ¶1047, Livre 61 title page, Mon Journal t.8 p.87")
drop('061.0003', WITHDRAWN + "; motto «Amans ita ut fax, agitando ardescit magis» = docx ¶1048, Livre 61 title page, "
                             "Mon Journal t.8 p.87")
drop('061.0004', WITHDRAWN + "; «Publius Syrus» (author of the motto) = docx ¶1049, Livre 61 title page, Mon Journal t.8 p.87")
remove_new('¶1048', 'Livre 61 title-page motto «Amans ita ut fax…» / «Publius Syrus» (withdrawn cover text; '
                    'duplicate of 061.0003–0004)')
# --- Livre 62 title page begins at the end of 061 (docx ¶1348, Mon Journal t.8 p.117) --------------------
drop('061.0216', WITHDRAWN + "; «Gloriae cupiditate / H[is] G[race] t[he] D[uke] o[f] H[amilton]» = docx ¶1348, "
                             "Livre 62 title page, Mon Journal t.8 p.117")
drop('061.0217', "empty cluster (only an entry-level RSR summary; the en text «[End of Cahier 61]» is a placeholder, "
                 "not manuscript text)")

# --- drafter completion of 061.0029 would duplicate 061.0030 (docx ¶1075 split over two clusters) ---------
e, x = find('061.0029')
if 'set_french' in x:
    del x['set_french']; x.pop('_rsr', None)
    log.append('set_french removed 061.0029: the docx ¶1075 remainder is 061.0030 (would duplicate)')

# --- OCR slips in old text (printed reading checked) ----------------------------------------------------
OCR = "OCR slip corrected to the printed reading of Mon Journal t.8 p.{} (2026-09-29 rebuild)."
fix_old('061.0013', [("Bon Dieu 1 Faut", "Bon Dieu ! Faut")], OCR.format(88))
fix_old('061.0021', [("tout cela 1", "tout cela !")], OCR.format(89))
fix_old('061.0101', [("sollicitude[^6] 1 En", "sollicitude[^6] ! En")], OCR.format(98))
fix_old('061.0182', [("Ville Étemelle", "Ville Éternelle")], OCR.format(111))
fix_old('061.0205', [("plaisir 1 et", "plaisir ! et"), ("*et puis,}*", "*et puis,*)")], OCR.format(114))

# --- OCR slips / typos in new text ----------------------------------------------------------------------
fix_new('¶1135', [("mais., mais", "mais... mais")],
        "Printed «mais.. mais» (typesetting slip, Mon Journal t.8 p.94) corrected to «mais... mais».")
fix_new('¶1218', [("Croyez- vous", "Croyez-vous")], "Line-break «Croyez- vous» joined (Mon Journal t.8 p.101).")
fix_new('¶1220', [("soi- même", "soi-même")], "Line-break «soi- même» joined (Mon Journal t.8 p.101).")
fix_new('¶1232', [("pas 1& temps", "pas le temps")], "OCR «1&»→«le» corrected from Mon Journal t.8 p.103.")
fix_new('¶1234', [("amour- propre", "amour-propre")], "Line-break «amour- propre» joined (Mon Journal t.8 p.103).")

p.pop('_draft', None)
os.makedirs(f'{W}/final', exist_ok=True)
json.dump(p, open(f'{W}/final/plan-{C}.json', 'w'), ensure_ascii=False, indent=1)
open(f'{W}/final/fix-{C}.log', 'w').write('\n'.join(log) + '\n')
print(f'{C}: {len(log)} edits -> final/plan-{C}.json')

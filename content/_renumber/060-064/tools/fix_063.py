#!/usr/bin/env python3
"""fix_063.py — scripted review edits: common/plan-063.json -> final/plan-063.json (re-runnable).

Paragraphs are identified by old ID or by the docx ¶ in a new paragraph's rsr, never by list index.
Decisions are documented in final/REVIEW-063.md.
"""
import json, re, sys
from pathlib import Path

W = Path(__file__).resolve().parent.parent
SRC = W / 'common/plan-063.json'
DST = W / 'final/plan-063.json'
p = json.loads(SRC.read_text())
E = p['entries']
LOG = []

WITHDRAWN = "title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)"


def entry(name):
    for e in E:
        if e['file'] == name:
            return e
    sys.exit(f'no entry {name}')


def find_old(i):
    for e in E:
        for k, q in enumerate(e['paragraphs']):
            if q.get('old') == i:
                return e, k, q
    sys.exit(f'old {i} not found')


def paras_of_new(q):
    m = re.search(r'¶([\d–]+)', q['new']['rsr'])
    return m.group(1) if m else None


def find_new(para):
    """para: docx ¶ as string ('3155' or '3100–3101')."""
    for e in E:
        for k, q in enumerate(e['paragraphs']):
            if 'new' in q and paras_of_new(q) == para:
                return e, k, q
    sys.exit(f'new ¶{para} not found')


def take(q):
    for e in E:
        for k, x in enumerate(e['paragraphs']):
            if x is q:
                del e['paragraphs'][k]
                return q
    sys.exit('take: not found')


def insert_after(anchor, items):
    for e in E:
        for k, x in enumerate(e['paragraphs']):
            if x is anchor:
                e['paragraphs'][k + 1:k + 1] = items
                return
    sys.exit('insert_after: anchor not found')


def drop(i, reason):
    _, _, q = find_old(i)
    take(q)
    p.setdefault('drop', []).append({'id': i, 'reason': reason})
    LOG.append(f'drop {i}: {reason}')


def rsr_add(q, text):
    r = q['new']['rsr']
    q['new']['rsr'] = r[:-1] + ' ' + text + r[-1] if r.endswith('.') else r + ' ' + text


def newp(french, rsr, **kw):
    n = {'french': french, 'rsr': rsr}
    n.update(kw)
    return {'new': n}


# ---------------------------------------------------------------- entries / headings
e = entry('1876-07-04.md')
e['file'] = '1876-07-04-05.md'          # keep the old range file name (Conventions §5)
e['heading'] = 'Mardi 4 juillet 1876 - mercredi 5 juillet 1876'   # docx ¶2799 date line
LOG.append('first entry renamed 1876-07-04.md -> 1876-07-04-05.md, heading = two-day date line (docx ¶2799)')

entry('1876-07-11.md')['frontmatter_from'] = '1876-07-12.md'

# ---------------------------------------------------------------- 4/5 July tail, 6 July start
_, _, q = find_old('063.0049')
q['set_french'] = 'Effroyable néant, désespérante nullité !'
q['_rsr'] = ('Heading «Jeudi 6 juillet 1876» removed: in tome08.docx (¶2849–2851, Mon Journal t.8 p.252) this line and '
             '«Rien, rien !» close the entry of 4–5 July; the 6 July date line comes after them (2026-09-29 rebuild).')
drop('063.0051', 'extraction artefact: a «---» separator line, not manuscript text (tome08.docx has nothing between ¶2850 and ¶2851 but the date line)')
_, _, q52 = find_old('063.0052')
take(q52)
e6 = entry('1876-07-06.md')
e6['paragraphs'].insert(0, q52)          # first half of docx ¶2852 -> opens 6 July
_, _, q53 = find_old('063.0053')
q53.pop('set_french', None)              # drafter's completion duplicated 063.0052
LOG.append('063.0052 moved to the start of 1876-07-06.md; set_french on 063.0053 removed (would duplicate 063.0052)')

# ---------------------------------------------------------------- 12 July
_, _, q = find_old('063.0133')
q['set_french'] = '# Mercredi 12 juillet 1876'
q['_rsr'] = ('«SOIXANTE-TROISIÈME CAHIER» removed: it is the printed running head of Mon Journal t.8 p.268, '
             'not manuscript text (2026-09-29 rebuild).')

_, _, q145 = find_old('063.0145')
take(q145)
_, _, q141 = find_old('063.0141')
insert_after(q141, [q145])
q145['kind'] = 'margin'
q145['source'] = "Note de Marie, renvoi ¹ après «table d'hôte»"
LOG.append('063.0145 (Marie\'s own note, printed as footnote p.268) -> margin, placed right after 063.0141 which carries the ¹ call')

_, _, q = find_old('063.0134')
assert q['set_french'].startswith("Collignon a dit")
q['_rsr'] = ('Completed from tome08.docx ¶2971, Mon Journal t.8 pp.267–268: the first half of the paragraph '
             '(«Collignon a dit…») had been lost at the page break (2026-09-29 rebuild).')

# ---------------------------------------------------------------- 18/19 July: 063.0344 back to 19 July
_, _, q = find_new('3330')
take(q)
LOG.append('new ¶3330 «— Et il sera pape ?» removed: 063.0232 is that line')
_, _, q344 = find_old('063.0344')
take(q344)
_, _, q343 = find_old('063.0343')
insert_after(q343, [q344])
LOG.append('063.0344 put back after 063.0343 in 1876-07-19.md (it is docx ¶3443, the passage Marie re-copies on 19 July)')

_, _, q = find_new('3373')
take(q)
LOG.append('new ¶3373 «Soixante-troisième cahier» removed: printed running head (p.296)')

_, _, q = find_old('063.0342')
q['set_french'] = '# Mercredi 19 juillet 1876'
q['_rsr'] = 'Heading comma removed to match the date line in tome08.docx ¶3441 / Mon Journal t.8 p.300 (2026-09-29 rebuild).'

# ---------------------------------------------------------------- kinds
_, _, q = find_old('063.0347')
q.pop('kind', None); q.pop('source', None); q.pop('_kind_guess_reason', None)
_, _, q = find_old('063.0499')
q.pop('_kind_guess_reason', None)
_, _, q = find_new('3130')
q['new']['french'] = '[une ligne rayée]'
q['new']['kind'] = 'rayé'
rsr_add(q, 'Whole struck line; trailing period of the print dropped.')

# ---------------------------------------------------------------- Livre 64 title page at the end
drop('063.0500', WITHDRAWN + '; this is the Livre 64 title page (tome08.docx ¶3599, Mon Journal t.8 p.309)')

# ---------------------------------------------------------------- page-break joins / splits in new text
_, _, q = find_new('2963–2964')
q['new']['french'] = q['new']['french'].replace("*Si quelqu 'un se contente de*\n*peu,", "*Si quelqu'un se contente de peu,").replace('au- dessus', 'au-dessus')
assert '\n' not in q['new']['french']
rsr_add(q, 'Page-break split rejoined; OCR «quelqu \'un», «au- dessus» corrected from the scan (pp.266–267).')

_, _, q = find_new('3100–3101')
a, b = q['new']['french'].split('\n')
insert_after(q, [newp(a, 'Restored from tome08.docx ¶3100, Mon Journal t.8 p.279 (missing from original extraction, 2026-09-29 rebuild). No final period after «protecteur», as printed.'),
                 newp(b, 'Restored from tome08.docx ¶3101, Mon Journal t.8 p.279 (missing from original extraction, 2026-09-29 rebuild).')])
take(q)

_, _, q = find_new('3199–3200')
a, b = q['new']['french'].split('\n')
assert a == '— Je vois 1'
insert_after(q, [newp('— Je vois !', 'Restored from tome08.docx ¶3199, Mon Journal t.8 p.286 (missing from original extraction, 2026-09-29 rebuild). OCR «1» corrected to «!» from the scan.'),
                 newp(b, 'Restored from tome08.docx ¶3200, Mon Journal t.8 p.286 (missing from original extraction, 2026-09-29 rebuild).')])
take(q)

_, _, q = find_new('3262–3263')
a, b = q['new']['french'].split('\n')
assert a.endswith('énergie I')
insert_after(q, [newp(a[:-1] + '!', 'Restored from tome08.docx ¶3262, Mon Journal t.8 p.289 (missing from original extraction, 2026-09-29 rebuild). OCR «I» corrected to «!» from the scan.'),
                 newp(b, 'Restored from tome08.docx ¶3263, Mon Journal t.8 p.289 (missing from original extraction, 2026-09-29 rebuild).')])
take(q)

# ¶3154 + ¶3156 are one paragraph cut by the page break and the edition's footnote ¶3155
_, _, q54 = find_new('3154')
_, _, q55 = find_new('3155')
_, _, q56 = find_new('3156')
q54['new']['french'] = q54['new']['french'] + ' ' + q56['new']['french']
q54['new']['rsr'] = ('Restored from tome08.docx ¶3154 + ¶3156, Mon Journal t.8 pp.283–284 (missing from original extraction, 2026-09-29 rebuild). '
                     'One paragraph cut by the page break and the edition\'s footnote (¶3155), rejoined.')
take(q55); take(q56)
LOG.append('new ¶3155 «Nihil ante, nihil post : est-ce cela ?» removed: the printed edition\'s own footnote (p.283)')

# ---------------------------------------------------------------- OCR / typo fixes in new text (Conventions §6)
FIX = [
    ('2949–2950', 'à Paris I Et', 'à Paris ! Et', 'OCR «I» corrected to «!» from the scan (p.265).'),
    ('2954', 'font pomme une auréole', 'font comme une auréole', 'OCR «pomme» corrected to «comme» from the scan (p.265).'),
    ('2967', 'la Prodgefs', 'la Prodgers', 'OCR «Prodgefs» corrected to «Prodgers» from the scan (p.267).'),
    ('2969', 'moi- même', 'moi-même', 'Line-break hyphen «moi- même» joined (p.267).'),
    ('3023', '- Ah I ha !', '- Ah ! ha !', 'OCR «I» corrected to «!» from the scan (p.275).'),
    ('3042', 'faites-moi mourir 1', 'faites-moi mourir !', 'OCR «1» corrected to «!» from the scan.'),
    ('3140', 'sert- elle', 'sert-elle', 'Line-break hyphen «sert- elle» joined (p.282).'),
    ('3152', "- « Rien avant, rien après » '.", '— « Rien avant, rien après ».', 'The call of the edition\'s footnote (¶3155) after «Rien avant, rien après» removed (p.283).'),
    ('3160', 'somnanbule', 'somnambule', 'Printed «somnanbule» (p.284) corrected to «somnambule» as a typesetting typo.'),
    ('3255', '— Non I vous', '— Non ! vous', 'OCR «I» corrected to «!» from the scan (p.288).'),
    ('3266', 'dévergondé 1 Oh I oui', 'dévergondé ! Oh ! oui', 'OCR «1», «I» corrected to «!» from the scan (p.290).'),
    ('3266', '[moti *rayés]*', '[mots rayés]', 'OCR «[moti rayés]» corrected to «[mots rayés]» (p.290).'),
    ('3269', 'étemel', 'éternel', 'OCR «étemel» corrected to «éternel» from the scan (p.290).'),
]
for para, old, new, note in FIX:
    _, _, q = find_new(para)
    assert old in q['new']['french'], (para, old)
    q['new']['french'] = q['new']['french'].replace(old, new)
    rsr_add(q, note)

# ---------------------------------------------------------------- dialogue dashes: «- » -> «— » in new text
nd = 0
for e in E:
    for q in e['paragraphs']:
        if 'new' in q and re.match(r'^- ', q['new']['french']):
            q['new']['french'] = '— ' + q['new']['french'][2:]
            nd += 1
LOG.append(f'dialogue dash «- » -> «— » at the start of {nd} new paragraphs')

# ---------------------------------------------------------------- sanity
seen = set()
for e in E:
    for q in e['paragraphs']:
        if 'old' in q:
            assert q['old'] not in seen, q['old']; seen.add(q['old'])
        else:
            assert '\n' not in q['new']['french'] or q['new'].get('kind'), q
            assert not re.search(r'(?<![A-Za-z])[1I] ?[!?]|\b1$', q['new']['french']), q['new']['french'][:80]

p['_review'] = 'final plan for 063 built by tools/fix_063.py from common/plan-063.json (2026-09-29); see final/REVIEW-063.md'
DST.parent.mkdir(exist_ok=True)
DST.write_text(json.dumps(p, ensure_ascii=False, indent=1) + '\n')
for l in LOG:
    print('-', l)
print('wrote', DST)

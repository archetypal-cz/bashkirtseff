"""Reviewer edits for carnet 064: common/plan-064.json -> final/plan-064.json (re-runnable).
Paragraphs are found by old ID or by the docx ¶ in a new paragraph's rsr, never by list index.
python3 fix_064.py"""
import json, os, re, sys, copy

W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
p = json.load(open(f'{W}/common/plan-064.json'))
WITHDRAW = 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)'


def entry(fn):
    for e in p['entries']:
        if e['file'] == fn:
            return e
    raise KeyError(fn)


def find_old(i):
    for e in p['entries']:
        for k, x in enumerate(e['paragraphs']):
            if x.get('old') == i:
                return e, k, x
    raise KeyError(i)


def find_new(para):
    pat = re.compile(r'¶%d\b' % para)
    for e in p['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'new' in x and pat.search(x['new']['rsr']):
                return e, k, x
    raise KeyError(para)


def remove_old(i):
    e, k, x = find_old(i)
    del e['paragraphs'][k]
    return x


def drop(i, reason):
    remove_old(i)
    if not any(d['id'] == i for d in p['drop']):
        p['drop'].append({'id': i, 'reason': reason})


def set_kind_old(i, kind=None, source=None):
    _, _, x = find_old(i)
    x.pop('_kind_guess_reason', None)
    x.pop('kind', None); x.pop('source', None)
    if kind:
        x['kind'] = kind
        if source:
            x['source'] = source


def fix_new(para, old=None, new=None, kind='keep', source=None, note=None):
    _, _, x = find_new(para)
    n = x['new']
    if old is not None:
        assert old in n['french'], (para, old, n['french'])
        n['french'] = n['french'].replace(old, new)
    if kind != 'keep':
        n.pop('kind', None); n.pop('source', None)
        if kind:
            n['kind'] = kind
            if source:
                n['source'] = source
    if note and note not in n['rsr']:
        n['rsr'] = n['rsr'].rstrip() + ' ' + note
    return n


def set_french(i, text, why):
    _, _, x = find_old(i)
    x['set_french'] = text
    x['_rsr'] = why


# 1. Livre 64 title page (docx ¶3599–3605, p.309): old 064.0002–0007 withdrawn
for n in range(2, 8):
    drop('064.%04d' % n, WITHDRAW)

# 2. extraction artefacts: horizontal rules not in the manuscript/print
for i, where in (('064.0373', 'p.342, between «Sainte Marie priez pour moi.» and «Mardi 1er août 1876»'),
                 ('064.0424', 'p.348–349, where the print has the «[annotation]» note of ¶4041–4042')):
    drop(i, f'extraction artefact: a «---» rule that is not in tome08.docx nor in Mon Journal t.8 ({where}) (2026-09-29 rebuild)')

# 3. «Paul de Cassagnac.» (docx ¶3667, p.315) ends 22 July, before ¶3668 «Yssayevitch…»
x = remove_old('064.0067')
e, k, _ = find_old('064.0068')
e['paragraphs'].insert(k, x)

# 4. kinds on old paragraphs
set_kind_old('064.0049', 'editorial')           # «[EN TRAVERS DE LA PAGE]» edition label (docx ¶3650, p.313)
set_kind_old('064.0050', 'margin', 'Annotation de Marie, en travers de la page')
for i in ('064.0097', '064.0120', '064.0121'):   # dialogue openers, not letters
    set_kind_old(i)
for i in ('064.0079', '064.0147', '064.0177', '064.0214', '064.0247', '064.0337', '064.0471'):
    set_kind_old(i, 'rayé')                      # standalone «[… rayé(e)s / cancellées]» paragraphs
set_kind_old('064.0456', 'editorial')           # «*[Quatre mots latins dépourvus de sens.]*» docx ¶4076
set_kind_old('064.0542', 'editorial')           # «[pièce jointe]» docx ¶4164 (proclamation not reproduced)

# 5. ¶3744 «[annotation] Déjà !» -> editorial label + margin note, like the other annotations
e, k, x = find_new(3744)
rsr = x['new']['rsr']
e['paragraphs'][k:k + 1] = [
    {'new': {'french': '[annotation]', 'rsr': rsr, 'kind': 'editorial'}},
    {'new': {'french': '*Déjà !*', 'rsr': rsr, 'kind': 'margin', 'source': 'Annotation de Marie'}},
]
# ¶3765 «Hum I» = Marie's annotation «Hum !» (italic, p.324)
fix_new(3765, '*Hum* I', '*Hum !*', kind='margin', source='Annotation de Marie',
        note='OCR «Hum I» corrected to «Hum !» from the scan.')

# 6. 4 August: «style russe)» is the tail of the one date line ¶4008 (p.344), not text
e, k, _ = find_new(4008)
del e['paragraphs'][k]
entry('1876-08-04.md')['heading'] = 'Vendredi 4 août 1876 (23 juillet, style russe)'

# 7. 26–27 July: one date line (¶3865) -> keep the old range file name
e = entry('1876-07-26.md')
e['file'] = '1876-07-26-27.md'
e.pop('redirect_from', None)
e['heading'] = 'Mercredi 26 juillet 1876 - jeudi 27 juillet 1876'

# 8. 5 / 6 August: separate date lines ¶4034, ¶4043 -> split the range heading
set_french('064.0417', '# Samedi, 5 août 1876 (24 juillet 1876)',
           'Heading split: tome08.docx has separate date lines for 5 August (¶4034) and 6 August (¶4043, Mon Journal t.8 p.349); 6 August is now its own entry (2026-09-29 rebuild).')
e = entry('1876-08-05.md'); e['heading'] = 'Samedi 5 août 1876 (24 juillet 1876)'; e['redirect_from'] = ['1876-08-05-06.md']
entry('1876-08-06.md')['heading'] = 'Dimanche 6 août 1876 (25 juillet)'

# 9. 8 / 9 August: separate date lines ¶4072, ¶4084 (p.354, not bracketed)
set_french('064.0452', '# Mardi, 8 août 1876 (27 juillet)',
           'Heading split: tome08.docx has separate date lines for 8 August (¶4072) and 9 August (¶4084, Mon Journal t.8 p.354); 9 August is now its own entry (2026-09-29 rebuild).')
x = remove_old('064.0464')
x['set_french'] = '# Mercredi, 9 août 1876 (28 juillet)'
x['_rsr'] = 'Date line as printed in Mon Journal t.8 p.354 (tome08.docx ¶4084), without the brackets of the old extraction; it now opens the 9 August entry (2026-09-29 rebuild).'
entry('1876-08-09.md')['paragraphs'].insert(0, x)
e = entry('1876-08-08.md'); e['heading'] = 'Mardi 8 août 1876 (27 juillet)'; e['redirect_from'] = ['1876-08-08-09.md']
entry('1876-08-09.md')['heading'] = 'Mercredi 9 août 1876 (28 juillet)'

# 10. 11 / 12 August: two stacked date lines (¶4143–4144, p.361) with no text under 11 August.
# Owner policy (empty days get separate «[Aucun texte…]» entries; lead applier 2026-09-29): 11 August is its own entry.
set_french('064.0522', "# Vendredi, 11 août 1876 (30 juillet)\n[Aucun texte - date seule mentionnée]",
           'Heading split: tome08.docx has separate date lines for 11 August (¶4143) and 12 August (¶4144), Mon Journal t.8 p.361, with no text under 11 August; 12 August is now its own entry (2026-09-29 rebuild).')
entry('1876-08-11.md')['heading'] = 'Vendredi 11 août 1876 (30 juillet)'
e = entry('1876-08-12.md'); e['heading'] = 'Samedi 12 août 1876 (31 juillet 1876)'; e['redirect_from'] = ['1876-08-11-12.md']
entry('1876-08-11.md').pop('redirect_from', None)

# 11. 13–16 August: headings as printed; Chpatowoka frontmatter for the new days
entry('1876-08-13.md')['heading'] = 'Dimanche 13 août (1er août 1876)'
entry('1876-08-14.md')['heading'] = 'Lundi 14 août (2 août 1876)'
e = entry('1876-08-15.md'); e['heading'] = 'Mardi 15 août (3 août 1876)'; e['frontmatter_from'] = '1876-08-14.md'
e = entry('1876-08-16.md'); e['heading'] = 'Mercredi 16 août (4 août 1876)'; e['frontmatter_from'] = '1876-08-14.md'

# 12. new text: dialogue dashes and OCR slips, checked on the scan
DASH = 'Dialogue dash «—» as printed.'
for para in (4186, 4191, 4194, 4195, 4196, 4249):
    n = find_new(para)[2]['new']
    if n['french'].startswith('- '):
        n['french'] = '— ' + n['french'][2:]
        n['rsr'] = n['rsr'].rstrip() + ' ' + DASH
    assert n['french'].startswith('— '), para
OCR = [
    (4221, 'il y a un an 1 II y a un an', 'il y a un an ! Il y a un an', 'OCR «1 II» corrected to «! Il» from the scan (p.372).'),
    (4226, "lorsqu'on passant", "lorsqu'en passant", "OCR «lorsqu'on» corrected to «lorsqu'en» from the scan (p.372)."),
    (4230, 'Ah 1 que', 'Ah ! que', 'OCR «Ah 1» corrected to «Ah !» from the scan (p.373).'),
    (4232, 'jè veux', 'je veux', 'OCR «jè» corrected to «je» from the scan (p.373).'),
    (4237, 'An- tiquité', 'Antiquité', 'Line-break hyphen «An- tiquité» removed.'),
    (4248, 'Zan- kowski', 'Zankowski', 'Line-break hyphen «Zan- kowski» removed.'),
    (4263, 'Yakow- leff', 'Yakowleff', 'Line-break hyphen «Yakow- leff» removed.'),
    (4266, 'parfait 1 Mais', 'parfait ! Mais', 'OCR «parfait 1» corrected to «parfait !» from the scan (p.376).'),
    (4283, 'de Girofla *.', 'de Girofla.', "The edition's footnote asterisk after «Girofla» removed."),
]
for para, a, b, note in OCR:
    fix_new(para, a, b, note=note)
# last page (p.377): struck lines, then Marie's topic notes (not a clipping)
fix_new(4281, '[HUIT LIGNES CANCELLÉES] ,', '[HUIT LIGNES CANCELLÉES]', kind='rayé',
        note='Stray «,» (a speck on the scan) removed.')
fix_new(4282, "corresp. serbe, interventions humaines, l'âme en Serbie.",
        "corresp. serbe. interventions humaines. l'âme en Serbie.", kind=None,
        note='Punctuation as printed (full stops); Marie\'s notes on the last page, not a clipping.')

# tidy: drafter guess reasons on paragraphs whose kind was reviewed
for e in p['entries']:
    for x in e['paragraphs']:
        x.pop('_kind_guess_reason', None)
p['_draft'] = 'final plan 064: common/plan-064.json + tools/fix_064.py (review 2026-09-29, see final/REVIEW-064.md)'

os.makedirs(f'{W}/final', exist_ok=True)
json.dump(p, open(f'{W}/final/plan-064.json', 'w'), ensure_ascii=False, indent=1)
nold = sum(1 for e in p['entries'] for x in e['paragraphs'] if 'old' in x)
nnew = sum(1 for e in p['entries'] for x in e['paragraphs'] if 'new' in x)
nsf = sum(1 for e in p['entries'] for x in e['paragraphs'] if 'set_french' in x)
kinds = {}
for e in p['entries']:
    for x in e['paragraphs']:
        k = x.get('kind') or x.get('new', {}).get('kind')
        if k:
            kinds[k] = kinds.get(k, 0) + 1
print(f"entries {len(p['entries'])}, old placed {nold}, dropped {len(p['drop'])}, new {nnew}, set_french {nsf}, kinds {kinds}")

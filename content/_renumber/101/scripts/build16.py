"""Final rebuild plans for tome 16 (carnets 101–106), from the drafts in ../draft16b
(drafted by draftwrap16.py, which hides the duplicate August block 106.0143–0418).

Run: python3 build16.py  → plan-101.json … plan-106.json + build.log + headmoves.json here.
Every edit below is a judgement recorded in REVIEW.md.
"""
from lib16 import *
from common import parse_heading

CARNETS16 = CARNETS
COVER = 'title page of the notebook (Livre heading, dates, address): cover pages are withdrawn (owner policy 2026-09-28); text kept in REVIEW.md «withdrawn cover pages»'
KERN = 'page number of the Kernberger edition («209» …), an artefact of the first import, not manuscript text (2026-09-28 rebuild)'
TYPO = {'Merecredi': 'Mercredi', 'Merredi': 'Mercredi', 'Samdi': 'Samedi', 'septembe ': 'septembre '}
KEEP_HEAD = {'106.0142', '105.0786'}  # Marie's (or the printer's) date slips: heading kept as written
TRAILS = []      # trailing date lines stripped from an old paragraph: postfix moves the translated line to the day's entry
PROMOTE = []
INNER = []      # a date line inside an old paragraph that is now its «# heading» (translations: move it up)
from common import norm     # old paragraphs that became «# date» headings (translations: prefix «# »)


def canon(line):
    s = line.strip().lstrip('#').strip()
    for a, b in TYPO.items():
        s = s.replace(a, b)
    s = re.sub(r'(?<=\d) (?=\d)', '', s)
    return s


def dateof(line):
    s = canon(line)
    h = parse_heading(s, None)
    if h and not h['rest']:
        return h['date'], s
    return None, s


def all_entries():
    for c in CARNETS16:
        for e in plans[c]['entries']:
            yield c, e


def entry_by_date(d, name=None):
    hits = [(c, e) for c, e in all_entries() if e['date'] == d and (name is None or e['file'] == name)]
    return hits


def split_entry(c, first_key, fname, date, heading=None, frontmatter_from=None, redirect_from=None):
    """move first_key and everything after it in its entry into a new entry (inserted after it)."""
    cc, ei, pi = loc_old(first_key) if isinstance(first_key, str) else loc_new(first_key)
    assert cc == c, (cc, c)
    e = plans[c]['entries'][ei]
    ne = {'file': fname, 'date': date, 'paragraphs': e['paragraphs'][pi:]}
    if heading:
        ne['heading'] = heading
    if frontmatter_from:
        ne['frontmatter_from'] = frontmatter_from
    if redirect_from:
        ne['redirect_from'] = redirect_from
    e['paragraphs'] = e['paragraphs'][:pi]
    plans[c]['entries'].insert(ei + 1, ne)
    return ne


def new_entry(c, after_file, fname, date, heading, paragraphs, frontmatter_from=None, redirect_from=None):
    idx = [k for k, e in enumerate(plans[c]['entries']) if e['file'] == after_file][0]
    ne = {'file': fname, 'date': date, 'heading': heading, 'paragraphs': paragraphs}
    if frontmatter_from:
        ne['frontmatter_from'] = frontmatter_from
    if redirect_from:
        ne['redirect_from'] = redirect_from
    plans[c]['entries'].insert(idx + 1, ne)
    return ne


def split_at_dateline(c, n, fname, date, heading, printed):
    ne = split_entry(c, n, fname, date, heading, frontmatter_from=fname if any(os.path.exists(f'/home/coder/bashkirtseff/content/_original/{c}/{fname}') for _ in [0]) else None)
    drop_new(n, f'date line «{printed}» (printed so), now the heading «{heading}» of the entry {fname[:-3]}')
    return ne


def aucun(i, heading_text, extra=''):
    pg = page(i)
    return mk_new('[Aucun texte - date seule mentionnée]', i,
                  rsr=f'tome16.docx ¶{i}' + (f', Mon Journal t.16 {pg}' if pg else '') +
                  f': the date line «{heading_text}» has no text under it ({TODAY} rebuild).' + (f' {extra}' if extra else ''))


def split_note(old, n, kind, source=None, first=True):
    """a bracketed note that is a paragraph of its own in the docx (¶n) is split off the start (first=True) of an old paragraph."""
    cur = get(old).get('set_french') or old_text(old)
    lines = cur.split('\n')
    note_t = straight(dtext(n))
    idx = next(k for k, l in enumerate(lines) if canon_eq(l, note_t))
    rest = [l for k, l in enumerate(lines) if k != idx]
    set_old(old, set_french='\n'.join(rest))
    item = mk_new(lines[idx], n, kind=kind, source=source, extra='Split off the following paragraph, where it was the first line (a paragraph of its own in the printed edition).' if first else 'Split off the preceding paragraph (a paragraph of its own in the printed edition).')
    if first:
        insert(item, before=old)
    else:
        insert(item, after=old)


def straight(s):
    return s.replace('’', "'")


def canon_eq(a, b):
    from common import norm
    return norm(a) == norm(b)


# ---------------------------------------------------------------- covers (all carnets)
for c in CARNETS16:
    for e in list(plans[c]['entries']):
        if e['file'].endswith('-cover.md'):
            plans[c]['entries'].remove(e)
            for x in e['paragraphs']:
                note(f'{c} withdrawn cover: {x["new"]["rsr"][:60]} «{x["new"]["french"]}»')

# ================================================================ 106 duplicate August block
import collections
COV = json.load(open(os.path.join(HERE, 'cover16.json')))
BYD = json.load(open(os.path.join(HERE, 'bydocx16.json')))
from common import norm
SHORT = {}
for _k in [k for k in O if k.startswith('105')]:
    for _l in old_text(_k).split('\n'):
        SHORT.setdefault(norm(_l.lstrip('#')), []).append(_k)
for n in range(143, 419):
    i = f'106.{n:04d}'
    twins = sorted({o for d in COV[i]['docx'] for o in BYD[str(d)] if o.startswith('105')})
    t = old_text(i).strip()
    if twins:
        why = f'duplicate of {", ".join(twins[:3])}: 106/1884-10-07.md held a second, accent-stripped transcription of 8–31 August 1884 (tome16.docx ¶3768–4043), which carnet 105 already has (2026-09-28 rebuild)'
    elif not t:
        why = 'empty cluster of the duplicate August block in 106/1884-10-07.md' + (' (en held only an «[End of entry]» placeholder)' if i == '106.0418' else '') + ' (2026-09-28 rebuild)'
    else:
        tw = SHORT.get(norm(t.lstrip('#'))) or SHORT.get(norm(t.replace('1 ', '1').lstrip('#')))
        what = 'date line' if dateof(t)[0] or re.search(r'\b18\d\d\b', t) else 'line'
        why = f'{what} «{t}» of the duplicate August block in 106/1884-10-07.md' + (f', duplicate of {tw[0]}' if tw else '') + ' (a second transcription of 8–31 August 1884 that carnet 105 already has; 2026-09-28 rebuild)'
    plans['106'].setdefault('drop', []).append({'id': i, 'reason': why})
# 106.0142 is the only unique paragraph: «Jeudi 7 octobre 1884» (so printed, p.279, amid August: 7 Aug 1884 was a Thursday)
x = remove('106.0142')
x['set_french'] = '# Jeudi 7 octobre 1884\n' + straight(dtext(3767))
x.pop('_kind_guess_reason', None)
e7 = entry('105', '1884-10-07.md')
plans['105']['entries'].remove(e7)
new_entry('105', '1884-08-06.md', '1884-08-07.md', '1884-08-07', None, [x], frontmatter_from='1884-08-06.md')
note('106.0142 → 105/1884-08-07.md, heading «Jeudi 7 octobre 1884» as printed (p.279), text from docx ¶3767 (accents restored)')

# ================================================================ 101
drop_old('101.0068', 'placeholder «[Note de l\'éd. : ici un dessin de Marie dans le journal.]» written at import; not in the printed edition, which reproduces the drawing itself (Mon Journal t.16 p.11). The drawing is now linked in the entry frontmatter (drawings:)')
set_old('101.0257', kind='editorial')
set_old('101.0465', kind=None)
# «Merecredi 22 août 1883» (¶281, printed so on p.23) is a bare date line: a day without text
drop_new(281, 'date line «Merecredi 22 août 1883» (printed typo), now the heading of the new empty entry 1883-08-22')
new_entry('101', '1883-08-21.md', '1883-08-22.md', '1883-08-22', 'Mercredi 22 août 1883', [aucun(281, 'Merecredi 22 août 1883', 'The printed page (p.23) reads «Merecredi»; the heading is normalised.')], frontmatter_from='1883-08-21.md')
# 26–29 August: «Lundi 27 août» is followed by «Mardi 26 août 1883» (bare) and «Mercredi 27 août 1883» — Marie's slips for Tuesday 28 / Wednesday 29
drop_new(316, 'bare date line «Mardi 26 août 1883», now the new entry 1883-08-28')
new_entry('101', '1883-08-27.md', '1883-08-28.md', '1883-08-28', 'Mardi 26 août 1883',
          [aucun(316, 'Mardi 26 août 1 883', 'It follows «Lundi 27 août 1883»: Marie wrote 26 for Tuesday 28 August 1883 (the weekday is right).')],
          frontmatter_from='1883-08-27.md')
split_entry('101', '101.0269', '1883-08-29.md', '1883-08-29', 'Mercredi 27 août 1883', frontmatter_from='1883-08-27-evening.md', redirect_from=['1883-08-27-evening.md'])
# the -evening entry's paragraphs were placed by the draft into 1883-08-27 after 0282–0284: move the split entry after 1883-08-28
_e29 = remove_entry('101', '1883-08-29.md')
_idx = [k for k, e in enumerate(plans['101']['entries']) if e['file'] == '1883-08-28.md'][0]
plans['101']['entries'].insert(_idx + 1, _e29)
# «Dimanche 16 septembe 1883» (¶435, printed so on p.35)
split_at_dateline('101', 435, '1883-09-16.md', '1883-09-16', 'Dimanche 16 septembre 1883', 'Dimanche 16 septembe 1883')
# ¶737 «Non, voyez dans le cahier suivant.»: Marie's last line in Livre 101 (the draft took it into 102's cover)
insert(mk_new(straight(dtext(737)), 737), after=entry('101', '1883-10-15.md')['paragraphs'][-1].get('old') or first_para(entry('101', '1883-10-15.md')['paragraphs'][-1]))

# ================================================================ 102
drop_new(744, 'reading notes on the front pages of Livre 102 (after the title page): withdrawn with the cover page, owner question in REVIEW.md')
for n in (745, 746, 747, 748, 749):
    drop_new(n, 'reading notes on the front pages of Livre 102: withdrawn with the cover page')
set_old('102.0011', set_french=straight(dtext(762)).split(' Eh bien vous ne me prendrez')[0])
set_old('102.0012', set_french='Eh bien vous ne me prendrez' + straight(dtext(762)).split(' Eh bien vous ne me prendrez')[1])
for n, why in ((1161, '«— Ah.» is already a line of 102.0059'), (1378, '«— Non ?» is already a line of 102.0085'),
               (1380, '«— Pourtant.» is already a line of 102.0085'), (1381, '«Enfin...» is already a line of 102.0085'),
               (1442, '«Claire:» is already a line of 102.0091')):
    drop_new(n, why)
drop_new(1383, '«- Noël» belongs to the date line «Mardi 25 décembre 1883 - Noël» (heading restored in full)')
_first25 = entry('102', '1883-12-25.md')['paragraphs'][0]['old']
set_old(_first25, set_french=old_text(_first25).replace('# Mardi 25 décembre 1883', '# Mardi 25 décembre 1883 - Noël', 1))
entry('102', '1883-12-25.md')['heading'] = 'Mardi 25 décembre 1883 - Noël'
# ¶1521 «(suite au prochain livre)»: Marie's last line in Livre 102
insert(mk_new(straight(dtext(1521)), 1521), after='102.0149')

# ================================================================ 103
e12 = entry('103', '1884-01-12.md')
e12['heading'] = 'Samedi 12 janvier 1884 - suite'
drop_new(1524, '«- suite»: part of the date line «Samedi 12 janvier 1884 - suite» (entry heading)')
drop_new(1542, 'line of the Montmartre song, already in 102.0153')
drop_new(1562, 'line of the Montmartre song, already in 102.0153')
replace_new_with_old(1767, '103.0176')
drop_new(1782, 'first line of 103.0184')
replace_new_with_old(1629, '103.0054')
drop_old('103.0731', COVER + ' (also the bare date lines «Lundi 1 4 avril 1 884», «Mardi 1 5 avril 1 884», which open 104 as «[Aucun texte…]» entries)')
set_old('103.0094', kind='rayé')
set_old('103.0434', kind='margin')
set_old('103.0455', kind='margin')
set_old('103.0631', kind='margin', source='écriture de Mme Bashkirtseff mère')
set_old('103.0671', kind='margin', source='écriture de Mme Bashkirtseff mère')
set_old('103.0688', kind='margin', source='écriture de Mme Bashkirtseff mère')
for i in ('103.0729', '103.0730'):
    set_old(i, kind='other', source='note de Mme Bashkirtseff mère à la fin du cahier')
split_note('103.0086', 1668, 'rayé')
split_note('103.0239', 1845, 'editorial')
split_note('103.0239', 1846, 'margin')
split_note('103.0249', 1857, 'margin')
split_note('103.0313', 1936, 'editorial')
split_note('103.0357', 1984, 'margin')
split_note('103.0680', 2377, 'margin')

# ================================================================ 104
for i in ('104.0330', '104.0346', '104.0367', '104.0393', '104.0510', '104.0590', '104.0614', '104.0633', '104.0648', '104.0666', '104.0795'):
    drop_old(i, KERN)
drop_old('104.0796', COVER)
drop_old('104.0797', COVER)
set_old('104.0287', kind=None)
set_old('104.0042', kind='margin', source='écriture de Mme Bashkirtseff mère')
set_old('104.0053', kind='margin', source='écriture de Mme Bashkirtseff mère')
set_old('104.0524', kind='rayé')
set_old('104.0782', kind='rayé')
set_old('104.0404', kind=None)
letter(['104.0404'], 'Dépêche de Julian à Marie, mai 1884')
letter(ids_range('104.0406', '104.0410'), 'Réponse de Marie à Julian, mai 1884')
letter(ids_range('104.0426', '104.0434'), 'Lettre de Marie à Tony Robert-Fleury (de mémoire), 28 mai 1884')
split_note('104.0463', 2935, 'margin')
split_note('104.0544', 3017, 'rayé')
split_note('104.0706', 3178, 'margin')
split_at_dateline('104', 2756, '1884-05-21.md', '1884-05-21', 'Mercredi 21 mai 1884', 'Merredi 21 mai 1884')
split_at_dateline('104', 2894, '1884-05-28.md', '1884-05-28', 'Mercredi 28 mai 1884', 'Merecredi 28 mai 1884')

# ================================================================ 105
set_old('105.0783', set_french=None)   # the draft's «completion» duplicates 105.0784, which holds the rest of ¶4060
set_old('105.0781', kind=None)
set_old('105.0586', kind='rayé')
split_note('105.0203', 3473, 'rayé')
split_note('105.0509', 3785, 'margin')
split_note('105.0767', 4039, 'rayé')
split_at_dateline('105', 3948, '1884-08-23.md', '1884-08-23', 'Samedi 23 août 1884', 'Samdi 23 août 1884')
drop_new(4100, 'date line «Mercredi 10 septembe 1884»: the day is 105.0802 (heading only)')
split_entry('105', '105.0802', '1884-09-10.md', '1884-09-10', frontmatter_from='1884-09-10.md')
# «Samedi 8 septembre 1884» (so in the manuscript, before «Dimanche 7»): the entry stays 1884-09-06
_x = remove('105.0786')
_x['set_french'] = old_text('105.0786').replace('# Samedi 6 septembre 1884', '# Samedi 8 septembre 1884', 1)
new_entry('105', '1884-09-05.md', '1884-09-06.md', '1884-09-06', None, [_x], frontmatter_from='1884-09-06.md')
# 105.0809: Livre 106's title page + «Jeudi 11 septembre 1884 - suite / Le principal s'est de travailler.» → 106
_x = remove('105.0809')
_x['set_french'] = "# Jeudi 11 septembre 1884 - suite\nLe principal s'est de travailler."
e11 = entry('106', '1884-09-11.md')
e11['paragraphs'] = [_x]
e11['heading'] = 'Jeudi 11 septembre 1884 - suite'
e11['frontmatter_from'] = None
e11.pop('frontmatter_from')
note('105.0809 → 106/1884-09-11.md: its title-page lines are withdrawn (cover), the day line and text stay')

# ================================================================ 106
set_old('106.0002', set_french="# Samedi 13 septembre 1884\nDe l'effet que peut produire un [Rayé: cahier de comptes de travaux d'architecture] mémoire d'architecte, \"article fumisterie[^1].\"")
drop_new(4116, 'same line as 106.0002 (its «[Rayé: …]» is restored there)')
set_old('106.0024', kind=None)
letter(ids_range('106.0095', '106.0097'), 'Lettre du Figaro illustré rêvée par Marie, 23 septembre 1884')
set_old('106.0425', kind='editorial')
for i, why in (('106.0431', '«Vendredi 10 octobre 1884»'), ('106.0442', '«Lundi 13 octobre 1884»'), ('106.0443', '«Mardi 14 octobre 1884»'), ('106.0444', '«Mercredi 15 octobre 1884»')):
    drop_old(i, f'heading-only stub for {why}: the manuscript has no such date line (tome16.docx ¶4289–4290 go from 9 to 11 October, ¶4301–4302 from 12 to 16 October; the raw carnet agrees)')
entry('106', '1884-10-09.md')['redirect_from'] = ['1884-10-10.md']
entry('106', '1884-10-12.md')['redirect_from'] = ['1884-10-13.md', '1884-10-14.md', '1884-10-15.md']

# ================================================================ paragraphs that run over a date line
def txt_of(i):
    return get(i).get('set_french') or old_text(i)

# 103.0137 «Ah ! / Lundi 28 janvier 1 884 / Je recommence…»: «Ah !» ends 27 January (¶1724)
_l = txt_of('103.0137').split('\n')
set_old('103.0137', set_french='\n'.join(['# Lundi 28 janvier 1884'] + _l[2:]))
insert(mk_new('Ah !', 1724, extra='Split off the next paragraph, which ran over the date line «Lundi 28 janvier 1 884».'), after='103.0136')
INNER.append({'old': '103.0137', 'date': '1884-01-28'})
# 103.0460 «Enfin- / Lundi 1 0 mars 1 884 / C'est commencé…»: «Enfin-» is ¶2103 (9 March, new paragraph)
_l = txt_of('103.0460').split('\n')
set_old('103.0460', set_french='\n'.join(['# Lundi 10 mars 1884'] + _l[2:]))
INNER.append({'old': '103.0460', 'date': '1884-03-10'})
# 104.0018 «Lundi 21 avril 1 884 / Mardi 22 avril 1 884 / Je vais voir Julian…»: 21 April has no text
_l = txt_of('104.0018').split('\n')
_x = remove('104.0018')
_x['set_french'] = '\n'.join(['# Mardi 22 avril 1884'] + _l[2:])
_e22 = entry('104', '1884-04-22.md')
_e22['paragraphs'].insert(0, _x)
_e22.pop('heading', None)
TRAILS.append({'old': '104.0018', 'line': 'Lundi 21 avril 1884', 'date': '1884-04-21'})
INNER.append({'old': '104.0018', 'date': '1884-04-22'})
# a trailing plain date line (the next day's heading glued to the end of a paragraph, 102.0019–0031 …)
for c in CARNETS16:
    for e in plans[c]['entries']:
        for x in e['paragraphs']:
            if 'old' not in x:
                continue
            lines = (x.get('set_french') or old_text(x['old'])).split('\n')
            if len(lines) < 2 or lines[-1].lstrip().startswith('#'):
                continue
            d, h = dateof(lines[-1])
            if not d or all(dateof(l)[0] for l in lines):
                continue
            x['set_french'] = '\n'.join(lines[:-1])
            TRAILS.append({'old': x['old'], 'line': h, 'date': d, 'same': norm(x['set_french']) == norm('\n'.join(old_text(x['old']).split('\n')[:-1]))})
            note(f'{x["old"]}: trailing date line «{lines[-1]}» stripped (the next entry has its own heading)')

# ================================================================ date lines kept as separate old paragraphs → «# heading» of their day
def move_first(x_key, c, e):
    x = remove(x_key)
    e['paragraphs'].insert(0, x)


for c in CARNETS16:
    for e in list(plans[c]['entries']):
        for x in list(e['paragraphs']):
            if 'old' not in x:
                continue
            txt = x.get('set_french') or old_text(x['old'])
            lines = [l for l in txt.split('\n') if l.strip()]
            if not lines:
                continue
            d0, h0 = dateof(lines[0])
            if not d0:
                continue
            plain0 = not lines[0].lstrip().startswith('#')
            dl = [dateof(l) for l in lines]
            only_dates = all(d for d, _ in dl)
            if not plain0 and not (all(d for d, _ in dl) and len(lines) > 1):
                continue      # «# date» headings: generic heading pass below
            tgt = [(cc, ee) for cc, ee in entry_by_date(d0) if cc == c] or entry_by_date(d0)
            if len(tgt) != 1:
                note(f'WARN date line {x["old"]} «{lines[0]}»: {len(tgt)} entries for {d0}')
                continue
            tc, te = tgt[0]
            if only_dates and len(lines) > 1:
                # «# Mercredi 23 avril / Jeudi 24 avril 1 884»: keep the first as the heading, move the others
                newtxt = '# ' + h0 if plain0 else lines[0].strip() + '\n[Aucun texte - date seule mentionnée]'
                KEEP_HEAD.add(x['old'])
                for d, h in dl[1:]:
                    TRAILS.append({'old': x['old'], 'line': h, 'date': d})
                note(f'{x["old"]}: trailing date line(s) {[h for _, h in dl[1:]]} stripped (they head their own entries)')
            else:
                newtxt = '\n'.join(['# ' + h0] + lines[1:])
            if te is not e or te['paragraphs'][0] is not x:
                first = te['paragraphs'][0]
                ft = (first.get('set_french') or old_text(first['old'])) if 'old' in first else first['new']['french']
                if 'old' in first and ft.lstrip().startswith('#'):
                    note(f'WARN {x["old"]} «{lines[0]}»: target {tc}/{te["file"]} already opens with a heading')
                    continue
                move_first(x['old'], tc, te)
            if newtxt != old_text(x['old']):
                x['set_french'] = newtxt
            if plain0:
                PROMOTE.append({'old': x['old'], 'heading': h0, 'same': norm(newtxt) == norm(old_text(x['old']))})
            te.pop('heading', None)
            note(f'date line {x["old"]} «{lines[0]}» → heading of {tc}/{te["file"]}')

# ================================================================ generic: date headings inside old paragraphs
HEADMOVES = []
for c in CARNETS16:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'old' not in x:
                continue
            txt = x.get('set_french') or old_text(x['old'])
            lines = txt.split('\n')
            hl = [l for l in lines if l.startswith('#')]
            if not hl:
                continue
            h = hl[0].lstrip('#').strip()
            ph = parse_heading(canon(h), None)
            ymd = '%04d-%02d-%02d' % tuple(ph['ymd']) if ph else None
            if k == 0 and (ymd == e['date'] or x['old'] in KEEP_HEAD):
                continue
            rest = '\n'.join(l for l in lines if not l.startswith('#'))
            if not rest.strip():
                note(f'WARN heading-only paragraph {x["old"]} «{h}» inside {c}/{e["file"]} (kept)')
                continue
            x['set_french'] = rest
            HEADMOVES.append({'old': x['old'], 'heading': h, 'heading_date': ymd, 'entry': f'{c}/{e["file"]}', 'first': k == 0})
            note(f'heading «{h}» removed from {x["old"]} (now in {c}/{e["file"]}, position {k})')
for c in CARNETS16:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'old' in x and 'set_french' in x:
                oh = [l for l in old_text(x['old']).split('\n') if l.startswith('#')]
                nh = [l for l in x['set_french'].split('\n') if l.startswith('#')]
                if oh and not nh and x['old'] not in KEEP_HEAD and not any(m['old'] == x['old'] for m in HEADMOVES):
                    h = oh[0].lstrip('#').strip(); ph = parse_heading(canon(h), None)
                    HEADMOVES.append({'old': x['old'], 'heading': h, 'heading_date': '%04d-%02d-%02d' % tuple(ph['ymd']) if ph else None,
                                      'entry': f'{c}/{e["file"]}', 'first': k == 0})
                    note(f'heading «{h}» removed from {x["old"]} by a fix (now in {c}/{e["file"]}, position {k})')
for m in HEADMOVES:
    x = get(m['old'])
    m['heading_only'] = '\n'.join(l for l in old_text(m['old']).split('\n') if not l.startswith('#')) == x.get('set_french')


# ================================================================ headings: rebuild-carnet keeps an old paragraph's «# » lines (they are
# not text lines for set_french), so a heading change or removal is recorded in HEADFIX and applied to
# _original by postfix16.py; set_french carries only the text lines.
HEADFIX = []   # since d08a2fb03 set_french is the paragraph's whole French, headings included
for c in CARNETS16:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'old' not in x or 'set_french' not in x:
                continue
            ol = old_text(x['old']).split('\n')
            nl = x['set_french'].split('\n')
            oh = [l for l in ol if l.startswith('#')]
            nh = [l for l in nl if l.startswith('#')]
            body = [l for l in nl if not l.startswith('#')]
            if oh and not nh and k == 0 and x['old'] not in KEEP_HEAD and e.get('heading'):
                # the old heading named another day: the entry's own date replaces it
                nl = ['# ' + e['heading']] + body
                nh = [nl[0]]
            if oh and nh != oh:
                HEADFIX.append({'old': x['old'], 'from': oh[0][2:], 'to': nh[0][2:] if nh else None})
                note(f'HEADFIX {x["old"]}: «{oh[0]}» ' + (f'→ «{nh[0]}»' if nh else 'removed'))
            if not body and not nh:
                raise SystemExit(f'{x["old"]}: empty set_french')
            if nl == ol:
                x.pop('set_french')
            else:
                x['set_french'] = '\n'.join(nl)

# ================================================================ new text: the typography of _original 101–106 (straight quotes), OCR fixes
FIX = [('Fourcaud,\nIe Wolff', 'Fourcaud, le Wolff'), ('[Rayé :Saint-Amand ?]', '[Rayé: Saint-Amand ?]'),
       ("*d'inspiration.]*", "*d'inspiration.*]")]
for c in CARNETS16:
    for e in plans[c]['entries']:
        for x in e['paragraphs']:
            if 'new' in x:
                t = x['new']['french']
                t2 = t.replace('’', "'").replace('“ ', '"').replace(' ”', '"').replace('“', '"').replace('”', '"')
                for a, b in FIX:
                    if a in t2:
                        t2 = t2.replace(a, b)
                        note(f'OCR/label fix in new text: «{a}» → «{b}»')
                x['new']['french'] = t2
            # «Aucun texte» rows of the draft cite only the docx: add the printed page
            if 'new' in x and x['new']['rsr'].startswith('tome16.docx ¶') and 'Mon Journal' not in x['new']['rsr']:
                m = re.match(r'tome16\.docx ¶(\d+)', x['new']['rsr'])
                pg = page(int(m.group(1)))
                if pg:
                    x['new']['rsr'] = x['new']['rsr'].replace(m.group(0), m.group(0) + f', Mon Journal t.16 {pg}', 1)

# ================================================================ check: date lines left inside paragraphs
for c in CARNETS16:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            txt = x.get('set_french') or (old_text(x['old']) if 'old' in x else x['new']['french'])
            for li, l in enumerate(txt.split('\n')):
                d, h = dateof(l)
                if d and not (li == 0 and k == 0):
                    note(f'CHECK date line inside {x.get("old") or "new"} (line {li}, para {k}) of {c}/{e["file"]}: «{l}»')

# ================================================================ old text: printed typesetting typos and accents lost at import
# (owner 2026-09-28: the printed edition's obvious typesetting typos are corrected, citing the page; Marie's own
# spellings stay). typostate.json: [old id, printed, corrected, docx check, printed page, docx ¶]; «docx=WRONG» = the
# docx has the same misprint. Kept as possibly Marie's own: accent-only and single/double-consonant variants and one
# anglicism (enervée, détèste, éxemple, Zolà, plaisaît, colonnel, Ambasadeur, demoiseles, imposible, neni, réusi,
# ocuper, pourait, chemmin, Metting), and the three rows the scan confirmed as words (meuvent, fourrait, vida).
KEEP_SPELLING = {'enervée', 'détèste', 'éxemple', 'Zolà', 'plaisaît', 'colonnel', 'Ambasadeur', 'demoiseles', 'imposible',
                 'neni', 'réusi', 'ocuper', 'pourait', 'chemmin', 'Metting'}
# Checked in context in the apply session: «deux lais de mousseline» (104.0561) is the dressmaking word, «je la pille»
# (105.0442) is right, and «qu'on plaidra» (103.0333) means «plaidera», not «plaira»: all three stay. «imitié» (104.0224)
# is «imité» (not «amitié»). «simpl*ement que personne…*» (102.0045) is an import slip: the docx reads «simplement que
# *personne…*». «cruell es 1*» (104.0408) is «cruelles*» plus the call of a printed footnote (footnotes stay out).
KEEP_SPELLING |= {'lais', 'pille', 'plaidra'}
OVERRIDE = {('104.0224', 'imitié'): ('imitié', 'imité'), ('102.0045', 'simpl*ement'): ('simpl*ement que ', 'simplement que *'),
            ('104.0408', 'cruell'): ('cruell es 1*', 'cruelles*')}
RSRNOTES = {}
for oid, a, b, chk, pg, dpar in json.load(open(os.path.join(HERE, 'typostate.json'))):
    if a == b or a in KEEP_SPELLING:
        continue
    a, b = OVERRIDE.get((oid, a), (a, b))
    x = get(oid)
    cur = x.get('set_french') or old_text(oid)
    assert cur.count(a) >= 1, (oid, a)
    x['set_french'] = cur.replace(a, b, 1)
    what = 'import slip (the docx reads «simplement que *personne…»)' if oid == '102.0045' else 'typesetting typo of the printed edition'
    if oid == '104.0408':
        what = 'typesetting split and the call of a printed footnote (footnotes stay out)'
    RSRNOTES.setdefault(oid, []).append(f'{what} «{a.strip()}» corrected to «{b.strip()}» (Mon Journal t.16 p.{pg}, tome16.docx ¶{dpar})')
    note(f'typo {oid}: «{a}» → «{b}» (p.{pg})')
import accentfix
for c in CARNETS16:
    for e in plans[c]['entries']:
        for x in e['paragraphs']:
            if 'old' not in x or x['old'] == '106.0142':
                continue
            r = accentfix.R.get(x['old'])
            if not r or not r['docx']:
                continue
            cur = x.get('set_french') or old_text(x['old'])
            new, ch = accentfix.fix(cur, r['docx'])
            if ch:
                x['set_french'] = new
                pg = page(r['docx'][0], r['docx'][-1])
                RSRNOTES.setdefault(x['old'], []).append('accents lost at import restored from the printed text (' + ', '.join(f'«{a}» → «{b}»' for a, b in ch) + f'; tome16.docx ¶{r["docx"][0]}' + (f', Mon Journal t.16 {pg}' if pg else '') + ')')
                note(f'accents {x["old"]}: {ch}')

if __name__ == '__main__':
    json.dump({'headmoves': HEADMOVES, 'trails': TRAILS, 'promote': PROMOTE, 'inner': INNER, 'headfix': HEADFIX}, open(os.path.join(HERE, 'headmoves.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(RSRNOTES, open(os.path.join(HERE, 'rsrnotes.json'), 'w'), ensure_ascii=False, indent=1)
    write(HERE)

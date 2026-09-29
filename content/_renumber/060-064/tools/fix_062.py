"""fix_062.py — scripted review edits: common/plan-062.json -> final/plan-062.json (re-runnable).
Paragraphs are identified by old ID or by the docx ¶ cited in a new paragraph's rsr, never by list index.
Decisions: final/REVIEW-062.md."""
import json, re, sys, copy
from pathlib import Path
W = Path('/home/coder/rebuild-state/plan-tome08')
sys.path.insert(0, str(W / 'tools'))
from tk import orig, docx

o = orig('062')
d = docx('08')
plan = json.load(open(W / 'common/plan-062.json'))

RB = '2026-09-29 rebuild'
FIG = '[#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md)'
CARD = '[#Cardinal_Antonelli](../_glossary/people/mentioned/CARDINAL_ANTONELLI.md)'
PIETRO = '[#Pietro](../_glossary/people/recurring/PIETRO.md)'
MARGIN_SRC = 'Annotation de Marie'


def q(s):  # docx typography -> _original conventions
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')


def dx(i):
    return q(d[i]['t'])


def dxi(i):
    """docx paragraph with italic runs as *…*"""
    out = ''
    for t, it in d[i]['runs']:
        t = q(t)
        if it and t.strip():
            lead = t[:len(t) - len(t.lstrip())]; trail = t[len(t.rstrip()):]
            out += lead + '*' + t.strip() + '*' + trail
        else:
            out += t
    out = re.sub(r' +', ' ', re.sub(r'\*(\s*)\*', r'\1', out)).strip()
    return out.replace('moi- même', 'moi-même')


def oldtext(pid):
    return '\n'.join(l for l in o[pid][1] if not l.startswith('[//]:'))


def rsr(p, page, extra=''):
    s = f'Restored from tome08.docx ¶{p}, Mon Journal t.8 {page} (missing from original extraction, {RB}).'
    return s + (' ' + extra if extra else '')


def new(french, rsr_, kind=None, source=None, tags=None):
    n = {'french': french, 'rsr': rsr_}
    if kind: n['kind'] = kind
    if source: n['source'] = source
    if tags: n['tags'] = tags
    return {'new': n}


def strip_heading(pid):
    lines = oldtext(pid).split('\n')
    assert lines[0].startswith('# '), (pid, lines[0])
    return '\n'.join(lines[1:]).strip()


# ---------- index helpers ----------
def find_entry(fname):
    for e in plan['entries']:
        if e['file'] == fname:
            return e
    raise KeyError(fname)


def loc_old(pid):
    for e in plan['entries']:
        for k, x in enumerate(e['paragraphs']):
            if x.get('old') == pid:
                return e, k
    raise KeyError(pid)


def docx_no(x):
    if 'new' not in x: return None
    m = re.search(r'¶(\d+)', x['new']['rsr'])
    return int(m.group(1)) if m else None


def loc_new(n):
    for e in plan['entries']:
        for k, x in enumerate(e['paragraphs']):
            if docx_no(x) == n:
                return e, k
    raise KeyError(n)


def para(pid):
    e, k = loc_old(pid); return e['paragraphs'][k]


def insert_after_old(pid, items):
    e, k = loc_old(pid); e['paragraphs'][k + 1:k + 1] = items


def insert_before_old(pid, items):
    e, k = loc_old(pid); e['paragraphs'][k:k] = items


drops = plan.setdefault('drop', [])
def drop(pid, reason):
    e, k = loc_old(pid); del e['paragraphs'][k]
    drops.append({'id': pid, 'reason': reason})


# ======================= 1. drops =======================
drop('062.0736', 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned) — '
     '«Gloriae cupiditate», first line of the Livre 63 title page (tome08.docx ¶2793, Mon Journal t.8 p.249)')
drop('062.0351', 'empty placeholder cluster (RSR entry summary only; no French; en shows only a «[RSR note…]» stub)')
drop('062.0419', 'extraction artefact: «---» separator where the date line «Dimanche 18 juin 1876 - lundi 19 juin 1876» stands (tome08.docx ¶2076)')

# ======================= 2. wrong completion / guesses =======================
p = para('062.0394'); p.pop('set_french', None)          # would duplicate 062.0393 (both halves of docx ¶2052)
for pid in ('062.0502', '062.0627', '062.0636'):           # dialogue openers, not letters
    p = para(pid); p.pop('kind', None); p.pop('source', None); p.pop('_kind_guess_reason', None)
e, k = loc_new(2703); x = e['paragraphs'][k]; x['new'].pop('kind', None); x.pop('_kind_guess_reason', None)

# ======================= 3. headings misplaced in _original =======================
# the printed edition's date line stands elsewhere; the cluster (already on the right day) loses its heading
for pid, where in [('062.0264', 'Mercredi 7 juin 1876'), ('062.0286', 'Jeudi 8 juin 1876'),
                   ('062.0509', 'Jeudi 22 juin 1876'), ('062.0553', 'Samedi 24 juin 1876'),
                   ('062.0614', 'Mardi 27 juin 1876'), ('062.0636', 'Mercredi 28 juin 1876')]:
    p = para(pid)
    p['set_french'] = strip_heading(pid)
    p['_rsr'] = (f'Date heading «{where}» removed from this paragraph: in the printed edition (Mon Journal t.8) '
                 f'the date line comes later, so this text belongs to the previous day ({RB}).')

# printed date lines have no comma after the weekday
for pid in ('062.0001', '062.0015', '062.0024', '062.0074', '062.0123', '062.0148', '062.0164'):
    t = oldtext(pid); assert t.startswith('# ') and '\n' not in t, pid
    p = para(pid); p['set_french'] = t.replace(', ', ' ', 1)
    p['_rsr'] = f'Date heading aligned with the printed date line (comma after the weekday removed) ({RB}).'

# 18–19 June: one entry, keep the old range file name
e = find_entry('1876-06-18.md')
e['file'] = '1876-06-18-19.md'; e['heading'] = 'Dimanche 18 juin 1876 - lundi 19 juin 1876'; e.pop('redirect_from', None)

# ======================= 4. 062.0273 spans 6/7 June =======================
p = para('062.0273'); p['set_french'] = dx(1663)
p['_rsr'] = (f'Split: the old cluster ran on into 7 June; the rest («Il faut partir…», «Cette insulte me pèse…») '
             f'now follows the date line «Mercredi 7 juin 1876» (tome08.docx ¶1663–1666, Mon Journal t.8 p.143; {RB}).')
insert_before_old('062.0274', [
    new(dx(1665), rsr(1665, 'p.143', 'Split off 062.0273, which ran on past the date line.')),
    new(dx(1666), rsr(1666, 'p.143', 'Split off 062.0273, which ran on past the date line.')),
])

# ======================= 5. inline «[annotation]» =======================
def split_tail_annotation(pid, marker_no, note_no, page):
    t = oldtext(pid); i = t.index('[annotation]')
    p = para(pid); p['set_french'] = t[:i].rstrip()
    p['_rsr'] = (f'Split: Marie\'s later annotation that followed this paragraph (tome08.docx ¶{marker_no}–{note_no}, '
                 f'Mon Journal t.8 {page}) is now its own margin paragraph ({RB}).')
    insert_after_old(pid, [
        new('[annotation]', rsr(marker_no, page, 'Split off ' + pid + '.'), kind='editorial'),
        new(dxi(note_no), rsr(note_no, page, 'Split off ' + pid + '.'), kind='margin', source=MARGIN_SRC),
    ])

split_tail_annotation('062.0272', 1661, 1662, 'p.143')
split_tail_annotation('062.0277', 1680, 1681, 'p.145')


def split_head_annotation(pid, note_no, page):
    """old cluster = italic annotation + diary text: annotation -> new margin paragraph before it"""
    t = oldtext(pid); m = re.match(r'(\*[^*]+\*)\s+(.*)$', t, re.S)
    assert m, pid
    ann = dxi(note_no)
    assert ann.replace(' ', '')[:15] == m.group(1).replace(' ', '')[:15], (pid, ann, m.group(1))
    p = para(pid); p['set_french'] = m.group(2).strip()
    p['_rsr'] = (f'Split: Marie\'s later annotation that opened this paragraph (tome08.docx ¶{note_no}, '
                 f'Mon Journal t.8 {page}) is now its own margin paragraph ({RB}).')
    insert_before_old(pid, [new(ann, rsr(note_no, page, 'Split off ' + pid + '.'), kind='margin', source=MARGIN_SRC)])

split_head_annotation('062.0556', 2291, 'p.201')
split_head_annotation('062.0612', 2527, 'p.219')
split_head_annotation('062.0657', 2652, 'p.235')

for pid in ('062.0121', '062.0382', '062.0383', '062.0384', '062.0429'):   # rest of the italic runs
    p = para(pid); p['kind'] = 'margin'; p['source'] = MARGIN_SRC
p = para('062.0685'); p['kind'] = 'margin'; p['source'] = MARGIN_SRC; p['set_french'] = '(*Pour sûr*)'
p['_rsr'] = f'«*[Pour sûr)*» corrected to «(*Pour sûr*)» from the scan (Mon Journal t.8 p.242); Marie\'s later remark ({RB}).'
p = para('062.0382')
p['set_french'] = oldtext('062.0382').replace("D'*ailleurs", "*D'ailleurs").replace("j'avai?.", "j'avais").replace('*volage.', 'volage.*')
p['_rsr'] = f'OCR corrected from the scan (Mon Journal t.8 p.176): «j\'avai?.»→«j\'avais», misplaced italic markers «D\'*ailleurs … *volage.» → «*D\'ailleurs … volage.*» ({RB}).'

# 12 June: the [annotation] marker ¶1910 was lost; ¶1911 is Marie's annotation
e, k = loc_new(1911)
e['paragraphs'][k]['new'].update(kind='margin', source=MARGIN_SRC)
e['paragraphs'][k:k] = [new('[annotation]', rsr(1910, 'p.163'), kind='editorial')]

# ======================= 6. Pietro's letter inside 062.0605 =======================
t = oldtext('062.0605'); i = t.index('LETTRE EN ITALIEN')
p = para('062.0605'); p['set_french'] = t[:i].rstrip() + '[^4]'
p['_rsr'] = (f'Split: the edition\'s label and the copied letter (tome08.docx ¶2506–2509, Mon Journal t.8 p.218) '
             f'are now their own paragraphs (editorial, letter) ({RB}).')
insert_after_old('062.0605', [
    new('LETTRE EN ITALIEN ÉPINGLÉE AU CAHIER', rsr(2506, 'p.218', 'The edition\'s label (small capitals); «ÉPINCLÉE» OCR corrected. Split off 062.0605.'), kind='editorial'),
    new('\n'.join([dx(2507), dx(2508), dx(2509)]),
        rsr('2507–2509', 'p.218', 'Marie\'s French translation of Pietro Antonelli\'s letter (the Italian original was pinned into the notebook; the letter is dated 23 June, see 27 June). Split off 062.0605.'),
        kind='letter', source='Lettre de Pietro Antonelli à Marie, 23 juin 1876, traduite de l\'italien par Marie', tags=[PIETRO]),
])

# ======================= 7. the Ignotus article (27 June) =======================
ART_FIX = [('pro secrétaire', 'pro-secrétaire'), ('M. de Bevel', 'M. de Revel'), ('Éminence ?»', 'Éminence ? »'),
           ('départ ?»', 'départ ? »'), ('religione;', 'religione ;'), ('lè roi', 'le roi'), ('II aime', 'Il aime'),
           ("xix' siècle", 'XIXe siècle'), ('demi- profane', 'demi-profane'), ("qïi'on", "qu'on"),
           ('mirabile unione,* etc.', 'mirabile unione,* etc.')]
PAGES = {2586: 'pp.223–224', 2587: 'p.224', 2588: 'pp.224–225', 2589: 'p.225', 2590: 'pp.225–226', 2591: 'p.226',
         2592: 'pp.226–227', 2593: 'p.227', 2594: 'pp.227–228', 2595: 'p.228', 2596: 'pp.228–229', 2597: 'p.229', 2598: 'pp.229–230'}
art = []
for n in range(2586, 2599):
    e, k = loc_new(n)
    x = e['paragraphs'].pop(k)
    txt = x['new']['french']
    fixed = []
    for a, b in ART_FIX:
        if a in txt and a != b:
            txt = txt.replace(a, b); fixed.append(f'«{a}»→«{b}»')
    nos = str(n)
    if n == 2586:
        txt = 'LE CARDINAL ANTONELLI\n' + txt; nos = '2585–2586'
    if n == 2598:
        txt = txt + '\nIgnotus.'; nos = '2598–2599'
    extra = ('Le Figaro article «Le cardinal Antonelli» signed Ignotus, cut out and pasted in by Marie on 27 June 1876'
             + ('; OCR corrected from the scan: ' + ', '.join(fixed) if fixed else '; checked against the scan') + '.')
    art.append(new(txt, rsr(nos, PAGES[n], extra), kind='clipping',
                   source='Le Figaro, Le cardinal Antonelli par Ignotus, juin 1876', tags=[FIG, CARD]))
e, k = loc_new(2599); del e['paragraphs'][k]                   # «Ignotus.» now closes the last clipping paragraph
e, k = loc_old('062.0633')
e['paragraphs'][k + 1:k + 1] = art
drop('062.0633', 'placeholder replaced by the restored clipping (Le Figaro, «Le cardinal Antonelli» par Ignotus, tome08.docx ¶2585–2599)')

# ======================= 8. the song of 24 June (verse, not a clipping) =======================
IT = ["Quanti ce n'è che s'entendomi cantare,", 'Diran : Viva colei che a il cor contento.',
      "S'io canto, canto per non dir del male !", "Faccio per revelar quel c'ho qui dentro,",
      "Faccio per revelar un'afflitta doglia,", 'Sebbene io canto, di piangere ho voglia,',
      "Faccio per revelar l'afflitta pena,", 'Sebbene io canto, di dolor son piena.']
FR = ["Combien il y en a qui m'écoutant chanter", 'Diront : Vive celle qui a le cœur content !',
      'Si je chante, je chante pour ne pas dire du mal,', 'Je le fais pour révéler ce que je renferme dans mon cœur.',
      "Je le fais pour révéler une douleur qui m'afflige.", "Quoi que je chante, j'ai le désir de pleurer ;",
      'Je le fais pour révéler une peine qui me tourmente...', 'Quoi que je chante, je suis accablée de douleur !']
e, k = loc_new(2432)
for n in range(2432, 2439):
    e2, k2 = loc_new(n); assert e2 is e; del e['paragraphs'][k2]
e['paragraphs'][k:k] = [
    new('\n'.join('*' + l + '*' for l in IT), rsr('2432–2433', 'p.212', 'Verse lines restored from the scan (the OCR ran them together); «s\'entendomi» as printed.')),
    new('\n'.join(FR), rsr('2434–2438', 'p.212', 'Marie\'s translation of the song, verse lines as printed; not a clipping (the drafter\'s guess removed).')),
]

# ======================= 9. OCR fixes in new text =======================
OCR = {1551: [('Oh I non', 'Oh ! non')], 1553: [('punis- sez-pas', 'punissez-pas')],
       2366: [('non.,', 'non..')], 2375: [('cela I Rien', 'cela ! Rien')], 2423: [('que.,', 'que..')],
       2430: [('serait justice, [deux', 'serait justice. [deux')], 2442: [('espion.,', 'espion..')]}
for n, subs in OCR.items():
    e, k = loc_new(n); x = e['paragraphs'][k]['new']
    done = []
    for a, b in subs:
        assert a in x['french'], (n, a)
        x['french'] = x['french'].replace(a, b); done.append(f'«{a}»→«{b}»')
    x['rsr'] += ' OCR corrected from the scan: ' + ', '.join(done) + '.'
# dialogue dashes the list-numbering restore missed
for e in plan['entries']:
    for x in e['paragraphs']:
        if 'new' in x and x['new']['french'].startswith('- ') and not x['new'].get('kind'):
            x['new']['french'] = '— ' + x['new']['french'][2:]
            x['new']['rsr'] += ' Dialogue dash «- » → «— ».'

plan['drop'] = drops
(W / 'final').mkdir(exist_ok=True)
json.dump(plan, open(W / 'final/plan-062.json', 'w'), ensure_ascii=False, indent=1)
print('ok: entries', len(plan['entries']), 'drops', len(drops))

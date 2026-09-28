"""Build rebuild plans for carnets 065, 066, 067 (tome09.docx ¶71–3380).

Inputs: t09.json (docx dump with italic runs), orig.json (_original 065+066+067
clusters), stage.json (alignment from align.py), clip/clippings.json
(clippings transcribed from the scan), footnotes.json (printed-edition
footnotes found on the scan).
Outputs: plan-065/066/067.json (multi-carnet: cross-carnet paragraphs placed
where the manuscript has them) and standalone/plan-CCC.json (cross-carnet
paragraphs left in their source carnet).
"""
import json, re, collections, unicodedata, copy, os

d = json.load(open('t09.json'))
rows = json.load(open('stage.json'))
C = json.load(open('orig.json'))
CB = {c['id']: c for c in C}
ORDER = [c['id'] for c in C]
POS = {k: i for i, k in enumerate(ORDER)}
R = {r['i']: r for r in rows}
CLIPS = json.load(open('clip/clippings.json'))
PM = json.load(open('/home/krr/bashkirtseff/.claude/reports/scans-2026-09-27/tome09_pagemap.json'))
FOOT = json.load(open('footnotes.json')) if os.path.exists('footnotes.json') else []

RANGE = {'065': (71, 851), '066': (852, 1685), '067': (1686, 3380)}
def carnet_of(i):
    for c, (a, b) in RANGE.items():
        if a <= i <= b: return c
    raise ValueError(i)

MONTHS = {'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12}
TODAY = '2026-09-27'

# ---------------------------------------------------------------- overrides of the alignment
OVR = {1104: None, 1357: '066.0384', 2978: None}
for i, v in OVR.items():
    R[i]['best'] = v
    if v: R[i]['how'] = 'override'

# ---------------------------------------------------------------- pages
def pages(a, b):
    ps = sorted({x['printed_page'] for x in PM if x.get('docx_para_end') is not None and x.get('printed_page')
                 and x['docx_para_start'] <= b and x['docx_para_end'] >= a})
    if not ps: return ''
    return f"p.{ps[0]}" if len(ps) == 1 else f"pp.{ps[0]}–{ps[-1]}"

# ---------------------------------------------------------------- docx text with italics
def ptext(i):
    p = d[i]; segs = []
    for t, it, u, b in p['runs']:
        if segs and segs[-1][1] == it: segs[-1][0] += t
        else: segs.append([t, it])
    out = ''
    for t, it in segs:
        if it and t.strip():
            lead = t[:len(t) - len(t.lstrip())]; trail = t[len(t.rstrip()):]
            out += lead + '*' + t.strip() + '*' + trail
        else: out += t
    if not p['runs']: out = p['t']
    s = out.strip()
    s = re.sub(r'\*\s*\*', '', s)
    s = re.sub(r'(?<=\s)II!!', '!!!!', s)
    s = re.sub(r'(?<=\s)II!', '!!!', s)
    s = re.sub(r'(?<=\s)I!', '!!', s)
    s = re.sub(r'(?<=\s)II$', '!!', s)
    s = re.sub(r'(?<=\S) I$', ' !', s) if re.search(r'[a-zà-ÿ] I$', s) else s
    s = dehyphen(s)
    s = re.sub(r'(?<=[a-zà-ÿ.]) I\]', ' !]', s)
    s = re.sub(r'\b1 8(\d)(\d)\b', r'18\1\2', s)
    s = re.sub(r'\b1 8 ?(\d) ?(\d)\b', r'18\1\2', s)
    return s

HYPHEN_KEEP = ['demi- mots', 'à- dire', 'Lève- toi', 'l’homme- femme', 'après- mariage', 'a- t', 'eux- mêmes', 'vingt- deux',
               'comico- tragiques', 'belle- mère', 'vous- mêmes', 'celles- là', 'celle- ci', 'peut- être', 'brûle- pourpoint',
               'soi- même', 'Elstonn- Soumarokoff', 'sauvez- moi', 'fûmes- nous']
HYPHEN_JOIN = ['incompréhensible- ment', 'deman- dai', 'éton- nements', "d'An- tonelli", 'câli- neries']
def dehyphen(s):
    for h in HYPHEN_KEEP: s = s.replace(h, h.replace('- ', '-'))
    for h in HYPHEN_JOIN: s = s.replace(h, h.replace('- ', ''))
    return s

def plain(i):
    return d[i]['t'].strip()

# ---------------------------------------------------------------- printed-edition footnotes spliced into the docx
def fnorm(s):
    s = unicodedata.normalize('NFKD', s); s = ''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
FOOTNOTE_TEXTS = []
for o in FOOT:
    for t in o['lines']:
        if not re.match(r'^\d\s', t): continue
        t2 = re.sub(r'^\d+\s*', '', t).strip()
        if len(t2) >= 8: FOOTNOTE_TEXTS.append((o['pdf'], t2))
FOUND_FOOTNOTES = []
def strip_footnotes(i, s):
    for pdf, t in FOOTNOTE_TEXTS:
        if t in s:
            FOUND_FOOTNOTES.append((i, pdf, t))
            s = s.replace(t, ' ')
            s = re.sub(r'\s{2,}', ' ', s).strip()
    return s

# ---------------------------------------------------------------- headings
WDRE = r'(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)'
def norm_heading(t):
    t = t.replace('\n', ' ')
    t = re.sub(r'(\d) (\d)', r'\1\2', t)
    t = re.sub(r'\bIer\b', '1er', t)
    t = re.sub(r'\(\s+', '(', t); t = re.sub(r'\s+\)', ')', t)
    t = re.sub(r'(\d{4})\(', r'\1 (', t)
    t = re.sub(r'\s{2,}', ' ', t).strip()
    return t
HEADS = {}  # docx ¶ -> {date, heading}
for r in rows:
    if not r['ishead']: continue
    t = norm_heading(r['t'])
    extra = None
    m = re.match(WDRE + r' (\d+|1er) (\w+) (18\d\d)(.*)$', t)
    wd, day, mon, yr, rest = m.groups()
    day = 1 if day == '1er' else int(day)
    rest = rest.strip()
    mm = re.match(r'^(\([^)]*\))?\s*(\[.*\])?$', rest)
    julian, extra = (mm.group(1), mm.group(2)) if mm else (rest, None)
    heading = f"{wd} {'1er' if day == 1 else day} {mon} {yr}" + (f" {julian}" if julian else '')
    HEADS[r['i']] = {'date': f"{yr}-{MONTHS[mon]:02d}-{day:02d}", 'heading': heading, 'extra': extra}
HEADS[201]['heading'] = 'Lundi 21 août 1876 (9 août) et Mardi 22 août 1876 (10 août)'
HEADS[1741]['heading'] = 'Samedi 14 octobre 1876 (2 octobre)'
HIDX = sorted(HEADS)
def dayof(k):
    h = [x for x in HIDX if x <= k]
    return h[-1] if h else None

# entry file per heading (two headings on 11 December share one entry)
def entry_file(h):
    dt = HEADS[h]['date']
    return dt + '.md'

# ---------------------------------------------------------------- clusters: docx position
bycl = collections.defaultdict(list)
for r in rows:
    if r['best'] and not r['ishead']: bycl[r['best']].append(r['i'])

def cl_heading(k):
    v = CB[k]['vis']
    return v and all(l.startswith('#') for l in v)
def cl_date(k):
    t = CB[k]['vis'][0]
    m = re.search(r'(\d+)(?:er)?,? (août|septembre|octobre|novembre|décembre) (18\d\d)', t)
    if not m: return None
    return f"{m.group(3)}-{MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}"

EMPTY = [c['id'] for c in C if not c['vis']]
DROP = {}
for k in EMPTY:
    DROP[k] = ('empty placeholder cluster (no French text in _original; no text in cz/uk/fr'
               + ('; en holds only the placeholder «[No further text]»' if k == '066.0290' else ' or en')
               + ') — 2026-09-27 rebuild')
DROP['066.0166'] = 'stub «[Entry content missing from source]» — the text of that stretch (tome09.docx ¶522–1139) is restored as new paragraphs (2026-09-27 rebuild)'
DROP['065.0205'] = 'duplicate of 065.0203 (the same sentence, tome09.docx ¶275, extracted twice across a file boundary) — 2026-09-27 rebuild'

# heading-only clusters: keep one per docx date line (the one nearest to it), drop invented / duplicate ones
key = {}
SETF = {}
HEAD_KEEP = {}
hcl = [c['id'] for c in C if c['vis'] and cl_heading(c['id'])]
def next_row(k):
    j = POS[k] + 1
    while j < len(ORDER):
        if bycl.get(ORDER[j]): return min(bycl[ORDER[j]])
        j += 1
    return 10**6
cands = collections.defaultdict(list)
for k in hcl:
    if '(suite)' in CB[k]['vis'][0]:
        continue
    dt = cl_date(k)
    hs = [h for h in HIDX if HEADS[h]['date'] == dt]
    if not hs: continue
    # 11 December: the cluster names its weekday
    if len(hs) > 1:
        wd = re.search(WDRE, CB[k]['vis'][-1]).group(1)
        hs = [h for h in hs if HEADS[h]['heading'].startswith(wd)] or hs
    h = hs[0]
    cands[h].append((abs(next_row(k) - h), k))
for h, lst in cands.items():
    lst.sort()
    k = lst[0][1]
    HEAD_KEEP[k] = h
    key[k] = h
for k in hcl:
    if k in HEAD_KEEP: continue
    if '(suite)' in CB[k]['vis'][0]:
        DROP[k] = 'invented continuation heading «(suite)» from the 2026-09-26 heading sweep: the paragraphs it headed are 24 August text and now follow the real date line «Jeudi 24 août 1876 (12 août)» (tome09.docx ¶454) — 2026-09-27 rebuild'
    else:
        dt = cl_date(k)
        hs = [h for h in HIDX if HEADS[h]['date'] == dt]
        if hs:
            other = [x for x, hh in HEAD_KEEP.items() if hh == hs[0]][0]
            DROP[k] = f'duplicate heading «{CB[k]["vis"][0].lstrip("# ")}»: the day keeps {other}, which stands at its date line (tome09.docx ¶{hs[0]}) — 2026-09-27 rebuild'
        else:
            DROP[k] = f'invented heading «{CB[k]["vis"][0].lstrip("# ")}»: tome09.docx has no such date line; the paragraphs under it belong to another day — 2026-09-27 rebuild'

def hnorm(s):
    s = s.lstrip('#').strip()
    return re.sub(r'[^a-z0-9éèàûôç]+', ' ', s.lower()).strip()
for k, h in HEAD_KEEP.items():
    v = CB[k]['vis']
    want = HEADS[h]['heading']
    if len(v) != 1 or hnorm(v[0]) != hnorm(want):
        level = re.match(r'^#+', v[-1]).group(0)
        if hnorm(v[-1]) == hnorm(want): SETF[k] = v[-1]
        else: SETF[k] = f'{level} {want}'
# heading text inside a combined cluster (065.0127) keeps its own text
SETF.pop('065.0127', None)

# placement key of every other cluster = its first docx paragraph
for c in C:
    k = c['id']
    if k in DROP or k in key: continue
    if k in bycl: key[k] = min(bycl[k])
for j, k in enumerate(ORDER):
    if k in DROP or k in key: continue
    p = j - 1
    while ORDER[p] not in key: p -= 1
    key[k] = key[ORDER[p]] + 0.01 * (j - p)
    print('NODOCX follows', k, 'after', ORDER[p], CB[k]['vis'][:1])

# ---------------------------------------------------------------- completions (set_french on old clusters)
TOK = re.compile(r"\[\^[^\]]*\]|\^\d+\^|<[^>]+>|[^\W_]+", re.U)
def nw(s):
    s = s.replace('œ', 'oe').replace('æ', 'ae')
    s = unicodedata.normalize('NFKD', s); s = ''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    return re.sub(r'[^a-z0-9]', '', s)
def toks(s):
    out = []
    for m in TOK.finditer(s):
        t = m.group(0)
        if t.startswith('[^') or t.startswith('^') or t.startswith('<'): continue
        n = nw(t)
        if n: out.append((n, m.start(), m.end()))
    return out
import difflib
COMPLETIONS = {}
def complete(k, docx_text, only_brackets=False):
    ctext = '\n'.join(CB[k]['vis'])
    a = toks(ctext); b = toks(docx_text)
    sm = difflib.SequenceMatcher(None, [x[0] for x in a], [x[0] for x in b], autojunk=False)
    ins = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'insert' and j2 - j1 >= 3:
            s, e = b[j1][1], b[j2 - 1][2]
            while s > 0 and docx_text[s - 1] in '[': s -= 1
            while e < len(docx_text) and docx_text[e] in ' .,;:!?»”)]': e += 1
            frag = docx_text[s:e].strip().replace('nobles-se', 'noblesse')
            at = a[i1][1] if i1 < len(a) else len(ctext)
            ins.append((at, frag))
    new = ctext
    for at, frag in sorted(ins, reverse=True):
        if at >= len(new): new = new.rstrip() + ' ' + frag
        else: new = new[:at] + frag + ' ' + new[at:]
    return new, ins

for k, i in [('066.0420', 1426), ('067.0018', 2655), ('067.0031', None), ('067.0056', None), ('067.0064', None),
             ('067.0071', None), ('067.0083', 2736), ('067.0176', None)]:
    rs = [i] if i else sorted(bycl[k])
    dt = ' '.join(plain(x) for x in rs)
    new, ins = complete(k, dt)
    SETF[k] = new
    COMPLETIONS[k] = (rs, ins)
# 066.0384: cut short at «embrouillé»; the docx ¶1357 continues. Keep the footnote marker, drop the stray «^1^» and the <u> tags.
v = CB['066.0384']['vis'][0]
assert v.endswith("cela s'est embrouillé")
t1357 = plain(1357)
tail = t1357[t1357.index("s'est embrouillé") + len("s'est embrouillé"):].strip()
SETF['066.0384'] = v.replace(' ^1^', '').replace('<u>Vierge porte ma</u>lheur', 'Vierge porte malheur') + ' ' + tail
COMPLETIONS['066.0384'] = ([1357], [(len(v), tail)])
# 067.0207 ends with «[Quatre lignes cancellées]», which the docx puts after the date line «Samedi 26 novembre 1876» (¶2978)
v = CB['067.0207']['vis']; assert v[-1] == '[Quatre lignes cancellées]'
SETF['067.0207'] = '\n'.join(v[:-1])

# ---------------------------------------------------------------- kinds
def kind_of_text(t):
    t = re.sub(r'\[\^[^\]]*\]', '', t).strip()
    if re.match(r'^\[(page cancellée|pages probablement arrachées|I?Bas de page déchiré|Une demi-page blanche|Une deùi-page blanche|Marie est passée)', t):
        return 'editorial'
    if t.startswith('Marie a noté le manuscrit'): return 'editorial'
    if (t.startswith('[') and t.endswith(']') and t.count('[') == 1) or (t.startswith('(Rayé') and t.endswith(')')):
        if re.match(r'^\[\s*(En travers|Dans la marge|En marge|En haut|Bas de page|Annotation)', t): return 'margin'
        if re.search(r'Rayé|ayé|cancell|noirci|barré', t): return 'rayé'
        return 'other'
    return None

OLDKIND = {}
for c in C:
    k = c['id']
    if k in DROP or not c['vis'] or cl_heading(k): continue
    kk = kind_of_text('\n'.join(c['vis'])) if len(c['vis']) == 1 else None
    if kk: OLDKIND[k] = (kk, None)
OLDKIND['066.0469'] = ('margin', None)   # «- Lampes à Amours…», the note announced by 066.0468 «[En haut de la page:]»
# copied letters (set in from both margins in the printed edition) — quoted with set_french
LETTER_OLD = {
    '065.0040': 'Lettre de Marie à son père, de l’hôtel de Poltava (copie), 20 août 1876',
    '065.0041': 'Lettre de Marie à son père, de l’hôtel de Poltava (copie), 20 août 1876',
}
for n in range(450, 458):
    LETTER_OLD['066.%04d' % n] = 'Lettre de Marie à Collignon (copie), 3 octobre 1876'
for k, src in LETTER_OLD.items():
    OLDKIND[k] = ('letter', src)
    base = SETF.get(k, '\n'.join(CB[k]['vis']))
    SETF[k] = '\n'.join('> ' + l for l in base.split('\n'))
OLDKIND['066.0360'] = ('other', 'Dédicace dictée par Marie à Michel Eristoff, au revers de son portrait, 25 septembre 1876')
OLDKIND['066.0361'] = ('other', 'Dédicace dictée par Marie à Michel Eristoff, au revers de son portrait, 25 septembre 1876')

# ---------------------------------------------------------------- new paragraphs
COVER_ROWS = set(range(71, 77)) | set(range(852, 856)) | set(range(1491, 1496)) | set(range(1686, 1696))
CLIP_ROWS = set(range(3323, 3380))
EXCLUDE = COVER_ROWS | CLIP_ROWS | {3322}
# copied letters in the restored text, grouped into one paragraph each
LETTERS = {1567: (1568, 'Billet de Marie à son oncle Alexandre (copie), 6 octobre 1876'),
           1641: (1643, 'Lettre de Marie à un rédacteur de journal, signée « Amanda » (copie), 11 octobre 1876'),
           1645: (1647, 'Lettre de Marie à un rédacteur de journal, pour « le citoyen L. G. » (copie), 11 octobre 1876'),
           2090: (2093, 'Lettre de Marie à son père (copie), 30 octobre 1876')}
FORCED = {j: a for a, (b, _) in LETTERS.items() for j in range(a, b + 1)}

NEWROWS = [r['i'] for r in rows if not r['ishead'] and not r['best'] and r['i'] not in EXCLUDE]
groups = []
for i in NEWROWS:
    t = strip_footnotes(i, ptext(i))
    if not t: continue
    if i in FORCED:
        if FORCED[i] == i: groups.append({'first': i, 'last': i, 'text': t, 'letter': LETTERS[i][1]})
        else: groups[-1]['text'] += '\n' + t; groups[-1]['last'] = i
        continue
    if groups and 'letter' not in groups[-1] and groups[-1]['last'] == i - 1 and dayof(groups[-1]['first']) == dayof(i) \
            and carnet_of(groups[-1]['first']) == carnet_of(i) and not kind_of_text(t) and not kind_of_text(groups[-1]['text']):
        prev = groups[-1]['text']
        pl = prev.split('\n')[-1].rstrip('*').rstrip()
        if not re.search(r'[A-Za-zÀ-ÿ]', t):
            groups[-1]['text'] = prev + '\n' + t; groups[-1]['last'] = i; continue
        if re.match(r'^[a-zà-ÿ]', t) or pl.endswith('-') or (pl.startswith('[') and pl.count('[') > pl.count(']')):
            groups[-1]['text'] = prev + ' ' + t; groups[-1]['last'] = i; continue
        if not re.search(r'[.!?…:;»"”\)\]]$', pl) and len(pl) < 60 and len(t) < 60:
            groups[-1]['text'] = prev + '\n' + t; groups[-1]['last'] = i; continue
    groups.append({'first': i, 'last': i, 'text': t})

def rsr(g):
    rng = f"¶{g['first']}" if g['first'] == g['last'] else f"¶{g['first']}–{g['last']}"
    pg = pages(g['first'], g['last'])
    return f"Restored from tome09.docx {rng}, Mon Journal t.9 {pg} (missing from the original extraction, 2026-09-27 rebuild)."

items = collections.defaultdict(list)   # carnet -> [(key, item)]
def add(c, k, it): items[c].append((k, it))

for g in groups:
    t = g['text']
    if g['first'] == 1214: t = '[Une demi-page blanche]'
    nw_ = {'french': t, 'rsr': rsr(g)}
    if 'letter' in g:
        nw_['kind'] = 'letter'; nw_['source'] = g['letter']
    else:
        kk = kind_of_text(t)
        if kk: nw_['kind'] = kk
    if g['first'] == 1214:
        nw_['rsr'] = rsr(g).replace('(missing', '(the docx OCR reads «[Une deùi-page blanche]»; missing')
    add(carnet_of(g['first']), g['first'], {'new': nw_})

# heading with a struck line on the same line: «Mardi 7 novembre 1876 (26 octobre) [Une ligne cancellée]»
for h, hd in HEADS.items():
    if hd['extra']:
        add(carnet_of(h), h + 0.5, {'new': {'french': hd['extra'], 'kind': kind_of_text(hd['extra']) or 'other',
             'rsr': f"Restored from tome09.docx ¶{h}, Mon Journal t.9 {pages(h, h)}, where it stands on the date line «{plain(h)}» (missing from the original extraction, 2026-09-27 rebuild)."}})
# «[Quatre lignes cancellées]» under «Samedi 26 novembre 1876» (split off 067.0207)
add('067', 2978, {'new': {'french': '[Quatre lignes cancellées]', 'kind': 'rayé',
     'rsr': f"Split off 067.0207 in the 2026-09-27 rebuild: tome09.docx ¶2978, Mon Journal t.9 {pages(2978, 2978)}, puts the four struck lines after the date line «Samedi 26 novembre 1876», not at the end of 25 November."}})

# empty days
for j, r in enumerate(rows):
    if r['ishead'] and j + 1 < len(rows) and rows[j + 1]['ishead'] and r['i'] != 3279:
        h = r['i']
        add(carnet_of(h), h + 0.5, {'new': {'french': '[Aucun texte - date seule mentionnée]',
             'rsr': f"tome09.docx ¶{h} (Mon Journal t.9 {pages(h, h)}): the date line «{plain(h)}» is followed directly by the next date line; empty-day note as in 068 (2026-09-27 rebuild)."}})

# old clusters
for k, v in key.items():
    it = {'old': k}
    c = k[:3]
    add('X', v, it)

# ---------------------------------------------------------------- covers, editorial notes, clippings
def rsrc(a, b, what):
    return f"Restored from tome09.docx ¶{a}–{b}, Mon Journal t.9 {pages(a, b)}: {what} Not in the original extraction; cover entry per KRR 2026-09-27."
COVERS = {
    '065': [{'new': {'french': 'Gloriae Cupiditate\nH[is] G[race] t[he] D[uke] o[f] H[amilton]\nLivre 65ème\ndepuis le jeudi 17 août 1876\njusqu\'au samedi 2 septembre 1876\nChpatovska\n19 août, Poltava, Gavronzi.',
             'kind': 'cover', 'source': 'page de titre du Livre 65',
             'rsr': rsrc(71, 76, 'the title page Marie wrote for Livre 65 (motto, dedication to the Duke of Hamilton, book number, dates, places). OCR «Dfuke] off]» read from the printed page as «D[uke] o[f]».')}}],
    '066': [{'new': {'french': 'H[is] G[race] t[he] D[uke] o[f] H[amilton]\nGloriae Cupiditate\nLivre 66ème\ndepuis le dimanche 3 septembre 1876\njusqu\'au jeudi 12 octobre 1876\nGavronzi',
             'kind': 'cover', 'source': 'page de titre du Livre 66',
             'rsr': rsrc(852, 855, 'the title page Marie wrote for Livre 66. OCR «off]» read from the printed page as «o[f]».')}}],
    '067': [{'new': {'french': 'Gloriae Cupiditate\nH[is] G[race] D[uke] o[f] H[amilton]\nLivre 67ème\ndepuis le jeudi 12 octobre 1876\njusqu\'au lundi 11 décembre 1876\nGavronzi ou Poltava\ndepuis le samedi 18 novembre à Paris\ndepuis le jeudi 1er décembre à Nice.',
             'kind': 'cover', 'source': 'page de titre du Livre 67',
             'rsr': rsrc(1686, 1689, 'the title page Marie wrote for Livre 67 (12 October – 11 December 1876). The printed page reads «o[f]]»; the doubled bracket is dropped.')}},
            {'new': {'french': 'Ment sana in corpore sano\nTutto fano nulla sauna\nTutto saumo, nulla fauno\nGara voit sa Francsi\nPiu gli pesi mon fi danus (Alfieri)\nMont sana in corpore sano',
             'kind': 'cover', 'source': 'devises sur la page de titre du Livre 67',
             'rsr': rsrc(1690, 1695, 'mottos on the title page of Livre 67, garbled as printed (Mens sana in corpore sano; Alfieri). Text follows the printed page, not the OCR («fatino», «Francai»).')}}],
}
_withdrawn_066 = ({'new': {'french': 'His Grace the Duc of Hamilton\nGloriae Cupiditate\nLivre 67ème\nGavronzi', 'kind': 'cover',
     'source': 'page de titre du cahier du 4 au 11 octobre 1876, marqué Livre 67',
     'rsr': f"Restored from tome09.docx ¶1491–1495 (without ¶1494), Mon Journal t.9 {pages(1491, 1495)}: title page of the notebook that holds 4–11 October 1876. Marie numbered it 67 although her Livre 66 cover runs to 12 October and Livre 67 restarts on 12 October; kept in carnet 066 (see REVIEW-066). Not in the original extraction (KRR 2026-09-27)."}})
add('066', 1490.6, {'new': {'french': '[4 octobre au 11 octobre 1876]', 'kind': 'editorial', 'source': 'note des éditeurs de Mon Journal sur les dates du cahier',
     'rsr': f"Restored from tome09.docx ¶1494, Mon Journal t.9 {pages(1494, 1494)}: the editors' bracketed dates for the notebook of 4–11 October 1876, printed under its «Livre 67ème» title page (¶1491–1495; title pages withdrawn until the manuscript is scanned, KRR 2026-09-28). Editors' notes on the manuscript are kept as kind editorial (KRR 2026-09-27)."}})
# end of 067: Marie's jotting, the editors' note on the pagination, the clippings
add('067', 3322, {'new': {'french': plain(3322), 'kind': 'editorial', 'source': 'note des éditeurs de Mon Journal sur la pagination du manuscrit',
     'rsr': f"Restored from tome09.docx ¶3322, Mon Journal t.9 {pages(3322, 3322)}: the editors' note on the manuscript's page numbers after the last entry of Livre 67 (KRR 2026-09-27: kept as kind editorial)."}})
CLIP_SRC = {'gazette': 'Le Figaro, Gazette de la Chambre par Albert Millaud, séance du 4 décembre 1876',
            'sommaire': 'Le Figaro, sommaire du numéro qui annonce la mort du cardinal Antonelli, novembre 1876',
            'antonelli': 'Le Figaro, Le cardinal Antonelli par Ignotus, novembre 1876',
            'deces': 'Le Figaro, nouvelle de la mort du cardinal Antonelli, novembre 1876'}
FIGARO_TAG = '[#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md)'
ANTONELLI_TAG = '[#Cardinal_Antonelli](../_glossary/people/mentioned/CARDINAL_ANTONELLI.md)'
cgroups = []
for x in CLIPS:
    t = x['text'].strip()
    item = x['item']
    if cgroups and cgroups[-1]['item'] == item and (cgroups[-1].get('open') or item == 'sommaire'):
        cgroups[-1]['lines'].append(t); cgroups[-1]['docx'] += [z for z in (x['docx'] or [])]; cgroups[-1]['pdf'].add(x['pdf_page'])
        cgroups[-1]['open'] = t == '***' or t.isupper() or t in ('Gazette de la Chambre', '4 décembre.')
        continue
    if t in ('Albert Millaud.', 'Ignotus.') and cgroups:
        cgroups[-1]['lines'].append(t); cgroups[-1]['pdf'].add(x['pdf_page']); continue
    heading_like = t == '***' or t.isupper() or t in ('Gazette de la Chambre', '4 décembre.')
    cgroups.append({'item': item, 'lines': [t], 'docx': list(x['docx'] or []), 'pdf': {x['pdf_page']}, 'open': heading_like})
ck = 3323.0
for g in cgroups:
    pdfs = sorted(g['pdf']); pr = [p - 2 for p in pdfs]
    ptxt = f"p.{pr[0]}" if len(pr) == 1 else f"pp.{pr[0]}–{pr[-1]}"
    dx = sorted(set(g['docx']))
    dtxt = (f"tome09.docx ¶{dx[0]}" + (f"–{dx[-1]}" if dx[-1] != dx[0] else '')) if dx else 'not in tome09.docx (read from the facsimile only)'
    tags = [FIGARO_TAG] + ([ANTONELLI_TAG] if g['item'] in ('antonelli', 'deces') else [])
    add('067', ck, {'new': {'french': '\n'.join(g['lines']), 'kind': 'clipping', 'source': CLIP_SRC[g['item']], 'tags': tags,
        'rsr': f"Newspaper clipping pasted at the end of Livre 67, reproduced in facsimile in Mon Journal t.9 {ptxt}; text transcribed from the facsimile, checked against the OCR ({dtxt}); italics of the print not marked (2026-09-27 rebuild)."}})
    ck += 0.01
add('067', 3380, {'new': {'french': '[Coupure de presse collée, illisible sur le fac-similé]', 'kind': 'clipping', 'source': 'coupure de journal non identifiée',
     'rsr': "Mon Journal t.9 p.226 (PDF p.228) reproduces a further pasted clipping in a facsimile too faint to read (empty picture slot tome09.docx ¶3380, just before the Livre 68 title page); placeholder so the clipping is not lost (2026-09-27 rebuild)."}})

# ---------------------------------------------------------------- assemble per carnet
def carnet_for_key(k, it):
    if 'old' in it:
        return carnet_of(int(k)) if k >= 71 else it['old'][:3]
    return None
allitems = []
for c, lst in items.items():
    for k, it in lst:
        cc = c if c != 'X' else None
        if cc is None:
            kk = key[it['old']]
            cc = carnet_of(int(kk))
        allitems.append((cc, k, it))
for cc, k, it in allitems:
    if 'old' in it:
        o = it['old']
        if o in SETF: it['set_french'] = SETF[o]
        if o in OLDKIND:
            it['kind'] = OLDKIND[o][0]
            if OLDKIND[o][1]: it['source'] = OLDKIND[o][1]

oldfiles = collections.defaultdict(list)
for c in C: oldfiles[c['id'][:3]].append(c['file'])
IDLESS = {'066': ['1876-10-07.md', '1876-10-08.md', '1876-10-09-11.md', '1876-10-12-13.md']}
IDLESS['067'] = sorted(f for f in os.listdir('/home/krr/bashkirtseff/content/_original/067')
                       if f.endswith('.md') and f != 'README.md' and f not in oldfiles['067'])
ALLFILES = {c: sorted(set(oldfiles[c]) | set(IDLESS.get(c, []))) for c in ('065', '066', '067')}

plans = {}
for c in ('065', '066', '067'):
    lst = sorted([(k, it) for cc, k, it in allitems if cc == c], key=lambda x: x[0])
    ents = collections.OrderedDict()
    for k, it in lst:
        h = dayof(k)
        f = entry_file(h)
        if f not in ents:
            ents[f] = {'file': f, 'date': HEADS[h]['date'], 'heading': HEADS[h]['heading'], 'paragraphs': []}
        ents[f]['paragraphs'].append(it)
    out = []
    for f, e in ents.items():
        # frontmatter: the old file of the same name in this carnet, else the nearest earlier one
        if f in ALLFILES[c]: e['frontmatter_from'] = f
        else:
            earlier = [x for x in ALLFILES[c] if x[:10] <= e['date']]
            e['frontmatter_from'] = earlier[-1] if earlier else ALLFILES[c][0]
        out.append(e)
    first = out[0]
    cover = {'file': first['date'] + '-cover.md', 'date': first['date'], 'frontmatter_from': ALLFILES[c][0], 'paragraphs': COVERS[c]}
    # KRR 2026-09-28: no cover entries until the manuscript is scanned (texts kept in REVIEW)
    drop = [{'id': k, 'reason': r} for k, r in DROP.items() if k[:3] == c]
    plan = {'carnet': c, 'source': 'tome09.docx', 'drop': drop, 'entries': out}
    live = {e['file'] for e in out}
    dfiles = [{'file': f, 'reason': ('empty stub (no paragraph IDs); the day is rebuilt from tome09.docx as a new entry of the same name (2026-09-27 rebuild)' if f in live
               else 'empty stub (no paragraph IDs) for a range the manuscript files elsewhere (2026-09-27 rebuild)')} for f in IDLESS.get(c, [])]
    if dfiles: plan['drop_files'] = dfiles
    plans[c] = plan

# cross-carnet list
for c, plan in plans.items():
    xs = []
    for e in plan['entries']:
        for i, p in enumerate(e['paragraphs']):
            if 'old' in p and p['old'][:3] != c:
                xs.append({'id': p['old'], 'from_carnet': p['old'][:3], 'from_file': CB[p['old']]['file'], 'to_carnet': c, 'to_file': e['file'], 'position': i + 1})
    plan['_cross_carnet'] = xs
    json.dump(plan, open(f'plan-{c}.json', 'w'), ensure_ascii=False, indent=1)

# standalone variant: cross-carnet paragraphs stay in their source carnet, in entries named by their true day
os.makedirs('standalone', exist_ok=True)
SP = copy.deepcopy(plans)
for c, plan in SP.items():
    for e in plan['entries']:
        e['paragraphs'] = [p for p in e['paragraphs'] if not ('old' in p and p['old'][:3] != c)]
    plan['entries'] = [e for e in plan['entries'] if e['paragraphs']]
for c, plan in plans.items():
    for x in plan['_cross_carnet']:
        src = SP[x['from_carnet']]
        f = x['to_file']
        e = next((e for e in src['entries'] if e['file'] == f), None)
        if e is None:
            e = {'file': f, 'date': f[:10], 'frontmatter_from': x['from_file'], 'paragraphs': [], '_holding': f"cross-carnet holding entry: these paragraphs belong to carnet {c} ({f})"}
            src['entries'].append(e)
        para = next(p for ee in plan['entries'] for p in ee['paragraphs'] if p.get('old') == x['id'])
        e['paragraphs'].append(para)
for c, plan in SP.items():
    ents = plan['entries']
    cov = [e for e in ents if e['file'].endswith('-cover.md')]
    if cov and any(e.get('_holding') for e in ents) and min(e['file'][:10] for e in ents) < cov[0]['file'][:10]:
        # a cover entry must come first: in the standalone variant the cover paragraph opens the first own entry instead
        ents.remove(cov[0])
        first_own = min((e for e in ents if not e.get('_holding')), key=lambda e: e['file'])
        first_own['paragraphs'] = cov[0]['paragraphs'] + first_own['paragraphs']
    plan['entries'].sort(key=lambda e: (e['file'][:10], not e['file'].endswith('-cover.md'), e['file']))
    for e in plan['entries']:
        if e.get('_holding'):
            e['paragraphs'].sort(key=lambda p: POS[p['old']])
    json.dump(plan, open(f'standalone/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)

json.dump(groups, open('newgroups.json', 'w'), ensure_ascii=False, indent=1)
json.dump({k: [v[0], [list(x) for x in v[1]]] for k, v in COMPLETIONS.items()}, open('completions.json', 'w'), ensure_ascii=False, indent=1)
print('footnotes stripped:', FOUND_FOOTNOTES)
for c, p in plans.items():
    n_old = sum(1 for e in p['entries'] for x in e['paragraphs'] if 'old' in x)
    n_new = sum(1 for e in p['entries'] for x in e['paragraphs'] if 'new' in x)
    print(c, 'entries', len(p['entries']), 'old', n_old, 'new', n_new, 'drops', len(p['drop']), 'cross-in', len(p['_cross_carnet']))

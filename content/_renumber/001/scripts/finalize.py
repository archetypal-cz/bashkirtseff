"""Turn the draft plans (draft3/) into final plans (final/) for carnets 001-014.
Every judgement from the planner review is encoded here; see REVIEW.md."""
import json, re, sys, copy
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import load_carnet, norm, grams

W = '/home/coder/rebuild-state/plan-tome0102'
SRC = f'{W}/draft3'
OUT = f'{W}/final'
CARNETS = ['%03d' % i for i in range(1, 15)]
TS = '2026-09-28 rebuild'
LOG = []
def log(*a): LOG.append(' '.join(str(x) for x in a))

plans = {c: json.load(open(f'{SRC if int(c) <= 7 else W + "/draft5"}/plan-{c}.json')) for c in CARNETS}  # draft3 = tome 1, draft5 = tome 2 (date-line regex fixed twice)
orig = {c: load_carnet('_original', c) for c in CARNETS}
ocl = {cl['id']: cl for c in CARNETS for cl in orig[c]}
order = {c: [cl['id'] for cl in orig[c]] for c in CARNETS}
def vis(i): return '\n'.join(ocl[i]['vis'])
def existing_kind(i):
    for l in ocl[i]['lines']:
        if l.startswith('%% kind:'): return l
    return None
tomes = {'01': json.load(open(f'{W}/t01.json')), '02': json.load(open(f'{W}/t02.json'))}
def tome_of(c): return '01' if int(c) <= 7 else '02'
def docx(c, i): return tomes[tome_of(c)][i]['text']
def para_n(q):
    m = re.search(r'¶(\d+)', q['new'].get('rsr', ''))
    return int(m.group(1)) if m else None
def newpara(c, i, french, **kw):
    d = {'french': french, 'rsr': f'Restored from tome{tome_of(c)}.docx ¶{i} (missing from original extraction, {TS}).'}
    d.update(kw)
    return {'new': d}

withdrawn = []   # (carnet, what, text)

# --- 1. cover entries out (owner policy KRR 2026-09-28: no cover entries) -------------
for c, p in plans.items():
    keep = []
    for e in p['entries']:
        if e['file'].endswith('-cover.md'):
            for q in e['paragraphs']:
                withdrawn.append((c, f"docx ¶{para_n(q)} (draft cover entry)", q['new']['french']))
            log(c, 'cover entry removed', e['file'])
        else:
            keep.append(e)
    p['entries'] = keep

def all_paras(c):
    for e in plans[c]['entries']:
        for k, q in enumerate(e['paragraphs']):
            yield e, k, q

def find_old(i):
    for c in CARNETS:
        for e, k, q in all_paras(c):
            if q.get('old') == i: return c, e, k
    return None

def remove_new(c, n, why, record=True):
    for e in plans[c]['entries']:
        for k, q in enumerate(e['paragraphs']):
            if 'new' in q and para_n(q) == n:
                del e['paragraphs'][k]
                if record: withdrawn.append((c, f'docx ¶{n}', q['new']['french']))
                log(c, f'new ¶{n} removed:', why, '«' + q['new']['french'][:60] + '»')
                return q
    raise SystemExit(f'{c}: new ¶{n} not found')

def insert_after_old(c, after_id, para):
    for e, k, q in all_paras(c):
        if q.get('old') == after_id:
            e['paragraphs'].insert(k + 1, para); return
    raise SystemExit(f'{c}: {after_id} not placed')

def insert_after_new(c, n, para):
    for e, k, q in all_paras(c):
        if 'new' in q and para_n(q) == n:
            e['paragraphs'].insert(k + 1, para); return
    raise SystemExit(f'{c}: new ¶{n} not placed')

def set_old(i, **kw):
    r = find_old(i)
    if not r: raise SystemExit(f'{i} not placed')
    c, e, k = r
    e['paragraphs'][k].update(kw)

drops = {c: {} for c in CARNETS}
def drop(i, why, record_text=True):
    r = find_old(i)
    if r:
        c, e, k = r
        del e['paragraphs'][k]
    c = i[:3]
    drops[c][i] = why
    if record_text: withdrawn.append((c, i, vis(i)))

# --- 2. draft "empty placeholder" drops are restored: they carry RSR entry summaries,
#        LAN/TR notes and CON verdicts in the trees (187 of 195), so they are carried. -----
for c, p in plans.items():
    for d in p.get('drop', []):
        i = d['id']
        # place after the nearest preceding old ID that is placed
        pos = order[c].index(i)
        for j in range(pos - 1, -1, -1):
            if find_old(order[c][j]):
                insert_after_old(find_old(order[c][j])[0], order[c][j], {'old': i}); break
        else:
            plans[c]['entries'][0]['paragraphs'].insert(0, {'old': i})
    p['drop'] = []

# --- 3. draft completions are all spurious: _original splits one docx paragraph into
#        several clusters, so the "missing" words are in the neighbouring clusters. ------
for c in CARNETS:
    for e, k, q in all_paras(c):
        if 'set_french' in q:
            log(c, 'draft set_french rejected (text is in neighbouring clusters):', q['old'])
            del q['set_french']

# --- 4. cross-carnet: 006.0089 stays in 006 (repeated note: 005 ¶1539 «C'est vrai» vs 006 ¶1646)
r = find_old('006.0089')
if r and r[0] != '006':
    del r[1]['paragraphs'][r[2]]
    insert_after_old('006', '006.0088', {'old': '006.0089'})
    log('006.0089 returned to 006 (1873-06-25)')

# --- 5. title pages withdrawn (KRR 2026-09-28) ------------------------------------------
# new text on title pages / before the first date line
for c, n in [('002', 599), ('002', 600), ('002', 601), ('002', 602), ('002', 277), ('002', 278),
             ('004', 883), ('005', 1233), ('006', 1810)]:
    try: remove_new(c, n, 'title page withdrawn')
    except SystemExit as ex: log('WARN', ex)
# old paragraphs holding title-page text
for i in ['001.0004', '006.0001', '006.0002', '006.0003', '006.0004', '006.0005', '011.0002',
          '011.0446', '011.0447', '011.0448', '011.0449', '011.0450',
          '013.0002', '013.0003', '013.0004', '013.0005', '013.0006',
          '014.0002', '014.0003', '014.0004']:
    drop(i, 'title page of the notebook withdrawn (no cover or title-page text until the manuscript is scanned; KRR 2026-09-28); text kept in content/_renumber/001-014 REVIEW.md')
# title line glued into a heading cluster: keep the heading only
SETF = {}
SETF['001.0001'] = '# Samedi 11 janvier 1873'           # «Carnet N° 1» withdrawn
SETF['013.0001'] = '# Vendredi 21 novembre 1873'         # «Carnet N° 13» withdrawn
withdrawn += [('001', '001.0001 (title line only)', 'Carnet N° 1'), ('013', '013.0001 (title line only)', 'Carnet N° 13')]
# duplicate headings left once the title block between them is gone
drop('013.0007', 'duplicate date heading «Vendredi, 21 novembre 1873»; the day heading stays in 013.0001 (docx ¶7138)', False)
drop('014.0005', 'duplicate date heading «Mercredi, 10 décembre 1873»; the day heading stays in 014.0001 (docx ¶8512)', False)

# --- 6. page-break artefacts: clusters holding only «|» (008) ---------------------------
for c in CARNETS:
    for cl in orig[c]:
        if [v.strip() for v in cl['vis']] == ['|']:
            drop(cl['id'], 'page-break artefact «|» (no text; the manuscript sentence continues in the next paragraph)', False)

# --- 7. 010: 30 Sep / 1 Oct duplicates ------------------------------------------------------
drop('010.0149', 'truncated duplicate of 010.0152 (docx ¶3294–3295 has the sentence once, under 30 Sept)', False)
drop('010.0151', 'spurious date heading «Mercredi 1 octobre 1873» placed before 30 Sept text; the manuscript heading is 010.0155 (docx ¶3298)', False)
SETF['010.0155'] = '# Mercredi 1er octobre 1873'
# 010/1873-10-14: no such date in the manuscript (docx goes from 13 Oct to Livre 11)
drop('010.0463', 'invented stub: tome02.docx has no 14 October 1873 date line (13 Oct is followed by the Livre 11 title page)', False)
drop('010.0464', 'invented stub «[Pas d\'entrée pour cette date]» for a date the manuscript does not have', False)
drop('010.0465', 'entry summary of the invented 14 Oct stub', False)

# --- 8. heading labels as in the manuscript ------------------------------------------------
SETF['002.0089'] = '# Mardi 25 février 1873 (Mardi Gras)'
SETF['002.0136'] = '# Samedi 1er mars 1873 [Marie a mis par erreur 28 février]'
SETF['002.0142'] = '# Dimanche 2 mars 1873 [Marie a mis par erreur 1er mars]'
SETF['002.0278'] = '# Mardi 11 mars 1873 [mois rectifié]'
SETF['013.0092'] = '# Mercredi 26, jeudi 27 novembre 1873'
SETF['011.0451'] = '# Samedi 1er novembre 1873 (suite)'
for c, n in [('002', 366), ('002', 414), ('002', 419), ('002', 572), ('013', 7494)]:
    try: remove_new(c, n, 'heading label folded into the old heading (set_french)', record=False)
    except SystemExit as ex: log('WARN', ex)

# --- 9. marginal notes whose label _original dropped: old text gets its label back -----------
def bracket_body(t):
    m = re.fullmatch(r'\[(Dans la marge|En travers)\s*:\s*(.*)\]', t.strip(), re.S)
    return m.group(2).strip() if m else None
for c in CARNETS:
    for e in plans[c]['entries']:
        ps = e['paragraphs']
        k = 0
        while k < len(ps):
            q = ps[k]
            if 'new' in q:
                body = bracket_body(q['new']['french'])
                if body:
                    hit = None
                    for j in range(max(0, k - 3), min(len(ps), k + 4)):
                        o = ps[j].get('old')
                        if o and norm(vis(o)) == norm(body): hit = o
                    if hit:
                        SETF[hit] = q['new']['french'].replace('’', "'")
                        log(c, f'label restored on {hit} from docx ¶{para_n(q)}:', q['new']['french'][:60])
                        del ps[k]; continue
            k += 1

# --- 10. new paragraphs that duplicate old text or are unreadable OCR ------------------------
for c, n, why in [('014', 8775, 'garbled OCR repeat of the clipping tail already in 014.0059'),
                  ('014', 8813, 'OCR fragment of the clipping already in 014.0072'),
                  ('014', 9551, 'OCR fragment of the clipping already in 014.0227'),
                  ('014', 9033, 'unreadable OCR of a clipping picture (gift list; 014.0114–0115 hold the text)'),
                  ('013', 8235, 'OCR fragment of the clipping already in 013.0269'),
                  ('008', 868, 'date line «Lundi 25 août1873», already 008.0207')]:
    try: remove_new(c, n, why, record=False)
    except SystemExit as ex: log('WARN', ex)

# --- 11. 005 14 June: the mother's marginal note of ¶1539 is new (not 006.0089) ------------------
insert_after_new('005', 1538, newpara('005', 1539, "[Dans la marge: C'est vrai.] [Ecriture de sa mère]"))

# --- 11b. Livre 2: _original dropped the «[Dans la marge: …]» / «[Page intercalée: …]» wrapper
#          from ~30 whole-paragraph notes (docx style Body text (2)). The old text is kept as it is
#          (its OCR is already cleaned) and gets the manuscript label back.
LABELS_002 = {
    '0006': 'Dans la marge', '0020': 'Dans la marge', '0041': 'Dans la marge', '0043': 'Dans la marge',
    '0063': 'Dans la marge', '0067': 'Dans la marge', '0069': 'Dans la marge', '0079': 'Dans la marge',
    '0081': 'Page intercalée', '0084': 'Dans la marge', '0087': 'Dans la marge', '0115': 'Page intercalée',
    '0128': 'Dans la marge', '0138': 'Dans la marge', '0145': 'Dans la marge', '0155': 'Dans la marge',
    '0162': 'Dans la marge', '0164': 'Dans la marge', '0167': 'Dans la marge', '0171': 'Dans la marge',
    '0175': 'Dans la marge', '0177': 'Dans la marge', '0191': 'Dans la marge', '0195': 'Dans la marge',
    '0216': 'Dans la marge', '0221': 'Dans la marge', '0254': 'Dans la marge', '0277': 'Dans la marge',
    '0296': 'Dans la marge', '0304': 'Annotation',
}
for n, lab in LABELS_002.items():
    i = '002.' + n
    t = vis(i).strip()
    assert not t.startswith('[') and '\n' not in t, (i, t)
    SETF[i] = f'[{lab}: {t}]'
# 002.0024: the note sits inside the paragraph (docx ¶305); only its label is missing
SETF['002.0024'] = vis('002.0024').replace('[Voyez-vous ça !', '[Dans la marge: Voyez-vous ça !', 1)
assert SETF['002.0024'] != vis('002.0024')
# «Un petit sou s.v.p.» is in the margin twice (4 March ¶468 = 002.0191; 5 March ¶487, missing)
insert_after_old('002', '002.0206', newpara('002', 487, '[Dans la marge: Un petit sou s.v.p. !]'))
LOG.append('002 new ¶487 «[Dans la marge: Un petit sou s.v.p. !]» (second occurrence; OCR «s.v.p.!»)')

# --- 11c. 014: five struck words the extraction dropped inside paragraphs (docx ¶9632, ¶9738, ¶9741, ¶9780)
def insert_text(i, after, ins):
    t = SETF.get(i, vis(i))
    assert t.count(after) == 1, (i, after)
    SETF[i] = t.replace(after, after + ins, 1)
insert_text('014.0240' if False else [x['id'] for x in orig['014'] if 'Gioia était avec son fils' in vis(x['id'])][0], 'Combien fait l*a situation !*', ' [Rayé: fait beaucoup]')
SETF['014.0264'] = SETF.get('014.0264', vis('014.0264')).replace('reconquérir ses domaines. Paraît', "reconquérir ses domaines [Rayé: qu'on lui avait ravis.] Paraît", 1)
assert "ravis.] Paraît" in SETF['014.0264']
insert_text('014.0264', 'sa voiture du diable', ' [Rayé: traînée]')
insert_text('014.0267', "sifflant d'un air", ' [Rayé: insouciant]')
insert_text('014.0277', 'chemises de nuit, tantôt', ' [Rayé: il a mangé tout le dîner]')

# --- 11d. 005, 6 June: the list of coins on the inserted page (docx ¶1434–1460, «Table of contents»
#          style, skipped by the drafter as furniture). One row per line, tabs as spaces, OCR as printed.
rows = [re.sub(r'\s*\t\s*', ' ', docx('005', i).strip()) for i in range(1434, 1461)]
tbl = newpara('005', 1434, '\n'.join(rows), kind='other', source='liste de monnaies sur une page intercalée')
tbl['new']['rsr'] = ('Restored from tome01.docx ¶1434–1460 (missing from original extraction, 2026-09-28 rebuild): '
                     'a two-column list of coins and counts on the inserted page, set as a table in the edition; '
                     'OCR as printed («* cent francs», «10 k.*»).')
insert_after_new('005', 1433, tbl)
LOG.append('005 new ¶1434–1460 coin list after [Page intercalée]')
# 014.0301: the extraction replaced the opening words with those of 014.0300 (docx ¶9888; the LAN note
# on 0301 already glosses «Anglais poussière»)
assert vis('014.0301').startswith('Un Russe Ermolaïeff, une vieille')
SETF['014.0301'] = vis('014.0301').replace('Un Russe Ermolaïeff, une vieille', 'Dans le compartiment il y a trois Anglais poussière, une vieille', 1)

# 012.0231: Lise says «Mlle Baskirtseff» (docx ¶6741); _original had normalised the name
assert vis('012.0231').count('Bashkirtseff') == 1
SETF['012.0231'] = vis('012.0231').replace('Bashkirtseff', 'Baskirtseff')

# --- 12. kinds ---------------------------------------------------------------------------------
def top_groups(t):
    out, depth, cur, rest = [], 0, '', ''
    for ch in t:
        if ch == '[':
            depth += 1
            if depth == 1: cur = ''; continue
        if ch == ']':
            depth -= 1
            if depth == 0: out.append(cur); continue
        if depth >= 1: cur += ch
        else: rest += ch
    return out, rest.strip(), depth
def kind_for(t):
    t = t.strip().replace('’', "'")
    if not t.startswith('['): return None
    groups, rest, depth = top_groups(t)
    if rest or depth or not groups: return None
    g = groups[0]
    lab, _, body = g.partition(':')
    lab = lab.strip(); low = lab.lower()
    extra = [x for x in groups[1:]]
    src = None
    if any('criture de sa m' in x for x in extra): src = 'écriture de sa mère ?' if any('?' in x for x in extra) else 'écriture de sa mère'
    if re.match(r'(dans (la|ta) marge|en travers|ecrit plus loin dans les marges|écrit plus loin dans les marges|en marge)', low):
        return ('margin', src)
    if re.match(r'(rayé|raye)$', low) or (re.search(r'lignes? (rayée|cancellée)s?', low) and body.strip()):
        return ('rayé', None)
    if low.startswith('annotation'):
        y = re.match(r'\s*(\d{4}|[A-Za-zéû]+ \d{4}|\*?\d{4}[^:.]*)', body.strip())
        yr = re.search(r'1[89]\d\d', body[:25])
        return ('other', 'annotation de Marie' + (f', {yr.group(0)}' if yr else '') if 'mère' not in low else 'annotation de la mère de Marie')
    if low.startswith('page intercal') and body.strip(): return ('other', 'page intercalée')
    if low.startswith('page arrach'): return ('other', 'page arrachée')
    if low.startswith('rajout'): return ('other', 'ajouté entre les lignes')
    if low.startswith('sur la dernière page'): return ('other', 'dernière page du carnet')
    if low.startswith('sans date') and body.strip(): return ('other', 'note sans date')
    if not body.strip():
        return ('editorial', None)
    return None
kinds_set = {}
for c in CARNETS:
    for e, k, q in all_paras(c):
        if 'new' in q:
            t = q['new']['french']; kf = kind_for(t)
            q['new'].pop('kind', None); q['new'].pop('source', None); q.pop('_kind_guess_reason', None)
            if kf:
                q['new']['kind'] = kf[0]
                if kf[1]: q['new']['source'] = kf[1]
                kinds_set[f'new ¶{para_n(q)} ({c})'] = kf
        else:
            i = q['old']
            q.pop('kind', None); q.pop('source', None); q.pop('_kind_guess_reason', None)
            if existing_kind(i): continue
            t = SETF.get(i, vis(i))
            kf = kind_for(t)
            if kf:
                q['kind'] = kf[0]
                if kf[1]: q['source'] = kf[1]
                kinds_set[i] = kf
# continuation lines of a marginal note (004.0006 follows the bare «[Dans la marge]» 004.0005)
set_old('004.0005', kind='margin'); set_old('004.0006', kind='margin'); kinds_set['004.0005'] = ('margin', None); kinds_set['004.0006'] = ('margin', None)

# --- 12b. manual fixes -----------------------------------------------------------------------------
# 002: the 2 Feb page written at the end of Livre 2: the bracket belongs to the date line
remove_new('002', 565, 'bracket folded into the entry heading', record=False)
for e in plans['002']['entries']:
    if e['file'] == '1873-02-02.md':
        e['heading'] = 'Lundi 2 février 1873 [écrit en fin de carnet, antérieurement à ce qui précède.]'
        for q in e['paragraphs']:
            if 'new' in q and para_n(q) == 566:
                q['new']['french'] = '\n'.join(docx('002', i).strip() for i in range(566, 570))   # a list: one line per item
# 002.0093: the margin label _original dropped (docx ¶370)
SETF['002.0093'] = docx('002', 370).replace('’', "'")
set_old('002.0093', kind='margin'); kinds_set['002.0093'] = ('margin', None)
# 001: Borel/editors' provenance notes (carnet 001 is known only from Borel 1925)
for i in ('001.0002', '001.0003'):
    set_old(i, kind='editorial'); kinds_set[i] = ('editorial', None)
# 007.0161 mixes a struck line and a margin note: no kind, the inline forms stay
r = find_old('007.0161'); r[1]['paragraphs'][r[2]].pop('kind', None); r[1]['paragraphs'][r[2]].pop('source', None); kinds_set.pop('007.0161', None)
# obvious OCR slips in new text («11» for «!!», «//» for an italic «Il»)
for e, k, q in list(all_paras('002')):
    if 'new' in q and para_n(q) == 483:
        q['new']['french'] = q['new']['french'].replace('// me plaisait', '*Il me plaisait*').replace('**', '')
        q['new']['rsr'] += ' OCR «// me plaisait» read as «Il me plaisait» (italic).'
for e in plans['009']['entries']:
    for k, q in enumerate(e['paragraphs']):
        if 'new' in q and para_n(q) == 2261:
            a = newpara('009', 2261, docx('009', 2261).strip()[:-3] + ' !!')
            a['new']['rsr'] += ' OCR «11» read as «!!».'
            b = newpara('009', 2262, docx('009', 2262).strip())
            e['paragraphs'][k:k + 1] = [a, b]
            break
        if 'new' in q and para_n(q) == 2717:
            q['new']['french'] = '\n'.join(docx('009', i).strip() for i in range(2717, 2751) if docx('009', i).strip())

# --- 12c. date headings the drafter could not parse («Vendredi, 21 mars», no year) were placed after
#          their predecessor, i.e. at the end of the previous day. Move each (with the clusters of its
#          old file that trail it) to the head of its own day.
sys.path.insert(0, f'{W}/tool')
import importlib, common as _pc
importlib.reload(_pc)
for c in CARNETS:
    ents = {e['date']: e for e in plans[c]['entries']}
    for e in list(plans[c]['entries']):
        k = 0
        while k < len(e['paragraphs']):
            q = e['paragraphs'][k]
            i = q.get('old')
            if not i or not i.startswith(c):
                k += 1; continue
            hs = [v for v in (SETF.get(i, vis(i))).split('\n') if v.startswith('#')]
            y, m, d = map(int, e['date'].split('-'))
            ph = _pc.parse_heading(hs[0].lstrip('# '), (y, m, d)) if hs else None
            if ph and ph['date'] != e['date'] and ph['date'] in ents:
                j = k + 1
                while j < len(e['paragraphs']) and e['paragraphs'][j].get('old') and ocl[e['paragraphs'][j]['old']]['file'] == ocl[i]['file']:
                    j += 1
                run = e['paragraphs'][k:j]
                del e['paragraphs'][k:j]
                tgt = ents[ph['date']]['paragraphs']
                tgt[0:0] = run
                log(c, f'heading {i} {hs[0]!r} (+{len(run) - 1} following) moved from {e["file"]} to the head of {ph["date"]}')
                continue
            k += 1
# 001: keep the old order (heading cluster 001.0001 first, then the edition's provenance notes)
e0 = plans['001']['entries'][0]
ids = [q['old'] for q in e0['paragraphs']]
e0['paragraphs'].sort(key=lambda q: order['001'].index(q['old']))
log('001 first entry order', ids, '->', [q['old'] for q in e0['paragraphs']])

# --- 12d. Marie's own page-foot notes («¹ voir dans les trois livres précédents», «² Cependant on ne
#          doit pas se ruiner…», docx style Body text (11)) stay right after the paragraph that carries
#          the mark, as in _original; the drafter had moved them to the day printed on that page.
for i, after in [('011.0202', '011.0201'), ('011.0203', '011.0202'), ('012.0017', '012.0016')]:
    r = find_old(i); del r[1]['paragraphs'][r[2]]
    insert_after_old(i[:3], after, {'old': i})
    log(f'{i} kept after {after}')

# --- 12e. typesetting/OCR typos corrected (owner policy KRR 2026-09-28); Marie's own spellings stay
TYPO_OLD = {'002.0041': ('Miserere I]', 'Miserere !]'), '002.0177': ('Hamilton I]', 'Hamilton !]'),
            '002.0296': ('Hamilton II!', 'Hamilton !!!')}
for i, (a, b) in TYPO_OLD.items():
    assert a in SETF[i], i
    SETF[i] = SETF[i].replace(a, b)
for c in CARNETS:
    for e, k, q in all_paras(c):
        if 'new' not in q: continue
        t0 = q['new']['french']
        t = re.sub(r'([a-zà-ÿ])- ([a-zà-ÿ])', r'\1-\2', t0)       # line-break hyphen left by the typesetting
        t = t.replace('—t—', '-t-').replace('intercaléee', 'intercalée')
        if t != t0:
            q['new']['french'] = t
            q['new']['rsr'] += ' Typesetting slips corrected (line-break hyphens, «intercaléee», «—t—»).'
            log(c, f'typo fix new ¶{para_n(q)}')

# --- 13. apply set_french ------------------------------------------------------------------------
for i, t in SETF.items():
    set_old(i, set_french=t)

RSRN = {}
for i, t in SETF.items():
    why = ('title line withdrawn, date heading kept' if i in ('001.0001', '013.0001') else
           'date line as in the manuscript' if t.startswith('#') else
           'struck words restored from the manuscript' if '[Rayé:' in t and i.startswith('014.02') else
           'opening restored from the manuscript (the extraction had repeated 014.0300)' if i == '014.0301' else
           'name spelled as printed' if i == '012.0231' else
           'manuscript label restored')
    extra = ' OCR «I»/«II!» read as «!»/«!!!».' if i in TYPO_OLD else ''
    RSRN[i] = f'Text set from the manuscript edition in the 2026-09-28 rebuild: {why}.{extra}'

# --- 14. drops into the plans ------------------------------------------------------------------------
for c in CARNETS:
    plans[c]['drop'] = [{'id': i, 'reason': r} for i, r in sorted(drops[c].items())]
    plans[c]['source'] = f'tome{tome_of(c)}.docx'
    plans[c].pop('_draft', None)

# --- 15. entries that lost every paragraph -----------------------------------------------------------
for c in CARNETS:
    plans[c]['entries'] = [e for e in plans[c]['entries'] if e['paragraphs'] or e.get('body_from')]

import os
os.makedirs(OUT, exist_ok=True)
for c in CARNETS:
    json.dump(plans[c], open(f'{OUT}/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'rsr_notes': RSRN, 'withdrawn': withdrawn, 'kinds': {k: list(v) for k, v in kinds_set.items()}, 'setf': SETF, 'drops': drops}, open(f'{OUT}/decisions.json', 'w'), ensure_ascii=False, indent=1)
open(f'{OUT}/finalize.log', 'w').write('\n'.join(LOG) + '\n')
print('\n'.join(l for l in LOG if 'draft set_french rejected' not in l))
print('rejected completions:', sum('draft set_french rejected' in l for l in LOG))

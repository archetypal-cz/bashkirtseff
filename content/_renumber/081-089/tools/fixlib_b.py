RESTORE_SKIP = set()
# helpers exec'd into fix_083.py / fix_084.py
WITHDRAW = 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)'
ARTEFACT = 'extraction artefact: no such day/text in the manuscript (tome12.docx)'
NOTEXT = '[Aucun texte - date seule mentionnée]'

def strip_drafter_completions(p):
    n = 0
    for e in p['entries']:
        for q in e['paragraphs']:
            if 'old' in q and 'set_french' in q and not q.get('_tiler') and not q['set_french'].startswith('> '):
                q['_drafter_set_french'] = q.pop('set_french'); n += 1
    print('drafter completions removed', n)

def find(p, oid):
    for e in p['entries']:
        for k, q in enumerate(e['paragraphs']):
            if q.get('old') == oid: return e, k, q
    raise KeyError(oid)

def find_new(p, para):
    for e in p['entries']:
        for k, q in enumerate(e['paragraphs']):
            if 'new' in q and re.search(rf'¶{para}\b', q['new']['rsr']): return e, k, q
    raise KeyError(para)

def entry(p, fname):
    for e in p['entries']:
        if e['file'] == fname: return e
    raise KeyError(fname)

def remove_old(p, oid):
    e, k, q = find(p, oid); del e['paragraphs'][k]; return q

def drop(p, oid, reason):
    remove_old(p, oid); p['drop'].append({'id': oid, 'reason': reason})

def remove_new(p, para):
    e, k, q = find_new(p, para); del e['paragraphs'][k]; return q

def remove_entry(p, fname):
    p['entries'] = [e for e in p['entries'] if e['file'] != fname]

def insert_entry(p, ent):
    p['entries'].append(ent)

def move_old_after(p, oid, after_oid=None, to_entry=None, first=False):
    q = remove_old(p, oid)
    if to_entry:
        e = entry(p, to_entry)
        if first: e['paragraphs'].insert(0, q)
        else: e['paragraphs'].append(q)
    else:
        e, k, _ = find(p, after_oid); e['paragraphs'].insert(k + 1, q)

def setf(p, oid, text):
    e, k, q = find(p, oid); q['set_french'] = text; q['_b_setf'] = True

def kind(p, oid, kd, source=None):
    e, k, q = find(p, oid)
    if kd is None:
        q.pop('kind', None); q.pop('_kind_guess_reason', None); q.pop('source', None)
    else:
        q['kind'] = kd
        if source: q['source'] = source

def newkind(p, para, kd, source=None):
    e, k, q = find_new(p, para)
    if kd is None: q['new'].pop('kind', None); q['new'].pop('source', None); q.pop('_kind_guess_reason', None)
    else:
        q['new']['kind'] = kd
        if source: q['new']['source'] = source

def newtext(p, para, fr):
    e, k, q = find_new(p, para); q['new']['french'] = fr

def finish(p, A=None, B=None):
    if A is not None:
        import anchor_b, restore_b
        rlog = []
        restore_b.restore(p, '12', A, B, rlog, skip=RESTORE_SKIP)
        restore_b.labels(p, '12', A, B, rlog)
        restore_b.accents(p, '12', A, B, rlog)
        open(f"{W}/b/restore-{p['carnet']}.log", 'w').write('\n'.join(rlog) + '\n')
        print('restore:', len(rlog))
        log = []
        anchor_b.reorder(p, '12', A, B, log)
        open(f"{W}/b/reorder-{p['carnet']}.log", 'w').write('\n'.join(log) + '\n')
        print('reorder:', len(log), 'changes')
        home_placeholders(p)
        bare_days(p, A, B)
    from rebuild_order import order
    order(p)

def dash_lines(p, tome='12'):
    """a dialogue line (docx list-numbered «-» paragraph) inside a multi-¶ new paragraph starts its own line"""
    import json as _j
    sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
    from common import para_text
    NUM = _j.load(open(f'{W}/tools/numpr{tome}.json')); DX = tk.docx(tome); n = 0
    def qn(s): return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    for e in p['entries']:
        for q in e['paragraphs']:
            if 'new' not in q: continue
            m = re.search(r'¶(\d+)(?:[–-](\d+))?', q['new']['rsr'])
            if not m or not m.group(2): continue
            f = q['new']['french']
            for k in range(int(m.group(1)) + 1, int(m.group(2)) + 1):
                if NUM.get(str(k)) != '-': continue
                head = qn(para_text(DX[k]))[:25].strip()
                j = f.find('- ' + head)
                if j > 0 and f[j - 1] == ' ':
                    f = f[:j - 1] + '\n' + f[j:]; n += 1
            q['new']['french'] = f
    print('dialogue lines split', n)

PH = re.compile(r"^\s*(?:#[^\n]*\n)?\[Aucun texte - date seule mentionnée\]\s*$")

def home_placeholders(p):
    """old placeholder clusters go back to the entry named like their old file, right after its first paragraph"""
    from anchor_b import text_of, _O
    for e in list(p['entries']):
        for q in list(e['paragraphs']):
            if 'old' not in q or not PH.search(text_of(q)): continue
            of = _O[q['old'][:3]][q['old']][0]
            if of == e['file']: continue
            tgt = [x for x in p['entries'] if x['file'] == of]
            if not tgt: continue
            e['paragraphs'].remove(q); tgt[0]['paragraphs'].insert(1, q)
            print('placeholder', q['old'], 'back to', of)
    p['entries'] = [e for e in p['entries'] if e['paragraphs'] or e.get('body_from')]

def bare_days(p, A, B, tome='12'):
    """entries whose paragraphs hold only a heading, on a docx date line followed by another date line:
    the heading cluster gets the printed date line + «[Aucun texte - date seule mentionnée]»"""
    sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
    from common import parse_heading
    from anchor_b import text_of
    D = tk.docx(tome); prev = None; rows = []
    for d in D[A:B + 1]:
        t = d['t'].strip()
        if not t: continue
        h = parse_heading(t, prev)
        if h and (h['rest'] == '' or len(t) < 120):
            prev = h['ymd']; rows.append(('%04d-%02d-%02d' % h['ymd'], d['i'], t))
        else: rows.append((None, d['i'], t))
    bare = {}
    for k, (dt, i, t) in enumerate(rows):
        if dt and (k + 1 == len(rows) or rows[k + 1][0]): bare[dt] = re.sub(r'(?<=\d) (?=\d)', '', t)
    n = 0
    for e in p['entries']:
        if e['date'] not in bare: continue
        body = [l for q in e['paragraphs'] for l in text_of(q).split('\n') if l.strip() and not l.startswith('#')]
        if body: continue
        if any(PH.search(text_of(q)) for q in e['paragraphs']): continue
        hq = [q for q in e['paragraphs'] if 'old' in q]
        if hq:
            hq[0]['set_french'] = '# ' + bare[e['date']] + '\n' + NOTEXT; n += 1
        else:
            print('bare day without old cluster', e['file'])
    print('bare days', n)

POST_SUBS = []   # (id or ¶N, old, new): OCR fixes applied after finish() to the final French
def apply_subs(p):
    apply_moves(p)
    from anchor_b import text_of
    for key, a, b in POST_SUBS:
        if key.startswith('¶'):
            e, k, q = find_new(p, int(key[1:])); t = q['new']['french']
            assert a in t, (key, a); q['new']['french'] = t.replace(a, b)
        else:
            e, k, q = find(p, key); t = text_of(q)
            assert a in t, (key, a); q['set_french'] = t.replace(a, b)
    print('OCR/label fixes', len(POST_SUBS))

def rsr_for(para, tome='12', extra=''):
    pg = sorted({x - 1 for x in tk.pages_for(tome, para)})
    ps = f'p.{pg[0]}' if len(pg) == 1 else (f'pp.{pg[0]}–{pg[-1]}' if pg else 'p.?')
    return f'Restored from tome{tome}.docx ¶{para}, Mon Journal t.{tome} {ps} (missing from original extraction, 2026-09-28 rebuild).' + (' ' + extra if extra else '')

def add_new_after(p, after, french, para, kind=None, source=None, extra=''):
    """after: old id or '¶N' of a new paragraph"""
    if after.startswith('¶'): e, k, _ = find_new(p, int(after[1:]))
    else: e, k, _ = find(p, after)
    n = {'french': french, 'rsr': rsr_for(para, extra=extra)}
    if kind: n['kind'] = kind
    if source: n['source'] = source
    e['paragraphs'].insert(k + 1, {'new': n})

POST_MOVES = []   # (id, after_id): applied after finish()
def apply_moves(p):
    for oid, after in POST_MOVES:
        q = remove_old(p, oid); e, k, _ = find(p, after); e['paragraphs'].insert(k + 1, q)

# printer's typesetting typos (owner policy 2026-09-28): (wrong, right); regex word-bounded
TYPOS = [('désse', 'déesse'), ('muisque', 'musique'), ('supérieuee', 'supérieure'), ('surla', 'sur la'),
    ('regette', 'regrette'), ('plusieus', 'plusieurs'), ('mangifique', 'magnifique'), ('accepe', 'accepte'),
    ('soufffre', 'souffre'), ('éœurantes', 'écœurantes'), ('enregister', 'enregistrer'), ('bleux', 'bleus'),
    ('ds', 'des'), ('chanoi- nesse', 'chanoinesse'), ('chanoi nesse', 'chanoinesse'), ('gand', 'grand'),
    ('profonation', 'profanation'), ('javais', "j'avais"), ('possile', 'possible'), ('drie', 'dire'),
    ('ranconté', 'raconté'), ('leque', 'lequel'), ('noricis', 'noircis'), ('espérence', 'espérance'),
    ('plens', 'pleins'), ('dnas', 'dans'), ('Seilliéres', 'Seillière'), ('manusrit', 'manuscrit'),
    ('capales', 'capables'), ('colèe', 'colère'), ('monste', 'monstre'), ('porée', 'portée'),
    ('olypmpique', 'olympique'), ('frémmis', 'frémis'), ('commenttre', 'commettre'), ('Fhéâtre', 'Théâtre'),
    ('Angalis', 'Anglais'), ('physqiue', 'physique'), ('connaisances', 'connaissances'), ('Nelle', 'Mlle')]
HEADING_TYPO_NOTES = {}   # old id -> note (headings already normalised)

def _page_of(word, A, B, text=''):
    from check_b import fold, grams
    tg = set(grams(fold(text), 4)); best = None
    for d in tk.docx('12')[A:B + 1]:
        if re.search(r'(?<!\w)' + re.escape(word) + r'(?!\w)', d['t']):
            sc = len(tg & set(grams(fold(d['t']), 4)))
            if best is None or sc > best[0]: best = (sc, d['i'])
    if not best: return None
    pg = sorted({x - 1 for x in tk.pages_for('12', best[1])})
    return f'p.{pg[0]}' if pg else 'p.?'

def apply_typos(p, A, B):
    from anchor_b import text_of
    n = 0; log = []
    for e in p['entries']:
        for q in e['paragraphs']:
            if 'new' not in q and 'set_french' not in q: continue
            t = text_of(q); notes = []
            for w, r in TYPOS:
                rx = re.compile(r'(?<!\w)' + re.escape(w) + r'(?!\w)')
                if not rx.search(t): continue
                pg = _page_of(w, A, B, t)
                if not pg: continue          # not a print reading (e.g. Marie's text elsewhere)
                t = rx.sub(r, t); notes.append(f'«{w}» → «{r}» (Mon Journal t.12 {pg})'); n += 1
            if not notes: continue
            note = "Printer's typo corrected: " + '; '.join(notes) + '.'
            if 'new' in q: q['new']['french'] = t; q['new']['rsr'] += ' ' + note
            else: q['set_french'] = t; q['_rsr'] = (q.get('_rsr', '') + ' ' + note).strip()
            log.append(f"{q.get('old') or 'NEW ' + re.search(r'¶[\d–]+', q['new']['rsr']).group()}: {note}")
    for oid, note in HEADING_TYPO_NOTES.items():
        e, k, q = find(p, oid); q['_rsr'] = (q.get('_rsr', '') + ' ' + note).strip()
        log.append(f'{oid}: {note}')
    open(f"{W}/b/typos-{p['carnet']}.log", 'w').write('\n'.join(log) + '\n')
    print('printer typos fixed', n)

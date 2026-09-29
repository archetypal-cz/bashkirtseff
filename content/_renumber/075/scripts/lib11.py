"""Helpers for build11.py: load the draft plans of tome 11 and edit them."""
import json, re, glob, os, sys, copy
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
sys.path.insert(0, os.path.dirname(__file__))
from common import para_text
from scanlib import printed_pages
from cl import load, vis

HERE = os.path.dirname(os.path.abspath(__file__))
DRAFT = os.path.join(HERE, '..', 'draft11')
P = json.load(open(max(glob.glob('/home/coder/bashkirtseff/.cache/rebuild-plan/tome11.docx.*.json'), key=os.path.getmtime)))
PM = json.load(open(os.path.join(HERE, 'align11.json')))['pm']
CARNETS = ['075', '076', '077', '078', '079', '080']
O = {}
for _c in CARNETS:
    O.update(load('_original', _c))
TODAY = '2026-09-28'

plans = {c: json.load(open(f'{DRAFT}/plan-{c}.json')) for c in CARNETS}
LOG = []


def note(msg):
    LOG.append(msg)


def page(a, b=None):
    return printed_pages(PM, a, b if b is not None else a)


def rsr_for(a, b=None, extra=''):
    b = a if b is None else b
    rng = f'¶{a}' if a == b else f'¶{a}–{b}'
    pg = page(a, b)
    where = f'tome11.docx {rng}' + (f', Mon Journal t.11 {pg}' if pg else '')
    return f'Restored from {where} (missing from original extraction, {TODAY} rebuild).' + (f' {extra}' if extra else '')


def dtext(i):
    return para_text(P[i])


def old_text(i):
    return '\n'.join(vis(O[i]['lines']))


def mk_new(french, a, b=None, kind=None, source=None, extra='', rsr=None, tags=None):
    n = {'french': french, 'rsr': rsr or rsr_for(a, b, extra)}
    if kind:
        n['kind'] = kind
    if source:
        n['source'] = source
    if tags:
        n['tags'] = tags
    return {'new': n}


def first_para(x):
    if 'new' in x:
        m = re.search(r'¶(\d+)', x['new']['rsr'])
        return int(m.group(1)) if m else None
    return None


def locate(pred):
    """(carnet, entry index, paragraph index) of the single paragraph matching pred."""
    hits = [(c, ei, pi) for c, p in plans.items() for ei, e in enumerate(p['entries']) for pi, x in enumerate(e['paragraphs']) if pred(x)]
    if len(hits) != 1:
        raise SystemExit(f'locate: {len(hits)} hits')
    return hits[0]


def loc_old(i):
    return locate(lambda x: x.get('old') == i)


def loc_new(n):
    return locate(lambda x: first_para(x) == n)


def get(key):
    c, ei, pi = loc_old(key) if isinstance(key, str) else loc_new(key)
    return plans[c]['entries'][ei]['paragraphs'][pi]


def remove(key):
    c, ei, pi = loc_old(key) if isinstance(key, str) else loc_new(key)
    return plans[c]['entries'][ei]['paragraphs'].pop(pi)


def drop_old(i, reason):
    remove(i)
    plans[i[:3]].setdefault('drop', []).append({'id': i, 'reason': reason})


def drop_new(n, why):
    x = remove(n)
    note(f'new ¶{n} not inserted: {why} «{x["new"]["french"][:80]}»')


def insert(item, after=None, before=None):
    key = after if after is not None else before
    c, ei, pi = loc_old(key) if isinstance(key, str) else loc_new(key)
    plans[c]['entries'][ei]['paragraphs'].insert(pi + (1 if after is not None else 0), item)


def move_old(i, after=None, before=None):
    x = remove(i)
    insert(x, after=after, before=before)


def replace_new_with_old(n, i):
    """new ¶n is really old paragraph i (which the draft placed elsewhere)."""
    x = remove(i)
    for k in [k for k in list(x) if k not in ('old',)]:
        if k.startswith('_') or k == 'set_french':
            x.pop(k)
    c, ei, pi = loc_new(n)
    plans[c]['entries'][ei]['paragraphs'][pi] = x


def set_old(i, **kw):
    x = get(i)
    for k, v in kw.items():
        if v is None:
            x.pop(k, None)
        else:
            x[k] = v
    x.pop('_kind_guess_reason', None)


def set_new(n, **kw):
    x = get(n)['new']
    for k, v in kw.items():
        if v is None:
            x.pop(k, None)
        else:
            x[k] = v


def entry(c, fname):
    for e in plans[c]['entries']:
        if e['file'] == fname:
            return e
    raise SystemExit(f'no entry {c}/{fname}')


def remove_entry(c, fname):
    e = entry(c, fname)
    plans[c]['entries'].remove(e)
    return e


def quote(text):
    return '\n'.join(l if l.startswith('>') else '> ' + l for l in text.split('\n'))


def unquote(text):
    return '\n'.join(re.sub(r'^> ?', '', l) for l in text.split('\n'))


def letter(keys, source, kind='letter', fix=None):
    """mark each paragraph (old id or new ¶) as a letter/clipping; old ones get `> `-quoted French via set_french."""
    for k in keys:
        x = get(k)
        if 'new' in x:
            x['new']['kind'] = kind
            x['new']['source'] = source
            if fix and k in fix:
                x['new']['french'] = fix[k]
            x['new']['french'] = unquote(x['new']['french'])
        else:
            cur = x.get('set_french') or old_text(k)
            if fix and k in fix:
                cur = fix[k]
            heading = [l for l in cur.split('\n') if l.startswith('#')]
            body = [l for l in cur.split('\n') if not l.startswith('#')]
            q = '\n'.join(heading + [quote(l) for l in body])
            x['kind'] = kind
            x['source'] = source
            x.pop('_kind_guess_reason', None)
            if q != old_text(k):
                x['set_french'] = q
            else:
                x.pop('set_french', None)


def ids_range(a, b):
    c = a[:3]
    return [f'{c}.{n:04d}' for n in range(int(a[4:]), int(b[4:]) + 1)]


def write(outdir):
    os.makedirs(outdir, exist_ok=True)
    for c, p in plans.items():
        p.pop('_draft', None)
        p['source'] = 'tome11.docx'
        p['drop'] = sorted(p.get('drop', []), key=lambda d: d['id'])
        for e in p['entries']:
            for x in e['paragraphs']:
                x.pop('_kind_guess_reason', None)
        json.dump(p, open(f'{outdir}/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
    open(f'{outdir}/build.log', 'w').write('\n'.join(LOG) + '\n')

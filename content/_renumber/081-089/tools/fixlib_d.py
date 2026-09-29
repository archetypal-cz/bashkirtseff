"""Helpers for worker D's fix scripts (087–089). Base = identity plan (current layout): the draft
misfiled whole days wherever the docx date line was OCR-garbled («March 17 février», «Dimanche Î1»),
so the plans are built from the identity layout plus explicit edits."""
import json, os
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TS = 'tome13.docx'

def load(c):
    p = json.load(open(f'{W}/identity/plan-{c}.json'))
    p = {'carnet': c, 'source': TS, 'drop': [], 'entries': p['entries']}
    for e in p['entries']:
        e.pop('_first_line', None)
    return p

def find(p, oid):
    for e in p['entries']:
        for k, q in enumerate(e['paragraphs']):
            if q.get('old') == oid:
                return e, k, q
    raise KeyError(oid)

def kind(p, ids, k, source=None):
    for i in ids:
        _, _, q = find(p, i)
        q['kind'] = k
        if source: q['source'] = source

def setf(p, oid, text):
    find(p, oid)[2]['set_french'] = text

def take(p, oid):
    e, k, q = find(p, oid)
    return e['paragraphs'].pop(k)

def insert_after(p, oid, items):
    e, k, _ = find(p, oid)
    e['paragraphs'][k + 1:k + 1] = items

def drop(p, oid, reason):
    take(p, oid)
    p['drop'].append({'id': oid, 'reason': reason})

def new(french, rsr, kind=None, source=None):
    n = {'french': french, 'rsr': rsr}
    if kind: n['kind'] = kind
    if source: n['source'] = source
    return {'new': n}

def save(p, c):
    json.dump(p, open(f'{W}/final/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
    ps = [q for e in p['entries'] for q in e['paragraphs']]
    print(c, 'entries', len(p['entries']), 'old', sum('old' in q for q in ps), 'new', sum('new' in q for q in ps),
          'dropped', len(p['drop']), 'set_french', sum('set_french' in q for q in ps),
          'kinds', sum(1 for q in ps if q.get('kind') or q.get('new', {}).get('kind')))

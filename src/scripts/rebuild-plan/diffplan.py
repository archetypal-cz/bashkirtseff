"""Compare two rebuild plans for the same carnet (e.g. a draft against the plan
that was finally applied): entries, where each old paragraph goes, drops, new
paragraphs, set_french, heading moves and kinds.

  uv run python src/scripts/rebuild-plan/diffplan.py draft.json final.json
"""
from __future__ import annotations

import collections
import difflib
import json
import sys

from common import norm


def flat(plan):
    out = []
    for e in plan['entries']:
        for n, p in enumerate(e['paragraphs']):
            out.append((e['file'], n, p))
    return out


def kind_of(p):
    return p.get('kind') or (p.get('new') or {}).get('kind')


def main(a_path, b_path):
    A, B = json.load(open(a_path)), json.load(open(b_path))
    fa, fb = flat(A), flat(B)
    L = []
    ea, eb = [e['file'] for e in A['entries']], [e['file'] for e in B['entries']]
    L.append(f'entries: {len(ea)} vs {len(eb)}')
    only_a, only_b = [f for f in ea if f not in eb], [f for f in eb if f not in ea]
    if only_a:
        L.append(f'  only in A: {", ".join(only_a)}')
    if only_b:
        L.append(f'  only in B: {", ".join(only_b)}')
    oa = {p['old']: f for f, _, p in fa if 'old' in p}
    ob = {p['old']: f for f, _, p in fb if 'old' in p}
    da = {d['id'] for d in A.get('drop', [])}
    db = {d['id'] for d in B.get('drop', [])}
    L.append(f'old placed: {len(oa)} vs {len(ob)}; dropped: {len(da)} vs {len(db)}')
    if da ^ db:
        L.append(f'  dropped only in A: {sorted(da - db)}; only in B: {sorted(db - da)}')
    moved = [(k, oa[k], ob[k]) for k in oa if k in ob and oa[k] != ob[k]]
    L.append(f'old paragraphs in a different entry: {len(moved)}')
    for k, x, y in moved:
        L.append(f'  {k}: {x} vs {y}')
    # order of old paragraphs
    seq_a = [k for k in (p['old'] for _, _, p in fa if 'old' in p) if k in ob]
    seq_b = [k for k in (p['old'] for _, _, p in fb if 'old' in p) if k in oa]
    if seq_a != seq_b:
        sm = difflib.SequenceMatcher(None, seq_a, seq_b)
        L.append('old paragraph order differs:')
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op != 'equal':
                L.append(f'  {op}: A {seq_a[i1:i2][:6]} / B {seq_b[j1:j2][:6]}')
    # new paragraphs: match by normalised text
    na = [(f, p['new']) for f, _, p in fa if 'new' in p]
    nb = [(f, p['new']) for f, _, p in fb if 'new' in p]
    L.append(f'new paragraphs: {len(na)} vs {len(nb)}; chars {sum(len(x["french"]) for _, x in na):,} vs {sum(len(x["french"]) for _, x in nb):,}')
    ta = collections.Counter(norm(x['french']) for _, x in na)
    tb = collections.Counter(norm(x['french']) for _, x in nb)
    same = sum((ta & tb).values())
    L.append(f'  identical new texts: {same}')
    wa = ' '.join(norm(x['french']) for _, x in na).split()
    wb = ' '.join(norm(x['french']) for _, x in nb).split()
    L.append(f'  word overlap of all new text: {sum((collections.Counter(wa) & collections.Counter(wb)).values()):,} of {len(wa):,} (A) / {len(wb):,} (B) words')
    only = [(f, x) for f, x in na if norm(x['french']) not in tb]
    L.append(f'  new in A without an identical text in B: {len(only)}')
    for f, x in only[:15]:
        L.append(f'    {f}: «{x["french"][:70]}»')
    only = [(f, x) for f, x in nb if norm(x['french']) not in ta]
    L.append(f'  new in B without an identical text in A: {len(only)}')
    for f, x in only[:15]:
        L.append(f'    {f}: «{x["french"][:70]}»')
    # new paragraph placement: same text, different entry
    fa_of = {norm(x['french']): f for f, x in na}
    misplaced = [(f, fa_of[norm(x['french'])], x['french'][:50]) for f, x in nb if norm(x['french']) in fa_of and fa_of[norm(x['french'])] != f]
    L.append(f'  same new text in a different entry: {len(misplaced)}')
    for f, g, t in misplaced[:10]:
        L.append(f'    A {g} vs B {f}: «{t}»')
    # set_french / heading moves / kinds
    sa = {p['old'] for _, _, p in fa if 'set_french' in p}
    sb = {p['old'] for _, _, p in fb if 'set_french' in p}
    L.append(f'set_french: {len(sa)} vs {len(sb)}; both {len(sa & sb)}; only A {sorted(sa - sb)}; only B {sorted(sb - sa)}')
    ha = {p['old'] for _, _, p in fa if p.get('heading_to_next')}
    L.append(f'heading_to_next (A): {len(ha)}; of these with a set_french in B: {len(ha & sb)}')
    ka = collections.Counter(kind_of(p) for _, _, p in fa if kind_of(p))
    kb = collections.Counter(kind_of(p) for _, _, p in fb if kind_of(p))
    L.append(f'kinds: A {dict(ka)} vs B {dict(kb)}')
    oka = {p['old']: kind_of(p) for _, _, p in fa if 'old' in p and kind_of(p)}
    okb = {p['old']: kind_of(p) for _, _, p in fb if 'old' in p and kind_of(p)}
    agree = sum(1 for k in oka if okb.get(k) == oka[k])
    L.append(f'  old-paragraph kinds: A {len(oka)}, B {len(okb)}, same kind {agree}; only B: {sorted(set(okb) - set(oka))[:20]}')
    print('\n'.join(L))


if __name__ == '__main__':
    main(*sys.argv[1:3])

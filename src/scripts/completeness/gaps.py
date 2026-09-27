"""Build gap runs from scored.json."""
import json, os, re, collections, sys
from paths import work
D = json.load(open(work('scored.json')))
orig = D['orig']
MATCH = 0.5
PART = 0.2

def status(r):
    if r['cls'] in ('empty', 'furniture'):
        return 'N'
    c = r.get('cont', 0)
    if r['cls'] == 'text' and r.get('nw', 0) < 8 and c >= MATCH:
        return 'W'  # weak: short para found somewhere; does not break a gap
    if r['cls'] == 'text' and r.get('nw', 0) < 15 and PART <= c < MATCH:
        return 'W'
    if c >= MATCH:
        return 'M'
    if c >= PART:
        return 'P'
    return 'U'

allgaps = []
partials = []
percarnet = collections.defaultdict(lambda: collections.Counter())
RANGES = {1:(0,7),2:(8,14),3:(15,20),4:(21,30),5:(31,44),6:(45,52),7:(53,59),8:(60,64),9:(65,68),10:(69,74),11:(75,80),12:(81,84),13:(85,89),14:(90,94),15:(95,100),16:(101,106)}
def allowed(tn):
    a, b = RANGES[int(tn)]
    return {f'{x:03d}' for x in range(max(0, a - 1), b + 2)}
for tn in map(str, range(1, 17)):
    rows = D['tomes'][tn]
    ok = allowed(tn)
    for r in rows:
        if r.get('carnet') and r['carnet'] not in ok:
            r['carnet'] = None
        # recompute carnet from anchors when vote out of range
        if r.get('carnet') is None and r.get('loc') is not None and orig[r['loc']][0] in ok:
            r['carnet'] = orig[r['loc']][0]
    st = [status(r) for r in rows]
    Ms = [k for k, s in enumerate(st) if s == 'M' and rows[k]['cls'] == 'text' and rows[k].get('nw', 0) >= 10 and rows[k].get('carnet', '000') != '000']
    lo = Ms[0]
    endk = [k for k, r in enumerate(rows) if k > len(rows) // 2 and re.match(r'\s*(I?NDEX|TABLE DES MATI|\[Marie Bashkirtseff est d)', r['text'])]
    hi = (endk[0] - 1) if endk else Ms[-1]
    # carnet for each row: own vote if M/P, else neighbours
    prevM = [None] * len(rows)
    last = None
    for k in range(len(rows)):
        prevM[k] = last
        if st[k] == 'M' and rows[k].get('nw', 0) >= 8 and rows[k].get('carnet'):
            last = k
    nextM = [None] * len(rows)
    nxt = None
    for k in range(len(rows) - 1, -1, -1):
        nextM[k] = nxt
        if st[k] == 'M' and rows[k].get('nw', 0) >= 8 and rows[k].get('carnet'):
            nxt = k
    livre_at = [k for k, r in enumerate(rows) if r['cls'] == 'livre']
    hc = [None] * len(rows)
    cur = None
    for k, r in enumerate(rows):
        if k <= hi:
            m = re.match(r'\s*(livre|carnet|cahier)\s*(n°)?\s*([0-9IO lo]+)', r['text'], re.I)
            if m and len(r['text']) < 250:
                num = m.group(3).replace(' ', '').translate(str.maketrans('OoIl', '0011'))
                if num.isdigit() and 0 < int(num) < 107:
                    if int(num) == 4 and tn == '5':
                        num = '40'
                    if int(num) >= RANGES[int(tn)][0]:
                        cur = f'{int(num):03d}'
        hc[k] = cur
    heads = []
    curhead = None
    headof = [None] * len(rows)
    for k, r in enumerate(rows):
        if r['cls'] == 'head':
            curhead = (r['i'], r['text'])
        headof[k] = curhead

    def carnet_for(k):
        r = rows[k]
        if st[k] == 'M' and r.get('nw', 0) >= 8 and r.get('carnet'):
            return r['carnet']
        p, n = prevM[k], nextM[k]
        pc_ = rows[p]['carnet'] if p is not None else None
        nc_ = rows[n]['carnet'] if n is not None else None
        if pc_ and pc_ == nc_:
            return pc_
        if hc[k] and hc[k] in (pc_, nc_):
            return hc[k]
        if p is not None and n is not None:
            if any(p < L <= k for L in livre_at):
                return nc_
            return pc_
        if p is not None:
            return rows[p]['carnet']
        if n is not None:
            return rows[n]['carnet']
        return '???'

    # tally per carnet (only diary body region)
    for k in range(lo, hi + 1):
        r = rows[k]
        if r['cls'] != 'text':
            continue
        c = carnet_for(k)
        pc = percarnet[c]
        pc['tome_paras'] += 1
        pc['tome_chars'] += r['len']
        s = st[k]
        if s in ('M', 'W') and r['cont'] >= MATCH:
            pc['matched'] += 1
        elif s in ('P', 'W'):
            pc['partial'] += 1
            pc['partial_chars_est'] += int(r['len'] * (1 - r['cont']))
        else:
            pc['unmatched'] += 1
            pc['unmatched_chars'] += r['len']
        if s == 'P' or (s == 'M' and r['cont'] < 0.8 and r['len'] > 400):
            partials.append({'tome': int(tn), 'docx': r['i'], 'carnet': c, 'cont': r['cont'], 'len': r['len'],
                             'est_missing_chars': int(r['len'] * (1 - r['cont'])),
                             'head': headof[k][1] if headof[k] else None, 'first': r['text'][:100]})

    # runs of U (N and U-heads join; text U counts)
    k = 0
    n = len(rows)
    while k < n:
        if st[k] == 'U' and rows[k]['cls'] in ('text', 'head'):
            j = k
            while j + 1 < n and st[j + 1] in ('U', 'N', 'W') and not (k <= hi < j + 1) and not (k < lo <= j + 1):
                j += 1
            # trim trailing N
            while st[j] in ('N', 'W'):
                j -= 1
            seg = [m for m in range(k, j + 1) if rows[m]['cls'] in ('text', 'head', 'livre') and st[m] == 'U']
            texts = [m for m in seg if rows[m]['cls'] == 'text']
            chars = sum(rows[m]['len'] for m in texts)
            region = 'body' if lo <= k <= hi else ('front' if k < lo else 'back')
            p, nx = prevM[k], nextM[j]
            def locinfo(m, key):
                if m is None or rows[m].get(key) is None:
                    return None
                o = orig[rows[m][key]]
                return {'docx': rows[m]['i'], 'carnet': o[0], 'file': o[1], 'pid': o[2]}
            heads_in = [rows[m]['text'] for m in seg if rows[m]['cls'] == 'head']
            styles = collections.Counter(rows[m]['s'] for m in texts)
            flags = []
            txtjoined = ' '.join(rows[m]['text'] for m in texts)
            if re.match(r'^\s*\[', txtjoined) or 'Rayé' in txtjoined[:60] or 'marge' in txtjoined[:60].lower():
                flags.append('bracketed/rayé')
            if re.search(r'(manuscrit|Marie a (not|écrit|dessin|coll)|coupure|feuillet|\bp\. ?\d|Bas de page|illisible|déchir|collée? dans|Note de|\[Dessin|\[Croquis)', txtjoined[:400], re.I):
                flags.append('editorial?')
            pk = k - 1
            while pk >= 0 and rows[pk]['cls'] in ('empty', 'furniture'):
                pk -= 1
            ptxt = rows[pk]['text'] if pk >= 0 else ''
            if (len(ptxt) >= 8 and ptxt.upper() == ptxt and re.search('[A-Z]{5}', ptxt)) or re.search(r'Ignotus|Le Figaro|Le Gaulois|Gazette|Journal des', txtjoined[:300] + txtjoined[-300:]):
                flags.append('clipping?')
            if region != 'body':
                flags.append('apparatus-region')
            if texts and all(rows[m]['len'] < 60 for m in texts):
                flags.append('short-only')
            if re.search(r'\b[A-Z][a-zé]+ \(.*\),? ?[\d ,\-]+$', txtjoined[:200]):
                flags.append('index-like')
            g = {
                'tome': int(tn), 'docx_start': rows[k]['i'], 'docx_end': rows[j]['i'],
                'n_paras': len(texts), 'n_heads': len(heads_in), 'chars': chars,
                'carnet': carnet_for(k), 'region': region,
                'date_heading': headof[k][1] if headof[k] else None,
                'date_heading_docx': headof[k][0] if headof[k] else None,
                'heads_inside': heads_in,
                'prev_match': locinfo(p, 'loc2'), 'next_match': locinfo(nx, 'loc'),
                'first': rows[texts[0]]['text'][:120] if texts else rows[k]['text'][:120],
                'last': rows[texts[-1]]['text'][-80:] if texts else '',
                'styles': dict(styles), 'flags': flags,
                'docx_indices': [rows[m]['i'] for m in texts],
            }
            allgaps.append(g)
            k = j + 1
        else:
            k += 1

json.dump({'gaps': allgaps, 'partials': partials, 'percarnet': {c: dict(v) for c, v in percarnet.items()}},
          open(work('gaps.json'), 'w'), ensure_ascii=False, indent=1)
body = [g for g in allgaps if g['region'] == 'body']
print('gaps total', len(allgaps), 'body', len(body), 'body chars', sum(g['chars'] for g in body))

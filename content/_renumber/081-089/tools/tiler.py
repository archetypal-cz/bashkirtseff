"""Tile cut-short _original clusters over their docx paragraph.

_original in tome 12/13 often holds only the first sentence(s) of a docx paragraph, and sometimes
splits one docx paragraph into several clusters that each keep only their first sentences. The
drafter proposes set_french = whole docx paragraph for the head cluster and leaves the fragments
«not found», which would duplicate text. This tool computes, per docx paragraph P, the char span of
every old cluster inside P and gives each cluster the missing text up to the next cluster's start
(the first one also any text before it): old text kept verbatim, docx text appended.

python3 tiler.py TOME PLAN_IN PLAN_OUT REPORT [--root REPO]
"""
import sys, re, json, difflib, unicodedata, argparse, collections, os
sys.path.insert(0, os.path.dirname(__file__))
import tk
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import para_text, load_carnet, visible_lines  # noqa

ap = argparse.ArgumentParser()
ap.add_argument('tome'); ap.add_argument('plan_in'); ap.add_argument('plan_out'); ap.add_argument('report')
a = ap.parse_args()

def fold(w):
    w = unicodedata.normalize('NFKD', w.replace('œ', 'oe').replace('æ', 'ae'))
    return ''.join(ch for ch in w if not unicodedata.combining(ch)).lower()

def toks(s):
    return [(fold(m.group()), m.start(), m.end()) for m in re.finditer(r'\w+', s)]

def qnorm(s):
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')

D = tk.docx(a.tome)
P = {p['i']: p for p in D}
PT = {i: qnorm(para_text(p)) for i, p in P.items() if p['t'].strip()}
PTOK = {i: toks(s) for i, s in PT.items()}
# trigram index
idx = collections.defaultdict(set)
for i, tl in PTOK.items():
    w = [t[0] for t in tl]
    for k in range(len(w) - 2):
        idx[tuple(w[k:k + 3])].add(i)

plan = json.load(open(a.plan_in))
carnet = plan['carnet']
clusters = {c['id']: c for c in load_carnet('_original', carnet)}
# also clusters moved in from other carnets
for e in plan['entries']:
    for q in e['paragraphs']:
        if 'old' in q and q['old'] not in clusters:
            cc = q['old'][:3]
            for c in load_carnet('_original', cc):
                clusters.setdefault(c['id'], c)

rep = []
# docx ¶ used by draft new paragraphs
newparas = set()
for e in plan['entries']:
    for q in e['paragraphs']:
        if 'new' in q:
            for m in re.finditer(r'¶(\d+)(?:[–-](\d+))?', q['new'].get('rsr', '')):
                lo = int(m.group(1)); hi = int(m.group(2) or lo)
                newparas.update(range(lo, hi + 1))

def body_lines(c):
    """text lines of the cluster: visible lines without a heading line"""
    return [l for l in visible_lines(c['lines'])]

hits = {}  # id -> (P, ts, te, old_lead_unmatched, old_trail_unmatched)
for e in plan['entries']:
    for q in e['paragraphs']:
        if 'old' not in q: continue
        c = clusters[q['old']]
        vis = [l for l in body_lines(c) if not l.startswith('#')]
        txt = ' '.join(vis)
        ot = [t[0] for t in toks(re.sub(r'\[\^[^\]]*\]', '', txt))]
        if len(ot) < 4: continue
        votes = collections.Counter()
        for k in range(len(ot) - 2):
            for i in idx.get(tuple(ot[k:k + 3]), ()): votes[i] += 1
        if not votes: continue
        best, v = votes.most_common(1)[0]
        pw = [t[0] for t in PTOK[best]]
        sm = difflib.SequenceMatcher(None, ot, pw, autojunk=False)
        blocks = [b for b in sm.get_matching_blocks() if b.size]
        matched = sum(b.size for b in blocks)
        if matched < 0.8 * len(ot) or not blocks: continue
        ts = blocks[0].b; te = blocks[-1].b + blocks[-1].size
        lead_un = blocks[0].a; trail_un = len(ot) - (blocks[-1].a + blocks[-1].size)
        hits[q['old']] = (best, ts, te, lead_un, trail_un, len(pw))

# drop outliers: hit far from both plan neighbours
seq = [q['old'] for e in plan['entries'] for q in e['paragraphs'] if 'old' in q and q['old'] in hits]
HP = {c: hits[c][0] for c in seq}
for k, cid in enumerate(seq):
    p = HP[cid]
    nb = [HP[seq[j]] for j in (k - 1, k + 1) if 0 <= j < len(seq)]
    if nb and all(abs(p - x) > 30 for x in nb):
        rep.append(f'- {cid}: matched ¶{p}, far from its neighbours ({nb}) — not tiled')
        del hits[cid]
# new paragraphs that duplicate a partly covered docx paragraph
newby = {}
for e in plan['entries']:
    for q in e['paragraphs']:
        if 'new' in q:
            ms = re.findall(r'¶(\d+)(?:[–-](\d+))?', q['new'].get('rsr', ''))
            if len(ms) == 1 and not ms[0][1]: newby[int(ms[0][0])] = q
byP = collections.defaultdict(list)
for cid, h in hits.items(): byP[h[0]].append((h[1], cid))

setf = {}
for p, lst in sorted(byP.items()):
    lst.sort()
    n = len(PTOK[p])
    covered = sum(hits[c][2] - hits[c][1] for _, c in lst)
    if covered >= n - 1: continue
    if p in newby:
        rep.append(f'- ¶{p}: draft new paragraph removed (duplicate of the tiled clusters {", ".join(c for _, c in lst)})')
        newby[p]['_remove'] = True
    elif p in newparas:
        rep.append(f'- ¶{p}: partly covered by {", ".join(c for _, c in lst)} AND a draft new paragraph — check by hand')
        continue
    order = [c for _, c in lst]
    if order != sorted(order):
        rep.append(f'- ¶{p}: clusters appear in the docx in the order {", ".join(order)} (not ID order) — check by hand')
    s = PT[p]; tl = PTOK[p]
    for k, (ts, cid) in enumerate(lst):
        _, ts, te, lead_un, trail_un, _ = hits[cid]
        # overlap check
        if k + 1 < len(lst) and hits[lst[k + 1][1]][1] < te:
            rep.append(f'- ¶{p}: {cid} overlaps the next cluster {lst[k+1][1]} — skipped')
            continue
        nxt = hits[lst[k + 1][1]][1] if k + 1 < len(lst) else n
        pre = ''
        if k == 0 and ts - lead_un > 0:
            pre = s[:tl[ts - lead_un][1]].strip() if ts - lead_un < len(tl) else ''
        gs = te + trail_un
        gap = ''
        if gs < nxt:
            gap = s[tl[gs - 1][2]:tl[nxt][1]] if nxt < n else s[tl[gs - 1][2]:]
            if k + 1 < len(lst):
                gap = s[tl[gs - 1][2]:tl[nxt][1]]
        gap = gap.rstrip()
        # the old text's own final punctuation
        c = clusters[cid]
        lines = [l for l in visible_lines(c['lines'])]
        last = lines[-1]
        m = re.match(r'^[\s.,;:!?…»)"\]]*', gap)
        lead = m.group() if m else ''
        rest = gap[len(lead):].strip()
        oldend = re.sub(r'\[\^[^\]]*\]\s*$', '', last).rstrip()
        if not rest and not pre: continue
        if rest:
            if oldend and oldend[-1] in '.,;:!?…»)"]':
                add = ' ' + rest
            else:
                add = lead.rstrip() + ' ' + rest
            lines[-1] = last.rstrip() + add
        if pre:
            j = 0
            while j < len(lines) and lines[j].startswith('#'): j += 1
            if j < len(lines): lines[j] = pre + ' ' + lines[j]
        setf[cid] = '\n'.join(lines)
        rep.append(f'- {cid} ¶{p}: +{len(rest)+len(pre)} ch' + (f' (prefix {len(pre)})' if pre else '') + f' «…{rest[:70]}»')

# apply: remove drafter completions (set_french equal to a whole docx paragraph) where we tiled, add ours
nchg = 0
for e in plan['entries']:
    for q in e['paragraphs']:
        if 'old' in q and q['old'] in setf:
            if 'set_french' in q and not q.get('_tiler'):
                q['_drafter_set_french'] = q['set_french']
            q['set_french'] = setf[q['old']]
            q['_tiler'] = True
            q['_tiler_para'] = hits[q['old']][0]
            nchg += 1
for e in plan['entries']:
    e['paragraphs'] = [q for q in e['paragraphs'] if not q.get('_remove')]
json.dump(plan, open(a.plan_out, 'w'), ensure_ascii=False, indent=1)
open(a.report, 'w').write(f'# tiler {carnet}: {nchg} clusters completed\n\n' + '\n'.join(rep) + '\n')
print(carnet, 'tiled', nchg)

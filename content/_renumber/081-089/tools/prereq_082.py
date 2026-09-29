"""Prerequisites for the 082 rebuild (worker A, 2026-09-28). Mechanical and lossless.

python3 prereq_082.py REPO_ROOT [--check]

1. _original/082: the 2026-08-14 dedup (8067b5aac) left 12 page-overlap echo lines: the first text
   line of a cluster that repeats the last line of the preceding cluster (082.0003–0007, 0016, 0017,
   0020 in 08-09; 0082 in 08-14; 0104, 0105, 0107 in 08-18). cz, uk, en and fr translate each of these
   clusters as its OWN (second) line only, and render the echo as comment-only, so the echo line is
   deleted from _original (when the echo carries italics the kept line lacks, the kept line takes the
   echo's wording). 0020, 0082, 0105 and 0107 become empty (they are dropped in the plan).
2. _original/082/1878-08-27.md: the LAN/RSR notes about the Bismarck/«catastrophe»/«corsage»
   paragraph sit on 082.0160 (Anitchkoff) since the dedup; they move to 082.0159 (Bismarck).
3. en/082: the dedup kept a different copy in en, so en IDs are one off in four files:
   08-27 0160→0159 0161→0160; 08-30 0184→0183 0185→0184; 09-04 0223→0222 0224→0223;
   09-09 0280→0279 0281→0280, and the stray empty marker 082.0275 stacked above 0273 moves below 0274
   (the manuscript, tome12 ¶1261–1263 / Mon Journal t.12 p.115, writes «C'est triste, bien triste une
   vie pareille» before AND after the Antonsky line; _original, cz, uk and fr have both; en translates
   only the first, so en 0275 stays empty).
4. en/082/1878-08-10.md: the translation of the margin note sits under 082.0031 (dropped by the plan: a
   legacy comment copy of 0033's note); it moves to 082.0033.
Each step checks its preconditions and refuses (exit 1, nothing written) if the files are not in the
expected state. Idempotence: a second run reports «already applied».
"""
import sys, re, os
root = sys.argv[1]
check_only = '--check' in sys.argv
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
C = os.path.join(root, 'content')
errors = []; writes = {}

def rd(p):
    return open(os.path.join(C, p), encoding='utf-8').read()

def clusters(text):
    L = text.split('\n')
    j = L.index('---', 1) + 1 if L and L[0] == '---' else 0
    head, body = L[:j], L[j:]
    cl = []; cur = None
    for ln in body:
        if ID.match(ln): cur = [ln]; cl.append(cur)
        elif cur is None: cur = [ln]; cl.append(cur)
        else: cur.append(ln)
    return head, cl

def textidx(lines):
    out = []; inb = False
    for i, l in enumerate(lines):
        s = l.strip()
        if i == 0 and ID.match(l): continue
        if inb:
            if s.endswith('%%'): inb = False
            continue
        if s.startswith('%%'):
            if not (len(s) > 2 and s.endswith('%%')): inb = True
            continue
        if re.match(r'^\[\^[^\]]+\]:', s) or s.startswith('[//]') or not s: continue
        out.append(i)
    return out

def norm(s):
    s = re.sub(r'\[\^[^\]]*\]', '', s).replace('*', '').replace('’', "'")
    return re.sub(r'\W+', ' ', s).strip().lower()

# 1. echo lines
ECHO = {'1878-08-09.md': ['082.0003', '082.0004', '082.0005', '082.0006', '082.0007', '082.0016', '082.0017', '082.0020'],
        '1878-08-14.md': ['082.0082'],
        '1878-08-18.md': ['082.0104', '082.0105', '082.0107']}
for f, ids in ECHO.items():
    p = f'_original/082/{f}'
    head, cl = clusters(writes.get(p, rd(p)))
    idx = {ID.match(x[0]).group(1): k for k, x in enumerate(cl) if x and ID.match(x[0])}
    done = 0
    for cid in ids:
        k = idx[cid]; prev = cl[k - 1]; cur = cl[k]
        tp, tc = textidx(prev), textidx(cur)
        if not tc:
            done += 1; continue  # already emptied by an earlier run
        first = cur[tc[0]]
        if norm(first) not in {norm(prev[i]) for i in tp}:
            # already applied if the first line is no longer an echo and the cluster matches its translation
            done += 1; continue
        # keep the richer copy (the echo often has the italics the kept line lost)
        for i in tp:
            if norm(prev[i]) == norm(first) and first.count('*') > prev[i].count('*'):
                prev[i] = first
        del cur[tc[0]]
    if done == len(ids):
        print(f'{p}: echo strip already applied'); continue
    if done:
        errors.append(f'{p}: echo strip half applied ({done}/{len(ids)})')
    writes[p] = '\n'.join(head + [l for x in cl for l in x])

# 2. move the Bismarck notes 0160 -> 0159
p = '_original/082/1878-08-27.md'
head, cl = clusters(writes.get(p, rd(p)))
idx = {ID.match(x[0]).group(1): k for k, x in enumerate(cl) if x and ID.match(x[0])}
c159, c160 = cl[idx['082.0159']], cl[idx['082.0160']]
MOVE = [l for l in c160 if re.match(r'^%% 2026-02-0\dT[\d:]+ (LAN|RSR): ', l) and re.search(r'catastrophe|corsage|fourrer|intimate confession', l)]
if not MOVE:
    if any(re.search(r'catastrophe', l) for l in c159): print(f'{p}: notes already on 0159')
    else: errors.append(f'{p}: Bismarck notes not found on 0160')
else:
    if len(MOVE) != 4: errors.append(f'{p}: expected 4 notes on 0160, found {len(MOVE)}')
    for l in MOVE: c160.remove(l)
    ti = textidx(c159)
    at = ti[0] if ti else len(c159)
    c159[at:at] = MOVE
    writes[p] = '\n'.join(head + [l for x in cl for l in x])

# 3. en relabel
REL = {'1878-08-27.md': [('082.0160', '082.0159'), ('082.0161', '082.0160')],
       '1878-08-30.md': [('082.0184', '082.0183'), ('082.0185', '082.0184')],
       '1878-09-04.md': [('082.0223', '082.0222'), ('082.0224', '082.0223')],
       '1878-09-09.md': [('082.0280', '082.0279'), ('082.0281', '082.0280')]}
EXPECT = {'082.0159': 'Vous savez M. de Bismarck', '082.0183': 'La vie réelle est un détestable',
          '082.0222': 'Il me semble incroyable', '082.0279': 'Un caillou suffit'}
for f, pairs in REL.items():
    p = f'en/082/{f}'
    t = writes.get(p, rd(p))
    ids = ID.findall(t) if False else re.findall(r'^%% (\d{3}\.\d{4}) %%$', t, re.M)
    first_new = pairs[0][1]
    if first_new in ids:
        print(f'{p}: relabel already applied'); continue
    # precondition: the cluster now labelled pairs[0][0] embeds the French of pairs[0][1]
    m = re.search(r'^%% ' + re.escape(pairs[0][0]) + r' %%\n((?:%% (?:\[#|\d{4}-).*\n)*)%% (.*)$', t, re.M)
    if not m or not m.group(2).startswith(EXPECT[first_new]):
        errors.append(f'{p}: {pairs[0][0]} does not embed «{EXPECT[first_new]}…» — not relabelled'); continue
    for old, new in pairs:  # ascending order: 0160 -> 0159 before 0161 -> 0160
        n = len(re.findall(r'^%% ' + re.escape(old) + r' %%$', t, re.M))
        if n != 1: errors.append(f'{p}: {old} occurs {n}×'); break
        t = re.sub(r'^%% ' + re.escape(old) + r' %%$', f'%% {new} %%', t, flags=re.M)
    if f == '1878-09-09.md':
        # the stray empty 0275 stacked directly above 0273 moves below 0274's cluster
        stray = '%% 082.0275 %%\n%% 082.0273 %%'
        if stray not in t: errors.append(f'{p}: stray 0275 marker not found above 0273')
        else:
            t = t.replace(stray, '%% 082.0273 %%', 1)
            m2 = re.search(r'^%% 082\.0276 %%$', t, re.M)
            t = t[:m2.start()] + '%% 082.0275 %%\n\n' + t[m2.start():]
    writes[p] = t

# 4. en 08-10: the translation of the margin note «[En travers: Démente ! Ce n'est pas vrai.]» sits under
#    082.0031 (a legacy comment copy that the plan drops); it moves to 082.0033, which holds the note in
#    _original, cz, uk and fr.
p = 'en/082/1878-08-10.md'
t = writes.get(p, rd(p))
LINE = '[Written across the page: Madwoman! It is not true.]'
head, cl = clusters(t)
idx = {ID.match(x[0]).group(1): k for k, x in enumerate(cl) if x and ID.match(x[0])}
c31, c33 = cl[idx['082.0031']], cl[idx['082.0033']]
if LINE in c33: print(f'{p}: margin translation already on 0033')
elif LINE not in c31: errors.append(f'{p}: margin translation not found on 0031')
else:
    c31.remove(LINE)
    ti = textidx(c33)
    c33.insert(ti[0] if ti else len(c33), LINE)
    writes[p] = '\n'.join(head + [l for x in cl for l in x])

if errors:
    print('REFUSED:'); [print('  ' + e) for e in errors]; sys.exit(1)
for p, t in writes.items():
    print(('would write ' if check_only else 'write ') + p)
    if not check_only: open(os.path.join(C, p), 'w', encoding='utf-8').write(t)

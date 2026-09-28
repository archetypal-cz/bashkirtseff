"""Integrate the per-fork final plans into final2/: dialogue dashes (docx list numbering) for
069/070, the 070→071 cover move. python3 integrate.py"""
import json, re
from pathlib import Path
B = Path(__file__).resolve().parent.parent
np_ = json.load(open(B / 'work-072-073/numprefix.json'))
plans = {c: json.load(open(B / f'final/plan-{c}.json')) for c in ['069', '070', '071', '072', '073', '074']}
log = []
for c in ['069', '070', '074']:
    for e in plans[c]['entries']:
        for q in e['paragraphs']:
            n = q.get('new')
            if not n or not n['rsr'].startswith('Restored'): continue
            m = re.search(r'¶(\d+)', n['rsr'])
            if not m or m.group(1) not in np_: continue
            pre = np_[m.group(1)]
            if n['french'].lstrip().startswith(('-', '—', '–', pre.strip())): continue
            n['french'] = pre + n['french'].lstrip()
            log.append(f'{c} ¶{m.group(1)} dash')
cov = plans['071']['entries'][0]
assert cov['file'] == '1877-04-26-cover.md'
first = cov['paragraphs'][0]['new']
lines = first['french'].split('\n')
assert lines[0].startswith('"Dubium') and lines[1] == 'Gloriae Cupiditate', lines[:2]
first['french'] = '\n'.join(lines[2:])
first['rsr'] = first['rsr'].replace('¶2356–2363', '¶2358–2363').replace('«deceptìo»→«deceptio», «Cupi dit ate»→«Cupiditate», ', '').replace(
    'the title page Marie wrote for Livre 71;', 'the title page Marie wrote for Livre 71 (with 070.0198–0199, «Dubium…» and «Gloriae Cupiditate», docx ¶2356–2357, on the same page);')
cov['paragraphs'][:0] = [{'old': '070.0198', 'kind': 'cover'}, {'old': '070.0199', 'kind': 'cover'}]
log.append('071 cover: 070.0198/0199 placed')
for c, p in plans.items():
    (B / f'final2/plan-{c}.json').write_text(json.dumps(p, ensure_ascii=False, indent=1) + '\n')
print(len(log), 'changes;', sum('dash' in l for l in log), 'dashes')

# typography signal (toolsmith 75827567e, redraft in draft2/): two letters Marie copied in
# printed capitals to Larderei, signed «Violette», set in from both margins on printed pp.34–35
ORIG = Path('/home/krr/bashkirtseff/content/_original/069')
IDL = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
def text_lines(i):
    for f in ORIG.glob('*.md'):
        L = f.read_text().split('\n')
        if f'%% {i} %%' not in L: continue
        k = L.index(f'%% {i} %%') + 1; out = []
        while k < len(L) and not IDL.match(L[k]):
            l = L[k]
            if l.strip() and not l.startswith('%%') and not l.startswith('[^') and not l.startswith('#'): out.append(l)
            k += 1
        return out
LET = {'069.0391': 'Lettre de Marie à Larderei, signée Violette, 16 mars 1877', '069.0392': None, '069.0393': None, '069.0394': None, '069.0395': None,
       '069.0421': 'Lettre de Marie à Larderei, signée Violette, 17 mars 1877', '069.0422': None, '069.0423': None, '069.0424': None}
src = None
for e in plans['069']['entries']:
    for q in e['paragraphs']:
        if q.get('old') in LET:
            src = LET[q['old']] or src
            q['kind'] = 'letter'; q['source'] = src
            q['set_french'] = '\n'.join('> ' + l for l in text_lines(q['old']))
            log.append(f"069 {q['old']} letter")
(B / 'final2/plan-069.json').write_text(json.dumps(plans['069'], ensure_ascii=False, indent=1) + '\n')
print('letters:', sum('letter' in l for l in log))

# Owner decision (KRR, 2026-09-28): no cover entries until the manuscript is scanned. Every
# `-cover.md` entry and every kind:cover paragraph leaves the plans; old cover paragraphs are
# dropped; the withdrawn text is recorded for REVIEW.md.
REASON = 'title-page (cover) text; withdrawn by owner decision 2026-09-28 until the manuscript is available (text kept in content/_renumber/CCC/REVIEW.md)'
wd = []
def old_text(i):
    c = i[:3]
    for f in (Path('/home/krr/bashkirtseff/content/_original') / c).glob('*.md'):
        L = f.read_text().split('\n')
        if f'%% {i} %%' in L:
            k = L.index(f'%% {i} %%') + 1; out = []
            while k < len(L) and not IDL.match(L[k]):
                if L[k].strip() and not L[k].startswith('%%') and not L[k].startswith('[^'): out.append(L[k])
                k += 1
            return out
for c, p in plans.items():
    keep = []
    for e in p['entries']:
        paras = []
        for q in e['paragraphs']:
            kind = q.get('kind') or (q.get('new') or {}).get('kind')
            if e['file'].endswith('-cover.md') or kind == 'cover':
                if 'old' in q:
                    plans[q['old'][:3]].setdefault('drop', []).append({'id': q['old'], 'reason': REASON})
                    wd.append((c, e['file'], f"old {q['old']}", q.get('set_french') or '\n'.join(old_text(q['old']))))
                else:
                    wd.append((c, e['file'], q['new']['rsr'][:60], q['new']['french']))
            else: paras.append(q)
        if e['file'].endswith('-cover.md'):
            assert not paras, e['file']; continue
        e['paragraphs'] = paras; keep.append(e)
    p['entries'] = keep
for c, p in plans.items():
    (B / f'final2/plan-{c}.json').write_text(json.dumps(p, ensure_ascii=False, indent=1) + '\n')
with open(B / 'final2/withdrawn-covers.md', 'w') as f:
    f.write('## Withdrawn cover pages (for when the manuscript is available)\n\n')
    f.write('Owner decision (KRR, 2026-09-28): no cover entries for now — the manuscript is not scanned and the printed edition does not show which title-page lines are Marie\'s. The text the plan had for each cover, as printed in *Mon Journal* t.10:\n\n')
    cur = None
    for c, file, what, t in wd:
        if c != cur: f.write(f'\n### {c} ({file})\n\n'); cur = c
        f.write(f'- {what}:\n\n' + '\n'.join('  > ' + l for l in t.split('\n')) + '\n\n')
print('covers withdrawn:', len(wd), 'items;', sum(1 for x in wd if x[2].startswith('old')), 'old dropped')

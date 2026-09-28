"""Owner answers of 2026-09-28 applied to final2/ plans (in place), after integrate.py and
before keep_empties.py. Also adapts the plans to toolsmith's set_french change (d08a2fb03:
set_french is the paragraph's WHOLE French, heading lines included).
  A. every set_french gets the old cluster's heading lines (leading/trailing) unless changed on purpose;
     heading-label fixes are now set_french (069.0604, 070.0037, 073.0285, 073.0287, 074.0256)
     and 073.0371 loses its «Samedi 11 août» heading (the plan's `heading` puts it on 11 Aug);
  B. «Larderei» → «Larderel» (printed reading) in every tome-10 paragraph, old and new;
  C. printed-edition typesetting errors corrected, with an RSR note citing the page;
  D. 072.0094 + 072.0106 merged (one sentence split by a page swap); 072.0462 kind margin;
     069.0182 «[heures}» → «[heures]»."""
import json, re, sys
from pathlib import Path
B = Path(__file__).resolve().parent.parent
ROOT = Path('/home/krr/bashkirtseff/content/_original')
IDL = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
H = re.compile(r'^#{1,6} ')
C = ['069', '070', '071', '072', '073', '074']
clusters = {}
for c in C:
    for f in sorted((ROOT / c).glob('1*.md')):
        cur = None; indef = False
        for l in f.read_text().split('\n'):
            m = IDL.match(l)
            if m: cur = m.group(1); clusters[cur] = []; indef = False; continue
            if not cur: continue
            if l.startswith('[^'): indef = True; continue
            if indef and (l.startswith('    ') or l.startswith('\t')): continue
            indef = False
            if l.strip() and not l.startswith('%%'): clusters[cur].append(l.rstrip())
plans = {c: json.load(open(B / f'final2/plan-{c}.json')) for c in C}
log = []
def full(i): return clusters[i]
def with_heads(i, sf):
    old = full(i); lines = sf.split('\n')
    if any(H.match(l) for l in lines): return sf
    k = 0; lead = []
    while k < len(old) and H.match(old[k]): lead.append(old[k]); k += 1
    trail = []; j = len(old) - 1
    while j >= k and H.match(old[j]): trail.insert(0, old[j]); j -= 1
    mid = [l for l in old[k:j + 1] if H.match(l)]
    if mid: log.append(f'WARN {i}: heading inside the text, kept only leading/trailing: {mid}')
    return '\n'.join(lead + lines + trail)
HEADFIX = {'069.0604': ('# Dimanche 1er avril 1877', '# Dimanche 1er avril 1877 - Pâques'),
           '070.0037': ('# Dimanche 8 avril 1877', '# Dimanche 8 avril 1877 - Pâques'),
           '073.0285': ('# Lundi 6 août 1877', '# Dimanche 6 août 1877'),
           '073.0287': ('# Mardi 7 août 1877', '# Lundi 7 août 1877'),
           '074.0256': ('# Dimache 9 septembre 1877', '# Dimanche 9 septembre 1877')}
TYPO = [('cettte', 'cette'), ('priincesses', 'princesses'), ('acccompagné', 'accompagné'), ('trliste', 'triste'),
        ('diffférence', 'différence'), ('réctifié', 'rectifié')]
rsr_add = []   # for old paragraphs: (old id, note) → post_apply adds an RSR comment
LAR = re.compile(r'Larderei\b')
for c, p in plans.items():
    for e in p['entries']:
        if e.get('heading') and LAR.search(e['heading']): e['heading'] = LAR.sub('Larderel', e['heading'])
        for q in e['paragraphs']:
            if 'new' in q:
                n = q['new']; t = n['french']
                if LAR.search(t): t = LAR.sub('Larderel', t); log.append(f'new Larderel {c} {e["file"]}')
                for a, b in TYPO:
                    if a in t:
                        t = t.replace(a, b)
                        pg = re.search(r'Mon Journal t\.10 pp?\.([\d–]+)', n['rsr'])
                        n['rsr'] += f' Typesetting error of the printed edition corrected: «{a}»→«{b}» (Mon Journal t.10 p.{pg.group(1) if pg else "?"}).'
                        log.append(f'typo {a} {c} {e["file"]}')
                n['french'] = t
                continue
            i = q['old']
            sf = q.get('set_french')
            base = with_heads(i, sf) if sf is not None else '\n'.join(full(i))
            new = base
            if i in HEADFIX:
                a, b = HEADFIX[i]; assert a in new.split('\n'), (i, new[:80]); new = '\n'.join(b if l == a else l for l in new.split('\n'))
            if i == '073.0371':
                new = '\n'.join(l for l in new.split('\n') if l != '# Samedi 11 août 1877')
            if i == '069.0182': new = new.replace('[heures}', '[heures]')
            new = LAR.sub('Larderel', new)
            for a, b in TYPO:
                if a in new:
                    new = new.replace(a, b); rsr_add.append((i, f'Typesetting error of the printed edition corrected: «{a}»→«{b}» (Mon Journal t.10, tome10.docx).'))
            if sf is not None or new != base or new != '\n'.join(full(i)):
                if not new.strip(): log.append(f'WARN {i}: empty set_french skipped'); continue
                q['set_french'] = new
            if i == '072.0462': q['kind'] = 'margin'
# D. merge 072.0094 + 0106
p = plans['072']
for e in p['entries']:
    ps = e['paragraphs']; ids = [q.get('old') for q in ps]
    if '072.0094' in ids and '072.0106' in ids:
        a = ps[ids.index('072.0094')]; b = ps[ids.index('072.0106')]
        ta = a.get('set_french', '\n'.join(full('072.0094'))); tb = b.get('set_french', '\n'.join(full('072.0106')))
        a['set_french'] = ta.rstrip() + ' ' + tb.lstrip()
        ps.remove(b)
        p.setdefault('drop', []).append({'id': '072.0106', 'reason': 'merged into 072.0094: the two held one sentence split across the page swap of printed pp.218–219 (owner decision 2026-09-28); translations carried over by hand'})
        log.append('merged 072.0094+0106')
for c, p in plans.items():
    (B / f'final2/plan-{c}.json').write_text(json.dumps(p, ensure_ascii=False, indent=1) + '\n')
json.dump(rsr_add, open(B / 'final2/rsr_add.json', 'w'), ensure_ascii=False, indent=1)
import collections
print(collections.Counter(l.split(' ')[0] + ' ' + l.split(' ')[1] for l in log))
print('\n'.join(l for l in log if l.startswith(('WARN', 'typo', 'merged'))))
print('set_french total:', sum(1 for p in plans.values() for e in p['entries'] for q in e['paragraphs'] if q.get('set_french')))

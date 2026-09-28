"""Re-insert dropped empty placeholder clusters where that lets an entry keep its translation
approvals (its paragraph list becomes exactly one old file's list). final2 -> final3."""
import json, re
from pathlib import Path
B = Path(__file__).resolve().parent.parent
WT = Path('/home/krr/bashkirtseff')
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
oldfiles = {}   # id -> (carnet, file); file -> [ids]
lists = {}
for c in ['069', '070', '071', '072', '073', '074']:
    for f in sorted((WT / 'content/_original' / c).glob('*.md')):
        ids = [m.group(1) for l in f.read_text().split('\n') if (m := ID.match(l.strip()))]
        lists[(c, f.name)] = ids
        for i in ids: oldfiles[i] = (c, f.name)
kept = []
for c in ['069', '070', '071', '072', '073', '074']:
    p = json.load(open(B / f'final2/plan-{c}.json'))
    empties = [d for d in p.get('drop', []) if 'empty' in d['reason'].lower() and 'placeholder' in d['reason'].lower()]
    for d in empties:
        i = d['id']; src = lists[oldfiles[i]]
        pos = src.index(i)
        # find the entry that holds the old file's other paragraphs
        for e in p['entries']:
            ps = e['paragraphs']
            olds = [q['old'] for q in ps if 'old' in q]
            clean = all('old' in q and not q.get('set_french') and not q.get('heading_to_next') for q in ps)
            cand = list(olds)
            pred = src[pos - 1] if pos > 0 else None
            if pred in cand: cand.insert(cand.index(pred) + 1, i)
            elif pos == 0 and src[1:2] and src[1] in cand: cand.insert(cand.index(src[1]), i)
            else: continue
            if clean and cand == src:
                at = [q.get('old') for q in ps].index(pred) + 1 if pred in olds else 0
                ps.insert(at, {'old': i})
                p['drop'].remove(d); kept.append(i)
            break
    (B / f'final3/plan-{c}.json').write_text(json.dumps(p, ensure_ascii=False, indent=1) + '\n')
print(len(kept), 'empties kept:', ' '.join(kept))

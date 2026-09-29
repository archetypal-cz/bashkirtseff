"""Build the audit-fix plans from identity plans (rerun after every pull: identity-*.json regenerated at HEAD)."""
import json, sys
D = sys.argv[1] if len(sys.argv) > 1 else '.'
def load(c): return json.load(open(f'{D}/identity-{c}.json'))
def ent(p, f): return next(e for e in p['entries'] if e['file'] == f)
def ids(e): return [x['old'] for x in e['paragraphs']]

# 053: 0078 after 0088 (tome07 ¶160-162, Mon Journal t.7 p.13)
p = load('053'); e = ent(p, '1876-01-26.md'); l = ids(e)
assert '053.0078' in l and '053.0088' in l
l.remove('053.0078'); l.insert(l.index('053.0088') + 1, '053.0078')
e['paragraphs'] = [{'old': i} for i in l]
p['source'] = 'tome07.docx'
json.dump(p, open(f'{D}/plan-053.json', 'w'), ensure_ascii=False, indent=1)

# 069: drop 0555 (pre-rebuild 069.0495, the copy already in 27 Mar), keep 0556 (pre-rebuild 069.0464 moved from 03-25; fuller notes: cz FAB rationale, uk TR note, en Health tag)
p = load('069'); e = ent(p, '1877-03-27.md'); l = ids(e)
assert l[-2:] == ['069.0555', '069.0556'], l[-3:]
e['paragraphs'] = [x for x in e['paragraphs'] if x['old'] != '069.0555']
p['drop'] = p.get('drop', []) + [{'id': '069.0555', 'reason': 'duplicate of 069.0556 (tome10.docx ¶774 has «Cette espèce de laideur…» once; the 2026-09-28 rebuild moved pre-rebuild 069.0464 here from 03-25 beside the copy already in 27 Mar, pre-rebuild 069.0495 = this one; identical French, the kept copy has the fuller notes in cz/uk/en)'}]
p['source'] = 'tome10.docx'
json.dump(p, open(f'{D}/plan-069.json', 'w'), ensure_ascii=False, indent=1)

# 074: 0278-0283 (Monday text, tome10 ¶4590-4595) back under «Lundi 10 septembre» (¶4589)
p = load('074'); a = ent(p, '1877-09-10.md'); b = ent(p, '1877-09-11.md')
mv = [f'074.{n:04d}' for n in range(278, 284)]
assert ids(a) == ['074.0276'] and ids(b)[:7] == ['074.0277'] + mv
a['paragraphs'] += [{'old': i} for i in mv]
b['paragraphs'] = [x for x in b['paragraphs'] if x['old'] not in mv]
p['source'] = 'tome10.docx'
json.dump(p, open(f'{D}/plan-074.json', 'w'), ensure_ascii=False, indent=1)
print('ok')

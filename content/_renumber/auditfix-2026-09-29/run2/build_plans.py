"""Audit-fix run 2 (102, 104). Usage: build_plans.py <plan dir> <repo root> (identity-*.json regenerated at HEAD)."""
import json, re, sys
D, REPO = sys.argv[1], sys.argv[2]
def load(c): return json.load(open(f'{D}/identity-{c}.json'))
def ent(p, f): return next(e for e in p['entries'] if e['file'] == f)
def ids(e): return [x['old'] for x in e['paragraphs']]
def french(c, f, pid):
    """The cluster's French lines (headings + text, no comments, no footnote definitions)."""
    lines = open(f'{REPO}/content/_original/{c}/{f}').read().split('\n')
    i = lines.index(f'%% {pid} %%'); out = []; indef = False
    for l in lines[i + 1:]:
        if re.match(r'^%% \d{3}\.\d{4} %%$', l): break
        if re.match(r'^\[\^[^\]]+\]:', l): indef = True; continue
        if indef and (l.startswith('    ') or not l.strip()): continue
        indef = False
        if not l.strip() or l.strip().startswith('%%') or l.startswith('[//]:'): continue
        out.append(l.rstrip())
    return out

# 102: stray date line «Vendredi 23 novembre 1883» out of 102.0055; 23 Nov becomes its own empty entry
p = load('102'); e = ent(p, '1883-11-22.md'); l = ids(e)
assert l == ['102.0055'], l
fr = french('102', '1883-11-22.md', '102.0055')
assert fr[-1] == 'Vendredi 23 novembre 1883' and fr[0] == '# Jeudi 22 novembre 1883', fr[-1]
e['paragraphs'] = [{'old': '102.0055', 'set_french': '\n'.join(fr[:-1])}]
i = p['entries'].index(e)
assert not any(x['file'] == '1883-11-23.md' for x in p['entries'])
p['entries'].insert(i + 1, {'file': '1883-11-23.md', 'date': '1883-11-23', 'heading': 'Vendredi 23 novembre 1883',
    'paragraphs': [{'new': {'french': '[Aucun texte - date seule mentionnée]',
        'rsr': 'tome16.docx ¶1091, Mon Journal t.16 p.84: the date line (printed «Vendredi 23 novembe 1883», typesetting typo normalised) has no text under it; it had been left as a body line at the end of 1883-11-22 (2026-09-29 audit fix).'}}]})
p['source'] = 'tome16.docx'
json.dump(p, open(f'{D}/plan-102.json', 'w'), ensure_ascii=False, indent=1)

# 104: 28 April is an empty day; the text 104.0034-0040 is 29 April («Madi 29 avril 1 884», ¶2489)
p = load('104'); e = ent(p, '1884-04-28.md'); l = ids(e)
assert l == [f'104.{n:04d}' for n in range(34, 41)], l
fr = french('104', '1884-04-28.md', '104.0034')
assert fr[:2] == ['# Lundi 28 avril 1884', 'Mardi 29 avril 1 884'] and len(fr) == 3, fr
i = p['entries'].index(e)
assert p['entries'][i + 1]['file'] > '1884-04-29.md'
stub = {'file': '1884-04-28.md', 'date': '1884-04-28', 'heading': 'Lundi 28 avril 1884',
    'paragraphs': [{'new': {'french': '[Aucun texte - date seule mentionnée]',
        'rsr': 'tome16.docx ¶2488, Mon Journal t.16 p.185: the date line «Lundi 28 avril 1 884» has no text under it; the text formerly filed here is 29 April (2026-09-29 audit fix).'}}]}
e2 = {'file': '1884-04-29.md', 'date': '1884-04-29', 'frontmatter_from': '1884-04-28.md',
    'paragraphs': [{'old': '104.0034', 'set_french': '\n'.join(['# Mardi 29 avril 1884', fr[2]])}] + [{'old': x} for x in l[1:]]}
p['entries'][i:i + 1] = [stub, e2]
p['source'] = 'tome16.docx'
json.dump(p, open(f'{D}/plan-104.json', 'w'), ensure_ascii=False, indent=1)
print('ok')

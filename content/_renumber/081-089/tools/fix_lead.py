"""Lead review fixes (2026-09-28, resumed session) on top of final/plan-CCC.json.
Run AFTER tools/fix_CCC.py (each fix_CCC.py rewrites its final plan): python3 fix_lead.py
Idempotent. Found by g/artscan.py (page numbers, page-break splits), g/lost.py (inline labels the
extraction dropped from old clusters) and g/breaks.py.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import tk
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LOG = []

def load(c): return json.load(open(f'{W}/final/plan-{c}.json'))
def save(c, p): json.dump(p, open(f'{W}/final/plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
def page(t, para):
    pg = sorted({x - 1 for x in tk.pages_for(t, para)})
    return f'p.{pg[0]}' if len(pg) == 1 else f'pp.{pg[0]}–{pg[-1]}'
def find_old(p, oid):
    for e in p['entries']:
        for x in e['paragraphs']:
            if x.get('old') == oid: return e, x
    raise KeyError(oid)
def find_new(p, para):
    for e in p['entries']:
        for x in e['paragraphs']:
            if 'new' in x and re.search(r'¶' + str(para) + r'(?!\d)', x['new']['rsr']): return e, x
    return None, None
def cur_text(c, x, O):
    return x['set_french'] if 'set_french' in x else '\n'.join(O[x['old']][1])
def add_rsr(x, s):
    if s in x.get('_rsr', ''): return
    x['_rsr'] = (x.get('_rsr', '') + ' ' + s).strip()

def label(c, t, oid, para, old, new, extra=''):
    p = P[c]; e, x = find_old(p, oid); s = cur_text(c, x, O[c])
    if new in s: return
    assert s.count(old) == 1, (oid, old, s)
    x['set_french'] = s.replace(old, new)
    lab = re.search(r'\[[^\]]*\]', new).group(0)
    add_rsr(x, f'Inline label restored from tome{t}.docx ¶{para}, Mon Journal t.{t} {page(t, para)}: «{lab}» '
               f'(dropped in the original extraction, 2026-09-28 rebuild).' + (' ' + extra if extra else ''))
    LOG.append(f'{oid}: {lab}')

def join_new_into_old(c, t, para, oid, where):
    """a page-break half that the draft made a new paragraph goes back into its old cluster"""
    p = P[c]; e, n = find_new(p, para)
    if n is None: return
    e2, x = find_old(p, oid); s = cur_text(c, x, O[c]); nf = n['new']['french'].strip()
    x['set_french'] = (s.rstrip() + ' ' + nf) if where == 'after' else (nf + ' ' + s.lstrip())
    e.remove(n) if False else e['paragraphs'].remove(n)
    add_rsr(x, f'Page-break continuation joined from tome{t}.docx ¶{para}, Mon Journal t.{t} {page(t, para)} (2026-09-28 rebuild).')
    LOG.append(f'{oid}: joined new ¶{para} ({where})')

C = ['081', '082', '083', '084', '085', '086', '087', '088', '089']
P = {c: load(c) for c in C}
O = {c: tk.orig(c) for c in C}

# 081
e, x = find_old(P['081'], '081.0387')
if '[^2][^2]' in x['set_french']: x['set_french'] = x['set_french'].replace('[^2][^2]', '[^2]'); LOG.append('081.0387: doubled footnote ref')
label('081', 12, '081.0491', 848, 'Paris... Paris est cependant la seule ville', 'Paris... [Mots noircis: Paris est cependant la seule] ville')
# 082
e, n = find_new(P['082'], 1088)
if n is not None and n['new']['french'].startswith('Lundi 26 ao'):
    e['paragraphs'].remove(n); LOG.append('082: new ¶1088 (date line «Lundi 26 aoûtl 878», duplicate of 082.0151 heading) removed')
label('082', 12, '082.0037', 893, 'chatte blanche tire le', 'chatte blanche [Mot noirci: tire] le')
label('082', 12, '082.0078', 962, 'ce b (v) russe et', 'ce b (v) [Mot noirci: russe] et')
label('082', 12, '082.0132', 1063, 'sont exagérées et', 'sont exagérées [Rayé: fondées] et')
label('082', 12, '082.0149', 1085, 'et [aussitôt] que', 'et [Mot noirci: aussitôt] que')
label('082', 12, '082.0152', 1087, "L'autre est tout récent,", "L'autre [Mots noircis: est tout récent],",
      "Printer's typo corrected: «noiricis» → «noircis» (Mon Journal t.12 p.97).")
label('082', 12, '082.0155', 1094, 'fût [vrai]', 'fût [Mot cancellé: vrai]')
label('082', 12, '082.0179', 1140, 'je la tirai en', 'je la [Mot noirci: tirai] en')
label('082', 12, '082.0328', 1321, "je regrette qu'un homme qui suscite de ne plus le regretter.",
      "je regrette [Mots noircis: qu'un homme qui suscite de ne plus le regretter].")
label('082', 12, '082.0406', 1424, 'très fort et', 'très fort [Rayé: tandis] et')
label('082', 12, '082.0524', 1524, 'doit pas la', 'doit [Rayé: même] pas la')
# 083
e, n = find_new(P['083'], 1864)
if n is not None and ' 166 ' in n['new']['french']:
    n['new']['french'] = n['new']['french'].replace('un bon 166 moment', 'un bon moment'); LOG.append('083 new ¶1864–1865: page number «166» removed')
e, n = find_new(P['083'], 1732)
if n is not None and '(est-ce drôle 1)' in n['new']['french']:
    n['new']['french'] = n['new']['french'].replace('(est-ce drôle 1)', '(est-ce drôle !)'); LOG.append('083 new ¶1732: OCR «drôle 1)» → «drôle !)»')
join_new_into_old('083', 12, 1705, '083.0114', 'after')
join_new_into_old('083', 12, 2142, '083.0374', 'before')
# 084
join_new_into_old('084', 12, 2298, '084.0064', 'after')
# 085
e, x = find_old(P['085'], '085.0387')
s = x['set_french']
if "meilleure que [celle que j'use ici bas]." in s:
    x['set_french'] = s.replace("meilleure que [celle que j'use ici bas].", "meilleure que [Rayé: la mienne d'ici] celle que j'use ici bas.").replace('testatmenet', 'testament')
    add_rsr(x, "Inline label restored from tome13.docx ¶830, Mon Journal t.13 p.58: «[Rayé: la mienne d'ici]» (the extraction had "
               "bracketed the wrong words, 2026-09-28 rebuild). Printer's typo corrected: «testatmenet» → «testament» (Mon Journal t.13 p.58).")
    LOG.append("085.0387: [Rayé: la mienne d'ici] + testatmenet")
# 086
label('086', 13, '086.0119', 1118, '[rarement Princesse]', '[Mots noircis: rarement Princesse]',
      "Printer's typo corrected: «norcis» → «noircis» (Mon Journal t.13 " + page(13, 1118) + ').')
e, n = find_new(P['086'], 1317)
if n is not None and n['new']['french'].endswith('errare* 96'):
    n['new']['french'] = n['new']['french'][:-len('errare* 96')] + 'errare humanum est.*'
    n['new']['rsr'] = n['new']['rsr'].replace('¶1317, Mon Journal t.13 p.96', '¶1317–1319, Mon Journal t.13 pp.96–97')
    e2, n2 = find_new(P['086'], 1319); e2['paragraphs'].remove(n2)
    LOG.append('086 new ¶1317+¶1319 joined («errare humanum est.»), page number 96 removed')
join_new_into_old('086', 13, 1529, '086.0375', 'before')

# printer's typos of the workers' verified lists that sit in OLD clusters the plans did not otherwise touch
RANGES = {'081': (12, 46, 855), '082': (12, 856, 1577), '083': (12, 1578, 2177), '084': (12, 2178, 2958), '085': (13, 50, 956),
          '086': (13, 957, 1970), '087': (13, 1971, 3082), '088': (13, 3083, 4162), '089': (13, 4163, 99999)}
OLD_TYPOS = [('082', '082.0474', 'espirt', 'esprit'), ('084', '084.0260', 'porée', 'portée'), ('084', '084.0390', 'frémmis', 'frémis'),
             ('084', '084.0391', 'commenttre', 'commettre'), ('084', '084.0393', 'olypmpique', 'olympique'),
             ('085', '085.0142', 'noirici', 'noirci'), ('087', '087.0599', 'deséspère', 'désespère'),
             ('088', '088.0091', 'Bashkitseff', 'Bashkirtseff')]
for c, oid, w, r in OLD_TYPOS:
    e, x = find_old(P[c], oid); s = cur_text(c, x, O[c])
    rx = re.compile(r'(?<!\w)' + re.escape(w) + r'(?!\w)')
    if not rx.search(s): continue
    t, a, b = RANGES[c]
    para = next(d['i'] for d in tk.docx(str(t))[a:b + 1] if rx.search(d['t']))
    x['set_french'] = rx.sub(r, s)
    add_rsr(x, f"Printer's typo corrected: «{w}» → «{r}» (Mon Journal t.{t} {page(t, para)}, tome{t}.docx ¶{para}).")
    LOG.append(f'{oid}: typo «{w}» → «{r}»')

for c in C: save(c, P[c])
print('\n'.join(LOG)); print('fix_lead:', len(LOG), 'changes')

"""Worker A: common/plan-082.json -> final/plan-082.json (see final/REVIEW-082.md).
python3 fix_082.py ROOT   (ROOT = a repo root where tools/prereq_082.py has been applied)"""
import sys, os, json, subprocess
WD = '/home/coder/rebuild-state/plan-tome1213'
sys.path.insert(0, f'{WD}/wA')
import planops as po
from planops import dtext, newpara, quote
ROOT = sys.argv[1]
P = po.Plan(f'{WD}/common/plan-082.json')
po.strip_guesses(P)
H = 'Aucun texte - date seule mentionnée'

def rm_range(a, b, why=''):
    for e in P.p['entries']:
        keep = []
        for x in e['paragraphs']:
            r = po.newrng(x) if 'new' in x else None
            if r and not (r[1] < a or r[0] > b) and not x.get('_manual'):
                P.log.append(f'removed draft new ¶{r[0]}–{r[1]} {why}'); continue
            keep.append(x)
        e['paragraphs'] = keep
def setd(cid, text, q=False, why=''):
    old = '\n'.join(l for l in po.old_lines(cid, ROOT) if not l.startswith('#'))
    t = po.reconcile(old, text)
    P.setf(cid, quote(t) if q else t, why)
def lines(a, b, fix=None):
    fix = fix or {}
    return '\n'.join(fix.get(i, dtext(i)) for i in range(a, b + 1) if po.D()[i]['t'].strip())
def entry_of(key):
    return P.find(key)[0]

# --- carnet 083's title-page paragraphs belong to 083's plan (worker B)
for c in ('083.0002', '083.0003'):
    e, k, x = P.find(c); e['paragraphs'].pop(k); P.log.append(f'{c} removed from plan-082 (083 plan owns it)')

# --- 8 August «- suite» at the top of Livre 82 (¶861–862); ¶856–860 is the title page (withdrawn)
rm_range(861, 862, '(rebuilt)')
e, k, x = P.find('081.0499'); e['paragraphs'].pop(k)       # dropped in plan-081 (title page)
e['paragraphs'].insert(0, newpara(862, extra='Heading «Jeudi 8 août 1878 - suite...» (¶861), first page of Livre 82 after its title page (¶856–860, withdrawn).'))
e['heading'] = 'Jeudi 8 août 1878 - suite...'; e['frontmatter_from'] = '1878-08-09.md'

# --- clusters emptied by prereq_082 (page-overlap echoes) and other empty / artefact clusters
ECHO = 'page-overlap echo emptied by prereq_082 (the text is the preceding cluster\'s; no tree translates it separately)'
for c in ('082.0020', '082.0082', '082.0105', '082.0107'): P.drop(c, ECHO)
P.drop('082.0031', "legacy comment copy of the margin note 082.0033 (en's translation of it moves to 0033 in prereq_082)")
P.drop('082.0036', 'empty in _original; uk held a duplicate of 082.0035')
P.drop('082.0134', 'empty in _original; uk held a duplicate of 082.0133')
for c in ('082.0100', '082.0101'):
    P.drop(c, 'extraction artefact «[Note de transition: Départ de Soden…]»: not in the manuscript (tome12.docx)')
for c in ('082.0161', '082.0185', '082.0224', '082.0281'):
    P.drop(c, 'empty page-overlap slot left by the 2026-08-14 dedup (en relabelled by prereq_082)')

# --- 9 August ¶870: «[Mots noircis: Le vieux prince italien]»
setd('082.0009', dtext(870))

# --- 14 August: Marie's note to the princes, sent in German (¶958–960)
for c in ('082.0075', '082.0076'):
    P.kind(c, 'letter', 'Billet de Marie aux princes («les Gans»), envoyé en allemand, 14 août 1878')
setd('082.0075', dtext(958), q=True); setd('082.0076', lines(959, 960), q=True)

# --- 15 August: Marie's letter «Cher Comte» (¶988–998)
rm_range(988, 998, '(letter rebuilt)')
P.put([newpara(988, 998, kind='letter', source='Lettre de Marie à un comte, ami de la famille, Soden, 15 août 1878',
               extra="The edition's footnote call before «Soden» left out; OCR «Nés amitiés» → «Mes amitiés».")], after=987)

# --- 17 August: ¶1021 is 17 August (the _original filed it under 18 August)
P.move(['082.0103'], after='082.0099')

# --- 19–20 August: ¶1033–1039 and Multedo's letter to Dina (¶1044–1055, 20 August; the draft filed it under 19 August)
setd('082.0112', dtext(1035) + ' ' + dtext(1036), why='_original elided the middle of ¶1036')
rm_range(1034, 1034); rm_range(1038, 1039)
P.put([newpara(1034)], after=1033)
P.move(['082.0113'], after=1037)
setd('082.0113', lines(1038, 1039))
rm_range(1044, 1055, '(letter rebuilt)')
e, k, x = P.find('082.0543'); e['paragraphs'].pop(k)
P.put([newpara(1044)], after='082.0123')
P.move(['082.0125'], after=1044)
setd('082.0125', lines(1045, 1055, {1046: '19 août 1878\nMademoiselle,'}), q=True)
P.kind('082.0125', 'letter', "Lettre d'A. Multedo à Dina, Mont-de-Marsan, 19 août 1878")

# --- 26 August: the draft missed the date line «Lundi 26 aoûtl 878» (¶1088)
rm_range(1088, 1088, '(date line)')
P.ensure_entry('1878-08-26.md', heading='Lundi 26 août 1878')
P.move(['082.0151', '082.0153', 1091, '082.0154', 1093, '082.0155'], entry='1878-08-26.md')

# --- 27 August: Marie's letter to her brother (¶1105–1111)
rm_range(1105, 1111, '(letter rebuilt)')
P.put([newpara(1105, 1111, kind='letter', source='Lettre de Marie à son frère Paul, 27 août 1878')], after=1104)

# --- 10 September: Marie's letter to Marcuard (¶1277–1284)
rm_range(1277, 1284, '(letter rebuilt)')
MARC = 'Lettre de Marie à M. de Marcuard, 10 septembre 1878'
setd('082.0289', lines(1277, 1278), q=True); setd('082.0290', dtext(1279), q=True); setd('082.0291', dtext(1280), q=True)
P.put([newpara(1281, kind='margin')], after='082.0291')
setd('082.0292', dtext(1282), q=True); setd('082.0293', lines(1283, 1284), q=True)
for c in ('082.0289', '082.0290', '082.0291', '082.0292', '082.0293'): P.kind(c, 'letter', MARC)

# --- 13 September: Marie's letter to Paul (0310–0314, already quoted)
for n in range(310, 315): P.kind(f'082.0{n}', 'letter', 'Lettre de Marie à son frère Paul, 13 septembre 1878')

# --- merged-day headings: each day its own entry
def split_head(cid, new_heading, target, empty_days):
    P.drop(cid, f'merged-day heading; the manuscript has a date line per day (the entry {target} gets «{new_heading}»)')
    P.entry(target)['heading'] = new_heading
split_head('082.0323', 'Dimanche 15 septembre 1878', '1878-09-15.md', [])
split_head('082.0355', 'Samedi 21 septembre 1878', '1878-09-21.md', [])
split_head('082.0371', 'Mercredi 25 septembre 1878', '1878-09-25.md', [])
split_head('082.0423', 'Jeudi 3 octobre 1878', '1878-10-03.md', [])
split_head('082.0482', 'Mercredi 9 octobre 1878', '1878-10-09.md', [])
P.setf('082.0380', f'[{H}]', 'bare date line ¶1401')

# --- 25 September: Collignon's letter (0373–0379 + ¶1381–1396)
rm_range(1381, 1396, '(letter rebuilt)')
COLL = 'Lettre de C. Collignon à Marie, Nice, 22 septembre 1878'
P.put([newpara(1381, 1396, kind='letter', source=COLL)], after='082.0379')
for n in range(373, 380): P.kind(f'082.0{n}', 'letter', COLL)

# --- 3–4 October: the whole of 3 October; «Vendredi 4 octobre» is a bare date line (¶1467)
P.drop('082.0426', "heading «Vendredi, 4 octobre 1878 (Soir)» is not in the manuscript: its text is 3 October's (tome12 ¶1457–1466)")
P.setf('082.0437', f'[{H}]', 'bare date line ¶1467')
P.entry('1878-10-04.md').pop('redirect_from', None)
P.entry('1878-10-03.md')['redirect_from'] = ['1878-10-04-evening.md']
for n in range(438, 442): P.kind(f'082.0{n}', 'letter', 'Lettre de Mme F. de Mouzay à Marie, samedi [28 septembre 1878]')
setd('082.0438', dtext(1448), q=True)

# --- 11 October: Marie's letter to Paul (0522–0529)
for n in range(522, 530): P.kind(f'082.0{n}', 'letter', 'Lettre de Marie à son frère Paul, 11 octobre 1878')

# --- 12 October: one manuscript entry; «(Soir)» / «(Tard)» headings are not in the manuscript
P.drop('082.0495', "heading «Samedi, 12 octobre 1878 (Soir)» is not in the manuscript (tome12 ¶1530–1562 is one entry)")
P.drop('082.0513', "heading «Samedi, 12 octobre 1878 (Tard)» is not in the manuscript (tome12 ¶1530–1562 is one entry)")
P.entry('1878-10-12.md')['redirect_from'] = ['1878-10-12-evening.md', '1878-10-12-late.md']

# --- 14 October: 082.0543 «Multedo écrit à Dina.» is ¶1569 (the draft moved it to 20 August)
rm_range(1569, 1569, '(0543 is ¶1569)')
P.put([x], after='082.0542')

# --- 9 September: the manuscript writes «C'est triste…» before and after the Antonsky line (¶1261–1263)
P.find('082.0273')[2]['_docx'] = 1261; P.find('082.0275')[2]['_docx'] = 1263

# --- the edition's source footnotes
rm_range(1376, 1376, "(the edition's source footnote)"); rm_range(1287, 1287, "(the edition's source footnote)")
# --- bracketed notes the extraction cut
setd('082.0147', dtext(1083)); setd('082.0384', dtext(1400))

# --- kinds on old paragraphs
P.kind('082.0033', 'margin')
P.kind('082.0384', 'margin')
P.unkind(1007)   # «Madame Cancrine est née Greig…»: diary, not a letter

P.prune_entries()
tmp = f'{WD}/wA/pre082.json'; P.save(tmp)
open(f'{WD}/wA/fix082.log', 'w').write('\n'.join(P.log) + '\n')
SKIP = '856,857,858,859,860,1287,1376'
subprocess.run([sys.executable, f'{WD}/wA/streamtile.py', '12', '856', '1577', tmp, f'{WD}/wA/st082.json', f'{WD}/wA/st082.md',
                '--root', ROOT, '--skip', SKIP], check=True)
P = po.Plan(f'{WD}/wA/st082.json')
for e, k, x in P.items():
    if 'old' in x and x.get('kind') in ('letter', 'clipping') and 'set_french' in x and not x['set_french'].startswith(('>', '#')):
        x['set_french'] = quote(x['set_french'])
# 0190: _original has Marie's English «kitchen» with the footnote «In English in the original»; the print
# (tome12 ¶1136) has «cuisine». Keep _original's reading and its footnote at its place.
e, k, x = P.find('082.0190')
if 'set_french' in x:
    t = x['set_french'].replace('[^82.190.1]', '')
    assert 'à la cuisine' in t
    x['set_french'] = t.replace('à la cuisine', 'à la kitchen[^82.190.1]', 1)
P.p.pop('_draft', None)
P.save(f'{WD}/final/plan-082.json')
subprocess.run([sys.executable, f'{WD}/wA/addrsr.py', f'{WD}/final/plan-082.json', '47', '1578'], check=True)
subprocess.run([sys.executable, f'{WD}/wA/typofix.py', f'{WD}/final/plan-082.json'], check=True)
print('wrote final/plan-082.json')

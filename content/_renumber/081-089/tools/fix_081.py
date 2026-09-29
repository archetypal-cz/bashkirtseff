"""Worker A: common/plan-081.json -> final/plan-081.json (see final/REVIEW-081.md).
python3 fix_081.py [ROOT]   (ROOT = repo root the plan is checked against; default the main repo)"""
import sys, os, re, json, subprocess
WD = '/home/coder/rebuild-state/plan-tome1213'
sys.path.insert(0, f'{WD}/wA')
import planops as po
from planops import dtext, newpara, quote
ROOT = sys.argv[1] if len(sys.argv) > 1 else '/home/coder/bashkirtseff'
P = po.Plan(f'{WD}/common/plan-081.json')
po.strip_guesses(P)
H = 'Aucun texte - date seule mentionnée'

def rm_range(a, b, why=''):
    for e, k, x in list(P.items()):
        pass
    for e in P.p['entries']:
        keep = []
        for x in e['paragraphs']:
            r = po.newrng(x) if 'new' in x else None
            if r and not (r[1] < a or r[0] > b) and not x.get('_manual'):
                P.log.append(f'removed draft new ¶{r[0]}–{r[1]} {why}'); continue
            keep.append(x)
        e['paragraphs'] = keep
def setd(cid, text, q=False, why=''):
    """set_french from docx text, keeping _original's spelling where the two differ only slightly"""
    old = '\n'.join(l for l in po.old_lines(cid, ROOT) if not l.startswith('#'))
    t = po.reconcile(old, text)
    P.setf(cid, quote(t) if q else t, why)
def lines(a, b, fix=None):
    fix = fix or {}
    return '\n'.join(fix.get(i, dtext(i)) for i in range(a, b + 1) if po.D()[i]['t'].strip())

# --- title page (¶47–51) and the edition's source footnotes: out
rm_range(50, 51, '(title page of Livre 81, withdrawn)')
for p in (69, 157, 394, 844): rm_range(p, p, "(the edition's source footnote)")

# --- 7 July: a bare date line; 0305–0307 are copies of 8 July's 0310/0312/0313
P.setf('081.0304', f'[{H}]', 'bare date line ¶446')
for c, d in (('081.0305', '081.0310'), ('081.0306', '081.0312'), ('081.0307', '081.0313')):
    P.drop(c, f'duplicate of {d} (8 July text, tome12 ¶448–452, copied into the empty 7 July in extraction; the translations hold it twice)')

# --- 14 July: Mme Doubelt's answer (¶528–543)
rm_range(529, 543, '(Doubelt letter rebuilt)')
setd('081.0352', dtext(528))
P.put([newpara(529, 532, text=lines(529, 532), kind='letter', source='Lettre de Mme A. Doubelt à Marie, Pétersbourg, 7 juillet 1878')], after='081.0352')
setd('081.0353', lines(533, 538), q=True)
P.kind('081.0353', 'letter', 'Lettre de Mme A. Doubelt à Marie, Pétersbourg, 7 juillet 1878')
P.put([newpara(539, 543, text=lines(539, 541) + '\n' + dtext(543), kind='letter',
               source='Lettre de Mme A. Doubelt à Marie, Pétersbourg, 7 juillet 1878 (post-scriptum)',
               extra='¶542 «13-414» (an edition page reference) left out.')], after='081.0353')

# --- 17 July: Multedo's letter of 5 July and Marie's answer (¶588–606); the draft had filed them under 5 July
rm_range(589, 606, '(17 July letters rebuilt)')
setd('081.0368', dtext(588))
P.move(['081.0369'], after='081.0368')
F17 = {590: '5 juillet 1878\nMademoiselle,'}
P.put([newpara(589, 592, text=lines(589, 592, F17), kind='letter', source="Lettre d'A. Multedo à Marie, Mont-de-Marsan, 5 juillet 1878",
               extra='The edition\'s footnote call «5» before «Mont de Marsan» left out.')], after='081.0368')
setd('081.0369', lines(593, 600), q=True)
P.kind('081.0369', 'letter', "Lettre d'A. Multedo à Marie, Mont-de-Marsan, 5 juillet 1878")
F601 = {602: re.sub(r'^(\*?)°\s*', r'\g<1>1° ', dtext(602))}
P.put([newpara(601, 606, text=lines(601, 606, F601), kind='letter', source='Réponse de Marie à A. Multedo, juillet 1878 (en partie rayée)',
               extra='OCR: «°» restored to «1°» (docx list numbering lost).')], after='081.0369')

# --- 21 July: Multedo's verses (¶630–644)
rm_range(631, 644, '(verses rebuilt)')
setd('081.0387', dtext(630) + '[^2]')
F21 = {}
P.put([newpara(631, 644, text=lines(631, 644, F21), kind='letter', source="Vers d'A. Multedo à Marie, [18 juillet 1878]",
               extra='Footnote call «6» left out; OCR «vptre» → «votre».')], after='081.0387')

# --- 22 July: Multedo's letter (¶657–679), copied by Marie
rm_range(657, 679, '(22 July letter rebuilt)')
setd('081.0394', lines(657, 664), q=True)
P.kind('081.0394', 'letter', "Lettre d'A. Multedo à Marie, reçue le 22 juillet 1878 (copie de Marie)")
L665 = lines(665, 679).split('\n'); L665[0] = L665[0] + '[^1]'
setd('081.0395', '\n'.join(L665), q=True)
P.kind('081.0395', 'letter', "Lettre d'A. Multedo à Marie, reçue le 22 juillet 1878 (copie de Marie)")

# --- 23 July: bare date line
P.setf('081.0396', f'[{H}]', 'bare date line ¶691')

# --- 24 July: the draft filed ¶699–716 under 22 July (letter date «22 juillet 1878», ¶700)
rm_range(699, 709, '(24 July letter rebuilt)')
P.move(['081.0405', '081.0406', 712, 713, 714, '081.0408', '081.0409'], after=698)
setd('081.0405', lines(699, 709), q=True)
P.kind('081.0405', 'letter', "Lettre d'A. Multedo à Marie, Mont-de-Marsan, 22 juillet 1878")
P.kind('081.0406', 'margin')
P.unkind(712)

# --- 27 July: bare date line; the old placeholder is reworded
P.setf('081.0417', f'[{H}]', 'bare date line ¶727')

# --- 2 August: Multedo's poem «Dona Juana» (¶764–769)
rm_range(764, 769, '(poem rebuilt)')
setd('081.0443', lines(764, 769), q=True)
P.kind('081.0443', 'letter', "Poème d'A. Multedo à Marie, «Dona Juana», [31 juillet 1878]")

# --- 7 August: Multedo's letter of 5 August (¶834–841) and the rest of 7 August; the draft filed them under 5 August
rm_range(834, 834, '(7 Aug letter rebuilt)')
P.move([f'081.0{n}' for n in range(483, 492)], after='081.0482')
setd('081.0483', lines(834, 837, {835: '5 août 1878\nMademoiselle,'}), q=True)
setd('081.0484', dtext(838), q=True); setd('081.0485', dtext(839), q=True); setd('081.0486', lines(840, 841), q=True)
for c in ('081.0483', '081.0484', '081.0485', '081.0486'):
    P.kind(c, 'letter', "Lettre d'A. Multedo à Marie, Mont-de-Marsan, 5 août 1878")

# --- 18 July: 0375 (¶617) comes after the new ¶615–616
P.move(['081.0375'], after=616)
# --- 4 August: 0458 is an abridged merge of ¶799 + ¶801 (it skips ¶800 «Amen.»)
rm_range(799, 801, '(0458 rebuilt)')
setd('081.0458', lines(799, 801), why='abridged in _original; docx ¶799–801')

# --- 2 August: 0441 = ¶756 + the end of ¶757 (the draft made ¶757 new)
rm_range(757, 757, '(0441 rebuilt)')
setd('081.0441', lines(756, 757))

# --- 21 July: ¶646 split between 0388 and 0390 at a sentence boundary (_original cut it mid-sentence
#     and elided «Jusqu'à présent … je disais que»)
t646 = dtext(646); cut = t646.index('Je prends Auguste')
setd('081.0388', dtext(645) + ' ' + t646[:cut].strip())
setd('081.0390', t646[cut:])
# 0325 ends «l'Histoire Romaine.» where the print has «l'Hist[oire]. Romaine.»: left as it is
P.find('081.0325')[2]['_manual'] = True

# --- kinds on old paragraphs already quoted in _original
for c in ['081.0015']:
    P.kind(c, 'letter', "Première lettre anonyme de Marie au père de Paul de Cassagnac, 24 juin 1878")
for n in range(16, 26):
    P.kind(f'081.00{n}', 'letter', "Seconde lettre anonyme de Marie au père de Paul de Cassagnac, 24 juin 1878")
for c in ('081.0070', '081.0071'):
    P.kind(c, 'letter', 'Lettre de Marie à Paul de Cassagnac, 29 juin 1878')
for n in range(168, 173):
    P.kind(f'081.0{n}', 'letter', 'Lettre de Marie à Mme Doubelt, 2 juillet 1878')
for n in range(274, 277):
    P.kind(f'081.0{n}', 'letter', 'Lettre anonyme («Une femme indignée») à A. Multedo, juillet 1878 (mystification de la «petite tante»)')
for c in ('081.0177', '081.0282'): P.kind(c, 'margin')
P.kind('081.0082', 'rayé')
P.kind('081.0009', 'editorial')
# press cuttings Marie copied: quoted with set_french
setd('081.0061', lines(151, 155), q=True)
setd('081.0062', lines(156, 156) + '\n' + lines(158, 160), q=True)
for c in ('081.0061', '081.0062'): P.kind(c, 'clipping', 'Le Figaro, 28 juin 1878')
for n in range(260, 272): P.kind(f'081.0{n}', 'clipping', 'Le Figaro, juillet 1878 (service funèbre de la reine Mercedes à la Madeleine)')
# draft kind guesses on new paragraphs that are not letters/clippings
for pnum in (515,):
    P.unkind(pnum)

# --- 081.0499 = the Livre 82 title page (withdrawn) + «Que diable, au fait non.» (¶862, 8 Aug «- suite»);
#     the 082 plan restores ¶862 as new under the heading «Jeudi 8 août 1878 - suite...»
P.p['drop'].append({'id': '081.0499', 'reason': 'title page of Livre 82 (withdrawn, KRR 2026-09-28) plus «Que diable, au fait non.», which the 082 plan restores from tome12 ¶862 under «Jeudi 8 août 1878 - suite...»'})

P.prune_entries()
tmp = f'{WD}/wA/pre081.json'; P.save(tmp)
open(f'{WD}/wA/fix081.log', 'w').write('\n'.join(P.log) + '\n')
# stream tiling of the remaining cut-short / fragment clusters
SKIP = '47,48,49,50,51,69,157,232,394,844,542'
subprocess.run([sys.executable, f'{WD}/wA/streamtile.py', '12', '47', '855', tmp, f'{WD}/wA/st081.json', f'{WD}/wA/st081.md',
                '--root', ROOT, '--skip', SKIP], check=True)
P = po.Plan(f'{WD}/wA/st081.json')
# quoting of kinds set on old paragraphs whose text streamtile may have changed
for e, k, x in P.items():
    if 'old' in x and x.get('kind') in ('letter', 'clipping') and 'set_french' in x and not x['set_french'].startswith(('>', '#')):
        x['set_french'] = quote(x['set_french'])
os.makedirs(f'{WD}/final', exist_ok=True)
P.p.pop('_draft', None)
P.save(f'{WD}/final/plan-081.json')
subprocess.run([sys.executable, f'{WD}/wA/addrsr.py', f'{WD}/final/plan-081.json', '47', '1578'], check=True)
subprocess.run([sys.executable, f'{WD}/wA/typofix.py', f'{WD}/final/plan-081.json'], check=True)
print('wrote final/plan-081.json')

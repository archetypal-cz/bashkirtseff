"""Prerequisite fixes (apply to a repo root before the 015–030 rebuild):
 1. cz/020/1874-06-25.md lacks 020.0399 (the editors' note «[Papier à en-tête Hôtel de l'Europe, Spa]»)
 2. en/019/1874-05-08.md lacks 019.0142 (the note «[Note de l'éd. : ici un dessin de Marie dans le journal.]»)
 3. glossary citations «CCC.YYYY-MM-DD» for carnets 015–030 read as paragraph IDs by renumber-check → «CCC/YYYY-MM-DD»
    (028.1874-12-28 → 028/1874-12-27: that text moves one day back in the rebuild)"""
import re, sys, datetime
from pathlib import Path
TS = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
R = Path(sys.argv[1])
done = []

f = R / 'content/cz/020/1874-06-25.md'
s = f.read_text()
if '%% 020.0399 %%' not in s:
    s = s.rstrip('\n') + ('\n\n%% 020.0399 %%\n%% kind: editorial %%\n%% [Papier à en-tête Hôtel de l\'Europe, Spa] %%\n'
                          f'%% {TS} ED: Paragraph missing from the cz tree (present in _original, uk, en, fr); added with its Czech rendering. %%\n'
                          '[Dopisní papír s hlavičkou Hôtel de l\'Europe, Spa]\n')
    f.write_text(s); done.append(str(f.relative_to(R)))

f = R / 'content/en/019/1874-05-08.md'
s = f.read_text()
if '%% 019.0142 %%' not in s:
    block = ('%% 019.0142 %%\n%% kind: editorial %%\n%% [Note de l\'éd. : ici un dessin de Marie dans le journal.] %%\n'
             f'%% {TS} ED: Paragraph missing from the en tree (present in _original, cz, uk, fr); added with the wording en uses for 019.0073. %%\n'
             '[Ed. note: a drawing by Marie appeared here in the diary.]\n\n')
    assert s.count('%% 019.0143 %%') == 1
    s = s.replace('%% 019.0143 %%', block + '%% 019.0143 %%')
    f.write_text(s); done.append(str(f.relative_to(R)))

# 4. fr (unedited tree): the embedded French of the clusters whose date line the plan corrects is one
#    multi-line comment block; rebuild-carnet refuses set_french there, so split it into one comment per line
for rel, ids in (('content/fr/028', ['028.0216', '028.0218', '028.0226', '028.0241', '028.0250']), ('content/fr/029', ['029.0001', '029.0014'])):
    for md in sorted((R / rel).glob('*.md')):
        s = md.read_text(); t = s
        for oid in ids:
            m = re.search(rf'^%% {re.escape(oid)} %%\n', t, re.M)
            if not m:
                continue
            nxt = re.search(r'^%% \d{3}\.\d{4} %%$', t[m.end():], re.M)
            end = m.end() + (nxt.start() if nxt else len(t) - m.end())
            body = t[m.end():end]
            def split(mm):
                inner = mm.group(1)
                return '\n'.join(f'%% {l.strip()} %%' for l in inner.split('\n') if l.strip())
            body2 = re.sub(r'^%% ((?:(?!%%).)*\n(?:(?!%%).)*) %%$', split, body, flags=re.M | re.S)
            t = t[:m.end()] + body2 + t[end:]
        if t != s:
            md.write_text(t); done.append(str(md.relative_to(R)))

# 5. en: stale embedded French that renumber-check (d) FAILs on (pre-existing, visible English is right):
#    a stray copy of 021.0499's French in 021.0500; 030.0238 carrying 030.0237's sentence too;
#    heading copies of 030.0303/0313/0322/0341 that also held the first sentence of the next paragraph
EN_FIX = [
    ('content/en/021/1874-07-23.md', '021.0500', "%% Comme nous ressortions au Casino, Mme Lausberg remet à maman une boîte et une carte de visite. J'entends, encore au haut de l'escalier : %%\n", ''),
    ('content/en/030/1875-03-22.md', '030.0238', "%% Je monte jusqu'aux astres et je tombe dans les Durand et les Vigier... N'abandonne pas ton Alcibiade en jupes ! %%", "%% N'abandonne pas ton Alcibiade en jupes ! %%"),
    ('content/en/030/1875-03-28.md', '030.0303', "%% # Dimanche, 28 mars 1875. Je vais à l'église avec Dina... %%", '%% Dimanche, 28 mars 1875 %%'),
    ('content/en/030/1875-03-29.md', '030.0313', "%% # Lundi, 29 mars 1875. Moi et Marie avons commencé le portrait d'Olga... %%", '%% Lundi, 29 mars 1875 %%'),
    ('content/en/030/1875-03-30.md', '030.0322', "%% # Mardi, 30 mars 1875. Mon fichu frère s'en va en Russie avec Sacha... %%", '%% Mardi, 30 mars 1875 %%'),
    ('content/en/030/1875-04-01.md', '030.0341', "%% # Jeudi, 1 avril 1875. Décidément j'ai un fort caractère !... %%", '%% Jeudi, 1 avril 1875 %%'),
]
for rel, oid, a, b in EN_FIX:
    md = R / rel
    t = md.read_text()
    i = t.index(f'%% {oid} %%\n')
    j = t.find('\n%% ', i + 1)
    nxt = re.search(r'^%% \d{3}\.\d{4} %%$', t[i + 10:], re.M)
    end = i + 10 + nxt.start() if nxt else len(t)
    if a in t[i:end]:
        t = t[:i] + t[i:end].replace(a, b, 1) + t[end:]
        md.write_text(t); done.append(f'{rel} ({oid})')

for g in sorted((R / 'content/_original/_glossary').rglob('*.md')):
    t = g.read_text()
    t2 = t.replace('028.1874-12-28', '028.1874-12-27')
    if t2 != t:
        g.write_text(t2); done.append(str(g.relative_to(R)))
print('\n'.join(done))

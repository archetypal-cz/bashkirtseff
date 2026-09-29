"""Post-apply fixes for audit-fix run 2 (102, 104), repo root = argv[1]. Idempotent-ish: asserts the expected state."""
import re, sys
R = sys.argv[1]
H23 = {'cz': '# Pátek 23. listopadu 1883', 'uk': "# П'ятниця, 23 листопада 1883", 'en': '# Friday, 23 November 1883'}
def rw(p, f):
    s = open(p).read(); n = f(s); assert n != s, p; open(p, 'w').write(n)
def cluster(s, pid):
    a = s.index(f'%% {pid} %%\n'); m = re.search(r'^%% \d{3}\.\d{4} %%$', s[a + 5:], re.M)
    b = a + 5 + m.start() if m else len(s); return a, b
def fix_ed(c, trims):
    note = ('%% {ts} ED: {tag}: SOURCE CHANGED resolved by the applier — ' + trims + ' %%')
    return re.sub(r'%% (\S+) ED: (rebuild-carnet 10[24] \(tome16\.docx\)): SOURCE CHANGED — [^\n]*%%',
                  lambda m: note.format(ts=m.group(1), tag=m.group(2)), c, count=1)
for t in ('cz', 'uk', 'en', 'fr'):
    # 104: 04-29 cluster (104.0035): old heading «Lundi 28» out, stray «Mardi 29» line becomes the heading
    p = f'{R}/content/{t}/104/1884-04-29.md'; s = open(p).read(); a, b = cluster(s, '104.0035'); c = s[a:b]
    heads = {}
    if t != 'fr':
        m = re.search(r'^(# [^\n]*28[^\n]*)\n([^\n%#][^\n]*29[^\n]*)\n', c, re.M); assert m, (t, c[:600])
        heads['28'] = m.group(1)
        c = c[:m.start()] + '# ' + m.group(2).strip() + '\n' + c[m.end():]
        c = fix_ed(c, 'the old heading (28 April) was removed and the date line of 29 April made the heading.')
    else:
        c = fix_ed(c, 'the embedded French no longer has the 28 April heading; no visible fr text to trim.')
    s = s[:a] + c + s[b:]; open(p, 'w').write(s)
    # 104: 04-28 stub heading
    if t != 'fr':
        rw(f'{R}/content/{t}/104/1884-04-28.md', lambda s: s.replace('%% Lundi 28 avril 1884 %%\n# TODO\n', f'%% Lundi 28 avril 1884 %%\n{heads["28"]}\n', 1))
        rw(f'{R}/content/{t}/102/1883-11-23.md', lambda s: s.replace('%% Vendredi 23 novembre 1883 %%\n# TODO\n', f'%% Vendredi 23 novembre 1883 %%\n{H23[t]}\n', 1))
    # 102.0055: stray 23 Nov line (only uk renders it)
    p = f'{R}/content/{t}/102/1883-11-22.md'; s = open(p).read(); a, b = cluster(s, '102.0055'); c = s[a:b]
    if t == 'uk':
        assert c.count("\nП'ятниця, 23 листопада 1883\n") == 1; c = c.replace("\nП'ятниця, 23 листопада 1883\n", '\n', 1)
        c = fix_ed(c, 'the stray date line «Vendredi 23 novembre 1883» (now entry 1883-11-23) was removed from the translation.')
    else:
        c = fix_ed(c, 'only the stray date line «Vendredi 23 novembre 1883» (now entry 1883-11-23) left the French; this translation did not render it.')
    s = s[:a] + c + s[b:]; open(p, 'w').write(s)
print('ok')

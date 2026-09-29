"""Follow-up fix (tome 16 apply): Bastien-Lepage's «Jeanne d'Arc» (1879) is in the Metropolitan Museum of Art,
New York (acc. 89.21.1), not the National Gallery (London / Washington) as the footnotes and LAN/TR notes on
the 105 «Jeanne d'Arc» paragraph (old 105.0557) said. Exact-string replacements, all trees; the file is found by content, not by ID.
The paragraph moves between entries in the rebuild (1884-08-11 → 1884-08-12), so every 105 file is scanned.
Idempotent. Usage: python3 fixmet.py <repo root>"""
import sys
root = sys.argv[1]
import glob
R = {
    '*': [("Bastien-Lepage's most famous painting (1879), National Gallery London",
           "Bastien-Lepage's most famous painting (1879), Metropolitan Museum of Art, New York")],
    '_original': [("Now in the National Gallery of Art, Washington D.C.",
                   "Now in the Metropolitan Museum of Art, New York.")],
    'en': [("Now in the National Gallery of Art, Washington D.C.",
            "Now in the Metropolitan Museum of Art, New York."),
           ("now in the National Gallery of Art, Washington.", "now in the Metropolitan Museum of Art, New York.")],
    'cz': [("dnes v National Gallery v Londýně.", "dnes v Metropolitním muzeu umění v New Yorku.")],
    'uk': [("Нині зберігається в Національній галереї мистецтва у Вашингтоні.",
            "Нині зберігається в Метрополітен-музеї в Нью-Йорку.")],
}
for t in ('_original', 'cz', 'uk', 'en', 'fr'):
    n = 0
    for p in sorted(glob.glob(f'{root}/content/{t}/105/*.md')):
        s = open(p).read()
        k = 0
        for a, b in R['*'] + R.get(t, []):
            k += s.count(a)
            s = s.replace(a, b)
        if k:
            open(p, 'w').write(s)
            n += k
    print(f'fixmet: {t} {n}')

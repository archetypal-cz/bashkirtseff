"""Worker D post-apply (087, 089): drop the garbled duplicate date headings the extraction kept.
Run after --write: python3 post_apply_d.py REPO_ROOT. Exact-line edits only; IDs of these clusters do not change.
_original / cz / en / uk: delete the garbled heading line and its embedded copy; uk also its translated garbled
twin; fr: its visible heading is the garbled one alone -> replaced by the correct form."""
import sys, os
R = sys.argv[1]
FIX = [  # carnet, file, correct, garbled, uk visible twin
    ('087', '1880-02-01.md', 'Dimanche 1er février 1880', 'Dimancher 1er février 1880', '# Неділяа, 1 лютого 1880'),
    ('087', '1880-02-17.md', 'Mardi 17 février 1880', 'March 17 février 1880', '# March 17 лютого 1880'),
    ('087', '1880-03-16.md', 'Mardi 16 mars 1880', 'March 16 mars 1880', '# March 16 березня 1880'),
    ('087', '1880-04-06.md', 'Mardi 6 avril 1880', 'March 6 avril 1880', '# March 6 квітня 1880'),
    ('089', '1880-07-01.md', 'Jeudi 1er juillet 1880', 'Jeudi Ier juillet 1880', None),
    ('089', '1880-08-01.md', 'Dimanche 1er août 1880', 'Dimanche Ier août 1880', None),
    ('089', '1880-09-01.md', 'Mercredi 1er septembre 1880', 'Mercredi Ier septembre 1880', None),
]
n = 0
for c, f, good, bad, ukv in FIX:
    for t in ['_original', 'cz', 'uk', 'en', 'fr', 'es']:
        path = os.path.join(R, 'content', t, c, f)
        if not os.path.exists(path): continue
        L = open(path, encoding='utf-8').read().split('\n'); out = []
        for l in L:
            if l == f'%% {bad} %%' or (t != 'fr' and l == f'# {bad}') or (t == 'uk' and ukv and l == ukv):
                n += 1; continue
            if t == 'fr' and l == f'# {bad}':
                l = f'# {good}'; n += 1
            out.append(l)
        open(path, 'w', encoding='utf-8').write('\n'.join(out))
# RSR note for the printer's typo corrected in the old 0393 heading (_original only; its new ID via the 087 rebuild map:
# title_notes.py shifts 087 by one)
import datetime, glob, json
new393 = json.load(open(sorted(glob.glob(os.path.join(R, 'content', '_renumber', '087-*.json')))[-1]))['id_map']['087.0393']
ts = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
path = os.path.join(R, 'content', '_original', '087', '1880-02-01.md')
L = open(path, encoding='utf-8').read().split('\n')
k = L.index(f'%% {new393} %%')
note = ('%% ' + ts + " RSR: Printer's typo corrected: «Dimancher» → «Dimanche» (Mon Journal t.13 p.179, tome13.docx ¶2458); "
        'the duplicate garbled heading line from the extraction was removed (2026-09-28 rebuild). %%')
if not any("Printer's typo corrected: «Dimancher»" in l for l in L):
    L.insert(k + 1, note); n += 1
open(path, 'w', encoding='utf-8').write('\n'.join(L))
print('post_apply_d: lines changed', n)

"""Owner policy (handoff 2026-09-28): «Marie's own notes on title pages go in as margin/other at the first entry»
(cf. 080 «Femme nue», tome0102 title_notes.py). Marie's notes on the title pages of Livres 81, 84, 86, 87, 88, 89
and the index lines before the Livre 85 title become `margin` paragraphs right after the heading paragraph of the
Livre's first entry (085: after the one-line continuation paragraph that carries the «- suite» heading).
The title formulas (Gloriae Cupiditas / Livre N / commencé–terminé / addresses) stay withdrawn.
Edits final/plan-CCC.json in place (backup in final/pre-titlenotes/); idempotent."""
import json, os, shutil
from pathlib import Path
D = Path(__file__).resolve().parent.parent / 'final'
B = D / 'pre-titlenotes'
B.mkdir(exist_ok=True)
POL = "Restored in the 2026-09-28 rebuild (owner policy: Marie's own title-page notes go in)."
def src(n): return f'note de Marie sur la page de titre du Livre {n}'
def rsr(tome, paras, page, extra=''):
    return f"Marie's note on the title page of Livre {{n}}; tome{tome}.docx ¶{paras}, Mon Journal t.{tome} p.{page}. {POL}{extra}"
CASSAGNAC = '[#Cassagnac](../_glossary/people/recurring/CASSAGNAC.md)'
NOTES = {
 '081': ('1878-06-23.md', '081.0001', 81, [
    ("[Dans la marge : Explication à Cassagnac, sa décadence dans mon esprit après la dernière visite au 10 bis puis les pages pendant Schaeppi page 93, livre 79 et enfin les pages, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 du présent livre 81e, pages 95 et mes suivantes livre 79.]",
     rsr(12, 50, 5), [CASSAGNAC]),
    ("[En travers: Saillies folles.]", rsr(12, 51, 5), [])]),
 '084': ('1879-01-11.md', '084.0001', 84, [
    ("1879\nCommencé dessiner 4 octobre Rosalie ?\ncommencé peinture lundi 30 septembre 1878\nreçu médaille mardi 14 janvier 1879\nMardi, Jeudi 27 juin 1878\nDimanche 27 janvier 1878\nles cinq femmes.\nLivre 77, page 177 passage sur les amants qui me fait honneur.\narrangement tranquille livre 83, p. 140\nun chapeau noir comme celui de Soden.",
     rsr(12, '2171–2177', 195, " Printed in small type on the page before the Livre 84 title (line breaks as in the print)."), [])]),
 '085': ('1879-04-25.md', 0, 85, [
    ("Dessin 3 octobre 1877\npeinture 30 septembre 1878\nreçu médaille 14 janvier 1879\nmardi 27 juin 1878\ndimanche 27 janvier 1878 : 5 femmes\narrangement tranquille 83 p. 140\nVerdi - Prince impérial",
     rsr(13, '50–56', 5, " Printed above the Livre 85 title; placed after the one-line continuation of 25 April that opens the carnet."), [])]),
 '086': ('1879-08-07.md', '086.0001', 86, [
    ("Dessin 3 octobre 1879\npeinture 30 septembre 1878\nreçu médaille 14 janvier 1879\n27 juin 1878\nVerdi -Prince Impérial\nhautbois\nLettres à Jeanne, Daillens, Gavini.\n[Deux lignes cancellées]\nJe m'attendais à faire dans ce monde tout autre chose que ce que j'y fais et du moment que ce n'est pas ce que je croyais peu m'importe ce que cela peut être.",
     rsr(13, '957–965', 69, " «Dessin 3 octobre 1879» as printed (the Livres 85, 87 and 88 title pages read 1877); kept, not a clear typesetting typo."), [])]),
 '087': ('1879-12-22.md', '087.0001', 87, [
    ("Dessin, 3 octobre 1877 peinture 30 septembre 1878 médaille 14 janvier 1879\nprédiction d'Edmond, L. 75, p. 6\nJe m'attendais à faire en ce monde tout autre chose que ce j'y fais. Et du moment que ce n'est pas ce que je pensais peu m'importe ce que cela peut bien être.",
     rsr(13, '1971–1973', 147, " Printer's typo corrected: «septembe» → «septembre» (Mon Journal t.13 p.147)."), [])]),
 '088': ('1880-04-24.md', '088.0001', 88, [
    ("Dessin 3 octobre 1877\nPeinture 30 septembre 1878\nMédaille 14 janvier 1879\nPrédiction d'Edmond L.75, p. 6\nJe m'attendais à faire en ce monde tout autre chose que ce j'y fais. Et du moment que ce n'est pas ce que je pensais peu m'importe ce que cela peut bien être.\npage 86 faire un livre",
     rsr(13, '3083–3088', 225), [])]),
 '089': ('1880-06-20.md', '089.0001', 89, [
    ("Dessin 3 octobre 1871\nPeinture 30 septembre 1872\nMédaille 14 janvier 1877\nPrédiction d'Edmond (livre 75, p. 6\nRésolution sage (page 13)",
     rsr(13, '4163–4167', 293, " Dates as printed («1871», «1872», «1877»; the other title pages read 1877/1878/1879) — kept, not a clear typesetting typo; docx OCR «Médaille! 4» read from the scan as «Médaille 14»."), [])]),
}
for c, (file, after, livre, notes) in NOTES.items():
    f = D / f'plan-{c}.json'
    if not (B / f.name).exists(): shutil.copy(f, B / f.name)
    p = json.load(open(f))
    e = next(e for e in p['entries'] if e['file'] == file)
    if any((x.get('new') or {}).get('source') == src(livre) for x in e['paragraphs']):
        print(c, 'already done'); continue
    k = after if isinstance(after, int) else next(i for i, x in enumerate(e['paragraphs']) if x.get('old') == after)
    for j, (fr, note, tags) in enumerate(notes):
        para = {'new': {'kind': 'margin', 'source': src(livre), 'french': fr, 'rsr': note.replace('{n}', str(livre))}}
        if tags: para['new']['tags'] = tags
        e['paragraphs'].insert(k + 1 + j, para)
    json.dump(p, open(f, 'w'), ensure_ascii=False, indent=1)
    print(c, f'+{len(notes)} margin after', after)

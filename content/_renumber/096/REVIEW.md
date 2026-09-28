# Carnet 096

## 096 — rebuild plan notes (tome15, Livre 96, docx ¶627–1223)

Plan: `work/plan-096.json`, rebuilt by `p0956/build096.py` from the **identity plan** (_original's day-per-file layout, heading cluster per day, already right in most places) plus the fixes below. The draft had merged 5–6 Sept, 11–13 Sept, 15–17 Sept, 30 Sept–1 Oct and 6–8 Oct into single entries and turned combined date lines into «new» text paragraphs; all of that is discarded. 88 entries, 441 old + 32 new, 2 dropped, 1 moved out. Dry run with 095+097: 0 errors.

### Moves (docx order, checked on the scan)
- 0061–0062 («Voilà. C'est ennuyeux…», «Tout ça me montre… Bonsoir.») → end of **1882-08-11**. The «Samedi 12 août 1882» line comes after them (p.58).
- 0143–0148 (Dumas / «zut aux faux Diogène»…) → end of **1882-08-28**. «Mardi 29 août 1882» comes after them (p.68).
- 0420 «Alexandre et Kapitan ont dîné hier ici.» → **1882-10-26**, under «Jeudi 26 octobre» (p.102), before the 27 October date line.
- 0325–0341 → **1882-10-06**. The print has no «Samedi 7 octobre» or «Dimanche 8 octobre» line: 6 October runs from p.89 to p.92 up to «Lundi 9 octobre» (the torn leaves 121–124, 0329, fall inside it).
- 0444 «Impossible de coller deux mots ensemble.» → carnet **097** (confirmed: it follows the Livre 97 title page, ¶1230 «Dimanche 29 octobre 1882-suite» / ¶1231). 097's plan places it (097's first paragraph).

### Drops (lead to confirm)
- 096.0324 «# Samedi 7 octobre 1882» and 096.0342 «# Dimanche 8 octobre 1882»: heading-only clusters with no date line in the manuscript (tome15.docx ¶1051–1079, pp.89–92). The 1882-10-07 and 1882-10-08 URLs redirect to 1882-10-06.

### Dates
- ¶674 is printed «Mardi 6 août 1882» but is Tuesday **8 August** (between 7 and 9 August): kept as 1882-08-08 with _original's heading «Mardi 8 août 1882» (0033). The draft had put 0033 in 08-07 and 0034–0040 in 08-06.
- ¶912 «Mercredi 6 septembe 1882»: the print has «septembe». Kept as in _original (0209).
- ¶1198 repeats «Vendredi 27 octobre 1882» (empty) before «Samedi 28 octobre» (p.104): no extra entry, no placeholder.
- Combined date lines, one entry per date: ¶929 «Lundi 11 / Mardi 12 / Mercredi 13 septembre» (the text belongs to 13 Sept); ¶936 «Vendredi 15 / Samedi 16 / Dimanche 17 septembre» (text belongs to 17); ¶1023 «Samedi 30 septembre / Dimanche 1er octobre» (text belongs to 1 Oct). _original already had them this way: old heading clusters stay in their own entries.
- Weekdays of all 88 entries checked: all fit.

### Empty days
- 1882-08-01: the ID-less stub is in `drop_files` and replaced by an entry with «[Aucun texte…]» (¶631).
- 28 days that are only an old heading cluster get a new «[Aucun texte - date seule mentionnée]» paragraph after the heading (08-05, 08-24, 08-25, 08-27, 09-02, 09-03, 09-07, 09-08, 09-11, 09-12, 09-15, 09-16, 09-19–21, 09-23, 09-25, 09-29, 09-30, 10-11–13, 10-20–22, 10-24, 10-25, 10-28). This resets translation flags on those small entries.

### New text
- ¶1145–1147 (end of 19 Oct: «Donc pour en revenir à nos princes.» …): missing from _original, added. The print reads «dès mieux» (kept) and has «[Rayé: Et voilà tout]» inline (no kind).

### Kinds
- 0096 «[En travers: Et les maîtres…]», 0137 «[Dans la marge: A la première lecture…]»: margin (whole paragraphs, small type).
- 0154 «[Note de l'éd. : ici un plan de son atelier dessiné par Marie dans le journal.]»: editorial (kept). The printed page has no such note; it shows the plan itself. **Drawing for the planner:** Marie's plan of her studio at 30 rue Ampère (rooms labelled: chambre, cabinet de toilette, bibliothèque, atelier, jardin, rue Ampère…), printed p.69 (PDF p.70), 1882-08-29, after 0153 «Voici un plan, vous comprendrez mieux» (i.e. at 0154).
- 0329 «[Feuillets 121 à 124 arrachés]»: editorial (kept).
- 0377 → **letter**, source «Lettre de Marie à Rodolphe Julian, octobre 1882 (copiée dans le journal)»; `set_french` = the old text `> `-quoted. It is the letter she copies after «voici ce que j'écris à Julian : …» (¶1122–1123, small type, p.95).

### Completeness
Every docx paragraph ¶631–1223 is in the plan (start and end of the text checked, footnote markers ignored). ¶627–630 are the cover (in withdrawn-covers.json, including «Dupleix, 2, rue de Penthièvre, mardi, jeudi, samedi, (p. 19 au bas)»). Nothing else is withdrawn.

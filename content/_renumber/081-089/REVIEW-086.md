# 086 rebuild plan — review (worker C, 2026-09-28)

Plan: `final/plan-086.json`, built by `tools/fix_086.py` (helpers `tools/fixlib_c.py`) from `common/plan-086.json`.
Edit log: `final/fixlog-086.txt`. Dry run with 085: `final/dry-085-086.out` (not rejected; warnings only «old embedded
French not found — new copy inserted» for the rewritten heading clusters 0211 0268 0486 0513 0520, ×4 trees).

## Summary

- **137 entries** (37 added, 0 removed), **772 paragraphs**: 530 old carried, **242 new** (~58k chars restored:
  13 Sep–1 Oct, 15 Nov–2 Dec, 4–21 Dec 1879 and scattered paragraphs), **18 dropped**, 0 moved in/out
  (086.0089 stays in 086; the draft's move to 085 is rejected).
- **59 `set_french`**: 31 accent restorations, 10 label restorations, 12 placeholder normalisations, 5 heading fixes, 1 OCR fix (0441).
- Approval flags reset in 98 of 137 entries per translation tree.
- Kinds: old margin ×1 (0173); new editorial ×1, margin ×1, rayé ×1.

## Decisions

- **Livre 86 title page** (¶957–970, printed p.69) withdrawn: see table. ¶969 «Mardi 12 août 1879 à Dieppe / hôtel Bristol»
  and ¶970 «Jeudi 4 septembre 1879 Paris» are the title page's place lines (not date lines of entries); the draft had put
  «à Dieppe / hôtel Bristol» and «Paris» into the 12 Aug and 4 Sep entries — removed.
- **086.0089** stays at 16 Aug after 0088 (docx ¶1074; the old text is complete).
- **8/9 Aug.** 086.0026 «[Note: Ce contenu peut chevaucher avec l'entrée du 7 août…]» (a transcriber's note) dropped;
  086.0033 «[Aucun texte - date seule mentionnée]» (9 Aug) dropped: 9 Aug has text in the manuscript (¶1007–1015 = old
  0035–0040, which the draft already moves from 10 to 9 Aug).
- **4/5 Sep.** Old heading «# Jeudi, 4 septembre 1879/Vendredi, 5 septembre 1879» (0211) → «# Vendredi 5 septembre 1879» at
  the head of 5 Sep; 4 Sep is a bare date line (¶1234) → «[Aucun texte…]» (draft).
- **29 Sep / 30 Sep / 1 Oct.** Three consecutive date lines (printed p.102, text layer checked); text under 1 Oct. 29 and 30 Sep
  get «[Aucun texte…]»; 0268 (heading-only «# Mercredi, 1er octobre 1879», stranded by the draft in 13 Sep) → 1 Oct with
  0269–0273.
- **19 Nov.** «Mercredi19 novembre 1879» (¶1669) was not parsed: new entry 1879-11-19 with 0486 (heading → «# Mercredi 19
  novembre 1879»), ¶1670 and ¶1671–1675; 18 Nov keeps ¶1668.
- **13/14 Dec.** «Dimanche 14 décembe 1879» (¶1820, a printed misprint, crop checked) was not parsed: 13 Dec becomes a bare
  date line («[Aucun texte…]», ¶1819), new entry 1879-12-14 «Dimanche 14 décembre 1879» with ¶1821–1830.
- **1 Nov.** Draft new «- Toussaint» removed (it is the rest of the date line, already in 0400).
- **Placeholders** («[Pas d'entrée pour cette date]», «[Aucune entrée pour cette date.]», «… - Marie's 21st birthday]»): every
  such day has a date line in the docx. 12 are bare date lines (2, 8, 9, 10, 13, 15, 29 Oct; 3, 7, 11, 12, 13 Nov) →
  normalised to «[Aucun texte - date seule mentionnée]»; 15 days have text in the manuscript (16–30 Nov) → placeholder
  dropped. No entry disappears.
- **Accents.** Several old files were typed without accents (1 Oct, 4–10 Nov, 2–3 Dec). 31 clusters get the docx word forms,
  aligned word by word (only words whose accent-free form is identical change; e.g. «a»→«à» only where the printed text has
  «à» at that position). Headings «decembre» → «décembre» (0513, 0520). Reversible: drop the accents block in fix_086.py.
- **Labels restored** from the docx (page-break halves joined): «[Mots noircis: …]» / «[Mot noirci: …]» in 0004 0006 0020
  0047 0068 0093 0098 0111 0123 0136 (0123 also gains the struck «mal» in «[Mots noircis: mal façon]»).
- **Kinds.** 0173 «[Annotation: 4 décembre 1879. …]» → margin (Marie's own later note). ¶1369 «[MOITIE DE PAGE BLANCHE]» →
  editorial; ¶1370 not a clipping (diary text); ¶1895 «- Mon cher Arnaud, permettez-moi de vous présenter…» is spoken at the
  Murcia fête (dialogue), not a letter. ¶1711 «[En travers: …]» margin, ¶1776 «[Ligne rayée; …]» rayé (draft).
- **OCR** in new text: «découragée II Rien» → «!!» (¶1292), «errare 96» page number removed (¶1317), «_ Mais» → «- Mais»
  (¶1865), «rien, 139 vous» page number removed (¶1865), «/'Amnistie» → «l'Amnistie» (menu ¶1335), page-break line joins.
  «quittés Dieppe» kept as printed (old 0212 keeps «quitté»); «enmpoigné», «gôut» are corrected (table below).
- The menu of 14 Sep (¶1326–1339) stays diary text in italic lines (Marie's own composition), no kind.
- **Old OCR left**: 086.0544 «je n'y comprends rien II» (old text, not touched).

## Printer's typos corrected (owner policy 2026-09-28)

Each correction is noted in the paragraph's RSR (`rsr` for new paragraphs, `_rsr` for old ones). Marie's own spellings
and «[sic]» cases (e.g. «gambettai [sic]») are kept. OCR artefacts fixed without a note: hyphen-space splits such as
«sang- froid», «peut- être» joined; old 086.0441 «corne» → «comme».

| printed | corrected | paragraph (old ID or docx ¶) | Mon Journal t.13 |
|---|---|---|---|
| bon gôut | bon goût | new ¶1320 | p.97 |
| étonnament | étonnamment | new ¶1358 | p.99 |
| présnet | présent | 086.0271 | p.103 |
| faili la | failli la | 086.0416 | p.116 |
| abslument | absolument | new ¶1671–1674 | p.122 |
| deséspère | désespère | new ¶1671–1674 | p.122 |
| plus suvie | plus suivie | new ¶1671–1674 | p.122 |
| sa taile | sa taille | new ¶1736 | p.128 |
| apès avoir | après avoir | new ¶1807–1810 | p.134 |
| moité par | moitié par | new ¶1851 | p.138 |
| huissieurs | huissiers | new ¶1935 | p.143 |
| très dôle | très drôle | new ¶1938 | p.143 |
| enmpoigné | empoigné | 086.0004 | p.70 |
| lui et et des | lui et des | new ¶1847 | p.138 |
| décembe | décembre | 1879-12-14 heading | p.135 |

## Facsimiles

None in 086: the scan has no reproduced programme or clipping in this range. The 14 Sep menu (¶1326–1339) is typeset
text, not a facsimile.

## Withdrawn cover pages

| docx ¶ | printed | text |
|---|---|---|
| 957–965 | p.69 | «Dessin 3 octobre 1879 / peinture 30 septembre 1878 / reçu médaille 14 janvier 1879 / 27 juin 1878 / Verdi -Prince Impérial / hautbois / Lettres à Jeanne, Daillens, Gavini. / [Deux lignes cancellées] / Je m'attendais à faire dans ce monde tout autre chose que ce que j'y fais et du moment que ce n'est pas ce que je croyais peu m'importe ce que cela peut être.» (small type; the last sentence repeats 16 Aug 1879, old 086.0089) |
| 966–970 | p.69 | «Gloriae cupiditas / Livre 86 / commencé le jeudi 1 août 1879 / terminé le dimanche 21 décembre 1879 / Avenue Montaigne , 34, Paris / Mardi 12 août 1879 à Dieppe / hôtel Bristol / Jeudi 4 septembre 1879 Paris» |
| 1971–1973 | p.147 (before the Livre 87 title) | «Dessin, 3 octobre 1877 / peinture 30 septembe 1878 / médaille 14 janvier 1879 / prédiction d'Edmond, L. 75, p. 6 / Je m'attendais à faire en ce monde tout autre chose que ce j'y fais. Et du moment que ce n'est pas ce que je pensais peu m'importe…» — Livre 87's title page (worker D's carnet); removed from plan-086. |

## Drawings

None. Candidates checked: p.69 (¶975: page-break slot on the title page), p.96 (¶1318: page break inside «Erard... errare /
humanum est.»). `drawings-086.json` is empty.

## Owner questions

1. Accent restoration in 31 old clusters (source changes that reset approvals in ~10 otherwise untouched entries): keep?
2. (settled by the policy update: «décembe» corrected with an RSR note.)
3. The title-page sentence «Je m'attendais à faire dans ce monde…» (¶965, and again before Livre 87 ¶1973) is withdrawn with
   the title pages; the same sentence stays in the 16 Aug entry. OK?

## Post-apply

- Translations: heading clusters 0211, 0268, 0486, 0513, 0520 got new embedded French; the old translated headings in them
  must be checked (0211 now only 5 Sep; 4 Sep is its own entry with `# TODO`).
- Glossary tagging for the 242 new paragraphs.

## Lead review (resumed session, 2026-09-28)

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_086.py`)

- 086.0119: «[rarement Princesse]» → «[Mots noircis: rarement Princesse]» (¶1118; print «norcis», typo noted).
- new ¶1317 + new ¶1319 joined: «…sur son piano *Erard... errare humanum est.*» (page break, glued page number «96» removed).
- Page-break half joined: new ¶1529 «Moi, [Mots noircis: je me tenais]… avec une» prefixed to 086.0375 «indifférence tranquille…» (dropped as a paragraph).

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.
«Dessin 3 octobre 1879» is kept as printed (scan checked, p.69); the other title pages read 1877.

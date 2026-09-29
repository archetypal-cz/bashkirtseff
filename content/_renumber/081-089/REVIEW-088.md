# 088 (Livre 88, 24 Apr – 19 Jun 1880): final plan review — worker D, 2026-09-28

Plan: `final/plan-088.json`, built by `tools/fix_088.py` from the identity plan (the draft had merged 06-01 into
05-31 and 06-11 into 06-10 over OCR'd date lines «Mardi 1er juinl 880», «Vendredi î 1 juin», and wrongly moved
0433 from 30 May into 26 May — docx ¶3645 is 30 May; ¶3544 «qu'est-ce que vous venez faire ici ?» is a different line).

**Verdict: rebuild.** 870 old carried, 2 new, 0 dropped, 1 set_french, 57 entries, 872 paragraphs; IDs from 0284
shift by +2 (587 IDs change); flags reset in 1 entry per tree (1880-05-22).

## Split of 0283 (the only structural change)
0283 held the end of Marie's letter to her mother and the diary text after it (print p.252–253: the letter is set in
small inset type ending «…ceux qui me tourmentent.”», then the diary resumes at full measure).
- 0283 → `set_french` «> Ne pleurnichez pas … qui me tourmentent.”», kind letter.
- new «Au lieu de pleurer allons dormir. … il n'y croira pas.» (¶3455, p.252).
- new «J'étais couchée … Mais prisonnière forcée !!! Ce sera donc toujours comme cela !» (¶3458, p.253; OCR «II!» →
  «!!!» — the old LAN note on 0283 called «II!» Marie's emphatic punctuation; it is the usual OCR of «!!!»).

## Kinds (7 old)
| IDs | kind | source |
|---|---|---|
| 0281–0283 | letter | Lettre de Marie Bashkirtseff à sa mère, 22 mai 1880 |
| 0326–0327 | letter | Lettre de Marie Bashkirtseff à sa mère, 24 mai 1880 («A maman: …») |
| 0054–0055 | other | annotation marginale de Mme Bashkirtseff mère («[Dans la marge: Annotation de Mme Bashkirtseff / Ce n'est pas vrai…]») |

Rejected guesses: 0039 0395 0403 0837 (sentences starting «Madame X/Ma petite…»), 0012 (inset because it opens with an
«[En travers: …]» note, then the aunt's words: stays inline).

## New text in the draft, all rejected
¶3347, ¶3981, ¶3982 (duplicates of 0196, 0720, 0721), ¶3654, ¶3952 (OCR'd date lines, duplicates of the 0442 and
0697 headings), ¶4163–4167 (Livre 89 title page, withdrawn — see REVIEW-089). 088 has no missing diary text.

## Withdrawn cover pages
- tome13.docx ¶3083–3088, Mon Journal t.13 p.225: «Dessin 3 octobre 1877 / Peinture 30 septembre 1878 / Médaille
  14 janvier 1879 / Prédiction d'Edmond L.75, p. 6 / Je m'attendais à faire en ce monde tout autre chose que ce j'y
  fais. Et du moment que ce n'est pas ce que je pensais peu m'importe ce que cela peut bien être. / page 86 faire un livre».
- ¶3089–3091, p.225: «Gloriae Cupiditas / Livre 88 / commencé le samedi 24 avril 1880 / terminé le samdi 19 juin 1880 /
  34, avenue Montaigne, Paris» («samdi» as printed).

## Dialogue dashes
248 docx dialogue paragraphs, 238 `_original` lines without the dash (not changed; see REVIEW-087 question 3).

## Drawings
None.

## Policy update (2026-09-28): printer's typos
None in the plan's new/set_french text (0283 «tout espèce» is Marie's grammar and stays). «samdi» is in the withdrawn
title page only. Facsimiles: none in Livre 88. Dry run re-checked against HEAD ec6fa6163: PASS.

## Lead review (resumed session, 2026-09-28)

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_088.py`)

- 088.0091: printer's typo «Bashkitseff» → «Bashkirtseff» (old cluster, `set_french` + RSR).

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.

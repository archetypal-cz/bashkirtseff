# 087 (Livre 87, 22 Dec 1879 – 23 Apr 1880): final plan review — worker D, 2026-09-28

Plan: `final/plan-087.json`, built by `tools/fix_087.py` from the **identity plan** (not from `common/`).
Why: wherever the docx date line is OCR-garbled («March 1 7 février» = Mardi, «Dimanche Î1 avril», «Dimancher»),
the drafter missed the date and merged the whole day into the previous one (5 entries lost: 02-01, 02-17, 03-16,
04-06, 04-11). The `_original` day layout already matches the docx; nothing is misfiled.

**Verdict: rebuild with kind markers only — ID-preserving.** 895 old carried, 0 new, 0 dropped, 1 set_french (typo, lead review),
124 entries, 0 IDs change, 0 approval resets (dry run: 40 file operations, 8 entries touched by markers).

## Kinds (11)
| IDs | kind | source |
|---|---|---|
| 0104–0106 | letter | Lettre de Marie Bashkirtseff à Alexandrine Pachtenko, 31 décembre 1879 (already `> `-quoted) |
| 0144 0174 0454 0507 0551 | rayé | «[Une ligne (et demie) barrée/cancellée]» |
| 0217–0218 | margin | «[En travers: Chaque objet est accompagné…]» (two clusters, one note) |
| 0306 | margin | «[En travers: Plonplon ne veut pas…]» |

Rejected draft guesses: 0096 «Monsieur, j'ai été victime d'une odieuse mystification etc.» (what should have been
said, not a copied letter), 0232 «Ma chère enfant…» (Gavini's spoken words), 0111 0123 0151 0611 (sentences
starting with «Monsieur/Madame X»). Inline «[Mots noircis…]», «[manque]», «[Rayé: …]» stay inline.

## New text in the draft, all rejected
- ¶2458, ¶2592, ¶2734, ¶2944, ¶2989: the OCR'd date lines, duplicates of the headings in 0393 0499 0618 0788 0825.
- ¶2780 «- Qu'est-ce que ça vous fait ?»: duplicate of 0657 (far-match artefact).
- ¶3025 second «Mercredi 14 avril 1880»: the print (p.219, top) repeats the date line with no text, directly
  followed by «Jeudi 15 avril 1880». Not given an «[Aucun texte…]» paragraph (the day has text). **Owner question 1.**
- ¶3083–3088: title page of Livre 88 → withdrawn (see REVIEW-088).
Source completeness: the only «missing» text (¶3071–3086) is that title page; 087 has no missing diary text.

## Post-apply (`tools/post_apply_d.py REPO`, exact-line edits, no resets)
The extraction kept four headings twice (correct + OCR copy): 0393 «# Dimancher 1er février 1880», 0499/0618/0788
«# March …». The script deletes the garbled line in `_original` and every embedded copy, deletes uk's translated
twins («# March 17 лютого 1880», «# Неділяа…»), and in fr replaces the visible garbled heading by the correct one.
Stale notes to update afterwards: `_original` 0393 LAN «TRAP: BY-DESIGN duplicate/garbled date-header» and the uk TR
notes on 0393/0499/0618/0788 («відтворюю ОБИДВА заголовки»). The print itself reads «Dimancher 1er février 1880»
(printer's typo, p.179): the heading is given as «Dimanche». **Owner question 2.**

## Dialogue dashes (not changed)
137 docx paragraphs in 087 carry list numbering «-» (dialogue); 136 of the matching `_original` lines lack the dash.
Not `set_french`'d (convention). **Owner question 3** (all three carnets: 087 136, 088 238, 089 34 lines).

## Withdrawn cover pages
- tome13.docx ¶1971–1973, Mon Journal t.13 p.147 (index lines before the Livre 87 title; they sit in 086's docx
  range, worker C may list them too): «Dessin, 3 octobre 1877 peinture 30 septembe 1878 médaille 14 janvier 1879» /
  «prédiction d'Edmond, L. 75, p. 6» / «Je m'attendais à faire en ce monde tout autre chose que ce j'y fais. Et du
  moment que ce n'est pas ce que je pensais peu m'importe ce que cela peut bien être.» (the same motto recurs on the
  Livre 88 title page, so it is title-page material, not a diary note).
- ¶1974–1976, p.147: «Gloriae Cupiditas / Livre 87 / comencé le lundi 22 décembre 1879 / terminé le vendredi
  23 avril 1880 / 34, avenue Montaigne Paris».

## Drawings
None (no picture slot or figure candidate between ¶1974 and ¶3088).

## Policy update (2026-09-28): printer's typos
- Fixed: «Dimancher» → «Dimanche» (heading of 0393, Mon Journal t.13 p.179, ¶2458). `post_apply_d.py` removes the
  garbled line and adds to `_original` 087.0393 the RSR note «Printer's typo corrected: «Dimancher» → «Dimanche»
  (Mon Journal t.13 p.179, tome13.docx ¶2458); the duplicate garbled heading line from the extraction was removed».
- «March» (×3) is the OCR of «Mardi», not a printer's typo (the print reads «Mardi», pp.189, 197, 212): no note.
- No other new or set_french text in 087. Facsimiles: none in Livre 87.

## Lead review (resumed session, 2026-09-28)

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_087.py`)

- 087.0599: printer's typo «deséspère» → «désespère» (old cluster, `set_french` + RSR). This makes the 1880-03-12 entry lose its approval flags (1 entry per tree); the plan is otherwise still ID-preserving.

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.
Printer's typo corrected in the restored note: «septembe» → «septembre» (Mon Journal t.13 p.147).

# Carnet 083 rebuild plan — review (worker B, 2026-09-28)

Plan: `final/plan-083.json`, built by `tools/fix_083.py` (+ `tools/fixlib_b.py`, `tools/edits_083.py`,
`tools/restore_b.py`, `tools/anchor_b.py`) from `common/plan-083.json`. Source: tome12.docx ¶1578–2177
(Livre 83, printed pp.141–195). Checks: `tools/check_b.py` (duplicate text / uncovered docx ¶),
`tools/audit_b.py` (plan order vs docx), `tools/dates_b.py` (date lines vs entries), `tools/labelcheck_b.py`.

## Numbers
- 581 paragraphs in 86 entries: 369 old carried, 212 new (48,298 chars), 17 dropped; 129 `set_french`.
- Entries: 1878-10-17 … 1879-01-10, one per manuscript date line; 1 added (1878-10-19), none removed.
- Dry run (`just rebuild-carnets` 081 082* 083 084, *082 = common plan minus 083.0002–0003): not rejected;
  flags reset in 68 entries per tree; ~30 «old embedded French not found — new copy inserted» warnings per
  tree (heading clusters whose embedded copy differs), accepted.
- Completeness: every docx ¶ in 1578–2177 is covered except the withdrawn title/index pages and the
  print's footnote lines. No duplicated text between paragraphs except the print's own repetition
  (0368 / 0373: «je ne suis pas capable de me faire…», printed twice, p.191).

## What the rebuild does
- **Cut-short clusters completed (100, tiler):** _original kept only the first sentence(s) of most docx
  paragraphs from 31 Oct 1878 on. Each old cluster keeps its text and gets the missing docx text appended
  (a prefix where the old text started mid-paragraph). 16 draft `new` paragraphs that duplicated a partly
  covered ¶ were removed. Checked by hand: 0086–0114, 0106, 0125, 0151, 0197, 0213, 0303, 0374, and the
  full-carnet duplicate / coverage scans. Fixes to the tiler's output: 0109 (tail belongs to 0110),
  0271 / 0277 / 0346 (the old neighbour already held the sentence), 0167 / 0173 (0173 is ¶1803 «Le Vide et
  la Désolation.», 0167 gets «Ceux qui l'on senti me comprennent.»), 0334 (= ¶2072; ¶2073 stays new),
  0368 (= ¶2133–2135, «Giovani VIII» as printed p.191), 0383 (¶2156–2158 incl. «Effet raté.»).
- **Words _original dropped inside clusters restored (10, `restore_b`):** «[Rayé: si ce silence était]»
  0036, «[Rayé: de cocotte ou]» 0044, «[Mot cancellé]» 0080, «[sic]» 0081, «(Je tiens cela de Gavini et de
  Rouher lui-même).» 0124, «[Barré: mépris]» 0233, «[Mots noircis: qui sera devenue]» 0358, tails of 0375 and
  0381, «Je vous la ferai comprendre d'un mot.» 0279; by hand 0257 and 0373 (the «En rentrant seule…» passage).
- **Order:** paragraphs sorted within each day by docx position (5 days); 0197 (¶1831) moved 24 → 23 Nov;
  0038–0046 now under 25 Oct, 0037 heads 26 Oct (as in the docx).
- **17–19 Oct (p.141):** «Jeudi 17 octobre 1878 / Vendredi 18 octobre 1878 / samedi 19 octobre 1878» then
  the text: 0001 and 0007 become «[Aucun texte - date seule mentionnée]» days, new entry 1878-10-19 (heading
  «samedi 19 octobre 1878», lower case as printed) takes 0008–0010.
- **Bare date lines (13 days):** heading-only clusters get «[Aucun texte - date seule mentionnée]» (7, 11,
  14, 15, 19 Nov; 2, 9, 13, 18, 20 Dec; 3 and 7 Jan). 0360 (3 Jan) was a verbatim duplicate of 0362 (4 Jan,
  ¶2127): it becomes the 3 Jan placeholder (its translations get SOURCE CHANGED).
- **Dialogue:** 12 Nov ¶1757–1765 kept one new paragraph with one line per speaker («- …», docx list numbering).
- **Dropped:** 083.0002–0006 (title page, withdrawn; 0002–0003 sit in the draft plan-082 and are dropped here
  — worker A removes them there) and 12 empty placeholder clusters (drafter).

## Kinds
| Where | Para | kind | source |
|---|---|---|---|
| 3 Nov | new ¶1686 | rayé | «[Deux lignes cancellées]» |
| 6 Nov | new ¶1713 «[Quatre lignes cancellées] :» | rayé | |
| 6 Nov | old 0119 «[En travers: A travers l'aplomb…]» (closing bracket restored) | margin | |
| 8 Nov | new ¶1725 «[En travers: Les bonapartistes…]» | margin | |
| 24 Nov | new ¶1839 | rayé | |
| 27 Nov | new ¶1860 «[BAS DE PAGE BLANC]» | editorial | |
| 4 Dec | new ¶1931 | rayé | |
| 21 Dec | new ¶1992–1993 «[ Cancellé: …]» | rayé | |
| 21 Dec | new ¶1998 «[Quatorze lignes cancellées: …]» | rayé | |
| 21 Dec | new ¶2001 «[En travers: …]» | margin | |
| 22 Dec | new ¶2007 | rayé | |
| 31 Dec | new ¶2100 | clipping | Le Figaro, 28 décembre 1878, Gazette des tribunaux (texte donné d'après Le Roy 1999, p. 581); tag LE_FIGARO |

- ¶2100 is **not** the edition's footnote: it is printed inset after «D'ailleurs voici le compte-rendu.»
  (p.188) with a footnote marker whose footnote is «Ibid. p. 581» (Le Roy's edition). The print's footnote
  line ¶2104 stays out. The inset's lead-in («Le Figaro du samedi 28 décembre 1878… donne copie du jugement…»)
  is kept as printed.
- Letter guess on 0008 («Madame Gavini est à Paris…») removed. No letters in 083 (the drafter's list had none).

## OCR fixed to the printed reading
«c'est} étonnant» → «c'est] étonnant» (¶1757, p.157); «{.Deux lignes noircies: *Çes femmes… abruties!*» →
«[Deux lignes noircies: *Ces femmes sont littéralement abruties*]» (0171, p.161); «II m'en» → «Il m'en»
(0172); «remords II Ils» → «remords !! Ils» (¶1901); «II arrive», «Enfin II» → «Il» (¶2101); «mjs» → «mis»
(0328); «repri- pses» → «reprises» (¶1992); «Is lettres» → «les lettres» (¶2032); «à la paix» (¶2100, print
«àla»). Kept as printed: «pourqoi», «Vantadour», «Giovani» (possibly Marie's own; «muisque» is now corrected, see
below), the garbled
«j'ai pleuré au Voir p. 155 à voiture» (0368; the print has it so, p.191).

## Withdrawn cover pages
- Livre 83 title page, tome12.docx ¶1578–1582, Mon Journal t.12 p.141: «Gloriae Cupiditas / Livre 83ème /
  commencé le jeudi 17 octobre 1878 terminé le vendredi 10 janvier 1879 / Avenue de l'Alma 67, Paris /
  Champs Elysées 71, depuis le 5 janvier 1879» (old 083.0002–0006, dropped).
- Marie's index page between Livre 83 and Livre 84, ¶2171–2177, p.195 (small print): «1879 / Commencé
  dessiner 4 octobre Rosalie ? / commencé peinture lundi 30 septembre 1878 / reçu médaille mardi 14 janvier
  1879 / Mardi, Jeudi 27 juin 1878 / Dimanche 27 janvier 1878 / les cinq femmes. / Livre 77, page 177 passage
  sur les amants qui me fait honneur. / arrangement tranquille livre 83, p. 140 / un chapeau noir comme celui de
  Soden.» (the draft had made a «1878-01-27» entry of the last two lines: removed).

## Drawings
None: tome 12 has no figure candidates (`tome12.figures`), no picture slots in ¶1578–2177; «je fis son image
dans un petit album à croquis» (¶1721) is only a mention. `drawings-083.json` = [].

## Post-apply (after --write)
- RSR note on completed/corrected old clusters: `_tiler` / `_tiler_para` (100) and `_restored` (10) carry the
  docx ¶; «Completed from tome12.docx ¶N, Mon Journal t.12 p.X (2026-09-28 rebuild)» would be the note.
- Translations: 129 SOURCE CHANGED clusters; 0360 (now a placeholder) and 0173 (text changed back to ¶1803)
  need their translated text replaced, not extended.
- Glossary tags for the 212 new paragraphs (glossary-tagger).

## Owner questions
1. ¶2100: include the Figaro judgment (from Le Roy's edition, printed inset) as a clipping? (done; the
   lead's brief called it a footnote — the scan shows otherwise).
2. 0360: reuse the duplicate as the 3 Jan placeholder (done) or drop it?
3. Old headings keep their comma form («# Jeudi, 7 novembre 1878»); only headings touched by the plan use the
   printed form. Normalise all?

## Lead review (resumed session, 2026-09-28)

### Printer's typos corrected (owner policy 2026-09-28)

Each one is noted in the paragraph's RSR (`rsr` of a new paragraph, `_rsr` → RSR comment on an old one). Marie's own spellings and «[sic]» cases stay.

- NEW ¶1668: Printer's typo corrected: «ds» → «des» (Mon Journal t.12 p.147).
- NEW ¶1676: Printer's typo corrected: «désse» → «déesse» (Mon Journal t.12 p.148).
- NEW ¶1681: Printer's typo corrected: «muisque» → «musique» (Mon Journal t.12 p.149).
- 083.0125: Printer's typo corrected: «supérieuee» → «supérieure» (Mon Journal t.12 p.153); «surla» → «sur la» (Mon Journal t.12 p.153).
- NEW ¶1790: Printer's typo corrected: «regette» → «regrette» (Mon Journal t.12 p.160).
- NEW ¶1823: Printer's typo corrected: «chanoi- nesse» → «chanoinesse» (Mon Journal t.12 p.163).
- NEW ¶1840: Printer's typo corrected: «plusieus» → «plusieurs» (Mon Journal t.12 p.164).
- NEW ¶1898: Printer's typo corrected: «mangifique» → «magnifique» (Mon Journal t.12 p.170).
- NEW ¶1901: Printer's typo corrected: «accepe» → «accepte» (Mon Journal t.12 p.170).
- 083.0278: Printer's typo corrected: «soufffre» → «souffre» (Mon Journal t.12 p.175).
- 083.0312: Printer's typo corrected: «ds» → «des» (Mon Journal t.12 p.178).
- NEW ¶2029: Printer's typo corrected: «gand» → «grand» (Mon Journal t.12 p.179).
- NEW ¶2053: Printer's typo corrected: «éœurantes» → «écœurantes» (Mon Journal t.12 p.182).
- 083.0328: Printer's typo corrected: «enregister» → «enregistrer» (Mon Journal t.12 p.183).
- 083.0335: Printer's typo corrected: «bleux» → «bleus» (Mon Journal t.12 p.185).

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_083.py`)

- new ¶1864–1865: glued page number «166» removed («un bon moment»).
- new ¶1732: OCR «(est-ce drôle 1)» → «(est-ce drôle !)».
- Page-break halves joined: new ¶1705 «former.» appended to 083.0114 (dropped as a paragraph); new ¶2142 «Mais est-il vraiment possible… il faut dire» prefixed to 083.0374 «misère et corde…» (dropped as a paragraph).
- post_apply: clusters with both a tiler completion and a typo note now get both in their RSR (the typo `_rsr` had replaced the completion note).

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

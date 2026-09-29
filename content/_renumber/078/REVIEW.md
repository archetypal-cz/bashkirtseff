# Tome 11 rebuild plan (carnets 075–080): review (2026-09-28)

These plans are built from the drafter's output (`../draft11/`, run through `../draftwrap.py`, because the stock `livre_number` misses «Gloriae…\nLivre 75ème»). `build11.py` applies every judgement below to the draft. It is reproducible, so run `python3 build11.py`; every edit carries its reason in the code. `build.log` lists the new-text rows not inserted, the withdrawn covers and the heading removals.

- **Source:** `content/_raw/tome11.docx` and `content/_raw/scans/Tome11.pdf`. Printed page = PDF page − 1; checked on PDF 52 (p.51), 151 (p.150) and 190 (p.189).
- **Run:** one multi-carnet run, `just rebuild-carnets plan-075.json … plan-080.json`. 077 and 078 exchange paragraphs, and so do 079 and 080.
- **Validated at `ba398e4b7`** in a throwaway worktree: `--write`, then `postfix_headings_t11.py`, then the gates (see the end).

## Revision 2 (2026-09-28 evening): headings via set_french (rebuild-carnet ≥ d08a2fb03)

- Every `set_french` now holds the paragraph's whole French, with exactly the `#` lines to keep. The last pass in `build11.py` normalises this and writes `headfix` to `headmoves.json`. There are 30 heading changes:
  - 22 date headings removed, because their day's text is elsewhere;
  - 6 `######` pseudo-headings: 5 become plain text lines (078.0360 becomes a quoted clipping line), and 077.0005 becomes «# Dimanche 23 décembre 1877»;
  - 077.0017 → «- Noël»;
  - 080.0185 «# Samedi 18 mai» → «# Vendredi 17 mai» (its paragraph opens 17 May).
  - 078.0255 and 079.0519 keep their headings, which are no longer doubled.
- `postfix_headings_t11.py` no longer touches `_original` (that part is behind `--legacy-headfix`). It still moves the translated headings and adds the «# TODO» scaffold for 17 May.
- New check `checkheads_t11.py <root>` covers the rebuilt `_original`:
  - no duplicated line in a cluster;
  - no `######` line;
  - no heading outside an entry's first paragraph;
  - every entry's first paragraph opens with exactly one heading for the file's date;
  - every headfix applied.
  In cz and en it flags ≠1 heading per entry; in uk it flags more than 1, because uk writes plain date lines.
- Prerequisite, mechanical, 4 trees (cz has no such note): `../prereq11.py` removes the obsolete sentence «NOTE: Paragraph numbering anomaly … continuing from 078.1741 …» from the RSR note in 078/1878-02-10.md and keeps the rest of the note (the summary). renumber-check reads «078.1741» as an ID.

## Totals

| Carnet | Entries | Old carried | Moved in | New (of which «Aucun texte») | Dropped | drop_files | set_french | Kinds |
|---|---|---|---|---|---|---|---|---|
| 075 | 36 | 533 | 0 | 55 (0) | 3 | 0 | 2 | letter 25, margin 5, rayé 1 |
| 076 | 52 | 431 | 0 | 46 (0) | 53 | 0 | 2 | letter 15, margin 2, rayé 2 |
| 077 | 43 | 561 | 0 (42 out → 078) | 14 (2) | 56 | 2 | 58 | letter 121, margin 2, rayé 3, other 1 |
| 078 | 41 | 527 | 42 (from 077) | 1 (1) | 50 | 1 | 25 | letter 47, clipping 27, margin 3, rayé 5, editorial 1 |
| 079 | 48 | 612 | 5 (from 080) | 63 (4) | 45 | 2 | 43 | letter 54, clipping 26, margin 12, rayé 4 |
| 080 | 49 | 754 | 0 (5 out → 079) | 5 (2) | 53 | 2 | 24 | letter 58, other 6, margin 7, clipping 3, editorial 1 |

New paragraph counts after renumbering:

| Carnet | Paragraphs | Range |
|---|---|---|
| 075 | 588 | 0001–0588 |
| 076 | 477 | 0001–0477 |
| 077 | 575 | 0001–0575 |
| 078 | 570 | 0001–0570 |
| 079 | 680 | 0001–0680 |
| 080 | 759 | 0001–0759 |

## Drops

- **Empty placeholder clusters: 224.** 075 has 3, 076 has 52, 077 41, 078 40, 079 42 and 080 46. Each sits at the end of an entry. I re-checked every one: the cluster is empty in `_original` and in cz, uk, en and fr. There is no es for these carnets.
- **Printed-edition footnotes: 22 paragraphs.** These are the transcription's source citations («Ibid. p. N», «Journal – Edition intégrale … L'Age d'Homme, p. 137», «Lettres de Marie Bashkirtseff, Fasquelle 1892»). None of them is in the manuscript.
  - 076.0406
  - 077.0084 0169 0191 0240 0288 0332 0464
  - 078.0202 0248 0262 0275 0350 0388 0447 0561
  - 079.0130 0341 0443
  - 080.0765 0800
  - 077.0001, which also carried the duplicate heading of 077.0005.
- **Footnote marks inside kept paragraphs are removed with `set_french`.** These are the `^N^` superscripts and the OCR marks `'`, `*` and `•` of the same footnotes, in 21 letter or article openings.
- **Cover and title pages: 14 paragraphs** (see «Withdrawn cover pages» below):
  - 077.0002 0003 0004 0613 0614 0615 0616
  - 078.0575 0576
  - 080.0006–0010
- **New docx rows not inserted** (full list in `build.log`):
  - Printed footnotes: ¶151, 835, 1424, 1508, 3929, 4046, 4317.
  - The OCR «O» at ¶169.
  - Page-break continuations already in an old paragraph: ¶233 and ¶1312.
  - The date lines the draft missed: ¶1217 «Vendredi) 7 décembre» and ¶2248 «Diamnche 10 février». Their entries are restored.
  - «- Noël» ¶1436, which is now part of the heading.
  - Duplicates of old paragraphs: ¶1411, 1706, 1708, 2585 and 2611 (the old «###### » lines) and ¶1955 and ¶4398.

## Withdrawn cover pages (owner policy: no cover entries)

- **075**, ¶53–56, p.4: «Gloriae [Rayé: Cupididate] Cupiditas / Livre 75ème / commencé le mercredi 26 septembre 1877 / terminé le mercredi 31 octobre 1877 / Grand Hôtel, Paris / Champs Elysées 71, depuis le mardi 2 octobre». This page was never in `_original`.
- **076**, ¶768–770: «Gloriae Cupiditate / Livre 76ème / commencé le jeudi 1er novembre 1877 / terminé le samedi 22 décembre 1877 / Paris, Champs Elysées 71, entresol». Never in `_original`.
- **077**, ¶1407–1409: «Gloriae Cupiditas / Livre 77ème / commencé le dimanche 23 décembre 1877 / terminé le dimanche 3 février 1878 / Paris, Champs Elysées 71 avenue de l'Alma 67». Withdrawn: old 077.0002–0004. The footnote on «Gloriae Cupiditas» in the cz tree goes with 077.0002.
- **078**, ¶2129–2132: «Gloriae Cupiditas / Livre 78ème / commencé le dimanche 3 février 1878 / terminé samedi 16 mars 1878 / Paris, avenue de l'Alma 67» and the BN note «Annotation de la B.N. les pages 63 à 68 ont été enlevées. Déficit constaté le 13 avril 1938». Withdrawn: old 077.0613–0616. The gap stays marked in the diary by the editorial note 078.0283 «[MANQUE DE LA PAGE 63 A 68 (signalé par la BN au début du cahier)]».
- **079**, ¶2834–2835: «Gloriae Cupiditas / Livre 79ème / commencé le dimanche 17 mars 1878 / terminé le vendredi 3 mai 1878 / avenue de l'Alma 67, Paris». Withdrawn: old 078.0575–0576.
- **080**, ¶3688–3692: «Gloriae Cupididas / Livre 80ème / commencé le samedi 4 mai 1878 / terminé le samedi 22 juin 1878 / Paris, avenue de l'Alma 67 / Annotation : / Femme nue, tête dans l'ombre cela en lumière pour Florence, loin d'une école de garçons vue de la mer, le pont.». Withdrawn: old 080.0006–0010. **Owner question 1.**

## Structure decisions

- **Spurious cross-carnet moves rejected.** The draft pulled 076.0146, 077.0460, 077.0498 and 077.0501 into 075 on one-line short matches («C'est si amusant.», «Oui.», «Je me mis à rire.»).
  - All four stay home, at their docx lines ¶976, ¶1953, ¶1996 and ¶1999.
  - 075 gets its own lines ¶405, ¶717, ¶718 and ¶735 as new paragraphs.
- **077 → 078, 42 paragraphs (077.0617–0658).** The rest of «Dimanche 3 février 1878 - suite» is written after the Livre 78 title (¶2133 ff.). 078 therefore starts with a `1878-02-03.md` entry whose heading is «Dimanche 3 février 1878 - suite».
- **080 → 079, 5 paragraphs (080.0001–0005).** They sit under «Vendredi 3 mai 1878», before the Livre 80 title (¶3681–3685). 080.0001 loses its «# Samedi 4 mai 1878», and 080 opens at ¶3694.
- **Day moves.** 21 old paragraphs carried the next day's heading while their text belongs to the previous day in the manuscript. The draft moved them, and in every case the date line comes after the paragraph in the docx (checked). The generic pass in `build11.py` strips these headings. The same is true of the 1877-12-23-style headings in 077/078/079/080 from the heading-date sweep.
- **Two date lines the draft missed.** They restore the entries 076/1877-12-07 and 078/1878-02-10.
- **078/1878-02-24 disappears.** The manuscript has no «Dimanche 24 février 1878»: printed pp.149–150 run from «Samedi 23 février 1878» through the missing pages 63–68 to «Lundi 25 février». 078.0280 loses the heading, its paragraphs join 23 Feb, and the old URL redirects to 1878-02-23 (automatic). **Owner question 2.**
- **Marie's letter «[Samedi 23 février 1878]» (078.0268–0273) now sits under 22 Feb.** That is where the notebook has it, before the 23 Feb date line. Its heading is removed.
- **Also out of place:**
  - 079.0219 «Les quatre voyageuses…»: a 1 April telegram that carried «# Mardi 2 avril».
  - The Talandier clipping 078.0374: «# Lundi 4 mars» sat in the middle of it.
  - The Haussmann signature 080.0554: carried «# Dimanche 9 juin».
- **Headings restored in full:**
  - «Mardi 25 décembre 1877 - Noël» (077)
  - «Dimanche 21 avril 1878 - Pâques» (079)
  - «Dimanche 3 février 1878 - suite» (078)
- **079, 19–23 April (the 11% gap).**
  - ¶3436–3518 is restored as 58 new paragraphs in the entries 19, 20, 21, 22 and 23 April.
  - The old 079.0520–0529 (docx ¶3519 ff.) belong to 23 April, not 19 April. The extraction had glued 23 April's tail onto 19 April.
  - **079.0519** held a paragraph that is found nowhere: not in the docx, not in the raw carnet, not in the 1887 edition («Nous allons à l'église où je pèche beaucoup en priant. C'est le vendredi saint des catholiques et n'ayant pas pu aller aux Carmes … leitmotiv.»). The RSR note of 2026-02-10 already removed two fabricated paragraphs next to it. It takes the manuscript's text ¶3436 through `set_french`, and the tool flags SOURCE CHANGED in every tree. A check of all 3,500 old paragraphs of 075–080 against the docx (3-grams) found no other paragraph like it.
- **Completions and joins:**
  - 076.0418 is completed across the page break (¶1309 + ¶1312).
  - The new ¶1423 + ¶1427 are joined (one sentence).
  - The new ¶406 and ¶407 are split again: they are two paragraphs.
- **Scan-only text.** The end of Gordigiani's letter (¶834: «… Je vous prie de / me rappeler au bon souvenir … considération.», «Votre dévoué,», «Michel Gordigiani») is printed at the top of p.51. It is missing from the docx because a library stamp (Augsburg) on the scan was read as a picture (¶838). I transcribed it from the scan. The figure detector found no other picture region in the tome (PDF 1 and 314 are covers, and PDF 173 is a black blank page).
- **ID-less stubs dropped (`drop_files`), 7:** 077/1878-01-19 and 01-26, 078/1878-02-25, 079/1878-03-28 and 04-27, 080/1878-05-17 and 05-22. These are heading-only files. They become new entries of the same name with «[Aucun texte - date seule mentionnée]», following the 066/067 precedent, plus 079/04-02, 079/04-30 and 080/06-18.
- **Left as they are (not missing text):**
  - Old paragraphs split mid-sentence at page breaks: about 110 pairs, for example 077.0463/0465 and 078.0027/0028. Merging them would drop translated IDs.
  - OCR slips in old text: «. géme ?» (3ème/6ème, 076), «Oh I», «II!!!!!!» (078.0295), «Luricie». Fixing them would add SOURCE CHANGED notes; list them for an RSR pass.
  - One doubtful form in new text: 079 ¶3479 «comment pouvez-vous- ne pas y croire».

## Kinds

- **Letters (quoted with `> ` via `set_french` when not already quoted), sources as in the plans:**
  - Cassagnac letters and notes: 075, 077 (×6), 079 (×2)
  - Marie's letters and notes to Cassagnac, including drafts and anonymous ones («cinq femmes», «Suzanne au masque», «Bureau Taitbout XXX», the card of pasted book letters): 075, 077 (×9), 078 (×2), 079 (×2), 080 (×9)
  - Marcuard letters and telegrams, both ways: 075, 076, 077 (×6), 078 (×6), 079 (×4)
  - Gordigiani (076), Multedo (079 ×2, 080), Valon and Haussmann (080), Jeanne Suermondt (080)
  - The telegram to the Swiss girls (077) and the 1 April hoax telegrams (079 ×4)
- **Clippings:**
  - 078.0353–0380: «Pourquoi M. de Cassagnac avait demandé le huis clos», with Cassagnac's letter to Périvier and the Talandier case. The source is given as «Le Figaro ?», an inference from Périvier.
  - 079.0139–0141: «Le Pays», unsigned lines.
  - 079 ¶3200 (new, split off 079.0317) and 079.0318–0339: Cassagnac's article in «Le Pays».
  - 080.0484–0486: the «Figaro» note.
- **other:**
  - 080.0307–0312: Marie's copy of a passage from Daudet's «Le Nabab».
  - 077.0370: «[Annotation : …]» on a letter copy.
- **margin:**
  - All whole-paragraph «[En travers : …]» notes, old and new.
  - 079.0491 «[Bas de page : …]».
  - The label of 079.0225 is fixed to «[En travers : J'oublie», as printed on p.189.
  - 075.0081 «[En travers ;», 078.0212 without its opening bracket and 080.0585 «{En travers» are kept as printed (pp.12, 145, 277).
- **editorial:** 078.0283 [MANQUE DE LA PAGE 63 A 68 …] and 080.0066 [BAS DE PAGE BLANC].
- **rayé:** as drafted, plus 079.0153.
- **The draft's letter guesses were removed** where only «Monsieur/Madame» opened a sentence: 075.0293 and 0377; 076.0098, 0437 and 0439; 077.0105; 078.0023, 0027 and 0037; 079.0293 and 0299; 080.0044, 0360, 0648 and 0665; new ¶3469 and ¶3481.
- **Its clipping guesses on docx style «Body text (2)»** turned out to be letters or margins. In this edition that style means small print: margin notes and quoted matter.

## Drawings

None. Marie made no drawing in Livres 75–80:

- `just scan-figures 11` finds only the covers and the stamp region on PDF 52.
- The raw extraction's images are the covers and that stamp.
- No docx picture slot hides one (¶1348, 1526, 2153, 2735 and 2776 are page-break slots, checked).

`drawings.json` is therefore `[]`.

## Translation follow-up: `postfix_headings_t11.py` (run once, right after `--write`)

- It moves each translated day heading out of the paragraph that lost its French heading to the entry of that day, replacing the scaffold «# TODO». The uk tree often writes the heading inline («Понеділок, 4 лютого 1878. Ми…»), so the script splits it off first.
- It deletes the translated «Dimanche 24 février» headings (cz, uk, en).
- It turns former «###### » pseudo-headings into plain lines.
- It promotes the translated «3 février - suite» line to the heading.
- It removes the stale embedded heading comments, and the ED SOURCE CHANGED note where losing the heading was the only change (20 of 28).
- In the test it made 73 moves or edits. Afterwards the only «# TODO» headings left are the 12 new entries per tree (empty days and 20–23 April).

## Owner questions

All answered by the owner (2026-09-28) and applied:

1. The Livre 80 title-page «Annotation : Femme nue, tête dans l'ombre…» is kept as a **margin** paragraph (old 080.0009+0010 joined) at the start of 4 May, with an RSR note added by `postfix_headings_t11.py`; the rest of the title page stays withdrawn.
2. No «Dimanche 24 février 1878»: everything goes under 23 Feb (agreed).
3. 079.0519 is replaced by the manuscript text (agreed).
4. The printed edition's obvious typesetting typos are corrected, with an RSR note citing the page (see «Source corrections in old text»).

## Source corrections in old text (apply session, 2026-09-28)

Owner decision 4 also covers the old paragraphs. `build11.py` (last section) corrects them through `set_french`, and `../rsrpost.py` adds one RSR note per paragraph in `_original` («Source correction in the 2026-09-28 rebuild …», citing tome11.docx ¶ and the printed page). `rsrnotes.json` lists them all.

- **Typesetting typos, 30:** candidates from `typos11.py` (a word found once in `_original`, one edit away from a common word), judged by hand, and applied only when tome11.docx has the same misprint (printed so). Examples: «auxqelles», «vendrdi», «pemière», «viendait», «l'avient», «cinquane», «seulemet», «Multdo», «existence teme» → «terne», «[Mot noiric:» → «[Mot noirci:».
- **Kept as possibly the writer's own:** single/double-consonant and accent variants (jouisances, poura, adrese, ravisante, défence, recevrons), names (Francheschi, «Lancastre [sic]», «Mademoiselle Dinaa»), and the unclear «commençant por hini» and «ches nous» (077.0175, 077.0246).
- **Accents lost at import, 27 paragraphs (26 in 080):** words printed with their accents but stored without them (e.g. 080.0330 «etonnante … meme … feminin … revais»), restored token by token from the docx (`accentfix11.py`; only tokens that differ by diacritics alone). 076.0164 and 080.0588 are excluded, since the docx has the misprints «avàis» and «étànt» corrected above.
- These paragraphs get the tool's ED SOURCE CHANGED note in the translations. The meaning is unchanged, so translators only need to confirm.

## Gates

Throwaway worktree at `ba398e4b7`, then `--write` and the postfix:

- **`rebuild-carnets --write`:** 1,359 file operations.
- **`renumber-check` 075–080: 25 FAIL, all false positives.**
  - They are glossary dates written as «(076.1877-12-11)» in GEORGES.md and LOUISE_BRESLAU.md, read as IDs.
  - One is a stale RSR note in 078/1878-02-10 citing «078.1741», in all 4 trees.
  - All of them are there before the rebuild too. They are a tool issue for toolsmith.
  - The warnings are historical comments that cite dropped IDs.
- **`verify-carnet`:** PASS with 0 fail and 0 warn for `_original`, cz, uk, en and fr × 075–080 (30/30).
- **`splicescan`:** empty for all 30.
- **`check-comments`:** OK for all 5 trees.
- **`source-completeness 075–080`: 0 missing diary text.** What is left:
  - the 075 front matter and the 080 index (apparatus);
  - the withdrawn covers (076 ¶770–771, 078 ¶2131–2133, 080 ¶3690–3693);
  - the printed footnotes;
  - single lines whose footnote marks were cleaned («1 Mademoiselle,», «2 Mercredi 12 décembre», «' Halfweg»…), and 080 ¶3746 «Il vous Ta dit ?», which is OCR for 080.0055;
  - bare date lines.

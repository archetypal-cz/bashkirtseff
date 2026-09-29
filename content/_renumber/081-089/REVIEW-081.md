# 081 rebuild plan: review (worker A, 2026-09-28)

Plan: `final/plan-081.json`, built by `tools/fix_081.py ROOT` from `common/plan-081.json`
(pipeline: draft → tiler → fix_common → fix_081, which runs `wA/streamtile.py` and `wA/addrsr.py`).
Run it together with 082: `just rebuild-carnets final/plan-081.json final/plan-082.json`
(082 needs `tools/prereq_082.py` applied first; 081 has no prerequisite). Dry run: not rejected.

## Counts

| | |
|---|---|
| entries | 47 (none added or removed) |
| old paragraphs carried | 487 |
| new paragraphs | 103 |
| dropped | 12 (8 empty placeholders from the draft + 0305–0307 + 0499) |
| set_french | 69 (each carries `_rsr`, a suggested RSR note with docx ¶ and page, for post-apply) |
| kinds | letter 31 old + 5 new, clipping 14 old, margin 3 old + 1 new, rayé 1 old + 1 new, editorial 1 old |
| flag resets | 38 entries per translation tree |

## Method

- The draft's completions (whole docx ¶ into the head cluster) duplicated the «not found» fragments.
  I replaced the tiler/drafter completions with `wA/streamtile.py`: every old cluster is aligned to the docx
  token stream (¶47–855), then every uncovered docx word goes to the cluster that ends / starts next to it in
  the same ¶; a cluster whose span has ≥3 docx words it lacks (the extraction's «...»/«[...]» elisions and
  cut sentences) gets the docx text of its span, reconciled word by word with the old text (`planops.reconcile`:
  _original's spelling, italics and footnote markers are kept where the two differ only slightly; editorial
  insertions of the extraction such as «[Lettre de Multedo]», «[au bal]», «^5^» go). Lower-case continuation
  lines join the cluster before them (hyphens repaired). Whole uncovered ¶ stay/become `new`.
- Coverage check (`wA/cover.py`): every docx ¶ of Livre 81 is covered once; the only uncovered ¶ are the
  withdrawn title page and the edition's footnotes; residual «duplicates» are 4-word boundary noise.
- docx corrections (`wA/fix12.py` → `wA/fix12.json`, checked on the scan where not obvious): the edition's
  footnote calls at the head of small-print ¶ (¶67, 151, 390, 589, 631, 764, 834), «vptre» → «votre» (¶636),
  «{Mots noircis» → «[Mots noircis» (¶758), «ces èvre charmates» → «ces lèvres charmantes» (¶766),
  «malgré £moi]» → «malgré [moi]» (¶176, scan p.18), «IRayé;» → «[Rayé:» (¶668), «yeux I.» → «yeux !» (¶492),
  «(quel nom I)» → «(quel nom !)» (¶803), «diffidile» → «difficile» (¶606), OCR «II»/«I!» rules.
  «°» → «1°» in Marie's reply (¶602, docx list numbering lost; print p.52 shows «1°»).

## Structure decisions

- **7 July** is a bare date line (¶446). 0304 keeps its heading and gets «[Aucun texte - date seule mentionnée]».
  0305, 0306, 0307 are copies of 8 July's 0310, 0312, 0313 (¶448–452) and are dropped; every tree held the
  same text twice. The draft's drops of the empty 0308/0320/0326/0332 clear the cz/en «missing» warnings.
- **17 July**: the draft filed Multedo's letter and Marie's answer under 5 July (the letter's date line
  «5 juillet 1878 Mademoiselle,», ¶590). They are back after 0368: 0368 = ¶588; new letter ¶589–592;
  0369 = ¶593–600 (letter, quoted); new letter ¶601–606 = Marie's answer (partly struck).
- **21 July**: 0387 = ¶630 (+ its footnote [^2]); Multedo's verses ¶631–644 are one new `letter`.
  ¶646 is split between 0388 and 0390 at «Je prends Auguste…» (the extraction had cut it mid-sentence).
- **22 July**: Multedo's letter ¶657–679 = 0394 + 0395 (quoted; the draft's 17 new fragments removed).
- **23 July**: bare date line; 0396 gets the placeholder.
- **24 July**: the draft filed ¶699–716 under 22 July (letter date «22 juillet 1878», ¶700). 0405 (letter,
  ¶699–709), 0406 (margin), new ¶712–714, 0408, 0409 moved to 24 July.
- **27 July**: bare date line; 0417 «[Pas d'entrée pour cette date dans le carnet original]» reworded to
  the standard placeholder.
- **4 August**: 0458 was an abridged merge of ¶799 + ¶801; it is now ¶799–801 (with «Amen.», ¶800).
- **7 August**: the draft filed Multedo's 5 August letter and the rest of 7 August under 5 August (¶835).
  0483–0491 moved back; 0483–0486 are the letter (quoted, docx text).
- **18 July**: 0375 (¶617) moved after the new ¶615–616.
- **Title page** ¶46–51: withdrawn (see below). 081.0499 (the Livre 82 title page + «Que diable, au fait non.»)
  is dropped in this plan; the 082 plan restores ¶862 as new.

## Kinds

- letter: 0015 (first anonymous letter to Paul de Cassagnac's father, 24 June), 0016–0025 (second one), 0070–0071
  (to Paul de Cassagnac, 29 June), 0168–0172 (to Mme Doubelt, 2 July), 0274–0276 («Une femme indignée», the
  «petite tante» mystification, to Multedo), Mme Doubelt's answer (new ¶529–532, 0353, new ¶539–543), Multedo
  5 July (new ¶589–592, 0369), Marie's answer (new ¶601–606), verses (new ¶631–644), 0394–0395, 0405, 0443
  («Dona Juana»), 0483–0486.
- clipping: 0061–0062 (Le Figaro, Cassagnac's wedding), 0260–0271 (Le Figaro, service for Queen Mercedes).
- margin: 0177, 0282, 0406, new ¶549. rayé: 0082, new ¶550. editorial: 0009.
- Draft guesses removed: all «Madame X…/Monsieur X…» letter guesses on old paragraphs (0182 0246 0345 0371 0472),
  new ¶515 and ¶712; the draft's Body-text-(4) «clipping» guesses (small print = letters here).
- Not given a kind (mixed paragraphs, per convention): 0032 (margin line + 7 diary ¶ merged), 0323, 0173, 0113.

## Withdrawn cover pages

- tome12 ¶46–49, Mon Journal t.12 p.5: «Gloriae Cupiditas / Livre 81eme / commencé le dimanche 23 juin 1878 /
  terminé le jeudi 8 août 1878 / Avenue de l'Alma 67, Paris / Soden, Kurhaus 22».
- ¶50, p.5 (small print under the title): «[Dans la marge : Explication à Cassagnac, sa décadence dans mon esprit
  après la dernière visite au 10 bis puis les pages pendant Schaeppi page 93, livre 79 et enfin les pages, 5, 6,7,
  8,9, 10, 11, 12, 13, 14, 15, 16 du présent livre 81e, pages 95 et mes suivantes livre 79.]» (an index note).
- ¶51, p.5: «[En travers: Saillies folles.]». Not first-person diary text, so withdrawn with the page; tell me if
  it should stay as a `margin` paragraph of 23 June.

## Left out

- The edition's source footnotes ¶69 («' Marie Bashkirtseff, Journal intégral par Lucie Le Roy… p.367-370»),
  ¶157, ¶394, ¶844 («Ibid…»), ¶542 «13-414», the page number ¶232 «22».

## Owner questions

1. Tome 12's foreword: some letters «envoyées ou reçues, épinglées ou non au manuscrit» are printed from Coppée
   (1891) and Le Roy (1999). All letters printed in the tome are kept as `letter`; we cannot tell which were
   pinned into the notebook. OK?
2. ¶601 opens «[Rayé: Votre lettre…» without a closing bracket; the print (p.52) has none either. Kept as printed.
3. Old paragraphs keep their dialogue dashes as they are; the new text has the docx's list-numbered dashes.

## Post-apply (after --write)

- Add `[#Press_clipping]` and `[#Le_Figaro]` tags to the 14 clipping clusters (old 0061–0062, 0260–0271): the
  tool adds the press tag only to new clippings.
- Optional: turn each `_rsr` of the plan into a `RSR:` comment under the new ID (69 clusters).
- Translation trees: 38 entries reset per tree; the SOURCE CHANGED notes mark the 69 clusters to trim/complete.

## Lead review (resumed session, 2026-09-28)

### Printer's typos corrected (owner policy 2026-09-28)

Each one is noted in the paragraph's RSR (`rsr` of a new paragraph, `_rsr` → RSR comment on an old one). Marie's own spellings and «[sic]» cases stay.

- 081.0061: Printer's typo corrected: «Couve let» → «Couvelet», «deTarn-et -Garonne» → «de Tarn-et-Garonne» (Mon Journal t.12 pp.16–17).
- 081.0062: Printer's typo corrected: «Cassagnc» → «Cassagnac» (Mon Journal t.12 pp.16–17).
- 081.0316: Printer's typo corrected: «persone» → «personne» (Mon Journal t.12 p.39).
- new ¶498: Printer's typo corrected: «dépît» → «dépit» (Mon Journal t.12 p.42).
- 081.0375: Printer's typo corrected: «têtg» → «tête» (Mon Journal t.12 p.53).
- new ¶684: Printer's typo corrected: «Bashkirtesff» → «Bashkirtseff» (Mon Journal t.12 p.59).
- 081.0443: Printer's typo corrected: «Lorsqe» → «Lorsque», «d'El vire» → «d'Elvire» (Mon Journal t.12 p.66).
- 081.0461: Printer's typo corrected: «somms» → «sommes» (Mon Journal t.12 p.71).
- 081.0487: Printer's typo corrected: «noiricis» → «noircis» (Mon Journal t.12 p.74).

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_081.py`)

- 081.0387: doubled footnote call «[^2][^2]» from the reconcile → «[^2]».
- 081.0491: «[Mots noircis: Paris est cependant la seule]» restored (¶848; the extraction kept the words, dropped the label).

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.

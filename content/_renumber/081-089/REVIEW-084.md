# Carnet 084 rebuild plan — review (worker B, 2026-09-28)

Plan: `final/plan-084.json`, built by `tools/fix_084.py` (+ `fixlib_b.py`, `edits_084.py`, `restore_b.py`,
`anchor_b.py`) from `common/plan-084.json`. Source: tome12.docx ¶2178–2958 (Livre 84, printed pp.195–265).

## Numbers
- 755 paragraphs in 105 entries: 625 old carried, 130 new (32,073 chars), 33 dropped; 114 `set_french`.
- Entries 1879-01-11 … 1879-04-25; 4 added (02-20, 03-02, 03-11, 03-17: bare date lines), none removed.
- Dry run (081 082* 083 084): not rejected; ~30 «old embedded French not found — new copy inserted»
  warnings per tree (merged / changed heading clusters); uk footnote [^84.632.1] follows its reference.
- Completeness: every docx ¶ covered except the title page and the print's footnote lines; no duplicated text.

## What the rebuild does
- **Accents restored (78 clusters, 084.0294–0660, ~March–April 1879):** _original had lost every diacritic
  there («Je suis arrivee… j'ai travaille ferme»). Each word that differs from the docx only by accents takes
  the docx spelling (no other change; «a»→«à» only when the docx has «à»). Log: `b/restore-084.log`.
- **Labels restored:** «[Rayé: complète]» 0051, «[Mot noirci: pour]» 0059, «[Mots noircis: pas faire
  autrement]» 0175, «[Mots noircis: et évita]» 0201, «[Mots noircis: je serais]» 0208, «[Mots noircis:
  d'appeler]» 0230, «[Mots noircis: de laisser]» 0231, «[Barré: la pièce]» 0420, «[Mots noircis: d'intérieur et
  de solitude. Une longue jupe]» 0422, «[Mot noirci: Versailles,]» 0427, «[Mot noirci: enfin ce]» 0438,
  «[Mots cancellés: s'il est vraiment si bien]» 0451 (_original had kept the words and dropped the label).
- **Completions:** tiler 9 clusters; 0049 = whole ¶2275 (the long parenthesis on Mme de Mouzay was missing);
  0070 = ¶2309–2310 («cal-/culent», the draft's new ¶2310 removed); 0046 «j'étais ennuyée, j'avais froid».
- **28 Feb:** old 0245 had glued ¶2544 («Figurez-vous… une lettre de Mlle») to the tail of ¶2558, losing
  the letters in between. 0245 = ¶2544–2545; ¶2546–2557 new; ¶2558 new (whole).
- **19 Jan:** «Dimanche 19 janver 1879» (¶2254, misprint) was not read as a date: 0034–0036 + ¶2257 back in
  their own entry 1879-01-19 (the draft had merged them into 18 Jan).
- **Merged headings split** (convention 6): 0183 «# Jeudi 20 / Vendredi, 21 février» → «# Vendredi 21 février
  1879» heading 21 Feb, 20 Feb is a «[Aucun texte…]» entry; likewise 0264 → «# Lundi 3 mars 1879» (2 Mar
  bare), 0339 → «# Mercredi 12 mars 1879» (11 Mar bare), 0381 → «# Mardi 18 mars 1879» (17 Mar bare).
- **Bare date lines:** 12, 20 Jan and 12, 14, 19, 24 Apr etc. keep/get «[Aucun texte - date seule
  mentionnée]»; old placeholder clusters 0544, 0555, 0603, 0628 stay in their days.
- **Dropped:** 084.0204–0205 (verbatim duplicates of 0209–0210: «Hier nous sommes allés à Monaco…» exists once,
  under 23 Feb, ¶2480–2481) and 31 empty placeholder clusters (drafter).
- **Draft artefacts removed:** «- Nouvelle année russe» (¶2194, part of 0007's heading), «Dimanche 19 janver
  1879» (¶2254), «Rien.» (¶2759 = 0436), «- ???» (¶2832 = 0507), the print's footnote lines «2 Ibid, p.
  647-648» (¶2712), «3 Ibid. p. 650-651» (¶2728), «Ibid. p. 662» (¶2824). «bid, p. 608-609» (¶2357) was never
  included.

## Kinds
| Where | Para | kind | source |
|---|---|---|---|
| 19 Jan | new ¶2257 | rayé | |
| 29 Jan | new ¶2322 «[Bas de page blanc]» | editorial | |
| 3 Feb | new ¶2352–2356, ¶2358, ¶2359 | clipping | La Vie mondaine (Nice), février 1879 (texte donné d'après Le Roy 1999, pp. 608-609) |
| 5 Feb | old 0107 «[En travers: …]» | margin | |
| 18 Feb | old 0177 «[Une ligne cancellée : J'évite la catastrophe…]» (was `~~…~~`) | rayé | |
| 18 Feb | new ¶2447 «[BAS DE PAGE MANQUE]» | editorial | |
| 23 Feb | old 0210 «[En travers: … (Mot noirci : truc d'éclairage électrique.]» as printed p.221 | margin | |
| 27 Feb | new ¶2532–2535 | letter | Lettre de Paul Bashkirtseff au prince C. Eristoff, 27 février 1879 (copie) |
| 28 Feb | new ¶2547–2550 | letter | Lettre de Paul Bashkirtseff à Mlle Eristoff, 28 février 1879 (copie) |
| 28 Feb | new ¶2554–2556 | letter | Lettre de Paul Bashkirtseff au consul de Russie à Nice, 28 février 1879 (brouillon) |
| 28 Feb | new ¶2557 «[Manque dans le manusrit p. 96 à 98]» | editorial | |
| 1 Mar | old 0255–0257 | letter | Lettre de Marie Bashkirtseff au comte Des Perrières, 1er mars 1879 (copie) |
| 1 Mar | old 0259–0262 | letter | Lettre au procureur de la République, écrite au nom de l'oncle Alexandre (brouillon) |
| 19 Mar | old 0386–0394 | letter | Lettre de Marie Bashkirtseff à Alexandre Dumas fils, 19 mars 1879 (copie) |
| 20 Mar | old 0404–0408 | letter | Lettre de Marie Bashkirtseff à Alexandre Dumas fils, 20 mars 1879 (copie) |
| 6 Apr | old 0499–0500 «Voici un bout de journal» | clipping | coupure de journal, avril 1879, réunion électorale au cirque des Champs-Elysées (Le Roy 1999, p. 662) |
| 17 Apr | old 0596 «[Barré: …]» | rayé | |

- Letter guesses removed (sentences starting «Madame X / Monsieur X»): 0235, 0342, 0378, 0504.
- The clipping and letter texts are printed inset in small italics, several with a footnote to Le Roy's
  edition; the print's footnotes stay out. 0499 lost its «^*4^» footnote marker.
- 0404 «[Jeudi 20 mars 1879]» stays the first line of the second Dumas letter, after 0403.

## OCR
The print's typos «plens», «dnas», «Seilliéres» (¶2353), «porée» (0260), «manusrit» (¶2557), «olypmpique», «frémmis»,
«commenttre» (0390–0393) are corrected under the owner policy of 2026-09-28 (see «Printer's typos corrected»). _original's corrected readings kept
where the docx has OCR noise: «catastrophe / Strasbourg» (0177; docx «catatrosphe / Srasbourg»), «instant»
(0174; docx «insanì»), «incroyable» (0551), «invraisemblable» (0516).

## Withdrawn cover pages
- Livre 84 title page, tome12.docx ¶2178–2183, Mon Journal t.12 p.195: «*Gloriae Cupiditas* / Livre 84ème /
  commencé le samedi 11 janvier 1879 / termiiné le dimanche 25 avril 1879 / Champs Elysées 71 / le 28 janvier
  1879 avenue Montaigne, 34 / Depuis le vendredi 21 février / jusqu'au dimanche 2 mars, Nice / Hôtel du Parc /
  Villa d'Acqua Viva». (Marie's index page just before it, ¶2171–2177, is listed in REVIEW-083.)

## Drawings
None (no figure candidates in tome 12, no picture slots in the range). `drawings-084.json` = [].

## Post-apply
- RSR «Completed/corrected from tome12.docx ¶N» note for `_tiler` (9) and `_restored` (6) clusters; the 78
  accent-restored clusters need no note beyond the rebuild ED comment (spelling only).
- Translations: 0245's translated text covers ¶2544 + the tail of ¶2558 — the second half now belongs to the
  new ¶2558 paragraph; 0183 / 0264 / 0339 / 0381 translated merged headings must become single-day headings.
- Glossary tags for the 130 new paragraphs.

## Owner questions
1. Clippings and letters that the print gives from Le Roy's edition (La Vie mondaine, the April cutting, the
   letters of 27–28 Feb): included with kinds (done). OK?
2. Accent restoration of 78 clusters (SOURCE CHANGED in 4 trees, but no change of meaning): OK?
3. 0204–0205 dropped as duplicates (their translations duplicate 0209–0210): OK?

## Lead review (resumed session, 2026-09-28)

### Printer's typos corrected (owner policy 2026-09-28)

Each one is noted in the paragraph's RSR (`rsr` of a new paragraph, `_rsr` → RSR comment on an old one). Marie's own spellings and «[sic]» cases stay.

- NEW ¶2213–2214: Printer's typo corrected: «profonation» → «profanation» (Mon Journal t.12 p.198); «javais» → «j'avais» (Mon Journal t.12 p.198); «Nelle» → «Mlle» (Mon Journal t.12 p.198).
- NEW ¶2218: Printer's typo corrected: «possile» → «possible» (Mon Journal t.12 p.199).
- 084.0049: Printer's typo corrected: «drie» → «dire» (Mon Journal t.12 p.202); «connaisances» → «connaissances» (Mon Journal t.12 p.202).
- 084.0059: Printer's typo corrected: «ranconté» → «raconté» (Mon Journal t.12 p.204).
- NEW ¶2340: Printer's typo corrected: «leque» → «lequel» (Mon Journal t.12 p.208); «noricis» → «noircis» (Mon Journal t.12 p.208); «espérence» → «espérance» (Mon Journal t.12 p.208).
- NEW ¶2353: Printer's typo corrected: «plens» → «pleins» (Mon Journal t.12 p.209); «dnas» → «dans» (Mon Journal t.12 p.209); «Seilliéres» → «Seillière» (Mon Journal t.12 p.209).
- NEW ¶2557: Printer's typo corrected: «manusrit» → «manuscrit» (Mon Journal t.12 p.226).
- NEW ¶2558: Printer's typo corrected: «Fhéâtre» → «Théâtre» (Mon Journal t.12 p.226).
- 084.0333: Printer's typo corrected: «capales» → «capables» (Mon Journal t.12 p.236); «colèe» → «colère» (Mon Journal t.12 p.236).
- 084.0375: Printer's typo corrected: «monste» → «monstre» (Mon Journal t.12 p.241).
- 084.0034: Printer's typo corrected: date line «Dimanche 19 janver 1879» → «janvier» (Mon Journal t.12 p.201).

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_084.py`)

- Page-break half joined: new ¶2298 «tant de gens heureux…» appended to 084.0064 (dropped as a paragraph).
- Printer's typos in old letter clusters (worker B's verified list, not reached by the first pass): 0260 «porée» → «portée», 0390 «frémmis» → «frémis», 0391 «commenttre» → «commettre», 0393 «olypmpique» → «olympique». The LAN notes on 0391/0393 («SPELLING ERROR») are now moot.
- 084.0179: the print opens «[Mot noirci: le monolithe dans le compartiment…» and never closes the bracket (scan p.217–218). Not restored (which word is blackened is unknowable); flagged.

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

## Title-page notes restored (applier, 2026-09-28 night)
Owner policy in the handoff («Marie's own notes on title pages go in as margin/other at the first entry»): the
Marie-written lines listed above under «Withdrawn cover pages» that are not the title formula (Gloriae Cupiditas /
Livre N / commencé–terminé / addresses) are now `margin` paragraphs (source «note de Marie sur la page de titre du
Livre N») at the start of the first entry, inserted by `tools/title_notes.py`. The formal title lines stay withdrawn.

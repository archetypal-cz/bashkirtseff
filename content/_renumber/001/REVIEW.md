# Carnets 001–014 rebuild plan: review (2026-09-28)

Plans: `plan-001.json` … `plan-014.json` in this directory, built by `finalize.py` from the
`just rebuild-draft-plan` drafts (tome 1: draft with the date-line fix below; tome 2: same). Sources:
`content/_raw/tome01.docx` (Livres 1–7) and `tome02.docx` (Livres 8–14). There is no scan PDF for
tomes 1–2, so new paragraphs cite the docx ¶ only.

Runs: 001–007, 010, 013, 014 one carnet at a time; **008+009** and **011+012** as multi-carnet runs
(the first day of Livres 9 and 12 was filed in the previous carnet).

Applied on main 2026-09-29 (after midnight): maps `../CCC-2026-09-29.json`, SQL `../CCC-2026-09-29.sql` (008+009 and 011+012 combined), plans `../CCC/plan.json` (from final2 = final + `scripts/title_notes.py`).

## Owner policy applied (KRR 2026-09-28)

- Every paragraph in its manuscript day, missing French inserted, carnet renumbered 0001..N.
- Kinds: `margin` («[Dans la marge: …]», «[En travers: …]», «[Écrit plus loin dans les marges: …]»),
  `rayé` (a whole struck paragraph with its text), `editorial` (the edition's bracketed notes about the
  manuscript: «[Trois lignes cancellées]», «[Une page déchirée]», «[Croquis de toilette]», «[Sans date,
  en fin de carnet]», Borel/editors' provenance notes in 001), `other` (Marie's later «[Annotation:
  1875 …]», «[Page intercalée: …]», «[Page arrachée: …]», «[Sur la dernière page du carnet: …]»,
  «[Sans date: …]», «[Rajouté entre les lignes: …]», with `source` naming what it is). The clippings
  (011, 013, 014) already carried `kind: clipping` (commits 5decad5fb, d2956be5b) and are unchanged.
  **No letters**: every salutation the drafter flagged (006.0163, 009.0111, 009.0118, 010.0222,
  012.0234, 014.0310) is reported dialogue, not a copied letter.
- No cover or title-page entries; all title-page text is listed under «Withdrawn cover pages».
- The printed edition's footnotes stay out (none were added).
- Labels as in the manuscript: see «Labels» below.
- Drawings: none. tome01.docx has one embedded image (`word/media/image1.png`, 84×20 px, ¶2576): the
  publisher's logo after the table of contents, not a facsimile. tome02.docx has no images. The empty
  «picture slots» the drafter lists in 014 (docx ¶8746–8774, ¶8786–8873, ¶8996, ¶9590) are where the
  printed edition reproduced the *Galignani* clippings as pictures; their text is already in 014.
  The notes «[Croquis sur la page opposée]», «[Croquis de toilette]» (007, end of notebook) and
  «[Croquis de Marie]» (011.0269) describe sketches that the edition did not reproduce.
- Carnet 001: the notebook is lost; its text is Pierre Borel's 1925 publication (CARNET-REFERENCE.md).
  The edition's two provenance notes (001.0002 «[Passages reproduits par Pierre Borel…]», 001.0003
  «Connaissant la façon dont Pierre Borel…») are kept and marked `editorial`; the title lines
  «Carnet N° 1» (glued into 001.0001's heading cluster) and «Du 11 janvier 1873 au 12 février 1873»
  (001.0004) are withdrawn like every other title page. No text is missing from 001 (its only
  completeness gap, docx ¶26–63, is the Borel preface already in carnet 000).

## Corrections to the drafts (for toolsmith)

1. **Date-line regex** (`common.py` RE_HEAD): «Lundi 25 août1873» (no space before the year) and
   «Mercredi 26, jeudi 27 novembre 1873» are not recognised, so the drafter merged 25 Aug into 24 Aug
   (008, 30 paragraphs) and 26–27 Nov into 25 Nov (013, 37 paragraphs). The plans here were drafted
   with a patched copy: `(?P<mon>…)(?![a-zà-ÿ])` instead of `\b`, and an optional
   `,\s*<weekday>\s+\d\d?` after the day.
2. **ba398e4b7 regression**: the title pages of Livre 3 («Carnet N° 3 Mon journal commencé…», ¶599)
   and Livre 7 («Carnet N° 7 [commencé…]», ¶1810) are no longer seen as Livre headings; their text was
   appended to the last entry of 002 and 006 (removed here).
3. **56 completions rejected** (003, 004, 005, 007): `_original` splits one docx paragraph into several
   clusters, so each «cut short» cluster's missing words are in its neighbours (checked: 0.79–1.00 of
   the added words in the ±4 clusters). Applying them would have duplicated text.
4. **195 «empty placeholder» drops rejected**: in 001–014 these clusters are the per-day RSR entry
   summaries (and LAN/TR notes, en/uk/cz CON verdicts); 187 of 195 carry notes. They are carried.
5. **006.0089 is not a cross-carnet move**: «[Dans la marge: Comme c'est vrai.]» (006, 25 June, docx
   ¶1646) and «[Dans la marge: C'est vrai.]» (005, 14 June, ¶1539) are two notes. 006.0089 stays;
   ¶1539 is new in 005.
6. Kind guesses: salutation → letter was wrong every time; «[N lignes cancellées]» is `editorial`,
   not `rayé` (the struck text is not given).


## Structure decisions

**Paragraphs moved to their manuscript day** (every case checked against the docx date lines; the
automatic heading-date sweep of 2026-09-26 flagged the same ones):

- 005.0195–0199: 005/1873-06-06.md → 005/1873-06-05.md
- 005.0201–0207: 005/1873-06-07.md → 005/1873-06-06.md
- 005.0209–0220: 005/1873-06-08.md → 005/1873-06-07.md
- 005.0222–0230: 005/1873-06-09.md → 005/1873-06-08.md
- 005.0232–0238: 005/1873-06-10.md → 005/1873-06-09.md
- 005.0240–0243: 005/1873-06-11.md → 005/1873-06-10.md
- 005.0245–0258: 005/1873-06-12.md → 005/1873-06-11.md
- 005.0260–0264: 005/1873-06-13.md → 005/1873-06-12.md
- 005.0266–0275: 005/1873-06-14.md → 005/1873-06-13.md
- 008.0335–0363: 008/1873-09-01.md → 009/1873-09-01.md
- 010.0152–0154: 010/1873-10-01.md → 010/1873-09-30.md
- 010.0305–0309: 010/1873-10-08.md → 010/1873-10-07.md
- 010.0349–0352: 010/1873-10-11.md → 010/1873-10-10.md
- 011.0171–0176: 011/1873-10-22.md → 011/1873-10-21.md
- 011.0373–0377: 011/1873-10-31.md → 011/1873-10-30.md
- 011.0451–0473: 011/1873-11-01.md → 012/1873-11-01.md
- 013.0046–0051: 013/1873-11-23.md → 013/1873-11-22.md
- 014.0305–0307: 014/1873-12-30.md → 014/1873-12-29.md

- 005, 6–14 June: an off-by-one chain. The text of each day sat in the next day's file. The date
  headings stay, and the text moves back one day. 14 June gets its real text (new, docx ¶1533–1542).
- 010, 30 Sept / 1 Oct: 010.0152–0154 are 30 Sept text. 010.0149 is a truncated duplicate of 0152
  and is dropped. The heading «Mercredi 1 octobre» (0151) sat before that text and is dropped. The
  manuscript's heading line 0155 becomes the entry heading «# Mercredi 1er octobre 1873».
- 014.0305–0307 («[Une ligne illisible]», «Nous avons vu diadia…», «La comtesse de Mouzay…»)
  stand before «Mardi 30 décembre» (docx ¶9890–9920), so they belong to 29 Dec.
- **Cross-carnet**: the first day of Livre 9 (1 Sept, 008.0335–0363) and the continuation
  «Samedi 1er novembre 1873 (suite)» that opens Livre 12 (011.0451–0473) move into 009 and 012.
  The old file 008/1873-09-01 redirects to 009/1873-09-01.
- Date headings the drafter could not parse («# Vendredi, 21 mars», «# Mercredi, 30 avril» …) had
  been put at the end of the previous day. They are back at the head of their own day (003.0060,
  003.0159, 004.0206, 004.0228 with 0229–0230, 004.0237, 010.0155).
- Kept where `_original` has them: Marie's own page-foot notes «¹ voir dans les trois livres
  précédents» (011.0202) and «² Cependant on ne doit pas se ruiner…» (012.0017), right after the
  paragraph carrying the mark. The drafter had moved them to the next day, because the printed
  footnote falls on that page.
- Entry-level RSR summary clusters are carried and follow their predecessor.

**Dropped (55)**:

- 001.0004: title page of the notebook withdrawn (no cover or title-page text until the manuscript is scanned; KRR 2026-09-28); text kept in content/_renumber/001-014 REVIEW.md
- 006.0001, 006.0002, 006.0003, 006.0004, 006.0005: title page of the notebook withdrawn (no cover or title-page text until the manuscript is scanned; KRR 2026-09-28); text kept in content/_renumber/001-014 REVIEW.md
- 008.0105, 008.0106, 008.0122, 008.0123, 008.0131, 008.0132, 008.0149, 008.0150, 008.0161, 008.0162, 008.0170, 008.0171, 008.0179, 008.0180, 008.0186, 008.0187, 008.0200, 008.0201, 008.0213, 008.0214, 008.0228, 008.0229, 008.0244, 008.0245, 008.0257, 008.0258, 008.0269, 008.0270: page-break artefact «|» (no text; the manuscript sentence continues in the next paragraph)
- 010.0149: truncated duplicate of 010.0152 (docx ¶3294–3295 has the sentence once, under 30 Sept)
- 010.0151: spurious date heading «Mercredi 1 octobre 1873» placed before 30 Sept text; the manuscript heading is 010.0155 (docx ¶3298)
- 010.0463: invented stub: tome02.docx has no 14 October 1873 date line (13 Oct is followed by the Livre 11 title page)
- 010.0464: invented stub «[Pas d'entrée pour cette date]» for a date the manuscript does not have
- 010.0465: entry summary of the invented 14 Oct stub
- 011.0002, 011.0446, 011.0447, 011.0448, 011.0449, 011.0450: title page of the notebook withdrawn (no cover or title-page text until the manuscript is scanned; KRR 2026-09-28); text kept in content/_renumber/001-014 REVIEW.md
- 013.0002, 013.0003, 013.0004, 013.0005, 013.0006: title page of the notebook withdrawn (no cover or title-page text until the manuscript is scanned; KRR 2026-09-28); text kept in content/_renumber/001-014 REVIEW.md
- 013.0007: duplicate date heading «Vendredi, 21 novembre 1873»; the day heading stays in 013.0001 (docx ¶7138)
- 014.0002, 014.0003, 014.0004: title page of the notebook withdrawn (no cover or title-page text until the manuscript is scanned; KRR 2026-09-28); text kept in content/_renumber/001-014 REVIEW.md
- 014.0005: duplicate date heading «Mercredi, 10 décembre 1873»; the day heading stays in 014.0001 (docx ¶8512)

**New paragraphs (118)**: one per manuscript paragraph. Each carries `RSR: Restored from tomeNN.docx
¶N (missing from original extraction, 2026-09-28 rebuild).` and has no glossary tags (run
glossary-tagger afterwards). The largest blocks:
- 008, 28 Aug: the arrival in Nice, ¶1064–1137 (20 paragraphs).
- 013, 30 Nov (Séraphine, ¶7722–7791), 5 Dec (¶8056–8088) and 8 Dec (Marie's reaction to the
  Hamilton wedding report, ¶8283–8356): 33 paragraphs.
- 011, 28 Oct: ¶5442–5480 (11).
- 002, the 2 Feb page written at the end of Livre 2 (¶565–571), a new entry
  `002/1873-02-02.md` with the heading «Lundi 2 février 1873 [écrit en fin de carnet, antérieurement à
  ce qui précède.]». Other additions in 002: Marie's 1874 annotations, the «[Page intercalée: Je
  comprends maintenant seulement à la page 46…]» (¶371–377), 8 marginal notes, and the second
  «[Dans la marge: Un petit sou s.v.p. !]» (5 March, ¶487).
- 004: 21 April (¶996–998) and 28 April (¶1075–1079).
- 005: 14 June (¶1533–1542, incl. the mother's note «[Dans la marge: C'est vrai.] [Ecriture de sa
  mère]») and the **coin list** on the inserted page of 6 June (¶1434–1460). The docx sets it as a
  «Table of contents»-style table, which the drafter skipped. It is now one `other` paragraph,
  one row per line.
- 007: the undated notes at the end of the notebook (¶2207–2216).
- 003, 009, 012: short missing lines.

Obvious OCR repaired in new text (noted in the RSR line): «11» → «!!» (¶2261); «// me plaisait» →
«*Il me plaisait*» (¶483). The coin list stays exactly as printed. All other new text is verbatim docx
(typographic apostrophes, as in 068).

Not inserted (duplicates or unreadable): 014 ¶8775 (a garbled repeat of the clipping tail in 014.0059),
¶8813 (in 014.0072), ¶9551 (in 014.0227), ¶9033–9040 (an unreadable OCR of a gift-list clipping; the
list text is in 014.0114–0115), and 013 ¶8235 (in 013.0269).

## Labels as in the manuscript (`set_french`, 50 paragraphs)

- **002, 32 whole-paragraph notes had lost their label** in `_original`: 30 «[Dans la marge: …]»,
  including 002.0093, whose bracket had lost only its label, and 2 «[Page intercalée: …]» (0081, 0115).
  These are 0006 0020 0041 0043 0056 0063 0067 0069 0072 0079 0081 0084 0087 0093 0111 0115 0128
  0138 0145 0155 0162 0164 0167 0171 0175 0177 0191 0195 0216 0221 0254 0277 0296. In addition,
  0304 becomes «[Annotation: 1874. …]», and in 0024 the inline note gets «Dans la marge:» back.
  The old (cleaned) text is kept inside the restored label.
- Headings: 002.0089 «Mardi 25 février 1873 (Mardi Gras)», 002.0136 «Samedi 1er mars 1873 [Marie a
  mis par erreur 28 février]», 002.0142 «Dimanche 2 mars 1873 [Marie a mis par erreur 1er mars]»,
  002.0278 «Mardi 11 mars 1873 [mois rectifié]», 013.0092 «Mercredi 26, jeudi 27 novembre 1873»,
  011.0451 «# Samedi 1er novembre 1873 (suite)» (it opens 012's 1 Nov entry), 010.0155.
- Title lines removed from heading clusters: 001.0001 and 013.0001 («Carnet N° 1», «Carnet N° 13»).
- 014: five struck words the extraction dropped: 014.0242 «[Rayé: fait beaucoup]», 014.0264
  «[Rayé: qu'on lui avait ravis.]» and «[Rayé: traînée]», 014.0267 «[Rayé: insouciant]»,
  014.0277 «[Rayé: il a mangé tout le dîner]».
- 014.0301: `_original` had replaced its opening with 0300's words («Un Russe Ermolaïeff, …»). The
  docx ¶9888 reads «Dans le compartiment il y a trois Anglais poussière, une vieille, …», and the
  existing LAN note already glosses «Anglais poussière».
- 012.0231: «Mlle Baskirtseff», as Lise says it (docx ¶6741).

Every `set_french` adds the tool's «SOURCE CHANGED» note in cz/uk/en/fr. Translators then add the
label or heading to their text.

## Owner questions

1. ~~Marie's own sentences on the title pages~~ **Settled by the owner policy (handoff 2026-09-28: Marie's own
   title-page notes go in as margin/other at the first entry, cf. 080 «Femme nue»)**, applied at apply time
   (`title_notes.py`, final → final2): `margin` paragraphs right after the heading of the Livre's first entry —
   002/1873-02-16 ¶278 «[Annotation: 1880. Je prie l'Editeur…]» (new), 010/1873-09-23 ¶2756–2757 «Jour de mon
   plus grand malheur…» (new), 012/1873-11-01 old 011.0450 «Malheureux journal !…», 013/1873-11-21 old
   013.0006 «La veille de son mariage…». Still withdrawn: the title formulas («appartenant à Moi, une bête de
   quatorze ans», 013.0004), addresses, and her mother's 1901 note on Livre 3 (003 ¶601–602), not Marie's.
2. **002/1873-02-02.md**: this page, written at the end of Livre 2, is dated «Lundi 2 février 1873»
   (2 Feb 1873 was a Sunday). It sorts first in 002, and 001 also has a 1873-02-02 entry. Is that
   acceptable?
3. **Cosmetic heading differences left alone**: «Vendredi, 21 mars» / «Mercredi, 2 avril» / «Lundi,
   28 avril» / «Mercredi, 30 avril» / «Jeudi, 1er mai» (no year), «1 septembre», «1 octobre»,
   «1 novembre», «1 décembre», «1 janvier» for «1er», and 007's ten «aout» headings. Aligning them needs
   18 more `set_french` and resets those entries' flags.
4. **006/007 `_original` has lost its accents** in about 125 paragraphs («etait», «tres», «Voila»,
   «aout», «dechiree»). This is a separate restoration from the docx and is not part of this rebuild.
5. 010/1873-10-14 «[Pas d'entrée pour cette date]» is dropped: the manuscript has no 14 Oct date line.

## Withdrawn cover pages

### Livre 1

- tome01.docx ¶127:
  ```text
  Carnet N° 1
  ```
- _original 001.0004 (old ID):
  ```text
  Du 11 janvier 1873 au 12 février 1873
  ```
- _original 001.0001 (title line only) (old ID):
  ```text
  Carnet N° 1
  ```

### Livre 2

- tome01.docx ¶276:
  ```text
  Carnet N° 2
  ```
- tome01.docx ¶277:
  ```text
  *Mon Journal* commencé le dimanche 16 février 1873 terminé le mercredi 12 mars 1873 appartenant à Mlle Marie de Baschkyrtseff [sic] Promenade des Anglais, n° 51 Villa d’Acqua Viva, Nice
  ```
- tome01.docx ¶278: **restored as a margin paragraph (Owner questions 1)**
  ```text
  [Annotation: 1880. Je prie l’Editeur de supprimer dans ce livre et les suivants les redites sur le duc de Hamilton.]
  ```

### Livre 3

- tome01.docx ¶599:
  ```text
  Carnet N° 3 Mon journal commencé le jeudi 13 mars 1873 à midi terminé le lundi 14 avril 1873 à 9 heures appartenant à Mlle Marie de Baschkyrtseff [sic] Promenade des Anglais, n° 51, Nice Villa d’Acqua Viva
  ```
- tome01.docx ¶601:
  ```text
  [Annotation de la mère de Marie]
  ```
- tome01.docx ¶602:
  ```text
  1901. *Maria, Nice. Je suis née stupide, je mourrai stupide. M. S. Bashkirtseff.*
  ```

### Livre 4

- tome01.docx ¶879:
  ```text
  Carnet N° 4 Mon journal
  commencé le mardi 15 avril 1873
  terminé le samedi 17 mai 1873 à dix heures moins vingt minutes du soir
  appartenant
  ```
- tome01.docx ¶883:
  ```text
  à Mlle Marie de Baschkyrtseff [sic] promenade des Anglais, n° 51 villa d’Acqua Viva
  ```

### Livre 5

- tome01.docx ¶1231:
  ```text
  Carnet N° 5
  Mon journal
  ```
- tome01.docx ¶1233:
  ```text
  commencé le dimanche 18 mai 1873 terminé le dimanche 15 juin 1873, à huit heures vingt-cinq minutes appartenant à Mlle Marie de Baschkyrtseff [sic] promenade des Anglais, n° 51 villa d’Acqua Viva, Nice
  ```

### Livre 6

- tome01.docx ¶1556:
  ```text
  Carnet N° 6
  ```
- _original 006.0001 (old ID):
  ```text
  Carnet N° 6
  ```
- _original 006.0002 (old ID):
  ```text
  Mon journal
  ```
- _original 006.0003 (old ID):
  ```text
  commencé le lundi 16 juin 1873, à 10 heures du soir terminé le samedi 12 juillet 1873, à 12 heures moins 7 minutes et demie
  ```
- _original 006.0004 (old ID):
  ```text
  appartenant
  ```
- _original 006.0005 (old ID):
  ```text
  à Mlle Marie de Baschkyrtseff [sic] promenade des Anglais, n° 51, villa d'Acqua Viva Villa Baquis, quartier de la Buffa
  ```

### Livre 7

- tome01.docx ¶1810:
  ```text
  Carnet N° 7 [commencé le dimanche 13 juillet 1873 terminé le dimanche 10 août 1873] Nice
  ```

### Livre 8

- tome02.docx ¶131:
  ```text
  Carnet N° 8
  Mon Journal
  commencé le lundi 11 août 1873
  terminé le dimanche 31 août 1873
  appartenant
  à Mlle Marie de Bachkyrtseff [sic]
  Ringstrasse, Vienne, Grand Hôtel n° 243-4
  depuis le 18 août, Paris, Grand Hôtel, n° 273-2
  Jeudi le 28 août à Nice
  ```

### Livre 9

- tome02.docx ¶1437:
  ```text
  Carnet N° 9
  Mon journal
  commencé le lundi 1er septembre 1873
  terminé le lundi 22 septembre 1873 à neuf heures un quart
  appartenant
  à Mlle Marie de Bachkyrseff [sic]
  rue de la Buffa, villa Baquis, Nice
  ```


### Livre 10
- tome02.docx ¶2753: (the last two lines, ¶2756–2757, **restored as a margin paragraph, Owner questions 1**)
  ```text
  Cahier N° 10
  Mon journal
  commencé le mardi 23 septembre 1873
  terminé le lundi 13 octobre 1873, 10 heures un quart
  appartenant à Marie de Bachkirzseff [sic]
  rue du Temple, villa Baquis, Nice
  Jour de mon plus grand malheur jusqu’à présent, et toujours.
  En ce jour mes espérances sont brisées et pour être heureuse... Dieu seul peut me rendre heureuse !
  ```

### Livre 11

- tome02.docx ¶4325:
  ```text
  Carnet N° 11
  ```
- _original 011.0002 (old ID):
  ```text
  [Carnet N° 11 - Malheur - commencé le mercredi 15 octobre 1873, terminé le samedi 1er novembre 1873, appartenant à Mlle Marie de Bachkirzeff [sic], rue du Temple, villa Baquis, Nice]
  ```

### Livre 12

- tome02.docx ¶5782:
  ```text
  Carnet N° 12
  ```
- _original 011.0446 (old ID):
  ```text
  Carnet N° 12
  ```
- _original 011.0447 (old ID):
  ```text
  Mon malheureux journal
  ```
- _original 011.0448 (old ID):
  ```text
  commencé le samedi 1er novembre 1873
  terminé le jeudi 20 novembre 1873
  appartenant
  à moi
  ```
- _original 011.0449 (old ID):
  ```text
  rue du Temple, villa Baquis, Buffa, Nice.
  ```
- _original 011.0450 (old ID): **restored as a margin paragraph (Owner questions 1)**
  ```text
  Malheureux journal ! Ces trois derniers livres 10, 11, 12 sont remplis de misères ! Je ne fais ce malheureux journal que pour savoir combien de peines j'avais et combien de fois mes espérances sont misères ensuite.
  ```

### Livre 13

- tome02.docx ¶7132:
  ```text
  Carnet N° 13
  ```
- _original 013.0002 (old ID):
  ```text
  Mon misérable journal
  ```
- _original 013.0003 (old ID):
  ```text
  commencé le vendredi 21 novembre 1873
  terminé le mardi 9 décembre 1873
  appartenant
  ```
- _original 013.0004 (old ID):
  ```text
  à Moi, une bête de quatorze ans.
  ```
- _original 013.0005 (old ID):
  ```text
  Rue du Temple, villa Baquis, Nice
  ```
- _original 013.0006 (old ID): **restored as a margin paragraph (Owner questions 1)**
  ```text
  La veille de son mariage est terminé ce wretched livre ! Après son mariage une ère nouvelle commence pour moi.
  ```
- _original 013.0001 (title line only) (old ID):
  ```text
  Carnet N° 13
  ```

### Livre 14

- tome02.docx ¶8509:
  ```text
  Carnet N° 14
  Mon journal
  ```
- _original 014.0002 (old ID):
  ```text
  Mon journal
  ```
- _original 014.0003 (old ID):
  ```text
  commencé le mercredi 10 décembre
  terminé le jeudi 1er janvier 1874
  appartenant à moi.
  ```
- _original 014.0004 (old ID):
  ```text
  Rue du Temple, villa Baquis, Nice.
  ```

## Post-write fixes (apply, 2026-09-28)

- `pre_fix.py`: fr/013 013.0001 two-line embedded block split (tool refuses set_french on it).
- `add_rsr.py`: RSR note on the 50 `set_french` paragraphs (`_original`).
- `post_fix.py`: tool bug, still present at 7a0f5a11e — cross-carnet moves duplicate a footnote definition
  (cz/009 1873-09-01 `[^1]`, en/012 1873-11-01 `[^5]`); the second copy removed. en/009 old 009.0001 embedded
  heading fixed (pre-existing).
- `post_fix2.py`: tool bug — when `set_french` turns an old plain date line into the entry heading (010 «Mercredi
  1er octobre 1873», 012 «Samedi 1er novembre 1873 (suite)»), cz/uk/en/fr got a second scaffolded heading
  (`# TODO`) and a wrong «SOURCE CHANGED … must be trimmed» ED note; removed, the existing translation line made
  the heading.


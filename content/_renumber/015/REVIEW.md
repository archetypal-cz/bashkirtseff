# Carnets 015–030 rebuild (tome03.docx, tome04.docx): review (2026-09-28)

Plans: `plan-015.json` … `plan-030.json`, run together (`just rebuild-carnets plan-0*.json --write`) because paragraphs cross carnet boundaries.
They were drafted with `just rebuild-draft-plan` and every judgement point was reviewed by hand; the review is the script `fix.py` (with `fixlib.py`), which turns the drafts into these plans and writes the decision log at the end of this file.
Source: tome03.docx (Livres 15–20, 2 January – 4 July 1874) and tome04.docx (Livres 21–30, 5 July 1874 – 2 April 1875). Neither tome has a scan PDF, so there are no printed-page citations; new paragraphs cite docx ¶.

## Summary

| Carnet | Paragraphs | Carried | Moved in | Moved out | New | Dropped | Entries |
|---|---|---|---|---|---|---|---|
| 015 | 336 | 330 | 0 | 0 | 6 | 0 | 24 (+0 −0) |
| 016 | 416 | 414 | 0 | 0 | 2 | 0 | 27 (+2 −1) |
| 017 | 502 | 480 | 0 | 0 | 22 | 0 | 34 (+0 −0) |
| 018 | 370 | 334 | 0 | 0 | 36 | 0 | 26 (+0 −0) |
| 019 | 436 | 414 | 0 | 0 | 22 | 1 | 35 (+0 −1) |
| 020 | 583 | 535 | 0 | 0 | 48 | 2 | 34 (+0 −2) |
| 021 | 563 | 516 | 0 | 0 | 47 | 1 | 19 (+0 −0) |
| 022 | 464 | 463 | 0 | 47 | 1 | 1 | 16 (+0 −0) |
| 023 | 287 | 209 | 68 | 0 | 10 | 0 | 37 (+2 −0) |
| 024 | 418 | 408 | 0 | 21 | 10 | 4 | 40 (+0 −1) |
| 025 | 270 | 264 | 0 | 0 | 6 | 1 | 23 (+0 −0) |
| 026 | 40 | 40 | 0 | 0 | 0 | 1 | 5 (+0 −0) |
| 027 | 397 | 366 | 22 | 0 | 9 | 0 | 30 (+0 −0) |
| 028 | 279 | 235 | 1 | 22 | 43 | 1 | 27 (+0 −0) |
| 029 | 229 | 225 | 0 | 1 | 4 | 1 | 30 (+1 −0) |
| 030 | 458 | 361 | 0 | 0 | 97 | 1 | 42 (+9 −0) |

- **Cross-carnet moves** (the Livre boundaries in the manuscript):
  - 022.0465–0510 → 023: Livre 23 begins in the middle of 8 August 1874 («Samedi 8 août 1874 - suite», docx ¶1307). 1874-08-08 is now an entry in both 022 and 023.
  - 024.0001–0021 → 023/1874-09-16: the entry of Wednesday 16 September (Marie's account of 13–16 September) stands before the Livre 24 title page (docx ¶2219–2247). The old URL 024/1874-09-16 redirects to 023/1874-09-16.
  - 028.0002–0023 → 027/1874-12-24: the text of Jeudi 24 décembre stands before the Livre 28 title page (docx ¶3657–3683).
  - 029.0001 → 028/1875-01-20: «Mercredi 20 janvier 1875» with the torn-out leaves and the poem stands before the Livre 29 title page (docx ¶4046–4060); the rest of 20 January («On m'a apporté mes robes…») opens Livre 29. 1875-01-20 is an entry in both 028 and 029.
  - The draft moved 480 paragraphs of 017 into 016 because it did not read «[Carnet] N° 17» as a Livre heading (fixed in the drafter meanwhile, ba398e4b7), and 016.0281 into 017 on a repeated sentence; both reverted.
- **Days shifted by one** (the heading-date sweep of 2026-09-26): 027 from 18 December and 028 up to 20 January held each day's text under the next day's heading. The text now sits under the manuscript's date line. In 028 the wrong date line was the first line of the moved cluster, so it is corrected with `set_french` (028.0216 0218 0226 0241 0250, 029.0001 0014): the translations get an `ED: SOURCE CHANGED` note and still show the old translated date line — fix those headings in cz/uk/en/fr.
- **Invented date lines dropped:** 019.0221 «Vendredi, 15 mai 1874», 020.0373 «Mardi, 23 juin 1874», 020.0388 «Mercredi, 24 juin 1874». Neither the docx nor the raw carnet has them; the text stays under the day Marie wrote (14 May; 22 June, «depuis lundi 22 je n'ai rien écrit»). Their URLs redirect.
- **Date lines the drafter misread** (entries kept as in `_original`): «Merceredi 8 avril», «Lund 20 avril», «Mercredi 9 septembe», «Mardi 6 octore», «Mardi Gras 9 février», and «12 février Duc de Hamilton.» (text, not a date line). Marie's double dates stay two entries where the weekdays differ (015 «Mardi 21 / Mercredi 21 janvier» = 20/21 January; 028 «Mardi 6 / Mercredi 6 janvier» = 5/6 January), as in `_original`; where she repeated the same weekday and date (028 «Jeudi 14 janvier» twice, 027 «Jeudi 18» then «Vendredi 18 décembre») the second date line is kept as a `##` sub-heading in the same entry.
- **Empty days:** 14 February 1874 (016: «Samedi 14 février» then «Dimanche 15 février… Je n'ai rien écrit hier») becomes its own «[Aucun texte - date seule mentionnée]» entry; the old 1874-02-14-15 URL redirects to 1874-02-15. Heading-only entries already in `_original` are kept as they are.
- **Empty clusters kept.** The drafter drops the text-less clusters that hold old RSR entry summaries (91 in 016, 019, 020, 022, 023). Dropping them changes an entry's paragraph list and so resets the translations' approval flags (it would have reset 62 approved entries in 019–020 alone), so they stay.
- **Printed footnotes:** the edition's own notes stay out («[NdT]» 015, «(Nd R)» 024). Footnotes whose text is Marie's own remark are kept, as `_original` already does for 020.0158 and 020.0166, now with `kind: other` and source «Note de Marie, imprimée en bas de page dans Mon Journal»: 015 «Laid et poussiéreux, je ne le compte pas», 016 «Je ne pensais pas à ces choses-là… j'avais douze ans», 027 «belle-mère de la Prodgers…».
- **Kinds:** Marie's later annotations («[Annotation: 1880. …]») are `other` with the source «Annotation ultérieure de Marie, <year>»; bracketed marginal notes `margin`; struck paragraphs `rayé`; the editors' notes about the manuscript `editorial` (existing markers from d4dd02b2c/672b977ac are kept); the copy of Marie's letter to Berthe (19 July 1874) `letter`; Marie's tally of the days she saw the duke of Hamilton (end of Livre 24) `other`. The drafter's `letter` guesses on dialogue lines («- Monsieur, …») were removed.
- **Text of new paragraphs:** docx text, italics as `*…*`, typographic apostrophes and quotes straightened as in `_original`. OCR is otherwise verbatim (the `★` marks are the transcription's own, as in `_original`). 028/029 `_original` text is accent-stripped (a pre-existing extraction defect); the restored paragraphs keep the docx accents.

## Drawings

Tomes 3–4 have no scan PDF; the pictures are the docx's embedded facsimiles (low resolution, as printed). They are cut to WebP under `src/frontend/public/images/marie/drawings/<carnet>/tome0N-imgNN.webp` and listed under `drawings:` in the `_original` entry, after the paragraph that precedes the picture (or the editors' «[Note de l'éd. : ici un dessin…]»). Translations fall back to the French captions.

- 015/1874-01-13.md, after 015.0149: `tome03-img01.webp` (101×96, 2 KB)
- 017/1874-02-24.md, after 017.0032: `tome03-img04.webp` (30×51, 1 KB)
- 017/1874-02-25.md, after 017.0043: `tome03-img05.webp` (46×46, 1 KB)
- 018/1874-04-05.md, after 018.0124: `tome03-img07.webp` (236×354, 19 KB)
- 019/1874-05-01.md, after 019.0073: `tome03-img09.webp` (171×150, 4 KB)
- 020/1874-06-09.md, after 020.0199: `tome03-img19.webp` (610×914, 74 KB)
- 020/1874-06-09.md, after 020.0199: `tome03-img20.webp` (590×904, 95 KB)
- 023/1874-08-31.md, after 023.0254: `tome04-img09.webp` (287×102, 6 KB)
- 024/1874-10-08.md, after 024.0271: `tome04-img17.webp` (59×82, 2 KB)
- 024/1874-10-25.md, after 024.0402: `tome04-img18.webp` (74×129, 3 KB)
- 024/1874-10-03.md, after 024.0226: `tome04-img26.webp` (585×842, 99 KB)
- 027/1874-12-16.md, after 027.0240: `tome04-img25.webp` (200×146, 7 KB)
- 028/1875-01-01.md, after 028.0108: `tome04-img27.webp` (377×656, 51 KB)
- 030/1875-03-21.md, after 030.0276: `tome04-img31.webp` (282×277, 16 KB)

Not used: tome03 images 2, 3, 6, 8, 10–18 and tome04 images 1–3, 5–8, 10–16, 19–24, 28, 29, 32 are scan artefacts (page edges, fingers, the bookbinder's clamp); tome03 image 21 is the library stamp (back matter); tome04 image 30 is a blank page; tome04 image 4 (an engraved ornamental monogram, 23 July 1874) looks like printed matter rather than Marie's pen — owner question. The editors' notes «ici un dessin» at 018.0036 (28 March), 019.0142 (8 May), 025.0264 (18 November), 027.0010 (25 November) and 029.0001 (20 January) have no usable picture in the docx (the slot holds a page-edge crop).

## Prerequisite fixes (before the rebuild)

- cz/020/1874-06-25.md lacked 020.0399 (the editors' note «[Papier à en-tête Hôtel de l'Europe, Spa]»); en/019/1874-05-08.md lacked 019.0142 («[Note de l'éd. : ici un dessin…]»). Both added (renumber-check fails on a text paragraph a tree lacks).
- Glossary citation of the form `CCC.YYYY-MM-DD` (GEORGES.md «028.1874-12-28») read as a paragraph ID `CCC.1874` → «028/1874-12-27», where that text now is. (GIOIA.md, listed in the first run, no longer needs it at HEAD.)
- fr 028/029 (unedited tree): the embedded French of the clusters whose date line the plan corrects (028.0216 0218 0226 0241 0250, 029.0001 0014) was one multi-line comment block, which rebuild-carnet refuses for `set_french`; split into one comment per line.
- en: stale embedded French that renumber-check (d) fails on, visible English unchanged — a stray copy of 021.0499's French in 021.0500, 030.0237's sentence doubled into 030.0238, and the heading copies of 030.0303/0313/0322/0341 that also held the next paragraph's first sentence.

## Typo corrections

- Owner policy: the printed edition's obvious typesetting typos are corrected via `set_french`. Tomes 3–4 have no scan PDF, so the note cites the docx ¶. Corrected: 020.0194 «après- demain» → «après-demain». The rest of the typo scan (`typos.py`) was left as it stands: «estl» sits inside a [Rayé:] passage, «fourures» and «rappellée» may be Marie's own spellings (owner questions).

## Post-write fix

- The tool's flag-reset ED comment names the source of a cross-carnet move as «024/1874-09-16.md», which renumber-check (c) reads as a link to the removed entry (a known false positive, reported for the toolsmith). `postfix.py` rewrites that mention inside the rebuild's ED comments as «024, 1874-09-16.md».

## Gates

Run on main after the write, the drawings and postfix.py (2026-09-28):

- `just renumber-check CCC` for 015–030: PASS for all 16 (0 fail; the warnings are the text-less RSR-summary clusters the translations lack, and stale embedded French in uk/023 and en/016 that `just resync-french` can refresh). Before postfix.py, 023 FAILed only on the tool's own ED comment «…024/1874-09-16.md» in cz/uk/en/fr (known false positive, see above).
- `just verify-carnet` + `just splicescan` for _original, cz, uk, en, fr × 015–030: PASS and 0 splice hits for all 80.
- `just check-comments _original cz uk en fr`: OK.
- `just source-completeness 015 … 030`: 0 missing diary text. The unmatched docx rows are the withdrawn cover and title pages (Livres 17–24, below), plus tome04 ¶857–868, Walitsky's acrostic, which `_original` 022/1874-07-25 has one line per paragraph (the docx merges the lines, so the matcher misses it).

## Owner questions

1. **tome04 image 4** (23 July 1874): an engraved ornamental monogram. It looks like printed matter (letterhead or a pasted-in vignette) rather than Marie's pen, so it is not linked. Include it as a facsimile? (Default: left out.)
2. **Spellings left as printed:** «estl» (inside a [Rayé:] passage), «fourures», «rappellée». Typesetting typos to correct, or Marie's own spellings to keep? (Default: kept.)
3. **028/029 translated date lines:** the `set_french` corrections of 028.0216 0218 0226 0241 0250, 029.0001 0014 leave each translation (cz/uk/en/fr) showing the old translated date line, with an `ED: SOURCE CHANGED` note. These headings need fixing in the translation wave (not an owner decision; listed so it is not lost).

## Withdrawn cover pages

> **Update.** Title-notes pass 2026-09-29 (`_renumber/titlenotes-2026-09-29/`, owner policy: Marie's own notes on title/flyleaf pages go in as `margin`/`other` at the carnet's first entry; the formal title lines stay withdrawn; the carnet was renumbered): the Livre 15 crosswise note «[En travers: J'ai déjà écrit deux mille sept cents pages !!!!]» (tome03.docx ¶41) is now **015.0002** (`margin`), after the heading of 1874-01-02. The title lines below stay withdrawn.

Owner decision (KRR, 2026-09-28): no cover or title-page entries until the manuscript is scanned; the printed edition alone cannot show which lines are Marie's. Nothing below is in `_original`. Lines that `_original` already had are dropped from it (their IDs are in the maps as `DROPPED`); the others were never added. Restore from here once the manuscript can be checked.

### Livre 15

- tome03.docx ¶38–40:

  ```
  Livre 15eme
  Mon Journal
  commencé le vendredi 2 janvier 1874
  terminé le samedi 25 janvier 1874
  appartenant à Moi,
  Rue du Temple, Villa Baquis, Nice
  ```
- tome03.docx ¶41:

  ```
  [En travers : J’ai déjà écrit deux mille sept cents pages !!!!]
  ```

### Livre 16

- tome03.docx ¶519–522:

  ```
  Livre 16eme
  Mon journal
  commencé le lundi 26 janvier 1874
  terminé le samedi 21 février 1874
  appartenant à moi
  rue du Temple, Villa Baquis, Nice
  ```

### Livre 17

- tome03.docx ¶1047–1051:

  ```
  [Carnet] N° 17
  Mon journal
  commencé le dimanche 22 février 1874
  terminé le mercredi 27 mars 1874
  appartenant à moi.
  Rue du Temple, villa Baquis, Nice
  ```

### Livre 18

- tome03.docx ¶1747–1748:

  ```
  Carnet 1 8eme
  de mes bêtises
  appartenant à moi
  commencé le samedi 28 mars 1874
  terminé le jeudi 23 avril 1874
  rue du Temple, villa Baquis, Nice
  ```

### Livre 19

- tome03.docx ¶2254–2258:

  ```
  CARNET 19eme
  de mes pensées
  commencé le vendredi 24 avril 1874
  terminé le vendredi 29 mai 1874
  appartenant à moi
  rue du Temple, villa Baquis, Nice
  depuis le 12 mai Paris
  Hôtel Scribe, appartement 22 au premier.
  ```

### Livre 20

- tome03.docx ¶2812–2818:

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Carnet 20eme
  de ce qui me passe par la tête
  commencé le samedi 30 mai 1874 terminé le samedi 4 juillet 1874
  appartenant à moi
  rue Scribe hôtel Scribe, 32, Paris !
  depuis le 3 juin hôtel des Iles Britanniques, app.32
  rue de la Paix
  Hôtel de l’Europe depuis le 22 juin, appart. [mot illisble]
  ```

### Livre 21

- tome04.docx ¶45–48:

  ```
  Livre 21eme
  Mon journal
  commencé le dimanche 5 juillet 1874 terminé le 23 juillet 1874
  Spa, Maison Willem Lausberg
  ```
- tome04.docx ¶751:

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```
- _original 021.0517 (1874-07-23.md):

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```

### Livre 22

- tome04.docx ¶752–757:

  ```
  Livre 22ème
  commencé le vendredi 24 juillet 1874 terminé le samedi 8 août 1874
  Maison Willem Lausberg, Spa
  [Carte de visite insérée avant la première page:
  De la part du *Baron Charles de Gericke d’Herwynen* Maria Douchenka
  1874, 22 juillet, Spa]
  ```
- _original 022.0464 (1874-08-08.md):

  ```
  Livre 23ème
  commencé le vendredi 8 août 1874
  terminé à la Cour de Londres, Spa, jeudi 13 août 1874 Ostende, Hôtel de France, appar. 8-9
  depuis jeudi 20 août, rue Longue, 104, au premier, terminé le 13 septembre 1874
  ```

### Livre 23

- tome04.docx ¶1303–1304:

  ```
  Livre 23ème
  commencé le vendredi 8 août 1874
  ```
- tome04.docx ¶2252:

  ```
  H[is] G[race] t[he] D[uke] o[f] Hamilton]
  ```

### Livre 24

- tome04.docx ¶2253:

  ```
  Livre 24ème
  ```
- tome04.docx ¶2256:

  ```
  Nice, depuis le 1er octobre Promenade des Anglais, 55bis
  ```
- tome04.docx ¶2789:

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```
- _original 024.0022 (1874-09-16.md):

  ```
  H[is] G[race] t[he] D[uke] o[f] Hamilton]
  ```
- _original 024.0023 (1874-09-16.md):

  ```
  Livre 24^ème^
  ```
- _original 024.0024 (1874-09-16.md):

  ```
  commencé le jeudi 17 septembre 1874 terminé le 26 octobre 1874
  ```
- _original 024.0025 (1874-09-16.md):

  ```
  Paris, hôtel des Iles Britanniques, au premier
  ```

### Livre 25

- tome04.docx ¶2790–2791:

  ```
  Livre 25ème
  commencé le mardi 27 octobre 1874 terminé le mercredi 18 novembre 1874
  ```
- tome04.docx ¶2792:

  ```
  Promenade des Anglais, 55 bis, en ma villa, Nice
  ```
- _original 025.0265 (1874-11-18.md):

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```

### Livre 26

- tome04.docx ¶3120–3121:

  ```
  Livre 26ème
  commencé le jeudi 19 novembre 1874 terminé le lundi 23 novembre 1874
  ```
- tome04.docx ¶3172:

  ```
  H[is] G[race] t[he] D[uke] o[f] Hamilton]
  ```
- _original 026.0041 (1874-11-23.md):

  ```
  H[is] G[race] t[he] D[uke] o[f] Hamilton]
  ```

### Livre 27

- tome04.docx ¶3173–3174:

  ```
  Livre 27ème
  commencé le mardi 24 novembre 1874 terminé le jeudi 24 décembre 1874
  ```
- tome04.docx ¶3685:

  ```
  H[is] Gfrace] t[he] D[uke] o[f] H[amilton]
  ```

### Livre 28

- tome04.docx ¶3686–3687:

  ```
  Livre 28ème
  commencé le vendredi 25 décembre 1874 terminé le mercredi 20 janvier 1875
  ```
- tome04.docx ¶3688:

  ```
  Promenade des Anglais, 55 bis, en ma villa, Nice
  ```
- tome04.docx ¶4067:

  ```
  [H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```
- _original 028.0024 (1874-12-25.md):

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```

### Livre 29

- tome04.docx ¶4068:

  ```
  Livre 29èrne
  ```
- tome04.docx ¶4069:

  ```
  commencé le mercredi 20 janvier 1875 terminé le jeudi 18 février 1875
  Promenade des Anglais, 55 bis, en ma villa, Nice]
  ```
- tome04.docx ¶4514:

  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  ```
- _original 029.0002 (1875-01-21.md):

  ```
  [H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Livre 29ème
  commencé le mercredi 20 janvier 1875 terminé le jeudi 18 février 1875
  Promenade des Anglais, 55 bis, en ma villa, Nice]
  ```

### Livre 30

- tome04.docx ¶4515:

  ```
  Livre 30ème
  ```
- tome04.docx ¶4517:

  ```
  Promenade des Anglais 55 bis, en ma villa
  ```
- _original 030.0002 (1875-02-19.md):

  ```
  [Livre 30ème commencé le vendredi 19 février 1875 terminé le vendredi 2 avril 1875 - Promenade des Anglais 55 bis, en ma villa]
  ```

## Decision log (per carnet)

Generated from the plan-review script (`fix.py`, kept next to the plans).

### Entries kept as in `_original` (drafter misread a date line) (9)

- **015** 1874-01-20.md, 1874-01-21.md kept as in _original: the manuscript dates both entries «21 janvier» (Mardi 21, then Mercredi 21); Tuesday was the 20th, so the first stays 1874-01-20 as in _original
- **016** 1874-02-07.md kept as in _original: the docx lines here come from a garbled two-column OCR; _original holds the complete text in reading order
- **018** 1874-04-07.md, 1874-04-08.md kept as in _original: the date line «Merceredi 8 avril» (OCR) was not recognised by the drafter
- **018** 1874-04-19.md, 1874-04-20.md kept as in _original: the date line «Lund 20 avril» (OCR) was not recognised by the drafter
- **020** 1874-06-17.md kept as in _original: «12 février Duc de Hamilton.» was read as a date line by the drafter
- **023** 1874-09-08.md, 1874-09-09.md kept as in _original: the date line «Mercredi 9 septembe 1874» (OCR) was not recognised by the drafter
- **024** 1874-10-05.md, 1874-10-06.md kept as in _original: the date line «Mardi 6 octore 1874» (OCR) was not recognised by the drafter
- **028** 1875-01-05.md, 1875-01-06.md kept as in _original: the manuscript dates both entries «6 janvier» (Mardi 6, then Mercredi 6); Tuesday was the 5th, so the first stays 1875-01-05 as in _original
- **029** 1875-02-08.md, 1875-02-09.md kept as in _original: the date line «Mardi Gras 9 février 1875» was not recognised by the drafter

### Entry decisions (3)

- **016** 1874-02-14: date line only → «[Aucun texte…]» entry; 016.0282 opens 1874-02-15
- **023** 1874-09-16 (024.0001–0021) kept as one entry: «Dimanche 13 septembre» inside it is Marie's retrospective sub-date, not a new day
- **030** 1875-04-02: heading 030.0359, then the tome04 text (docx ¶5078–5088), then 030.0360–0362 (the continuation from tome05)

### Paragraphs moved by hand (3)

- **016** 016.0281 back to docx ¶881: the drafter matched «Que je suis malheureuse aujourd'hui !» to 1 March (¶1189 «Ah ! que je suis…») and took ¶881 for new text
- **018** 018.0310 → 018/1874-04-21.md: «Lundi 20 - suite.» sits after the 21 April text in the manuscript (docx ¶2223–2224)
- **024** 024.0026 (date line) back before 024.0027 («Je pense qu'on peut beaucoup supprimer dans ce livre…», written on the title page) as in _original

### `set_french` (completions, date lines, struck words) (40)

- **015** 015.0133: restore the struck word «[Rayé: assez]» (docx ¶232)
- **015** 015.0290: complete the sentence cut at a page break (docx ¶451 + ¶456)
- **015** 015.0026: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0027: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0032: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0037: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0051: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0058: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0062: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0085: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0097: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0098: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0103: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0135: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0137: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0150: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0171: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0178: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0218: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0226: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0234: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0248: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0281: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0292: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **015** 015.0300: restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)
- **016** 016.0282: the old cluster held both date lines; 14 February becomes its own empty day
- **017** 017.0097: complete the sentence cut at a page break (docx ¶1184 + ¶1188)
- **019** 019.0374: complete the paragraph cut at a page break (docx ¶2745 + ¶2749)
- **020** 020.0194: complete the paragraph cut at the facsimile pages (docx ¶3068–3076)
- **020** 020.0279: complete the sentence cut at a page break (docx ¶3185 + ¶3189)
- **022** 022.0465: Marie's date line «Samedi 8 août 1874 - suite» opens Livre 23 (docx ¶1307); made a heading
- **028** 028.0216: its date line «Samedi 16 janvier» is dropped: the text is Vendredi 15 (docx ¶3990), whose heading 028.0214 now precedes it
- **028** 028.0218: text of Samedi 16 janvier (docx ¶3993)
- **028** 028.0226: text of Dimanche 17 janvier (docx ¶4004)
- **028** 028.0241: text of Lundi 18 janvier (docx ¶4023)
- **028** 028.0250: text of Mardi 19 janvier (docx ¶4035)
- **029** 029.0001: text of Mercredi 20 janvier, before the Livre 29 title page (docx ¶4046)
- **029** 029.0014: text of Jeudi 21 janvier (docx ¶4086)
- **029** 029.0182: the date line as Marie wrote it (docx ¶4377)
- **020** 020.0194: typos corrected «après- demain» → «après-demain»

### Drafter completions rejected (they duplicated a neighbouring paragraph) (8)

- **015** 015.0277: the docx paragraph also holds 015.0278, which _original keeps as its own paragraph; no text is missing
- **016** 016.0412: the docx paragraph also holds 016.0401–0411, which _original keeps as its own paragraph; no text is missing
- **024** 024.0282: the docx paragraph also holds 024.0283, which _original keeps as its own paragraph; no text is missing
- **024** 024.0426: the docx paragraph also holds 024.0425, which _original keeps as its own paragraph; no text is missing
- **025** 025.0225: the docx paragraph also holds 025.0224, which _original keeps as its own paragraph; no text is missing
- **026** 026.0029: the docx paragraph also holds 026.0028, which _original keeps as its own paragraph; no text is missing
- **026** 026.0031: the docx paragraph also holds 026.0030, which _original keeps as its own paragraph; no text is missing
- **030** 030.0092: the docx paragraph also holds 030.0091, which _original keeps as its own paragraph; no text is missing

### Old paragraphs dropped (invented date lines) (3)

- **019** 019.0221 «# Vendredi, 15 mai 1874»: date line «Vendredi, 15 mai 1874» invented by the extraction: neither tome03.docx nor the raw carnet has it; the text stays under Jeudi 14 mai (docx ¶2524–2558)
- **020** 020.0373 «# Mardi, 23 juin 1874»: date line «Mardi, 23 juin 1874» invented by the extraction: neither tome03.docx nor the raw carnet has it; the text stays under Lundi 22 juin (Marie: «depuis lundi 22 je n'ai rien écrit»)
- **020** 020.0388 «# Mercredi, 24 juin 1874»: date line «Mercredi, 24 juin 1874» invented by the extraction: neither tome03.docx nor the raw carnet has it; the text stays under Lundi 22 juin (Marie: «depuis lundi 22 je n'ai rien écrit»)

### New paragraphs added by hand (4)

- **017** 1874-03-01.md: «Ah ! que je suis malheureuse aujourd'hui !» — the 1 March line, distinct from 016.0281
- **018** 1874-04-21.md: «Lundi 20 - suite.» — the label of the addendum
- **028** 1875-01-14.md: «## Jeudi 14 janvier 1875» — the repeated date line of 14 January
- **022** 1874-07-24.md: «De la part du Baron Charles de Gericke d'Herwynen Maria Douchenka
1874» — the visiting card Marie put before the first page of Livre 22

### New paragraphs edited (17)

- **015** docx ¶457: split into 2 paragraphs — two docx paragraphs; OCR «I» → «!»
- **018** docx ¶2036: OCR «Oh Paris I» → «Oh Paris !»
- **021** docx ¶153: drop «d'arriver.», the end of 021.0086 repeated after the page break
- **024** docx ¶2770: Marie's tally of the days she saw the duke of Hamilton (docx ¶2770–2782, a table the OCR broke: two cells of the January column are blank)
- **027** docx ¶3529: the second date line of 18 December (Marie wrote «Jeudi 18» and then «Vendredi 18»), kept as a sub-heading
- **017** docx ¶1069: typos corrected «lui- même» → «lui-même»
- **018** docx ¶1915: typos corrected «Tepla- koff» → «Teplakoff»
- **018** docx ¶1919: typos corrected «rafraî-chie» → «rafraîchie»
- **020** docx ¶3199: typos corrected «parti-culier» → «particulier»
- **020** docx ¶3201: typos corrected «au- dessus» → «au-dessus»
- **020** docx ¶3303: typos corrected «peut- être» → «peut-être»
- **023** docx ¶1604: typos corrected «Zurybarren» → «Jurybarren»
- **030** docx ¶4724: typos corrected «dis- je» → «dis-je»
- **030** docx ¶4776: typos corrected «indiffférents» → «indifférents»
- **030** docx ¶4782: typos corrected «criai- je» → «criai-je»
- **030** docx ¶4803: typos corrected «veus sortir» → «veux sortir»
- **030** docx ¶4804: typos corrected «davan- tage» → «davantage»

### Drafter "new" text dropped (page numbers, OCR debris, page-break repeats, printed footnotes) (44)

- **015** docx ¶204 «i»: OCR debris
- **018** docx ¶2242 «I»: OCR debris
- **020** docx ¶3171 «'i»: OCR debris
- **021** docx ¶698 «48»: printed page number (picture-caption style), not text
- **023** docx ¶1555 «! ! !»: OCR debris
- **023** docx ¶1954 «126»: printed page number (picture-caption style), not text
- **023** docx ¶2108 «134»: printed page number (picture-caption style), not text
- **023** docx ¶2223 «142»: printed page number (picture-caption style), not text
- **024** docx ¶2514 «166»: printed page number (picture-caption style), not text
- **024** docx ¶2612 «174»: printed page number (picture-caption style), not text
- **027** docx ¶3504 «244»: printed page number (picture-caption style), not text
- **028** docx ¶4013 «280»: printed page number (picture-caption style), not text
- **030** docx ¶4692 «332»: printed page number (picture-caption style), not text
- **030** docx ¶4906 «347»: printed page number (picture-caption style), not text
- **030** docx ¶5042 «356»: printed page number (picture-caption style), not text
- **015** docx ¶229 «2 Gâteau pascal au fromage blanc [NdT]»: printed-edition footnote marked [NdT] (translator's gloss of a Russian word)
- **015** docx ¶232 «tesse de Galve, je l'ai vue [Rayé: assez] plus que les autres.»: page-break repeat of the end of 015.0133 («…la com-/tesse de Galve»); its struck word goes into 015.0133
- **015** docx ¶456 «la nuit pour en commencer une autre presque semblable.»: appended to 015.0290 (same sentence)
- **016** docx ¶754 «non loin de
Avant
Howard me
leva aussi;»: entry 1874-02-07.md restored as in _original
- **017** docx ¶1188 «ces dames à la gare; je vais avec Machenka chez Rumpelmayer.»: appended to 017.0097 (same sentence)
- **017** docx ¶1274 «Pourquoi sommes-nous si malheureux I Pourquoi ne veut-on»: page-break repeat of the start of 017.0162
- **017** docx ¶1290 «ments.»: page-break repeat of the end of 017.0170 («…embellisse-ments»)
- **018** docx ¶1909 «folie s'est prè-
les yeux fermés,
gauche le prince»: words of 018.0121 printed around the facsimile (image7); already in _original
- **018** docx ¶2006 «Merceredi 8 avril 1874»: entry 1874-04-07.md restored as in _original
- **018** docx ¶2208 «Lund 20 avril 1874»: entry 1874-04-19.md restored as in _original
- **019** docx ¶2749 «sœurs. Elle est grasse mais jolie et un air satisfait et heureux. Elle»: appended to 019.0374 (same paragraph)
- **020** docx ¶3250.5 «Duc de Hamilton.»: «12 février Duc de Hamilton.» is text (020.0314), not a date line
- **020** docx ¶3076 «sa fille à cheval avec l'homme commode, M. Zveguinzoff. Nous arrêtons »: appended to 020.0194 (same sentence)
- **020** docx ¶3189 «avec étonnement.»: appended to 020.0279 (same sentence)
- **021** docx ¶185 «J CUI IO.»: OCR debris («J CUI IO.»)
- **021** docx ¶208 «m H S' hal||le|b°nhoUr-,d aV0'r un saint'bernard je le nomme Nothmah. »: garbled OCR of 021.0134 (same text)
- **021** docx ¶307 «enfa	d°nnera'S des man'ères, il les a trop libres et trop»: garbled OCR of the end of 021.0211
- **022** docx ¶857 «Descendant d'Achille Admirateur du roi d'Ephèse Papari poulous grec Et»: the acrostic lines are already in _original, one line per paragraph (022.0084–0087)
- **022** docx ¶859 «Monarque à demi sauvage Aux quatre yeux Albin Body Pas d'autre rime qu»: the acrostic lines are already in _original (022.0089–0097)
- **023** docx ¶1805 «Ma tante:»: already in 023.0194
- **023** docx ¶1995 «nous»: already in 023.0202 (German verse)
- **023** docx ¶2110 «première fois.»: page-break repeat inside 023.0203
- **023** docx ¶2159 «Mercredi 9 septembe 1874»: the misspelt date line «Mercredi 9 septembe»; 023.0206 already opens 9 September
- **024** docx ¶2557 «Mardi 6 octore 1874»: entry 1874-10-05.md restored as in _original
- **024** docx ¶2783 «1 Marie a rencontré leduc de Hamilton (Nd R)»: printed-edition footnote «(Nd R)»
- **025** docx ¶2832 «contente.»: page-break repeat of the end of 025.0032
- **028** docx ¶3819 «ri., tpvtp- 3 octobre 1874 Page manuscrite du texte.»: caption of the facsimile page (image26), used for the drawing entry, not diary text
- **028** docx ¶4056 «Et c'est là seulement que je comprends la vie»: already in 029.0001 (the poem)
- **029** docx ¶4377 «Mardi Gras 9 février 1875»: the date line «Mardi Gras 9 février 1875»; 029.0182 already opens 9 February

### Kinds set (31)

- **017** 017.0147 → other (Annotation ultérieure de Marie, 1875): Marie's later annotation
- **017** 017.0160 → other (Annotation ultérieure de Marie, 1875): Marie's later annotation
- **019** 019.0338 → other (Annotation ultérieure de Marie, 1880): Marie's later annotation
- **020** 020.0296 → other (Annotation ultérieure de Marie, 1876): Marie's later annotation
- **022** 022.0469 → other (Annotation ultérieure de Marie, 1875): Marie's later annotation
- **023** 023.0142 → other (Annotation ultérieure de Marie, 1876): Marie's later annotation
- **028** 028.0088 → other (Annotation ultérieure de Marie, 1880): Marie's later annotation
- **028** 028.0240 → other (Annotation ultérieure de Marie, 1880): Marie's later annotation
- **029** 029.0032 → other (Annotation ultérieure de Marie): Marie's later annotation
- **030** 030.0046 → other (Annotation ultérieure de Marie): Marie's later annotation
- **030** 030.0087 → other (Annotation ultérieure de Marie): Marie's later annotation
- **030** 030.0343 → other (Annotation ultérieure de Marie): Marie's later annotation
- **015** new ¶156 → other («Laid et poussiéreux, je ne le compte pas»): footnote in Marie's voice («Laid et poussiéreux, je ne le compte pas»), not the editors'
- **016** new ¶948 → other («Je ne pensais pas à ces choses-là, je n'en savais »): footnote in Marie's voice («… j'avais douze ans»)
- **016** 016.0400 → editorial: the editors' note introducing the struck fragments (docx ¶1040)
- **016** 016.0401 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0402 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0403 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0404 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0405 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0406 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0407 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0408 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0409 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0410 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **016** 016.0411 → rayé: unfinished phrase Marie struck out (docx ¶1040–1041)
- **020** 020.0158 → other (Note de Marie, imprimée en bas de page dans Mon Journal): Marie's own note printed as a footnote (as the new ones in 015/016/027)
- **020** 020.0166 → other (Note de Marie, imprimée en bas de page dans Mon Journal): Marie's own note printed as a footnote (as the new ones in 015/016/027)
- **021** new ¶533–544 → letter: the copy of Marie's letter to Berthe (19 July 1874)
- **021** 021.0488 → editorial: the editors' description of the torn page corner with the surviving word fragments
- **027** new ¶3582 → other («belle-mère de la Prodgers. jeune et passable à qui»): footnote in Marie's voice (docx style «Footnote»: «belle-mère de la Prodgers…»)

### Kind guesses removed (9)

- **020** 020.0350: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **020** 020.0476: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **021** 021.0365: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **021** 021.0399: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **025** 025.0230: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **027** 027.0262: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **027** 027.0306: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **028** 028.0039: dialogue or narration, not a copied letter (drafter guess from a salutation)
- **029** 029.0141: dialogue or narration, not a copied letter (drafter guess from a salutation)

### Empty clusters kept (5)

- **016** 3 empty clusters (old RSR summaries) kept in place, not dropped: 016.0221, 016.0315, 016.0346
- **019** 29 empty clusters (old RSR summaries) kept in place, not dropped: 019.0074, 019.0080, 019.0093, 019.0099, 019.0112, 019.0130, 019.0136, 019.0153, 019.0161, 019.0167, 019.0171, 019.0177, 019.0197, 019.0220, 019.0228, 019.0252, 019.0274, 019.0287, 019.0296, 019.0307, 019.0318, 019.0323, 019.0342, 019.0358, 019.0361, 019.0375, 019.0380, 019.0393, 019.0415
- **020** 36 empty clusters (old RSR summaries) kept in place, not dropped: 020.0014, 020.0020, 020.0106, 020.0111, 020.0115, 020.0131, 020.0142, 020.0149, 020.0178, 020.0182, 020.0195, 020.0204, 020.0214, 020.0232, 020.0245, 020.0280, 020.0288, 020.0310, 020.0330, 020.0335, 020.0356, 020.0361, 020.0365, 020.0372, 020.0387, 020.0389, 020.0400, 020.0407, 020.0413, 020.0434, 020.0453, 020.0458, 020.0488, 020.0504, 020.0517, 020.0537
- **022** 12 empty clusters (old RSR summaries) kept in place, not dropped: 022.0211, 022.0249, 022.0269, 022.0354, 022.0355, 022.0365, 022.0387, 022.0408, 022.0418, 022.0431, 022.0458, 022.0511
- **023** 11 empty clusters (old RSR summaries) kept in place, not dropped: 023.0021, 023.0033, 023.0045, 023.0057, 023.0061, 023.0072, 023.0087, 023.0113, 023.0150, 023.0173, 023.0185

### Cover handling (per carnet) (39)

- **015** cover entry 1874-01-02-cover.md not created (title page withdrawn)
- **016** cover entry 1874-01-26-cover.md not created (title page withdrawn)
- **017** cover entry 1874-02-22-cover.md not created (title page withdrawn)
- **018** cover entry 1874-03-28-cover.md not created (title page withdrawn)
- **019** cover entry 1874-04-24-cover.md not created (title page withdrawn)
- **020** cover entry 1874-05-30-cover.md not created (title page withdrawn)
- **021** cover entry 1874-07-05-cover.md not created (title page withdrawn)
- **021** docx ¶751 «H[is] G[race] t[he] D[uke] o[f] H[amilton]»: title-page line, withdrawn
- **022** cover entry 1874-07-24-cover.md not created (title page withdrawn)
- **023** cover entry 1874-08-08-cover.md not created (title page withdrawn)
- **023** docx ¶2252 «H[is] G[race] t[he] D[uke] o[f] Hamilton]»: title-page line, withdrawn
- **024** cover entry 1874-09-17-cover.md not created (title page withdrawn)
- **024** docx ¶2256 «Nice, depuis le 1er octobre Promenade des Anglais, 55bis»: title-page line, withdrawn
- **024** docx ¶2789 «H[is] G[race] t[he] D[uke] o[f] H[amilton]»: title-page line, withdrawn
- **025** cover entry 1874-10-27-cover.md not created (title page withdrawn)
- **025** docx ¶2792 «Promenade des Anglais, 55 bis, en ma villa, Nice»: title-page line, withdrawn
- **026** cover entry 1874-11-19-cover.md not created (title page withdrawn)
- **026** docx ¶3172 «H[is] G[race] t[he] D[uke] o[f] Hamilton]»: title-page line, withdrawn
- **027** cover entry 1874-11-24-cover.md not created (title page withdrawn)
- **027** docx ¶3685 «H[is] Gfrace] t[he] D[uke] o[f] H[amilton]»: title-page line, withdrawn
- **028** cover entry 1874-12-25-cover.md not created (title page withdrawn)
- **028** docx ¶3688 «Promenade des Anglais, 55 bis, en ma villa, Nice»: title-page line, withdrawn
- **028** docx ¶4067 «[H[is] G[race] t[he] D[uke] o[f] H[amilton]»: title-page line, withdrawn
- **029** cover entry 1875-01-20-cover.md not created (title page withdrawn)
- **029** docx ¶4069 «commencé le mercredi 20 janvier 1875 terminé le jeudi 18 fév»: title-page line, withdrawn
- **029** docx ¶4514 «H[is] G[race] t[he] D[uke] o[f] H[amilton]»: title-page line, withdrawn
- **030** cover entry 1875-02-19-cover.md not created (title page withdrawn)
- **030** docx ¶4517 «Promenade des Anglais 55 bis, en ma villa»: title-page line, withdrawn
- **021** 021.0517 «H[is] G[race] t[he] D[uke] o[f] H[amilton]»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **022** 022.0464 «Livre 23ème
commencé le vendredi 8 août 1874
terminé à la Cour de Lond»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **024** 024.0022 «H[is] G[race] t[he] D[uke] o[f] Hamilton]»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **024** 024.0023 «Livre 24^ème^»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **024** 024.0024 «commencé le jeudi 17 septembre 1874 terminé le 26 octobre 1874»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **024** 024.0025 «Paris, hôtel des Iles Britanniques, au premier»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **025** 025.0265 «H[is] G[race] t[he] D[uke] o[f] H[amilton]»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **026** 026.0041 «H[is] G[race] t[he] D[uke] o[f] Hamilton]»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **028** 028.0024 «H[is] G[race] t[he] D[uke] o[f] H[amilton]»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **029** 029.0002 «[H[is] G[race] t[he] D[uke] o[f] H[amilton]
Livre 29ème
commencé le me»: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)
- **030** 030.0002 «[Livre 30ème commencé le vendredi 19 février 1875 terminé le vendredi »: withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)


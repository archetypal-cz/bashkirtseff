# 082 rebuild plan: review (worker A, 2026-09-28)

Plan: `final/plan-082.json`, built by `tools/fix_082.py ROOT` (ROOT = a tree with the prerequisite applied)
from `common/plan-082.json`. Run with 081: `just rebuild-carnets final/plan-081.json final/plan-082.json`.
Dry run (scratch copy with the prerequisite, and main without it): not rejected. Method as in REVIEW-081.

## Prerequisite: `tools/prereq_082.py REPO_ROOT [--check]` (apply before --write; idempotent, refuses on surprises)

1. `_original/082`: the 2026-08-14 dedup (8067b5aac) left 12 page-overlap echo lines — the first text line of
   a cluster repeating the preceding cluster's last line: 0003–0007, 0016, 0017, 0020 (08-09), 0082 (08-14),
   0104, 0105, 0107 (08-18). cz, uk, en and fr translate each of these clusters as its own second line only
   and keep the echo comment-only, so the echo line is deleted from _original (when the echo had italics the
   kept line lacked, the kept line takes its wording). 0020, 0082, 0105, 0107 become empty and the plan drops them.
2. `_original/082/1878-08-27.md`: the four LAN/RSR notes on «la catastrophe», «corsage», «fourrer» and Marie's
   «intimate confession» move from 0160 (Anitchkoff) to 0159 (Bismarck), where the dedup had left them one off.
3. `en/082` relabel (the dedup kept a different copy in en): 08-27 0160→0159, 0161→0160; 08-30 0184→0183,
   0185→0184; 09-04 0223→0222, 0224→0223; 09-09 0280→0279, 0281→0280. cz, uk and fr already match _original.
4. `en/082/1878-09-09.md`: the stray empty marker 0275 stacked above 0273 moves below 0274.
5. `en/082/1878-08-10.md`: the translation of «[En travers: Démente ! Ce n'est pas vrai.]» moves from 0031
   (a legacy comment copy, dropped by the plan) to 0033.

Effect shown in the scratch copy `wA/root` (diffs: 8, 1, 3, 8 lines in _original; 4, 4, 4, 7, 2 in en).

## Canonical text for the lead's questions

- **09-09 «C'est triste…»**: the print (Mon Journal t.12 p.115, ¶1261–1263) has «C'est triste, bien triste une
  vie pareille !» / «Madame Antonsky écrit…» / «C'est triste, bien triste une vie pareille.» — Marie wrote it
  twice. _original (0273, 0274, 0275) already has the manuscript order; en translated only the first (0275 stays
  empty in en). The plan pins 0273 → ¶1261 and 0275 → ¶1263 (`_docx`).
- **08-27 Bismarck**: text canonical as in _original (0159 Bismarck, 0160 Anitchkoff); notes moved (prereq 2).
- **-evening / -late files**: the tome has no such sub-entries.
  - «Vendredi 4 octobre 1878» (¶1467) is a bare date line followed at once by «Samedi 5 octobre 1878» (print p.132).
    What _original filed as 4 October and «4 octobre (Soir)» (the Mouzay letter, the matinée, «Quelle affreuse
    existence…», 0427–0445) is 3 October's text in the manuscript (¶1448–1466). The plan: 3 October = its text
    in manuscript order; 0426 (heading «(Soir)») dropped; 0437 keeps 4 October's heading + the placeholder;
    `redirect_from 1878-10-04-evening.md` → 1878-10-03.
  - 12 October (¶1530–1562) is one entry. The headings 0495 «(Soir)» and 0513 «(Tard)» are dropped; the text is
    in manuscript order (0530–0535, 0496–0512, 0514–0520); both old files redirect to 1878-10-12.

## Counts

| | |
|---|---|
| entries | 70 (7 added: 08-26, 09-14, 09-20, 09-24, 10-01, 10-02, 10-08; 3 removed: 10-04-evening, 10-12-evening, 10-12-late) |
| old paragraphs carried | 486 |
| new paragraphs | 129 |
| dropped | 64 (42 empty placeholders from the draft + 22 listed below) |
| set_french | 49 (with `_rsr` notes) |
| kinds | letter 32 old + 3 new, margin 2 old + 3 new, rayé 3 new |
| flag resets | 61 entries per translation tree |

## Structure decisions

- **8 August «- suite»** (¶861–862), the first page of Livre 82 after its title page: a new paragraph
  «Que diable, au fait non.» under the heading «Jeudi 8 août 1878 - suite...». 081.0499 (the title page plus
  this sentence) is dropped in the 081 plan. 083.0002–0003 left this plan (worker B).
- **Drops** besides the draft's empty placeholders: 0020, 0082, 0105, 0107 (echoes, see prereq); 0031 (legacy
  comment copy of 0033); 0036, 0134 (empty; uk held duplicate translations of 0035/0133); 0100, 0101
  («[Note de transition: Départ de Soden…]», an extraction note, not in the manuscript); 0161, 0185, 0224, 0281
  (empty dedup slots); merged-day headings 0323, 0355, 0371, 0423, 0482 (the entries 09-15, 09-21, 09-25, 10-03,
  10-09 get the manuscript heading through `heading`; translations get «# TODO» there); 0426, 0495, 0513.
- **17 August**: ¶1021 «Encore ce matin nous étions à Soden…» is 17 August; 0103 moved from 18 August.
- **19–20 August**: 0112 = ¶1035–1036 (the extraction elided its middle); new ¶1034; 0113 = ¶1038–1039 after
  new ¶1037. Multedo's letter to Dina (¶1044–1055) is 20 August (the draft filed it under 19 August by its
  date line): new ¶1044 «Multedo écrit à Dina, voici sa lettre.», 0125 = the letter (quoted, docx text,
  replacing _original's «[...]» elisions).
- **26 August**: the draft missed the date line «Lundi 26 aoûtl 878» (¶1088); 26 August is its own entry again.
- **14 October**: 0543 «Multedo écrit à Dina.» is ¶1569 (the draft had moved it to 20 August on a short match).
- Bare date lines kept as placeholders: 14, 20, 24 Sep, 1, 2, 8 Oct (new), 26 Sep (0380), 4 Oct (0437).
- Streamtile completions, the ¶870 «[Mots noircis: Le vieux prince italien]», ¶1083, ¶1400 bracket repairs;
  many inline «[Mots noircis: …]», «[Rayé: …]», «[Une ligne cancellée: …]» that _original had dropped are back.

## Kinds

- letter: 0075–0076 (Marie's note to the princes, sent in German, 14 Aug — see question 3), new ¶988–998
  («Cher Comte», 15 Aug), 0125 (Multedo to Dina), new ¶1105–1111 (to her brother Paul, 27 Aug), 0289–0293 (to
  Marcuard, 10 Sep, with the margin note new ¶1281 as `margin`), 0310–0314 (to Paul, 13 Sep), 0373–0379 + new
  ¶1381–1396 (C. Collignon, Nice, 22 Sep), 0438–0441 (Mme de Mouzay, [28 Sep]), 0522–0529 (to Paul, 11 Oct).
- margin: 0033, 0384, new ¶1174, ¶1199, ¶1281. rayé: new ¶913–914, ¶1170, ¶1428.
- Removed guesses: all old «Monsieur/Madame/Mademoiselle X…» letter guesses (0112 0178 0501), new ¶1007 and
  every Body-text-(4) «clipping» guess (small print = letters).

## Withdrawn cover pages

- tome12 ¶856–860, Mon Journal t.12 p.77: «Gloriae Cupiditas / Livre 82ème / commencé le jeudi 8 août 1878 /
  terminé le mercredi 16 octobre 1878 / Soden Kurhaus / Depuis le 17 août Paris, avenue de l'Alma, 67»
  (_original had it in 081.0499, dropped).

## Left out

The edition's source footnotes ¶1287 «, p 495-496», ¶1376 «* Ibid, p; 505-506»; footnote calls at the head of
¶988, 1045, 1277, 1373, 1448 (fix12.json). OCR fixed: «Nés amitiés» → «Mes amitiés» (¶997), «Qe tiens» →
«(je tiens» (¶1276), «qu'/7s» → «qu'ils» (¶1041).

## Owner questions

1. 0190: _original has Marie's English «kitchen» with the footnote «In English in the original»; the print
   (¶1136) has «cuisine». The plan keeps «kitchen» and its footnote. Which is right?
2. 4 and 12 October: the «(Soir)» / «(Tard)» sub-entries are not in the tome and are dissolved (above). OK?
3. 0075–0076 «Réponse. / Les colombes ne fréquentent pas les oies. / Colombe adorée.» (small print, the note
   Marie had the Coubés post in German) are marked `letter`. Keep, or plain diary?
4. Reconcile took the docx word where the difference is not an OCR slip: 0199 «manche» → «mince». 0295 is not
   changed and keeps _original's «a fréquemment honoré la tribune»; the print reads «abruti» (¶1286). Which?

## Post-apply (after --write)

- en: the stray stacked markers (0118 above 0117 etc.) are all empty dropped slots; the rebuild removes them.
- Translation trees: new headings «# TODO» in 08-08, 09-15, 09-21, 09-25, 10-03, 10-09 and the placeholder days;
  SOURCE CHANGED notes on the 49 changed clusters; en lacks a translation of 0275 (second «C'est triste»).
- Optional: `_rsr` → `RSR:` comments.
- Drawings: none in Livre 81–82 (no docx picture, no picture slot, no scan figure; the «caricature»/«croquis»
  mentions are Marie's words). `drawings-081.json` and `drawings-082.json` are empty.

## Lead review (resumed session, 2026-09-28)

### Printer's typos corrected (owner policy 2026-09-28)

Each one is noted in the paragraph's RSR (`rsr` of a new paragraph, `_rsr` → RSR comment on an old one). Marie's own spellings and «[sic]» cases stay.

- new ¶920: Printer's typo corrected: «télicieux» → «délicieux» (Mon Journal t.12 p.82).
- new ¶944: Printer's typo corrected: «terrase» → «terrasse» (Mon Journal t.12 p.84).
- new ¶1134: Printer's typo corrected: «cerceuil» → «cercueil» (Mon Journal t.12 p.102).
- 082.0182: Printer's typo corrected: «noricis» → «noircis», «tristese» → «tristesse» (Mon Journal t.12 p.103).
- new ¶1198: Printer's typo corrected: «espirt» → «esprit» (Mon Journal t.12 p.110).
- new ¶1212: Printer's typo corrected: «noirici» → «noirci» (Mon Journal t.12 p.112).
- 082.0293: Printer's typo corrected: «Bashkitseff» → «Bashkirtseff» (Mon Journal t.12 p.117).
- 082.0318: Printer's typo corrected: «cancéllées» → «cancellées» (Mon Journal t.12 p.119).
- new ¶1428: Printer's typo corrected: «aures» → «autres» (Mon Journal t.12 p.128).

### Fixes applied by `tools/fix_lead.py` (run after `tools/fix_082.py`)

- new ¶1088 «Lundi 26 aoûtl 878» removed: it is the date line of 26 August, which 082.0151 already carries as the entry's heading (it sat as a text paragraph at the end of 25 August).
- Inline labels the extraction dropped, restored by `set_french` with an RSR note (docx ¶): 0037 «[Mot noirci: tire]» ¶893; 0078 «[Mot noirci: russe]» ¶962; 0132 «[Rayé: fondées]» ¶1063; 0149 «[Mot noirci: aussitôt]» ¶1085; 0152 «[Mots noircis: est tout récent]» ¶1087 (print «noiricis», typo noted); 0155 «[Mot cancellé: vrai]» ¶1094; 0179 «[Mot noirci: tirai]» ¶1140; 0328 «[Mots noircis: qu'un homme qui suscite de ne plus le regretter]» ¶1321; 0406 «[Rayé: tandis]» ¶1424; 0524 «[Rayé: même]» ¶1524.
- 082.0474: printer's typo «espirt» → «esprit» (old cluster).

Scans run on the final plan (`g/artscan.py`, `g/lost.py`, `g/breaks.py`): repeated 6-grams and echoes between neighbours (tiler artefacts: none left), stray page numbers, split-digit gaps, page-break halves, inline labels of the docx missing from the plan text.

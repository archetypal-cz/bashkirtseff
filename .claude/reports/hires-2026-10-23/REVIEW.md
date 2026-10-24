# Independent spot review: Russian-run marks and reading fixes, _original 015–044

Reviewer: Claude (read-only, 2026-10-24). Commits reviewed: 46a61a4241 (015–020), e5f0144b18 (021–025), 7df5778edd (026–030), 9297e472e4 (031–037), a546efc4d7 (038–044).
Method: every verdict below comes from the sharp page image (`content/_raw/scans/hires/TomeN/pNNN.jpg`, rendered with `view.py`). Page numbers are PDF pages. In tome 5 the printed folio is PDF − 1. No file was edited.

## Summary

| | checked | defects |
|---|---|---|
| Primary sample marks (38 random, stratified 1–2 per carnet, plus 9 verse/long runs) | 47 | 0 extent, 0 false |
| Neighbouring marks on the same crops (checked as well) | about 150 | 0 extent, 0 false |
| Whole pages checked for missed runs (T3 p38, p95, p150; T4 p80, p318; T5 p55, p140, p259) | 8 pages, 14 runs | 0 missed, 0 false |
| Reading fixes from the commit messages | 8 | 0 wrong |
| Punctuation and readings at run boundaries | — | 3 minor (all older than the wave) |
| RSR provenance notes | — | 1 contradictory |

Error rate for what the wave set out to do (extent, missed runs, false runs): **0 of 47 primary marks, and 0 of about 200 marks counting the neighbours**. The 95% upper bound on the primary sample is about 6%. Counting the neighbours it is under 2%.
Minor text defects inside or next to marked lines: 3 of about 200 (about 1.5%). None of them was introduced by the wave, but the wave "confirmed" two of these marks and did not catch the defects.

**Judgement: a fuller re-check of the marks is not warranted.** The extents match the print exactly. That holds for the hard cases too: runs that stretch across several dialogue paragraphs and are split one mark per paragraph (019.0394–0396, 030.0007–0016, 031.0024–0035, 032.0041–0044), runs that include a `[Rayé]` (021.0504), editorial glosses inside the stars (020.0428 «[bourdon]») or outside them (040.0062), and verse (022.0080–0105, 023.0218/0220/0227/0228/0498, 039.0252–0258). Italics without stars were consistently left unmarked (018.0327, 022.0078/0079, 039.0205, 017 *fatale* / *prussiate jaune*, 022 p80 *monsieur*, *Jenesais pas quoi*). A cheap mechanical pass for punctuation at run boundaries against the text layer would catch the remaining class of defect (see D1–D3).

## Defects

| # | pid | verdict | evidence | suggested fix |
|---|---|---|---|---|
| D1 | 019.0337 r2 | reading wrong (punctuation) | T3 p201: «C'est pour cela que \*j'ai honte.\*». Source: `==j'ai honte==[^019.0337.r2]` with no full stop. The mark is older than the wave (already in HEAD~); the wave confirmed it. | `==j'ai honte.==[^019.0337.r2]` |
| D2 | 027.0340 | reading wrong (punctuation) | T4 p251: «Constantin \*n'est-il pas quelque chose pour vous\*. (on voyait…». Source has `==…pour vous==[^027.0340.r2], (on voyait`, a comma where the print has a full stop. Mark extent OK. | replace «, (on» with «. (on» |
| D3 | 041.0205 | reading wrong (missing dash) | T5 p297 (print 296): «- \*Si vingt-cinq âmes … séparément.\*» is printed as a dialogue line. Source starts `==Si vingt-cinq…` with no dash. Mark extent OK. | prefix `— ` (the tree's dialogue dash) |
| D4 | 023.0463 | note defect | Two RSR notes from the same run sit on this paragraph. The first says p.125 «opens a star … and prints no closing star» (correct, seen on the image). The second says «prints the run between stars» (wrong). | delete the second, generic note |

## Cosmetic / pre-existing (not counted as errors)

- **Italics inside stars are handled inconsistently.** In 016.0216 r1 and 016.0219 the source keeps them (`==*la marraine de noce*==`, `==*garçons d'honneur*==`). In 016.0216 r2, 016.0220 and 018.0004 r1/r2 (`==mon dépit==`, italic in print, T3 p135) it drops them. Pick one rule: since the mark already shows the switch, dropping is simpler.
- **Print italics missing from the source** (unrelated to Russian, older than the wave): 016.0226 *toasts*, *Mme Potemkine* (T3 p65); 020.0428 *poussière* (T3 p250); 018 (7 avril entry) *Bute* ×2 (T3 p150); 021.0032 *blunt* (T4 p7).
- **Layout:** 022.0091/0092. The print sets «Aux quatre yeux Albin Body» on one line (T4 p60); the source splits it into two verse paragraphs. 032.0205: the print starts a new paragraph at «On voit ce que j'ai ajouté» (T5 PDF44); the source merges it.
- 023.0227 note (1): the print has «Zurybarren» ×2. The source normalises it to Jurybarren, an older RSR choice (2026-09-28), not a wave error.
- 015.0301: the print puts the comma inside the stars («\* C'est fini maintenant,\*»); the source puts it outside. This is trivial.

## Per-sample verdicts

### Tome 3 (015–020)

| pid | verdict | evidence |
|---|---|---|
| 015.0333 r1 «Choupinski», r2 | OK | T3 p42 |
| 015.0301 (+0299, 0300 r1/r2 «plombs», 0302) | OK | T3 p38 |
| 016.0219 «*garçons d'honneur*» | OK (italics kept, see cosmetic) | T3 p65 |
| 016.0125 «se vanter» | OK | T3 p56 |
| 017.0305 | OK | T3 p114 |
| 017.0221 «en réalité» | OK | T3 p105 |
| 017.0370 (long run «Mais c'est contrariant … se marie») | OK | T3 pp121–122 |
| 017.0368 r1/r2, 017.0371 (margin), 017.0373 r1/r2 «doux», «chaleur» | OK | T3 pp121–122 |
| 017.0130 | OK | T3 p95 |
| 018.0004 r1–r3 | OK (italics dropped, see cosmetic) | T3 p135 |
| 018.0326 r1–r3; 018.0327 italic sentence unmarked | OK | T3 p166 |
| 018.0168 | OK | T3 p150 |
| 019.0394 (+0393 «*échafaud*», 0395, 0396) | OK | T3 p207 |
| 019.0337 r1, r2 | extent OK; **D1** | T3 p201 |
| 020.0428 r1–r3 | OK | T3 p250 |
| 020.0274 (+0270, 0272, 0273 r1/r2) | OK; 0275 is open item A-65 | T3 p234 |

### Tome 4 (021–030)

| pid | verdict | evidence |
|---|---|---|
| 021.0293 | OK | T4 p28 |
| 021.0313 «est indécis» | OK | T4 p30 |
| 021.0504 r1–r3 (long, incl. [Rayé]) | OK | T4 p46 |
| 021.0505 r2, 021.0507, 021.0502 «regarde»; 021.0505 r1 closing star only (A-65/A2 Q6) | OK | T4 p46 |
| 021.0032 | OK | T4 p7 |
| 022.0095, 022.0104 and the whole verse 022.0080–0105 | OK (layout note) | T4 pp59–60 |
| 023.0097 (+0096) | OK | T4 p97 |
| 023.0405 | OK | T4 p120 |
| 023.0218, 023.0220 (verse); 0222–0223 Marie's own version unmarked | OK | T4 p106 |
| 023.0227, 023.0228 (verse; note (1) outside) | OK | T4 pp106–107 |
| 023.0463 (star never closes, closed at stanza end) | OK per A-65; **D4** | T4 p125 |
| 023.0498 (verse), 023.0499 | OK | T4 p129 |
| 024.0175 «bercée» | OK | T4 p163 |
| 025.0112 «paysan» | OK | T4 p197 |
| 026.0019 | OK | T4 p215 |
| 027.0339, 0340 r1/r2, 0341, 0342 r1/r2, 0344 r1/r2, 0346 | extent OK; **D2** on 0340 | T4 p251 |
| 027.0347 r1/r2 | OK (option A of A-65) | T4 p252 |
| 027.0287 «Maria», 027.0290–0291 (letter run) | OK | T4 pp247–248 |
| 027.0251, 027.0252 | OK | T4 p243 |
| 028.0116 «damassé» | OK | T4 p269 |
| 029.0074 r1/r2, 0075 r1/r2, 0076 | OK | T4 p292 |
| 029.0029 «*fêtard*, fêtard» | OK | T4 p287 |
| 030.0221 (+0217–0220, 0222–0223) | OK | T4 p340 |
| 030.0004 r1/r2, 0006–0026 (long multi-paragraph runs) | OK | T4 pp317–318 |
| 030.0368 «Moussinka» | OK | T4 p352 |

### Tome 5 (031–044; PDF page)

| pid | verdict | evidence |
|---|---|---|
| 031.0029 (+0024–0036; 0037–0041 unmarked) | OK | T5 PDF8–9 |
| 032.0044 (+0041 r1–r3, 0042, 0043) | OK | T5 PDF33 |
| 033.0296 (+0293, 0294) | OK | T5 PDF92 |
| 034.0114 | OK | T5 PDF115 |
| 035.0163 (+0161, 0162) | OK | T5 PDF160 |
| 036.0108 (+0105 r1/r2, 0106; 0109 unmarked) | OK | T5 PDF178 |
| 037.0500 (+0499) | OK | T5 PDF216 |
| 038.0228 | OK | T5 PDF236 |
| 039.0216 (+0209, 0210) | OK | T5 PDF259 |
| 039.0252–0258 (verse; editorial 0253/0256 outside), 039.0262 «Obeziana» | OK | T5 PDF262–263 |
| 040.0059 «Akhtyrka», 040.0062 «ispravnik» (gloss outside) | OK | T5 PDF267 |
| 041.0205 | extent OK; **D3** | T5 PDF297 |

## Whole pages checked for missed runs

| page | content | result |
|---|---|---|
| T3 p38 | 015.0294–0302 | 5 runs, all marked exactly |
| T3 p95 | 017 (3 March) | 1 run (017.0130); italics *fatale*, *prussiate jaune* unmarked, correct |
| T3 p150 | 018 (6–7 April) | 1 run (018.0168); verse «Regardez ce petit nez rose» unstarred and unmarked, correct |
| T4 p80 | 022 (3 Aug) | no stars, no marks |
| T4 p318 | 030.0007–0026 | 16 runs, all marked exactly |
| T5 PDF55 | 032 (7–8 May) | no stars, no marks |
| T5 PDF140 | 034 (21 June) | no stars, no marks |
| T5 PDF259 | 039.0198–0216 | 3 runs, all marked; *non* (0205) unmarked, correct |

## Reading fixes checked against the print

All of these are confirmed:
- 017.0429 «Liocha Danilovski» (T3 p127)
- 018.0276 «Gênes» (T3 p160)
- 021.0032 «*Bouver et foumer*» (T4 p7)
- 027.0252 «*carlins*» (T4 p243)
- 029.0029 «*fêtard*, fêtard» (T4 p287)
- 032.0203 «c'est une idylle, notre vie à nous» and the restored words of 032.0205, *Ich diene* and *volo* (T5 PDF44)
- 038.0272 «*je ne m'en fiche pas mal*» (T5 PDF239)
- 019.0393 «*échafaud*» (T3 p207)

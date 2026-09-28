# Source completeness: tomes vs content/_original — 2026-09-27

Windmill task #63, step 1. Read-only analysis; nothing in `content/` was changed.

## Headline

- Tome body text paragraphs (carnets 001–106): **58,576** (10,591,015 chars).
- Paragraphs with no match in `_original`: **7,675** (1,359,004 chars, 12.8% of tome text).
- Of these, **7,373 paragraphs / 1,335,575 chars** sit in 689 reportable gaps (runs of >1 paragraph, or single paragraphs over 300 chars). These merge into 303 gap zones.
- The rest (302 paras, 23,429 chars) are isolated short lines. Most are dialogue lines and page-break fragments; see the false-positives section.
- Known gaps confirmed: 068 (1877-01-19 → 02-09, 02-12 Cancello tail, December cuts), 065/066 (24 Aug → mid-Sept 1876), 100 (1 and 3 June 1883), 073/1877-07-15.
- 072: the gap sits under **19 June**, not 15 June. The text of 072/1877-06-15 is complete against tome10 docx 3150–3196.
- **Much larger than expected.** Whole stretches of 066, 067, 068, 070 and 071 are absent, and 034/035/037/041, 059, 061, 063, 081–086 and 090 also have big holes. Many `_original` files are heading-only stubs, for example 067/1876-10-14 has `para_end: 0`.

## Method

1. **Tomes.** `content/_raw/tome01–16.docx` were dumped with python-docx (`uv run --with python-docx`), one record per `Document.paragraphs` entry. **"docx N" is that 0-based paragraph index**, the same convention as `english-placeholders-2026-09-26.md`. Styles `Header or footer`, `Table of contents` and `Picture caption`, plus bare page numbers, were dropped. Date headings (weekday + digit) and `Livre/Carnet/Cahier` headings were classed as headings, not text.
2. **Body region.** It runs from the first strong match to the line before `INDEX ALPHABETIQUE` / `TABLE DES MATIERES` / the death note (tome 16). The front matter (introduction, genealogy, editorial notes) and the back matter (index, notes) are excluded from the counts.
3. **_original.** Every `content/_original/CCC/*.md` (000–106, README excluded) was read. Frontmatter, every `%% … %%` span (multi-line too), `#` headings, `[//]: #` lines, footnote definitions and footnote refs were stripped. Text was grouped by paragraph ID.
4. **Normalisation.** Ligatures were expanded, accents stripped (100 is accent-stripped in `_original`), text lowercased, and every non-alphanumeric run collapsed to a space. OCR-split digits (`1 876`) were rejoined.
5. **Matching.** Matching uses word 5-gram shingle containment against a global index of all `_original` text, so matching ignores dates and file placement.
   - A tome paragraph is **matched** if ≥50% of its 5-grams occur in `_original`, **partial** if 20–50%, and **unmatched** if under 20%.
   - Paragraphs under 5 words need an exact normalised substring hit.
   - Paragraphs under 8 words that match, and paragraphs under 15 words at 20–50%, are "weak": they neither count as a gap nor break one, so a stray `- Oui.` found elsewhere does not split a gap.
6. **Gaps.** A gap is a maximal run of unmatched paragraphs; headings and empty lines inside it are absorbed. Char counts are unmatched text paragraphs only; headings and weak lines are excluded.
   - Each gap is assigned to a carnet by its nearest strong-match anchors (previous and next matched paragraph with ≥8 words), cross-checked against the tome's `Livre NN` headings.
   - "Zones" merge runs of the same carnet that are separated by 3 or fewer matched paragraphs.
7. **Sanity checks.**
   - Unmatched paragraphs (≥12 words) were re-scored with word 3-grams against their carnet ±1: 95% score below 0.35 and none reach 0.75, so they are not reworded copies.
   - A reverse pass checked for text sitting in a far-away carnet (below).
   - The known gaps from the placeholder report all reappear.

Scratch (not committed): `/tmp/claude-1000/-home-krr-bashkirtseff/467edde8-50c6-480d-80c0-3a213d11ff10/scratchpad/completeness/` — `dump.py` → `tomes.json`; `analyze.py` → `scored.json` (per-paragraph containment); `gaps.py` → **`gaps.json`** (machine-readable: `gaps[]` with `tome`, `docx_start`, `docx_end`, `docx_indices` (exact unmatched paragraph list), `carnet`, `date_heading`, `heads_inside`, `prev_match`/`next_match` anchors (`pid`, `file`), `chars`, `flags`; plus `partials[]` and `percarnet`); `zones.json`; `misplaced.py` → `misplaced.json`; `fpcheck.py` → `fp3.json`; `report.py` writes this file.

## Summary per carnet (sorted by unmatched chars)

Counts are tome body text paragraphs assigned to the carnet. "Gaps" counts reportable runs (>1 para or >300 chars). The last column is the biggest zone.

| Carnet | Tome | Tome paras | Matched | Partial | Unmatched | Unmatched chars | % of chars | Gaps | Largest zone (docx, paras/chars) |
|---|---|---|---|---|---|---|---|---|---|
| 066 | 09 | 1284 | 558 | 39 | 687 | 121,683 | 57.7% | 27 | 522–1140 (524/95,069) |
| 067 | 09 | 1514 | 740 | 49 | 725 | 118,817 | 56.8% | 34 | 1812–2644 (630/93,227) |
| 068 | 09 | 1790 | 1055 | 50 | 685 | 104,202 | 43.1% | 33 | 4150–4634 (391/55,674) |
| 070 | 10 | 1083 | 484 | 54 | 545 | 84,508 | 60.6% | 30 | 1624–2220 (426/67,416) |
| 071 | 10 | 638 | 346 | 20 | 272 | 61,612 | 45.3% | 24 | 2547–2696 (82/18,392) |
| 086 | 13 | 723 | 471 | 14 | 238 | 57,782 | 33.7% | 17 | 1767–1940 (116/26,953) |
| 083 | 12 | 510 | 236 | 68 | 206 | 55,927 | 46.5% | 57 | 1976–2126 (71/20,459) |
| 059 | 07 | 1010 | 654 | 48 | 308 | 47,970 | 29.7% | 32 | 4110–4183 (67/11,879) |
| 090 | 14 | 672 | 513 | 11 | 148 | 39,540 | 24.0% | 7 | 694–939 (158/42,313) |
| 082 | 12 | 646 | 472 | 23 | 151 | 37,238 | 25.0% | 19 | 913–956 (35/6,899) |
| 063 | 08 | 789 | 535 | 20 | 234 | 35,837 | 33.2% | 14 | 3011–3272 (202/28,035) |
| 041 | 05 | 245 | 61 | 23 | 161 | 35,774 | 76.9% | 17 | 4649–4845 (145/32,868) |
| 062 | 08 | 1421 | 1267 | 14 | 140 | 34,033 | 13.6% | 14 | 2586–2599 (14/14,218) |
| 081 | 12 | 756 | 579 | 29 | 148 | 32,921 | 19.6% | 34 | 656–720 (31/6,329) |
| 085 | 13 | 673 | 505 | 13 | 155 | 31,330 | 22.5% | 12 | 486–552 (49/12,235) |
| 034 | 05 | 633 | 420 | 23 | 190 | 31,321 | 35.8% | 16 | 2012–2145 (104/16,789) |
| 050 | 06 | 1422 | 1143 | 32 | 247 | 30,331 | 16.8% | 25 | 3875–3944 (57/8,824) |
| 037 | 05 | 552 | 344 | 17 | 191 | 30,183 | 41.7% | 11 | 3333–3542 (158/24,513) |
| 084 | 12 | 674 | 531 | 17 | 126 | 30,134 | 19.3% | 23 | 2509–2559 (34/5,816) |
| 035 | 05 | 336 | 110 | 23 | 203 | 26,121 | 68.3% | 14 | 2525–2657 (101/13,533) |
| 030 | 04 | 469 | 366 | 11 | 92 | 17,951 | 18.6% | 12 | 4703–4810 (71/14,351) |
| 061 | 08 | 295 | 215 | 8 | 72 | 15,908 | 28.9% | 5 | 1214–1260 (41/10,898) |
| 079 | 11 | 673 | 613 | 4 | 56 | 15,459 | 11.3% | 3 | 3435–3518 (56/15,459) |
| 064 | 08 | 643 | 561 | 7 | 75 | 13,337 | 10.3% | 2 | 4183–4272 (71/13,228) |
| 073 | 10 | 585 | 503 | 11 | 71 | 13,094 | 11.9% | 12 | 3839–3866 (16/3,107) |
| 069 | 10 | 857 | 780 | 7 | 70 | 11,130 | 8.4% | 8 | 606–730 (14/3,343) |
| 055 | 07 | 1309 | 1233 | 7 | 69 | 10,773 | 6.5% | 5 | 2346–2401 (42/7,110) |
| 032 | 05 | 560 | 491 | 5 | 64 | 10,508 | 14.1% | 5 | 870–901 (28/6,625) |
| 018 | 03 | 376 | 332 | 0 | 44 | 10,423 | 13.4% | 4 | 1909–1945 (25/6,987) |
| 076 | 11 | 507 | 460 | 2 | 45 | 9,908 | 11.6% | 5 | 826–842 (11/2,687) |
| 056 | 07 | 685 | 612 | 9 | 64 | 9,734 | 8.0% | 7 | 3241–3287 (40/5,865) |
| 020 | 03 | 556 | 500 | 4 | 52 | 9,376 | 8.5% | 7 | 3430–3458 (18/4,154) |
| 091 | 14 | 582 | 545 | 2 | 35 | 7,345 | 5.3% | 1 | 941–965 (17/2,696) |
| 013 | 02 | 360 | 321 | 4 | 35 | 7,177 | 8.9% | 4 | 7719–7792 (14/3,451) |
| 028 | 04 | 321 | 279 | 3 | 39 | 6,784 | 13.9% | 3 | 3930–3959 (21/3,713) |
| 092 | 14 | 458 | 439 | 2 | 17 | 6,645 | 4.9% | 6 | 1853–1922 (13/5,823) |
| 038 | 05 | 361 | 310 | 5 | 46 | 6,599 | 13.8% | 3 | 3831–3887 (42/6,217) |
| 058 | 07 | 276 | 223 | 5 | 48 | 6,585 | 13.9% | 5 | 3876–3918 (33/4,474) |
| 039 | 05 | 288 | 242 | 4 | 42 | 6,525 | 19.4% | 4 | 4002–4034 (26/3,805) |
| 021 | 04 | 599 | 543 | 8 | 48 | 6,060 | 6.0% | 8 | 531–573 (30/4,648) |
| 008 | 02 | 339 | 313 | 2 | 24 | 5,586 | 6.8% | 3 | 1060–1138 (16/4,440) |
| 060 | 08 | 968 | 910 | 11 | 47 | 5,553 | 5.0% | 5 | 592–652 (43/5,003) |
| 053 | 07 | 607 | 571 | 2 | 34 | 5,270 | 5.1% | 3 | 4474–4507 (32/4,916) |
| 072 | 10 | 552 | 491 | 7 | 54 | 5,127 | 4.3% | 8 | 3336–3389 (39/3,963) |
| 033 | 05 | 530 | 494 | 1 | 35 | 5,091 | 7.2% | 2 | 1124–1154 (26/4,170) |
| 019 | 03 | 402 | 376 | 4 | 22 | 4,938 | 6.2% | 3 | 2380–2398 (14/3,834) |
| 057 | 07 | 192 | 153 | 4 | 35 | 4,848 | 14.9% | 6 | 3461–3497 (27/4,094) |
| 048 | 06 | 828 | 793 | 4 | 31 | 4,516 | 4.4% | 5 | 1576–1602 (20/3,559) |
| 097 | 15 | 371 | 360 | 0 | 11 | 4,485 | 4.2% | 2 | 1278–1289 (6/4,284) |
| 042 | 05 | 69 | 46 | 2 | 21 | 3,996 | 38.6% | 2 | 4900–4930 (23/4,098) |
| 051 | 06 | 493 | 454 | 8 | 31 | 3,948 | 5.2% | 7 | 4440–4471 (21/3,144) |
| 075 | 11 | 581 | 530 | 13 | 38 | 3,903 | 4.6% | 7 | 392–411 (11/1,689) |
| 001 | 01 | 154 | 131 | 0 | 23 | 3,287 | 16.5% | 1 | 26–63 (23/3,287) |
| 101 | 16 | 651 | 626 | 3 | 22 | 2,921 | 2.5% | 3 | 619–631 (9/1,514) |
| 054 | 07 | 673 | 657 | 1 | 15 | 2,796 | 2.9% | 3 | 1088–1098 (9/2,208) |
| 002 | 01 | 294 | 260 | 7 | 27 | 2,669 | 3.6% | 2 | 371–381 (7/982) |
| 004 | 01 | 315 | 306 | 0 | 9 | 2,494 | 2.6% | 2 | 1075–1087 (5/1,273) |
| 099 | 15 | 694 | 678 | 2 | 14 | 2,466 | 2.0% | 3 | 2839–2851 (6/1,460) |
| 100 | 15 | 566 | 558 | 0 | 8 | 2,256 | 1.7% | 2 | 3496–3507 (6/1,696) |
| 047 | 06 | 469 | 452 | 1 | 16 | 2,152 | 3.4% | 3 | 1460–1475 (13/2,000) |
| 031 | 05 | 351 | 341 | 0 | 10 | 2,148 | 4.4% | 1 | 390–412 (10/2,148) |
| 094 | 14 | 376 | 365 | 0 | 11 | 2,110 | 1.8% | 1 | 3140–3166 (9/2,062) |
| 017 | 03 | 504 | 479 | 4 | 21 | 2,081 | 1.8% | 5 | 1596–1617 (14/1,221) |
| 024 | 04 | 432 | 418 | 1 | 13 | 2,019 | 2.3% | 2 | 2523–2534 (8/1,892) |
| 077 | 11 | 633 | 618 | 5 | 10 | 1,856 | 2.0% | 3 | 1411–1429 (8/1,738) |
| 005 | 01 | 266 | 256 | 1 | 9 | 1,756 | 2.0% | 2 | 1532–1543 (8/1,738) |
| 095 | 15 | 394 | 386 | 0 | 8 | 1,728 | 1.7% | 1 | 374–393 (7/1,708) |
| 093 | 14 | 420 | 413 | 0 | 7 | 1,702 | 1.1% | 1 | 2404–2415 (7/1,702) |
| 023 | 04 | 729 | 708 | 0 | 21 | 1,630 | 1.6% | 1 | 1598–1623 (19/1,590) |
| 027 | 04 | 386 | 375 | 3 | 8 | 1,548 | 2.0% | 1 | 3287–3299 (6/1,459) |
| 011 | 02 | 474 | 460 | 2 | 12 | 1,440 | 1.8% | 2 | 5442–5481 (10/1,357) |
| 029 | 04 | 373 | 365 | 0 | 8 | 1,102 | 1.7% | 1 | 4086–4099 (3/752) |
| 096 | 15 | 406 | 396 | 0 | 10 | 998 | 0.8% | 3 | 1145–1151 (3/445) |
| 025 | 04 | 262 | 256 | 0 | 6 | 890 | 1.8% | 1 | 2862–2874 (5/872) |
| 007 | 01 | 377 | 367 | 0 | 10 | 822 | 1.1% | 1 | 2207–2216 (10/822) |
| 015 | 03 | 342 | 332 | 1 | 9 | 753 | 0.9% | 1 | 456–460 (4/277) |
| 009 | 02 | 291 | 281 | 0 | 10 | 709 | 1.0% | 2 | 2718–2758 (8/649) |
| 045 | 06 | 526 | 512 | 0 | 14 | 669 | 1.1% | 2 | 550–562 (12/565) |
| 105 | 16 | 768 | 763 | 0 | 5 | 636 | 0.5% | 0 | 4045–4059 (2/334) |
| 106 | 16 | 177 | 172 | 1 | 4 | 633 | 2.8% | 1 | 4211–4227 (4/633) |
| 022 | 04 | 522 | 512 | 0 | 10 | 576 | 0.7% | 2 | 857–868 (2/263) |
| 043 | 05 | 437 | 426 | 0 | 11 | 458 | 0.8% | 1 | 5009–5019 (9/356) |
| 104 | 16 | 750 | 742 | 0 | 8 | 436 | 0.3% | 1 | 2497–2499 (2/150) |
| 098 | 15 | 586 | 579 | 0 | 7 | 432 | 0.3% | 2 | 2540–2546 (5/320) |
| 088 | 13 | 886 | 878 | 0 | 8 | 367 | 0.2% | 1 | 4163–4170 (7/340) |
| 014 | 02 | 426 | 413 | 3 | 10 | 325 | 0.4% | 1 | 9033–9040 (8/266) |
| 010 | 02 | 448 | 445 | 0 | 3 | 289 | 0.3% | 0 | — |
| 087 | 13 | 835 | 826 | 0 | 9 | 282 | 0.2% | 1 | 3071–3086 (4/101) |
| 074 | 10 | 412 | 408 | 0 | 4 | 277 | 0.4% | 1 | 4311–4313 (2/228) |
| 080 | 11 | 771 | 762 | 2 | 7 | 245 | 0.2% | 1 | 4582–4583 (2/141) |
| 016 | 03 | 383 | 375 | 2 | 6 | 243 | 0.3% | 1 | 1047–1052 (3/102) |
| 052 | 06 | 453 | 448 | 0 | 5 | 203 | 0.2% | 1 | 4821–4824 (2/113) |
| 003 | 01 | 246 | 243 | 0 | 3 | 149 | 0.2% | 1 | 870–871 (2/68) |
| 102 | 16 | 733 | 731 | 0 | 2 | 116 | 0.1% | 1 | 1522–1524 (2/116) |
| 046 | 06 | 462 | 459 | 0 | 3 | 115 | 0.2% | 0 | — |
| 006 | 01 | 233 | 230 | 1 | 2 | 101 | 0.1% | 1 | 880–881 (2/101) |
| 036 | 05 | 196 | 194 | 0 | 2 | 85 | 0.4% | 0 | — |
| 012 | 02 | 310 | 307 | 0 | 3 | 84 | 0.1% | 0 | — |
| 078 | 11 | 532 | 529 | 0 | 3 | 72 | 0.1% | 0 | — |
| 065 | 09 | 268 | 267 | 0 | 1 | 31 | 0.1% | 0 | — |
| 089 | 13 | 643 | 642 | 0 | 1 | 1 | 0.0% | 0 | — |
| 103 | 16 | 783 | 783 | 0 | 0 | 0 | 0.0% | 0 | — |
| 049 | 06 | 379 | 379 | 0 | 0 | 0 | 0.0% | 0 | — |
| 044 | 05 | 238 | 238 | 0 | 0 | 0 | 0.0% | 0 | — |
| 040 | 05 | 241 | 241 | 0 | 0 | 0 | 0.0% | 0 | — |
| 026 | 04 | 37 | 37 | 0 | 0 | 0 | 0.0% | 0 | — |

## Top 40 gap zones

| # | Carnet | Tome | docx range | Paras | Chars | Starts under heading | After (_original) | Before (_original) | First words |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 066 | 09 | 522–1140 | 524 | 95,069 | Jeudi 24 août 1 876 (12 août) | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Nous avons encore joué au croquet, papa nous surveillait. Il |
| 2 | 067 | 09 | 1812–2644 | 630 | 93,227 | Mardi 17 octobre 1 876 (5 octobre) | 068.0249 (1877-01-10-18) | 067.0009 (1876-11-09) | Non mais je devine. |
| 3 | 070 | 10 | 1624–2220 | 426 | 67,416 | Lundi 9 avril 1 977 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Ah ! mon empereur, fichus-lecteurs l'intérêt de mon illustre |
| 4 | 068 | 09 | 4150–4634 | 391 | 55,674 | Vendredi 19 janvier 1877 | 068.0261 (1877-01-10-18) | 068.0262 (1877-02-10-12) | J’ai commencé un autre portrait d’Olga, qui me retient jusqu |
| 5 | 090 | 14 | 694–939 | 158 | 42,313 | Vendredi 31 décembre 1880 | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Je vais à l’atelier faire une esquisse, je suis toute seule, |
| 6 | 041 | 05 | 4649–4845 | 145 | 32,868 | Samedi 4 septembre 1875 | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | En sortant de déjeuner je suis accostée par un Américain, un |
| 7 | 066 | 09 | 1559–1738 | 155 | 28,948 | Vendredi 6 octobre 1876 (24 septembre) | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | Alexandre m'a confié une affaire de paysans qui dépend de mo |
| 8 | 063 | 08 | 3011–3272 | 202 | 28,035 | Jeudi 13 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | J’ai reçu Rémy en costume complet de capucin. Oui, en capuci |
| 9 | 086 | 13 | 1767–1940 | 116 | 26,953 | Jeudi 4 décembre 1879 | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | J’ai parlé de l’exposition de Nice à mes maîtres, ils m’appr |
| 10 | 037 | 05 | 3333–3542 | 158 | 24,513 | Mardi 20 juillet 1875 | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | Je suis capable de rester des heures entières dans mon cabin |
| 11 | 067 | 09 | 3321–3390 | 62 | 20,584 | Lundi 11 décembre 1876 | 067.0369 (1876-12-08-11) | 068.0003 (1876-12-12) | 220 Nathalie etc. |
| 12 | 083 | 12 | 1976–2126 | 71 | 20,459 | Samedi 14 décembre 1878 | 083.0284 (1878-12-15) | 083.0360 (1879-01-03) | Cette infamie-là c’est le couronnement de mes misères. Maint |
| 13 | 071 | 10 | 2547–2696 | 82 | 18,392 | Lundi 7 mai 1 877 | 071.0052 (1877-05-06) | 071.0053 (1877-05-11) | La fidélité est un sentiment égoïste qui cesse d’exister du  |
| 14 | 083 | 12 | 1664–1833 | 66 | 17,746 | Jeudi 31 octobre 1878 | 083.0084 (1878-10-30) | 083.0195 (1878-11-24) | Jeudi 31 octobre 1878 |
| 15 | 086 | 13 | 1657–1748 | 54 | 16,937 | Samedi 1 5 novembre 1 879 | 086.0479 (1879-11-15) | 086.0514 (1879-12-02) | Chaudordy est resté très tard à raconter des histoires sur M |
| 16 | 034 | 05 | 2012–2145 | 104 | 16,789 | Mardi 15 juin 1875 | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | J’ai rêvé d’une fontaine jaillissante i.e., position brillan |
| 17 | 068 | 09 | 1740–1810 | 61 | 15,856 | Vendredi 13 octobre 1 876 (1er octobre ) | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | La seule vengeance que je veux. C'est que Dieu lui fasse com |
| 18 | 079 | 11 | 3435–3518 | 56 | 15,459 | Vendredi 19 avril 1878 | 079.0517 (1878-04-18) | 079.0520 (1878-04-19) | Nous allons à l’église où je pèche beaucoup [Mots noircis: p |
| 19 | 071 | 10 | 2396–2473 | 65 | 14,546 | Samedi 28 avril 1 877 | 071.0015 (1877-04-27) | 071.0016 (1877-05-02) | Ce n’est qu’au moment du départ que j’ai éprouvé un soupçon  |
| 20 | 030 | 04 | 4703–4810 | 71 | 14,351 | Dimanche 7 mars 1875 | 030.0150 (1875-03-06) | 030.0152 (1875-03-07) | Dimanche 7 mars 1875 |
| 21 | 062 | 08 | 2586–2599 | 14 | 14,218 | Mardi 27 juin 1876 | 062.0632 (1876-06-27) | 062.0634 (1876-06-27) | Il me dit avec un gracieux sourire « dans un moment je suis  |
| 22 | 062 | 08 | 2366–2461 | 79 | 13,654 | Samedi 24 juin 1876 | 062.0502 (1876-06-21) | 062.0583 (1876-06-25) | N... non., mais je ne l’ai pas refusé, bref je sais ce que j |
| 23 | 083 | 12 | 1840–1965 | 52 | 13,577 | Dimanche 24 novembre 1878 | 083.0201 (1878-11-25) | 083.0276 (1878-12-14) | Mme Gavini m’a envoyé un coussin brodé par elle et je suis a |
| 24 | 035 | 05 | 2525–2657 | 101 | 13,533 | Vendredi 2 juillet 1875 | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | On lit dans Le Figaro de ce soir: On demande des jeunes gens |
| 25 | 064 | 08 | 4183–4272 | 71 | 13,228 | Lundi 14 août (2 août 1876) | 064.0559 (1876-08-13) | 062.0605 (1876-06-26) | Hier à une heure nous avons quitté Moscou pleine de mouvemen |
| 26 | 034 | 05 | 2232–2325 | 76 | 12,875 | Lundi 21 juin 1875 | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | J’ai reçu la caisse de Worth. C’est une charmante robe de mo |
| 27 | 085 | 13 | 486–552 | 49 | 12,235 | Samedi 1 4 juin 1 879 | 085.0238 (1879-06-13) | 085.0240 (1879-06-17) | Samedi 1 4 juin 1 879 |
| 28 | 059 | 07 | 4110–4183 | 67 | 11,879 | Dimanche 23 avril 1876 | 059.0069 (1876-04-23) | 059.0072 (1876-04-24) | Ah ! nom d’un hippopotame I En ce moment la cloche sonne, je |
| 29 | 070 | 10 | 1168–1407 | 85 | 11,812 | Mercredi 4 avril 1877 | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | - Si nous allions leur acheter du poisson ? |
| 30 | 086 | 13 | 1317–1403 | 56 | 11,112 | Samedi 13 septembre 1879 | 086.0265 (1879-09-13) | 086.0269 (1879-10-01) | Non, ne le croyez pas si bête, car il l’a dit seulement parc |
| 31 | 061 | 08 | 1214–1260 | 41 | 10,898 | Vendredi 26 mai 1876 | 061.0138 (1876-05-26) | 061.0140 (1876-05-27) | Au fait, j’avais besoin pour calmer mon amour-propre, d’ente |
| 32 | 085 | 13 | 595–660 | 52 | 9,410 | Samedi 21 juin 1 879 | 085.0265 (1879-06-21) | 085.0268 (1879-06-23) | Je vous assure que je poussai un vrai cri et m’assis sur le  |
| 33 | 059 | 07 | 4015–4094 | 60 | 9,383 | Vendredi 21 avril 1876 | 059.0052 (1876-04-21) | 059.0058 (1876-04-23) | La course des gentlemen est un divin amusement, cela rappell |
| 34 | 035 | 05 | 2373–2471 | 69 | 8,852 | Vendredi 25 juin 1875 | 034.0446 (1875-06-25) | 035.0002 (1875-07-01) | commencé le samedi 26 juin 1875 terminé le jeudi 8 juillet 1 |
| 35 | 050 | 06 | 3875–3944 | 57 | 8,824 | Dimanche 19 décembre 1875 | 050.0800 (1875-12-19) | 050.0802 (1875-12-19) | Devant ces pensées mes petits désagréments s’évanouissent. J |
| 36 | 068 | 09 | 3569–3635 | 57 | 7,843 | Lundi 18 décembre 1876 | 068.0036 (1876-12-17-18) | 068.0039 (1876-12-19) | Et je pensais à Rome où je pourrais aller si ce monstre le v |
| 37 | 063 | 08 | 2938–2972 | 27 | 7,546 | Lundi 10 juillet 1876 | 063.0132 (1876-07-09) | 063.0135 (1876-07-12) | Ah ! je suis contente, on a payé Binder. On n’a plus cette d |
| 38 | 055 | 07 | 2346–2401 | 42 | 7,110 | Mardi 21 mars 1876 | 055.0933 (1876-03-21) | 055.0935 (1876-03-22) | Je viens de repasser mon dernier livre et je vois que ce n’e |
| 39 | 018 | 03 | 1909–1945 | 25 | 6,987 | Dimanche 5 avril 1874 | 018.0124 (1874-04-05) | 018.0126 (1874-04-06) | folie s’est prè- les yeux fermés, gauche le prince |
| 40 | 082 | 12 | 913–956 | 35 | 6,899 | Lundi 1 2 août 1878 | 082.0064 (1878-08-12) | 082.0074 (1878-08-14) | [Trois lignes cancellées: Expression en jetant par terre, et |

## Text present only in a distant carnet

These tome paragraphs match strongly, but only in a carnet outside the tome's range (±1). All of them are small. Most are Marie's recurring formulas (`H[is] G[race] t[he] D[uke]…`), stock phrases, or the preface quoted in 000. **No large misplaced block was found**: the gaps below are text that is truly absent, not text moved elsewhere.

- tome01 docx 126–126 (1 p, 432 ch) → found in 058 1876-04-19 (058.0173): «Quoique je devienne je lègue mon journal au public. Tous les»
- tome05 docx 48–51 (2 p, 89 ch) → found in 021 1874-07-23, 1875-01-21 (021.0517): «H[is] G[race] t[he] D[uke] off] Hfamilton]»
- tome05 docx 502–505 (2 p, 76 ch) → found in 023 1874-08-17, 1879-02-21 (023.0116): «Bon ! ce n’est pas la première fois.»
- tome05 docx 2371–2374 (2 p, 89 ch) → found in 021 1874-07-23, 1875-01-21 (021.0517): «H[is] G[race] t[he] D[uke] o[f] H[amilton]»
- tome05 docx 2764–2767 (2 p, 88 ch) → found in 024 1874-09-16, 1875-01-21 (024.0022): «H[is[ G[race] t[he] D[uke] o[f] Hamilton]»
- tome05 docx 2979–2982 (2 p, 88 ch) → found in 021 1874-07-23, 1875-01-21 (021.0517): «H[is] G[race] t[he] D[uc] o[f] H[amilton]»
- tome05 docx 5381–5384 (2 p, 90 ch) → found in 021 1874-07-23, 1875-01-21 (021.0517): «H[is] G[race] t[he] D[uke] o[f] H[amilton]»
- tome06 docx 564–567 (2 p, 91 ch) → found in 021 1874-07-23, 1875-09-21 (021.0517): «H[is] G[race] t[he] D[uke] off] H[amilton]»
- tome06 docx 2903–2905 (2 p, 68 ch) → found in 014 1873-12-14, 1874-11-07 (014.0099): «N’est-ce pas qu’il lui ressemble ?»
- tome07 docx 418–419 (2 p, 920 ch) → found in 000 000-10 (000.0048): «Je m’ennuie, je voudrais écrire sans fin, commenter tout mon»
- tome07 docx 4510–4512 (2 p, 81 ch) → found in 001 1873-02-05, 1876-01-07 (001.0086): «Et moi je ne l’ai pas vu.»
- tome10 docx 1708–1710 (2 p, 98 ch) → found in 056 1876-03-31 (056.0240): «Moi ? Pourquoi voulez-vous que je ne l'aie pas été ?»
- tome13 docx 228–231 (2 p, 433 ch) → found in 079 1878-05-01 (079.0612): «“Cette créature extraordinaire qui est en même temps une enf»

## Possible false positives / needs human look

- **Isolated short lines.** Single unmatched paragraphs under 300 chars are left out of the detailed list. They are mostly one-line dialogue turns, page-break fragments (docx splits a sentence at a page end), marginal OCR scraps, and `[Bas de page déchiré]`-type notes. Their paragraph lists are in `gaps.json`.
- **Notebook title pages.** Examples: `Livre 67ème depuis le jeudi 12 octobre…`, and the `depuis le … jusqu'au …` lines at the start of 066/072/096. `_original` usually omits these, although 105.0809 now carries one.
- **Newspaper clippings and letters.** The tome reproduces some pasted material that `_original` may have left out on purpose. The big one is **tome08 docx 2586–2599 (062, 14 paras, 14.2k chars)**: the article «LE CARDINAL ANTONELLI», signed *Ignotus*, pasted under 27 June 1876. Deciding whether it belongs in the edition is an owner call. Also check:
  - tome05 2525–2535 (035, Figaro notice);
  - tome12 543–564 and 600–606 (081, letters);
  - tome12 2100–2101 (083, footnote about the Figaro of 28 Dec 1878, which is an editor footnote);
  - tome09 3321–3390 (067, after 11 Dec 1876). This starts with an editor note, «Marie a noté le manuscrit jusqu'à la p. 271…», followed by pasted clippings (Gazette de la Chambre…) with heavy OCR noise. Most of it is probably not diary text.
- **Editor notes inside the body.** Examples: `Dessin 3 octobre 1877 …` (tome13 1971, 3083, 4163 — a list of dates on a notebook cover), `p. 250` (tome10 3582), `[Sans date, en fin de carnet]` (tome01 2207–2216, 007, 10 paras, 822 ch, which is probably real undated end-of-notebook text), and `[Livre] 97ème` (tome15 1225). The flags `editorial?`, `clipping?`, `bracketed/rayé` and `short-only` on the gap rows below are heuristic.
- **`[Rayé: …]` / `[Dans la marge: …]` / `[En travers: …]`.** Normalisation drops the brackets and keeps the words, so a struck passage that `_original` carries in bracket form still matches. A bracketed gap therefore means `_original` lacks the words altogether. `_original` may have dropped some struck passages on purpose; check the rows flagged `bracketed/rayé`.
- **Partial paragraphs.** These are present but cut: 20–50% containment, or 50–80% and over 400 chars. They are not in the gap list; they are in `partials` in `gaps.json`. The biggest, by estimated missing chars:
  - tome12 docx 617 (081, Jeudi 1 8 juillet 1878): 1474 ch, containment 0.259, ~1092 ch missing — «Je me suis fait un bonnet de velours grenat comme le noir qu»
  - tome12 docx 799 (081, Dimanche 4 août 1878): 1160 ch, containment 0.2, ~928 ch missing — «Le baron Schenk (celui d’hier) est le plus grand fonctionnai»
  - tome12 docx 1728 (083, Samedi 9 novembre 1878): 1126 ch, containment 0.241, ~854 ch missing — «Une veste honteuse ! Pas de médaille du tout. Ce qui fera tr»
  - tome12 docx 2275 (084, Jeudi 23 janvier 1879): 1128 ch, containment 0.268, ~825 ch missing — «J’ai passé chez Mouzay toujours en vue de samedi. J’ai eu l’»
  - tome14 docx 1901 (092, Samedi 1 1 juin 1881 - 30 mai): 1024 ch, containment 0.277, ~740 ch missing — «Hier donc nous sommes allés à Poltava, mon père devait y all»
  - tome12 docx 2558 (084, Vendredi 28 février 1879): 1092 ch, containment 0.381, ~675 ch missing — «Nous avons dîné au London House avec Bihovetz et puis nous a»
  - tome12 docx 743 (081, Mercredi 31 juillet 1878): 1176 ch, containment 0.438, ~660 ch missing — «Songez-donc, mais c’est moi qui n’y songe pas; je ris seulem»
  - tome12 docx 646 (081, Dimanche 21 juillet 1878): 1151 ch, containment 0.452, ~630 ch missing — «Les deux princes sont l’objet de toutes les plaisanteries à »
  - tome12 docx 785 (081, Samedi 3 août 1878): 1645 ch, containment 0.619, ~626 ch missing — «Grâce à cette sœur personne à dîner, mais en allant chez Thi»
  - tome12 docx 1036 (082, Lundi 1 9 août 1878): 967 ch, containment 0.361, ~617 ch missing — «Russie. Je crois vous avoir raconté que Mlle Oelsnitz est fi»
  - tome12 docx 1173 (082, Dimanche 1er septembre 1878): 868 ch, containment 0.299, ~608 ch missing — «Il y a cela de commun entre nous c’est que notre impertinenc»
  - tome12 docx 1821 (083, Vendredi 22 novembre 1878): 952 ch, containment 0.361, ~608 ch missing — «Elle a plus de dix fois plus que moi. Mais ça n’est pas tout»
  - tome05 docx 4757 (041, Lundi 6 septembre 1875): 743 ch, containment 0.216, ~582 ch missing — «Dans cet abattement et dans cette douleur incessante et affr»
  - tome12 docx 1030 (082, Lundi 1 9 août 1878): 922 ch, containment 0.403, ~550 ch missing — «Et puis ce qui me révolte c’est cet abrutissement moral qui »
  - tome12 docx 787 (081, Samedi 3 août 1878): 750 ch, containment 0.278, ~541 ch missing — «On a de bonnes idées mais pas d’énergie. Le Docteur propose »
  - tome12 docx 2140 (083, Lundi 6 janvier 1 879): 785 ch, containment 0.315, ~537 ch missing — «Je me suis promenée avec Mme Gavini. Cette lucarne ouverte s»
  - tome12 docx 1092 (082, Lundi 26 aoûtl 878): 856 ch, containment 0.408, ~506 ch missing — «Est-ce que je n’aimerai jamais personne ? Est-ce que j’ai dé»
  - tome12 docx 1832 (083, Samedi 23 novembre 1878): 647 ch, containment 0.219, ~505 ch missing — «Ce soir je vais revoir “Les Amants de Vérone” avec Nadine et»
  - tome12 docx 1071 (082, Vendredi 23 août 1878): 792 ch, containment 0.39, ~483 ch missing — «Ils ne songent même pas qu’il faut marier Dina ! de moi, je »
  - tome12 docx 2014 (083, Mardi 24 décembre 1878): 737 ch, containment 0.364, ~468 ch missing — «Tchernicheff, le vieil irrésistible vient et c’est devant lu»
  - tome12 docx 1939 (083, Samedi 7 décembre 1878): 679 ch, containment 0.315, ~465 ch missing — «C’est aujourd’hui l’invalidation du duc Decazes. Nous y allo»
  - tome12 docx 1777 (083, Samedi 16 novembre 1878): 961 ch, containment 0.517, ~464 ch missing — «J’ai égalé Breslau en dessin, ce qu’elle a en plus c’est l’h»
  - tome12 docx 2108 (083, Mercredi 1er janvier 1879): 725 ch, containment 0.368, ~458 ch missing — «Plaisante histoire chez Gavini. Voilà qu’entre Janvier de la»
  - tome12 docx 1694 (083, Mardi 5 novembre 1878): 612 ch, containment 0.257, ~454 ch missing — «Nous avions des billets d’officier, j’attrapai Bescherelle, »
  - tome12 docx 1674 (083, Samedi 2 novembre 1878): 770 ch, containment 0.439, ~431 ch missing — «Il y avait avec nous (moi les Gavini) la comtesse de Balinco»
- **Carnet attribution at Livre boundaries.** Livre headings are missing for 017, 075, 089, 097–099 and all of tome 16. There, attribution relies only on the neighbouring matched paragraphs; the `After`/`Before` anchors are authoritative.
- **Stale reference file.** `content/_raw/CARNET-REFERENCE.md` still lists 074, 087 (1 entry), 088 and 089 as missing. All four now exist in `_original` and cover the tome almost completely (unmatched under 0.5%). The file needs refreshing.
- **Wrong-day placement is out of scope.** The `heading-date-sweep` report covers text that is present but under the wrong day. This report only asks whether the text is present at all.

## Detailed gap list per carnet

One row per run: runs of >1 unmatched paragraph, or single paragraphs >300 chars. `docx` is the python-docx paragraph index in `content/_raw/tomeNN.docx`; the range is inclusive and may include headings and empty lines. The exact unmatched paragraph list for each row is in `gaps.json` (`docx_indices`). "After" and "Before" are the `_original` paragraph IDs of the nearest matched text on each side: the insertion point.

### 001 — 1 gaps, 23 paras, 3,287 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 26–63 | 23 | 3,287 | — (None) | — | 001.0002 (1873-01-11) | 000.0003 (000-01) | Cahiers intimes inédits, recueillis et collationnés par Pierre Borel en quatre v |  |

### 002 — 2 gaps, 12 paras, 1,469 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 371–377 | 7 | 982 | Mardi 25 février 1873 (Mardi Gras) (366) | — | 002.0093 (1873-02-25) | 002.0100 (1873-02-25) | [Page intercalée: Je comprends maintenant seulement à la page 46. Je disais que  | bracketed/rayé |
| 01 | 567–572 | 5 | 487 | Lundi 2 février 1873 [écrit en fin de ca (565) | Mardi 11 mars 1873 [mois recti | 002.0277 (1873-03-10) | 002.0280 (1873-03-11) | un service pour dîner en verre transparent |  |

### 003 — 1 gaps, 2 paras, 68 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 870–871 | 2 | 68 | Lundi 14 avril 1873 (861) | — | 003.0307 (1873-04-14) | 003.0309 (1873-04-14) | Aller au théâtre avec un masque. | short-only |

### 004 — 2 gaps, 8 paras, 2,454 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 996–999 | 3 | 1,181 | Lundi 21 avril 1873 (989) | Mardi 22 avril 1873 | 004.0130 (1873-04-21) | 004.0133 (1873-04-22) | Je ne désire plus rester à Nice. C’est un endroit pour des joueurs et des mauvai |  |
| 01 | 1075–1080 | 5 | 1,273 | Lundi 28 avril 1873 (1060) | Mardi 29 avril 1873 | 004.0220 (1873-04-28) | 004.0222 (1873-04-29) | [Dans la marge: J’écrivais en petit parce que j’avais la toquade d’économiser le | bracketed/rayé |

### 005 — 2 gaps, 8 paras, 1,738 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 1532–1538 | 5 | 1,300 | Samedi 14 juin 1873 (1532) | Samedi 14 juin 1873 | 005.0275 (1873-06-14) | 006.0114 (1873-06-28) | A sept heures du matin Sacchi vient et supplie d’acheter sa propriété avant deux |  |
| 01 | 1540–1543 | 3 | 438 | Samedi 14 juin 1873 (1532) | Dimanche 15 juin 1873 | 006.0089 (1873-06-25) | 005.0277 (1873-06-15) | A deux heures, nous vîmes passer tous les enfants Howard dans leur landau, ils a |  |

### 006 — 1 gaps, 2 paras, 101 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 880–881 | 2 | 101 | Lundi 14 avril 1873 (861) | — | 003.0314 (1873-04-14) | 006.0005 (1873-06-16) | commencé le mardi 15 avril 1873 |  |

### 007 — 1 gaps, 10 paras, 822 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 01 | 2207–2216 | 10 | 822 | Dimanche 10 août 1873 (2202) | — | 007.0392 (1873-08-10) | — | [Sans date, en fin de carnet] | bracketed/rayé, editorial? |

### 008 — 3 gaps, 23 paras, 5,490 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 02 | 1064–1099 | 8 | 2,498 | Jeudi 28 août 1873 (1060) | — | 008.0274 (1873-08-28) | 008.0277 (1873-08-29) | Je pleure [Rayé: depuis Toulon.] Non, jamais de ma vie je n’eus aussi chaud. Je  | bracketed/rayé |
| 02 | 1101–1135 | 7 | 1,846 | Jeudi 28 août 1873 (1060) | — | 008.0274 (1873-08-28) | 008.0277 (1873-08-29) | J’ai complètement oublié que l’hiver viendra. Je regarde Nice comme un exil. Sur |  |
| 02 | 1396–1441 | 8 | 1,146 | Dimanche 31 août 1873 (1244) | Lundi 1er septembre 1873 | 008.0333 (1873-08-31) | 008.0336 (1873-09-01) | J’ai raisonné alors avec assez de justesse, seulement on voit que j’étais une en |  |

### 009 — 2 gaps, 12 paras, 939 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 02 | 2259–2263 | 4 | 290 | Lundi 15 septembre 1873 (2190) | Mardi 16 septembre 1873 | 009.0175 (1873-09-15) | 009.0178 (1873-09-16) | - She will die, she will die ! |  |
| 02 | 2718–2758 | 8 | 649 | Lundi 22 septembre 1873 (2674) | Mardi 23 septembre 1873 | 009.0293 (1873-09-22) | 010.0002 (1873-09-23) | Un collier de chien avec inscription appartenant à ... |  |

### 011 — 2 gaps, 10 paras, 1,357 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 02 | 5442–5475 | 7 | 1,001 | Mardi 28 octobre 1873 (5355) | — | 011.0337 (1873-10-28) | 011.0340 (1873-10-29) | Jamais je n’aimerai un autre comme j’aimais celui-ci, je l’aimerai autant peut-ê |  |
| 02 | 5477–5481 | 3 | 356 | Mardi 28 octobre 1873 (5355) | Mercredi 29 octobre 1873 | 011.0337 (1873-10-28) | 011.0340 (1873-10-29) | A tous mes malheurs, j’ai en addition la société de cette vieille pierre ! |  |

### 013 — 4 gaps, 34 paras, 7,146 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 02 | 7722–7792 | 14 | 3,451 | Dimanche 30 novembre 1873 (7719) | Lundi 1er décembre 1873 | 013.0151 (1873-11-30) | 013.0154 (1873-12-01) | Enfin vient the long ago spoken of Séraphine. Je m’attendais à voir une femme gr |  |
| 02 | 8057–8089 | 4 | 551 | Vendredi 5 décembre 1873 (8046) | Samedi 6 décembre 1873 | 013.0219 (1873-12-05) | 013.0223 (1873-12-06) | Je voudrais qu’il se marie plus vite, je suis toujours comme ça; lorsque quelque |  |
| 02 | 8283–8320 | 10 | 1,968 | Lundi 8 décembre 1873 (8213) | — | 013.0272 (1873-12-08) | 013.0276 (1873-12-09) | Dans des occasions comme ça il faut user peu de mots car le sujet lui-même est t |  |
| 02 | 8322–8355 | 6 | 1,176 | Lundi 8 décembre 1873 (8213) | — | 013.0272 (1873-12-08) | 013.0276 (1873-12-09) | Et comme j’envie, je rage ! Car personne au monde ne pourra produire un effet co |  |

### 014 — 1 gaps, 8 paras, 266 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 02 | 9033–9040 | 8 | 266 | Lundi 15 décembre 1873 (8993) | — | 014.0114 (1873-12-15) | 014.0116 (1873-12-15) | ^6’^^ Çhé^B-Princess |  |

### 015 — 1 gaps, 4 paras, 277 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 03 | 456–460 | 4 | 277 | Jeudi 22 janvier 1874 (436) | Vendredi 23 janvier 1874 | 015.0290 (1874-01-22) | 015.0292 (1874-01-23) | la nuit pour en commencer une autre presque semblable. |  |

### 016 — 1 gaps, 3 paras, 102 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 03 | 1047–1052 | 3 | 102 | Samedi 21 février 1874 (1000) | Dimanche 22 février 1874 | 016.0414 (1874-02-21) | 017.0002 (1874-02-22) | [Carnet] N° 17 | bracketed/rayé, short-only |

### 017 — 5 gaps, 18 paras, 1,942 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 03 | 1069–1071 | 2 | 484 | Dimanche 22 février 1874 (1052) | Lundi 23 février 1874 | 017.0013 (1874-02-22) | 017.0015 (1874-02-23) | Le baron nous attaqua près d’un kiosque, il fallait absolument prendre quelque c |  |
| 03 | 1420–1425 | 2 | 237 | Mercredi 11 mars 1874 (1389) | Jeudi 12 mars 1874 | 017.0265 (1874-03-11) | 017.0267 (1874-03-12) | Comme je voudrais pouvoir tout décrire. Je pleure tous les |  |
| 03 | 1596–1602 | 3 | 93 | Vendredi 20 mars 1874 (1588) | — | 017.0389 (1874-03-20) | 017.0391 (1874-03-21) | - Oui, ce petit vilain. | short-only |
| 03 | 1605–1607 | 3 | 240 | Vendredi 20 mars 1874 (1588) | — | 017.0389 (1874-03-20) | 017.0391 (1874-03-21) | Heureusement on ne lui a dit aucune bêtise de Fedus. Ma tante assure qu’il est u |  |
| 03 | 1609–1617 | 8 | 888 | Vendredi 20 mars 1874 (1588) | Samedi 21 mars 1874 | 017.0389 (1874-03-20) | 017.0391 (1874-03-21) | J’ai encore perdu à la roulette ce soir. Je suis malheureuse au jeu, avant que l |  |

### 018 — 4 gaps, 39 paras, 10,272 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 03 | 1748–1750 | 2 | 154 | Vendredi 27 mars 1874 (1731) | Samedi 28 mars 1874 | 017.0480 (1874-03-27) | 018.0003 (1874-03-28) | de mes bêtises appartenant à moi commencé le samedi 28 mars 1874 terminé le jeud |  |
| 03 | 1915–1945 | 24 | 6,937 | Dimanche 5 avril 1874 (1903) | Lundi 6 avril 1874 | 018.0124 (1874-04-05) | 018.0126 (1874-04-06) | Lise est toujours la même, Hélène est un peu changée parce qu’elle est une demoi |  |
| 03 | 2032–2037 | 5 | 1,102 | Jeudi 9 avril 1874 (2022) | Vendredi 10 avril 1874 | 018.0187 (1874-04-09) | 018.0189 (1874-04-10) | Rosalie Léon passegia, con una bambina en uniforme gris. Quelle vieille chienne, |  |
| 03 | 2149–2160 | 8 | 2,079 | Vendredi 17 avril 1874 (2139) | Samedi 18 avril 1874 | 018.0266 (1874-04-17) | 018.0268 (1874-04-18) | Un homme jeune, riche et noble qui vit de la sorte ! Je ne comprends pas cela. Q |  |

### 019 — 3 gaps, 22 paras, 4,938 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 03 | 2256–2259 | 2 | 106 | Lundi 23 avril 1874 (2235) | Vendredi 24 avril 1874 | 018.0334 (1874-04-23) | 019.0002 (1874-04-24) | commencé le vendredi 24 avril 1874 terminé le vendredi 29 mai 1874 |  |
| 03 | 2380–2398 | 14 | 3,834 | Dimanche 3 mai 1874 (2364) | Lundi 4 mai 1874 | 019.0092 (1874-05-03) | 019.0095 (1874-05-04) | Lorsqu’il fut parti, son père venait me chercher tous les jours près de la table |  |
| 03 | 2750–2757 | 6 | 998 | Mardi 26 mai 1874 (2729) | Mercredi 27 mai 1874 | 019.0374 (1874-05-26) | 019.0377 (1874-05-27) | Je souffre de mon mal. On le connaît ce mal, les voitures, les toilettes, le mon |  |

### 020 — 7 gaps, 52 paras, 9,376 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 03 | 2814–2819 | 4 | 226 | Vendredi 29 mai 1874 (2781) | Samedi 30 mai 1874 | 021.0517 (1874-07-23) | 020.0002 (1874-05-30) | commencé le samedi 30 mai 1 874 terminé le samedi 4 juillet 1874 |  |
| 03 | 2953–2958 | 4 | 911 | Mercredi 3 juin 1874 (2947) | Jeudi 4 juin 1874 | 020.0114 (1874-06-03) | 020.0117 (1874-06-04) | Les cerises m’ont rendue malade. Ces fruits me font toujours la tête lourde et m |  |
| 03 | 3076–3084 | 8 | 1,027 | Mardi 9 juin 1874 (3051) | Mercredi 10 juin 1874 | 020.0194 (1874-06-09) | 020.0199 (1874-06-10) | sa fille à cheval avec l’homme commode, M. Zveguinzoff. Nous arrêtons nos voitur |  |
| 03 | 3190–3206 | 14 | 2,252 | Dimanche 14 juin 1874 (3144) | Lundi 15 juin 1874 | 020.0279 (1874-06-14) | 020.0282 (1874-06-15) | Depuis que nous sommes à Paris, Wittgenstein ne nous a pas vus, c’est étrange, g |  |
| 03 | 3302–3306 | 4 | 806 | Vendredi 19 juin 1874 (3274) | Samedi 20 juin 1874 | 020.0355 (1874-06-19) | 020.0358 (1874-06-20) | Dans mon deuxième journal le style est beaucoup meilleur. Mais je ne me comprend |  |
| 03 | 3434–3439 | 6 | 1,263 | Mardi 30 juin 1874 (3430) | — | 020.0457 (1874-06-30) | 020.0460 (1874-07-01) | Je suis contente lorsque nous restons dans le cabinet du marquis; moi, Mme Basil |  |
| 03 | 3443–3458 | 12 | 2,891 | Mardi 30 juin 1874 (3430) | Mercredi 1er juillet 1874 | 020.0457 (1874-06-30) | 020.0460 (1874-07-01) | Pendant une conversation ou plutôt une discussion sur les âges de la femme je du |  |

### 021 — 8 gaps, 45 paras, 5,978 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 47–49 | 2 | 89 | 5 Juillet 1874 - 2 Avril 1875 (12) | Dimanche 5 juillet 1874 | 021.0517 (1874-07-23) | 021.0002 (1874-07-05) | commencé le dimanche 5 juillet 1874 terminé le 23 juillet 1874 |  |
| 04 | 153–156 | 3 | 373 | Jeudi 9 juillet 1874 (124) | Vendredi 10 juillet 1874 | 021.0086 (1874-07-09) | 021.0089 (1874-07-10) | d’arriver. La femme est brésilienne, et mène avec elle deux ou trois dames et le |  |
| 04 | 344–347 | 3 | 132 | Lundi 13 juillet 1874 (288) | — | 021.0243 (1874-07-13) | 021.0245 (1874-07-14) | Le Polonais me demanda la réponse, je dis qu’il n’en aura point. |  |
| 04 | 349–356 | 7 | 736 | Lundi 13 juillet 1874 (288) | Mardi 14 juillet 1874 | 021.0243 (1874-07-13) | 021.0245 (1874-07-14) | Je le regardai avec étonnement. En voilà un ! quel petit lézard ! |  |
| 04 | 531–551 | 15 | 2,144 | Dimanche 19 juillet 1874 (531) | Dimanche 19 juillet 1874 | 021.0381 (1874-07-19) | 021.0383 (1874-07-20) | Ayant parlé de Berthe avec M. de Tanlay, l’idée me vint de lui écrire, ce que je |  |
| 04 | 553–561 | 9 | 1,240 | Dimanche 19 juillet 1874 (531) | — | 021.0381 (1874-07-19) | 021.0383 (1874-07-20) | J’avais peur que Gericke ne dise quelque bêtise devant Mme de Bauche née princes |  |
| 04 | 563–566 | 2 | 335 | Dimanche 19 juillet 1874 (531) | — | 021.0381 (1874-07-19) | 021.0383 (1874-07-20) | Au Casino maman se place à côté de la comtesse Merjeewsky, et moi et Dina sur un |  |
| 04 | 568–573 | 4 | 929 | Dimanche 19 juillet 1874 (531) | Lundi 20 juillet 1874 | 021.0381 (1874-07-19) | 021.0383 (1874-07-20) | Gericke m’a demandé la permission de me faire une déclaration d’amour; après qu’ |  |

### 022 — 2 gaps, 7 paras, 491 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 753–758 | 5 | 228 | Jeudi 23 juillet 1874 (691) | Vendredi 24 juillet 1874 | 021.0517 (1874-07-23) | 022.0002 (1874-07-24) | commencé le vendredi 24 juillet 1874 terminé le samedi 8 août 1874 |  |
| 04 | 857–868 | 2 | 263 | Samedi 25 juillet 1874 (779) | Dimanche 26 juillet 1874 | 022.0078 (1874-07-25) | 022.0107 (1874-07-26) | Descendant d’Achille Admirateur du roi d’Ephèse Papari poulous grec Et bel espri |  |

### 023 — 1 gaps, 19 paras, 1,590 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 1598–1623 | 19 | 1,590 | Mercredi 19 août 1874 (1568) | Jeudi 20 août 1874 | 023.0181 (1874-08-19) | 023.0186 (1874-08-20) | Avec toute sa suite |  |

### 024 — 2 gaps, 12 paras, 1,963 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 2523–2534 | 8 | 1,892 | Samedi 3 octobre 1874 (2498) | Dimanche 4 octobre 1874 | 024.0242 (1874-10-03) | 024.0244 (1874-10-04) | Et aujourd’hui je me désespère parce que le pavillon est perdu pour moi, dans mo |  |
| 04 | 2770–2782 | 4 | 71 | Lundi 26 octobre 1874 (2760) | — | 024.0433 (1874-10-26) | 021.0517 (1874-07-23) | Décembre 13 mercredi | short-only |

### 025 — 1 gaps, 5 paras, 872 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 2867–2874 | 5 | 872 | Samedi 31 octobre 1874 (2862) | Dimanche 1er novembre 1874 | 025.0059 (1874-10-31) | 025.0062 (1874-11-01) | Allons à Monaco et gagnons. |  |

### 027 — 1 gaps, 5 paras, 1,370 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 3290–3296 | 5 | 1,370 | Lundi 30 novembre 1874 (3287) | — | 027.0095 (1874-11-30) | 027.0097 (1874-12-01) | On ne voit personne, mais j’aime beaucoup ce weather gris et humide, je ne sais  |  |

### 028 — 3 gaps, 38 paras, 6,732 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 3770–3776 | 5 | 966 | Mardi 29 décembre 1874 (3766) | — | 028.0094 (1874-12-30) | 028.0097 (1874-12-31) | J’appelai Arthur et l’envoyai dire au commissaire général |  |
| 04 | 3778–3795 | 12 | 2,053 | Mardi 29 décembre 1874 (3766) | Mercredi 30 décembre 18 74 | 028.0094 (1874-12-30) | 028.0097 (1874-12-31) | Maman est allée à San Remo pour consulter Botkine le médecin de l’impératrice. |  |
| 04 | 3934–3956 | 21 | 3,713 | Samedi 9 janvier 1875 (3930) | Dimanche 10 janvier 1875 | 028.0192 (1875-01-09) | 028.0193 (1875-01-10) | Ce soir grande représentation aux Italiens, “La Somnambule”, nous avons la trois |  |

### 029 — 1 gaps, 3 paras, 752 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 4089–4093 | 3 | 752 | Vendredi 22 janvier 1875 (4089) | Vendredi 22 janvier 1875; Samedi 23 janvier 1875 | 029.0015 (1875-01-22) | 029.0017 (1875-01-23) | A huit heures nous sommes à Nice, entrons droit chez maman, nous la trouvons deb |  |

### 030 — 12 gaps, 90 paras, 17,815 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 04 | 4705–4727 | 14 | 2,324 | Dimanche 7 mars 1875 (4703) | Lundi 8 mars 1875; Mardi 9 mars 1875 | 030.0150 (1875-03-06) | 023.0039 (1874-08-11) | J’eus la vue écorchée par ma détestation plusieurs fois. A peine rentrée dans la |  |
| 04 | 4729–4735 | 6 | 1,220 | Mardi 9 mars 1875 (4713) | Mercredi 10 mars 1875 | 030.0150 (1875-03-06) | 023.0039 (1874-08-11) | Danis me fixait du parterre comme aux premiers temps et je rougissais à tous mom |  |
| 04 | 4737–4746 | 6 | 797 | Jeudi 11 mars 1875 (4737) | Jeudi 11 mars 1875; Vendredi 12 mars 1875 | 030.0150 (1875-03-06) | 023.0039 (1874-08-11) | Je sors en robe bleue sans tunique et misérable de figure. |  |
| 04 | 4748–4748 | 1 | 383 | Vendredi 12 mars 1875 (4745) | — | 030.0150 (1875-03-06) | 023.0039 (1874-08-11) | A peine sommes-nous dans sa chambre qu’arrive de Mouzay, fait mille tendresses e |  |
| 04 | 4750–4755 | 5 | 986 | Vendredi 12 mars 1875 (4745) | — | 030.0150 (1875-03-06) | 023.0039 (1874-08-11) | Alors de Mouzay s’offense. |  |
| 04 | 4757–4775 | 15 | 3,230 | Vendredi 12 mars 1875 (4745) | Samedi 13 mars 1875; Dimanche 14 mars 1875; Lundi 15 mars 1875 | 030.0150 (1875-03-06) | 023.0039 (1874-08-11) | Ce n’est pas tout, on se prive de robes, on ne bâtit pas la maison qui est néces |  |
| 04 | 4777–4784 | 6 | 2,342 | Lundi 15 mars 1875 (4774) | — | 023.0039 (1874-08-11) | 030.0152 (1875-03-07) | A deux heures nous partons, Pâris, Sacha, Walitsky, première voiture, deuxième v |  |
| 04 | 4786–4800 | 12 | 1,124 | Lundi 15 mars 1875 (4774) | — | 023.0039 (1874-08-11) | 030.0152 (1875-03-07) | Que pensiez-vous donc ? |  |
| 04 | 4802–4810 | 6 | 1,945 | Mardi 16 mars 1875 (4802) | Mardi 16 mars 1875 | 023.0039 (1874-08-11) | 030.0152 (1875-03-07) | A la musique, (gris, pâle). Je rentre pour étudier mais, au lieu de cela, reste  |  |
| 04 | 4836–4846 | 8 | 1,743 | Vendredi 19 mars 1875 (4836) | Vendredi 19 mars 1875 | 030.0162 (1875-03-18) | 030.0173 (1875-03-20) | Scène de famille, Sacha a battu Adam. Je suis extrêmement contente, il y a longt |  |
| 04 | 5078–5088 | 8 | 1,668 | Vendredi 2 avril 1875 (5077) | — | 030.0358 (1875-04-01) | — | Ma tante est, elle aussi à Cannes, de sorte que seulette suis (robe blanche) je  |  |
| 05 | 52–54 | 3 | 53 | 2 avril 1875 - 25 septembre 1875 (12) | — | — | 030.0360 (1875-04-02) | Page annotée: | short-only |

### 031 — 1 gaps, 10 paras, 2,148 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 397–408 | 10 | 2,148 | Lundi 19 avril 1875 (394) | Mardi 20 avril 1875 | 031.0290 (1875-04-19) | 031.0292 (1875-04-20) | Je pense toujours à aller en Russie et telle est grande ma peur de reste vieille |  |

### 032 — 5 gaps, 62 paras, 10,284 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 485–498 | 6 | 242 | Vendredi 23 avril 1875 (477) | — | 032.0008 (1875-04-23) | 032.0012 (1875-04-24) | Eh bien comment est-il ? |  |
| 05 | 506–525 | 14 | 983 | Vendredi 23 avril 1875 (477) | — | 032.0008 (1875-04-23) | 032.0012 (1875-04-24) | J’ai commandé selon mon goût. |  |
| 05 | 527–528 | 2 | 376 | Vendredi 23 avril 1875 (477) | — | 032.0008 (1875-04-23) | 032.0012 (1875-04-24) | Le soir encore bavardage, on rit, et on dit des bêtises. On parle naturellement  |  |
| 05 | 693–709 | 12 | 2,058 | Vendredi 30 avril 1875 (685) | Samedi 1er mai 1875 | 032.0155 (1875-04-30) | 032.0157 (1875-05-01) | Ils lisent religieusement et lèvent de temps en temps des yeux béats l’un sur l’ |  |
| 05 | 870–901 | 28 | 6,625 | Dimanche 9 mai 1875 (869) | Lundi 10 mai 1875 | 032.0298 (1875-05-08) | 032.0302 (1875-05-10) | Je continue à faire des rêves superbes. Hier c’étaient des géants, Mmes Prodgers |  |

### 033 — 2 gaps, 35 paras, 5,091 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 1124–1154 | 26 | 4,170 | Mardi 18 mai 1875 (1115) | Mercredi 19 mai 1875 | 033.0016 (1875-05-18) | 033.0018 (1875-05-19) | Voilà ce qui s’est passé aujourd’hui. A cinq heures j'étais habillée et en chape |  |
| 05 | 1523–1536 | 9 | 921 | Lundi 31 mai 1875 (1517) | Mardi 1er juin 1875 | 033.0359 (1875-05-31) | 033.0363 (1875-06-01) | Depuis ces derniers cinq ou six jours j’ai embelli a vue d œil. Il y a dans tout |  |

### 034 — 16 gaps, 189 paras, 31,176 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 2012–2106 | 78 | 12,826 | Mardi 15 juin 1875 (2012) | Mardi 15 juin 1875; Mercredi 16 juin 1875; Jeudi 17 juin 1875; Vendredi 18 juin 1875 | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | J’ai rêvé d’une fontaine jaillissante i.e., position brillante, fortune rapide,  |  |
| 05 | 2109–2110 | 2 | 449 | Vendredi 18 juin 1875 (2106) | — | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | Voilà que ma tante dit qu’Audiffret est refroidi. Vous comprenez ? D’ailleurs to |  |
| 05 | 2112–2113 | 2 | 775 | Vendredi 18 juin 1875 (2106) | — | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | Je suis parfaitement tranquille et indifférente. Ce n'est pas la figure du beau  |  |
| 05 | 2117–2125 | 8 | 968 | Vendredi 18 juin 1875 (2106) | — | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | On dirait une divinité indienne sur* le passage de laquelle les peuples se prost |  |
| 05 | 2127–2130 | 4 | 440 | Vendredi 18 juin 1875 (2106) | — | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | Pas tout blond, mais comme ma tante par exemple, ou un peu plus blond. |  |
| 05 | 2132–2139 | 7 | 923 | Vendredi 18 juin 1875 (2106) | — | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | Bravo ! Je suis de cet avis. |  |
| 05 | 2141–2145 | 3 | 408 | Vendredi 18 juin 1875 (2106) | Samedi 19 juin 1875 | 034.0311 (1875-06-14) | 034.0316 (1875-06-19) | Mais d’ailleurs je n’étais pas sotte. Maman venait de retourner de la Crimée au  |  |
| 05 | 2232–2246 | 12 | 2,111 | Lundi 21 juin 1875 (2232) | Lundi 21 juin 1875; Mardi 22 juin 1875 | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | J’ai reçu la caisse de Worth. C’est une charmante robe de mousseline de laine bl |  |
| 05 | 2248–2259 | 12 | 2,017 | Mardi 22 juin 1875 (2246) | — | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | Je trouve mon journal de ces derniers jours stupide. Tout est détaché, je saute, |  |
| 05 | 2262–2276 | 14 | 2,878 | Mardi 22 juin 1875 (2246) | — | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | Godard n’est qu’un gamin, les autres d’affreux paysans, mais Godard est aussi un |  |
| 05 | 2278–2300 | 19 | 3,792 | Mardi 22 juin 1875 (2246) | Mercredi 23 juin 1875 | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | Et qui sait, peut-être que j’aurai mieux. Non, je ne connais rien de mieux, parc |  |
| 05 | 2302–2305 | 4 | 343 | Mercredi 23 juin 1875 (2293) | — | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | Léonie m’a dit un jour qu’elle avait servi les Audiffret et que le vieux était t |  |
| 05 | 2307–2309 | 2 | 197 | Jeudi 24 juin 1875 (2307) | Jeudi 24 juin 1875 | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | Quel temps délicieux ! |  |
| 05 | 2312–2325 | 13 | 1,537 | Jeudi 24 juin 1875 (2307) | — | 034.0405 (1875-06-20) | 034.0410 (1875-06-25) | En étudiant mon piano l’idée me vint tout à coup que je serai reine de Bavière. |  |
| 05 | 2663–2670 | 7 | 1,184 | Mardi 6 juillet 1875 (2647) | — | 034.0376 (1875-06-20) | 045.0275 (1875-10-01) | Je suis habillée comme à la Promenade, c’est-à-dire en ma longue robe blanche, s |  |
| 05 | 2672–2674 | 2 | 328 | Mercredi 7 juillet 1875 (2672) | Mercredi 7 juillet 1875 | 034.0376 (1875-06-20) | 045.0275 (1875-10-01) | J’ai encore rêvé de ce faquin, toute la nuit je le voyais. Je suis triste et enn |  |

### 035 — 14 gaps, 200 paras, 25,902 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 2377–2399 | 16 | 2,008 | Samedi 26 juin 1875 (2375) | Dimanche 27 juin 1875 | 034.0446 (1875-06-25) | 035.0002 (1875-07-01) | Je puis faire le plan des chambres si bien je les connais. Je sais aussi comment |  |
| 05 | 2401–2408 | 7 | 1,358 | Dimanche 27 juin 1875 (2399) | — | 034.0446 (1875-06-25) | 035.0002 (1875-07-01) | Je lis mon journal livre 15ème. Mais c’est au premier que je retourne sans cesse |  |
| 05 | 2410–2426 | 14 | 1,484 | Dimanche 27 juin 1875 (2399) | Lundi 28 juin 1875 | 034.0446 (1875-06-25) | 035.0002 (1875-07-01) | enveloppe: A Monsieur le rédacteur en chef du Figaro, rue Drouot 26 Paris |  |
| 05 | 2428–2444 | 13 | 1,947 | Lundi 28 juin 1875 (2413) | Mardi 29 juin 1875; Mercredi 30 juin 1875 | 034.0446 (1875-06-25) | 035.0002 (1875-07-01) | Maman était chez elle malade et au lit. |  |
| 05 | 2446–2471 | 18 | 1,992 | Mercredi 30 juin 1875 (2434) | Jeudi 1er juillet 1875 | 034.0446 (1875-06-25) | 035.0002 (1875-07-01) | Ma tante est tout entourée de Bihovetz, Smirnoff, Enotëas et Walitsky. |  |
| 05 | 2525–2535 | 9 | 851 | Vendredi 2 juillet 1875 (2525) | Vendredi 2 juillet 1875 | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | On lit dans Le Figaro de ce soir: On demande des jeunes gens séduisants et comme | clipping? |
| 05 | 2537–2571 | 30 | 4,248 | Vendredi 2 juillet 1875 (2525) | Samedi 3 juillet 1875 | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | J’ai un nouveau tourment. |  |
| 05 | 2573–2575 | 2 | 93 | Samedi 3 juillet 1875 (2553) | — | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | Je désire si ardemment, si follement qu’il m’aime que je | short-only |
| 05 | 2577–2579 | 3 | 450 | Samedi 3 juillet 1875 (2553) | — | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | Saëtone, Galula et le beau ténébreux me racontent des histoires de Danis et dise |  |
| 05 | 2583–2584 | 2 | 175 | Samedi 3 juillet 1875 (2553) | — | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | Mon cœur bat librement, mes yeux brillent, mes pieds ne touchent pas le sol en m |  |
| 05 | 2589–2609 | 16 | 2,534 | Dimanche 4 juillet 1875 (2586) | — | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | J ai bien prié, agenouillée et le menton appuyé sur mes mains très blanches et f |  |
| 05 | 2612–2652 | 34 | 4,389 | Dimanche 4 juillet 1875 (2586) | Lundi 5 juillet 1875; Mardi 6 juillet 1875 | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | Et que diriez-vous si je faisais cela ? |  |
| 05 | 2654–2657 | 4 | 663 | Mardi 6 juillet 1875 (2647) | — | 035.0048 (1875-07-01) | 034.0376 (1875-06-20) | Il s’excuse disant avoir été depuis le matin occupé à des arrangements du jardin |  |
| 05 | 2677–2716 | 32 | 3,710 | Mercredi 7 juillet 1875 (2672) | Jeudi 8 juillet 1875 | 045.0275 (1875-10-01) | 035.0054 (1875-07-08) | Ils sont partis ! nous étions tous à la gare et moi habillée de rose, cette robe |  |

### 037 — 11 gaps, 187 paras, 29,971 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 3155–3165 | 9 | 2,041 | Vendredi 16 juillet 1875 (3114) | — | 037.0160 (1875-07-16) | 037.0002 (1875-07-15) | Au bain une pluie de jeunes gens. Saëtone, Danis, Pépino-Gautier, Smirnoff, Biho |  |
| 05 | 3167–3172 | 6 | 644 | Vendredi 16 juillet 1875 (3114) | — | 037.0160 (1875-07-16) | 037.0002 (1875-07-15) | Qu’on s’imagine que j’ai des remords ! J’ai l’absurdité de regretter ma conduite |  |
| 05 | 3176–3177 | 2 | 591 | Vendredi 16 juillet 1875 (3114) | — | 037.0160 (1875-07-16) | 037.0002 (1875-07-15) | Vivre loin de ses amours, n’est-ce pas mourir tous les jours ? On dit qu’il a so |  |
| 05 | 3180–3192 | 12 | 2,182 | Vendredi 16 juillet 1875 (3114) | — | 037.0160 (1875-07-16) | 037.0002 (1875-07-15) | C’est une misère, [Rayé: l'élan] un roman à peine ébauché. | bracketed/rayé |
| 05 | 3333–3361 | 23 | 2,894 | Mardi 20 juillet 1875 (3333) | Mardi 20 juillet 1875; Mercredi 21 juillet 1875 | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | Je suis capable de rester des heures entières dans mon cabinet de toilette, tout |  |
| 05 | 3364–3416 | 43 | 8,284 | Mercredi 21 juillet 1875 (3345) | Jeudi 22 juillet 1875; Vendredi 23 juillet 1875; Samedi 24 juillet 1875 | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | Désiré me dit adieu, je lui dis au revoir. Il revient ici en novembre. Je serai  |  |
| 05 | 3419–3428 | 9 | 1,622 | Samedi 24 juillet 1875 (3415) | — | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | Depuis plusieurs jours les cartes me prédisent des douleurs et des chagrins, et  |  |
| 05 | 3430–3434 | 4 | 652 | Samedi 24 juillet 1875 (3415) | Dimanche 25 juillet 1875 | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | J’ai vu le maçon qui doit arranger mes chambres, j’ai fait emballer devant moi m |  |
| 05 | 3436–3467 | 25 | 4,075 | Dimanche 25 juillet 1875 (3434) | Lundi 26 juillet 1875 | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | Je n’en ai rien dit, dans mon journal, je ne sais pourquoi. Vers la fin à Spa je |  |
| 05 | 3469–3485 | 13 | 2,084 | Lundi 26 juillet 1875 (3450) | — | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | - Eh ! ma chère, c’est que cela vous ferait une position, je crois bien. Eh bien |  |
| 05 | 3487–3540 | 41 | 4,902 | Lundi 26 juillet 1875 (3450) | Mardi 27 juillet 1875; Mercredi 28 juillet 1875; Jeudi 29 juillet 1875 | 037.0292 (1875-07-19) | 037.0297 (1875-07-30) | Nous faisons arrêter la voiture en face le numéro 77. Au lieu de rentrer je cass |  |

### 038 — 3 gaps, 42 paras, 6,217 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 3833–3850 | 14 | 2,113 | Dimanche 8 août 1875 (3831) | — | 038.0212 (1875-08-07) | 038.0217 (1875-08-10) | Il fait beau, je suis en blanc avec un grand chapeau de |  |
| 05 | 3852–3881 | 26 | 3,818 | Dimanche 8 août 1875 (3831) | Lundi 9 août 1875 | 038.0212 (1875-08-07) | 038.0217 (1875-08-10) | Surtout parce qu’il est capricieux, violent et colère. J’aime les hommes méchant |  |
| 05 | 3885–3887 | 2 | 286 | Lundi 9 août 1875 (3871) | Mardi 10 août 1875 | 038.0212 (1875-08-07) | 038.0217 (1875-08-10) | J’y trouve aussi combien je m’occupais de Lambertye, de ce vieux singe. Mon jour |  |

### 039 — 4 gaps, 42 paras, 6,525 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 4005–4007 | 3 | 554 | Samedi 14 août 1875 (4002) | — | 038.0312 (1875-08-13) | 039.0002 (1875-08-15) | Je ne suis allée nulle part, excepté les bains qui sont en face. Il n’y a person |  |
| 05 | 4009–4034 | 23 | 3,251 | Samedi 14 août 1875 (4002) | Dimanche 15 août 1875 | 038.0312 (1875-08-13) | 039.0002 (1875-08-15) | Combien fait la toilette ! Justement enchantée de ma personne, je prie Dina de m |  |
| 05 | 4088–4101 | 11 | 2,159 | Mercredi 18 août 1875 (4088) | Mercredi 18 août 1875 | 039.0051 (1875-08-17) | 039.0054 (1875-08-18) | Nous passons la journée à m’admirer. Maman m'admire, la princesse m'admire réell |  |
| 05 | 4210–4218 | 5 | 561 | Samedi 21 août 1875 (4144) | Dimanche 22 août 1875 | 039.0128 (1875-08-21) | 039.0138 (1875-08-22) | Entre Saëtone et Gaiuia |  |

### 041 — 17 gaps, 160 paras, 35,667 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 4577–4588 | 11 | 1,843 | Mercredi 1er septembre 1875 - suite (4560) | — | 040.0257 (1875-09-01) | 041.0002 (1875-09-02) | Ah ! les Durand ! fi ! les petites misères humaines. |  |
| 05 | 4590–4594 | 4 | 956 | Mercredi 1er septembre 1875 - suite (4560) | Jeudi 2 septembre 1875 | 040.0257 (1875-09-01) | 041.0002 (1875-09-02) | Nous allons chez Binder voir des voitures, il demande six mille trois cents fran |  |
| 05 | 4649–4660 | 9 | 2,100 | Samedi 4 septembre 1875 (4649) | Samedi 4 septembre 1875 | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | En sortant de déjeuner je suis accostée par un Américain, un assez vieux qui sta |  |
| 05 | 4663–4676 | 12 | 1,987 | Samedi 4 septembre 1875 (4649) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | De Gonzalès père et fils sont à pied, nous nous saluons, dans leur voiture sont  |  |
| 05 | 4678–4693 | 14 | 1,665 | Samedi 4 septembre 1875 (4649) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | C’est pourtant dommage qu’il lui manque ce on ne sait quoi qui plaît tout à fait |  |
| 05 | 4695–4706 | 10 | 1,209 | Samedi 4 septembre 1875 (4649) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | De combien de demoiselles avez-vous été amoureux depuis ? |  |
| 05 | 4709–4712 | 3 | 268 | Samedi 4 septembre 1875 (4649) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Oh ! Oh ! et pourquoi alors avez-vous deviné ? |  |
| 05 | 4714–4726 | 8 | 892 | Samedi 4 septembre 1875 (4649) | Dimanche 5 septembre 1875 | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | On donne “La Guigne” mais bientôt on donnera “La Vie parisienne". |  |
| 05 | 4728–4733 | 4 | 746 | Dimanche 5 septembre 1875 (4720) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Après deux tours nous retombons dans notre engourdissement car celui qui pour le |  |
| 05 | 4735–4740 | 5 | 1,485 | Dimanche 5 septembre 1875 (4720) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Ici il n’y a ni matin ni soir, le matin on balaie, le soir ces innombrables lant |  |
| 05 | 4744–4745 | 2 | 1,052 | Dimanche 5 septembre 1875 (4720) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | D’ailleurs jamais aucun écrit ne donnera la moindre idée de la vie réelle. Comme |  |
| 05 | 4747–4756 | 8 | 2,658 | Dimanche 5 septembre 1875 (4720) | Lundi 6 septembre 1875 | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Si par hasard on lisait ce journal, se moquerait-on ? Sans doute, oui. Et pourta |  |
| 05 | 4760–4773 | 13 | 3,061 | Lundi 6 septembre 1875 (4748) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Ce n’est pas que je préfère les larmes à la joie, ce serait absurde, mais, loin  |  |
| 05 | 4775–4777 | 3 | 473 | Lundi 6 septembre 1875 (4748) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Mais tout semble m’être contraire. Qu’un grand malheur vienne, on en est écrasé, |  |
| 05 | 4779–4810 | 29 | 7,892 | Lundi 6 septembre 1875 (4748) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Pour comble de disgrâce il n’y a pas avec quoi payer les commandes, ma tante ne  |  |
| 05 | 4814–4836 | 19 | 5,809 | Mardi 7 septembre 1875 (4813) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | Quelle position, bon Dieu, quelle position ! Nous devons partir pour nous arrête |  |
| 05 | 4838–4845 | 6 | 1,571 | Mardi 7 septembre 1875 (4813) | — | 041.0052 (1875-09-03) | 042.0004 (1875-09-08) | J’ai dit tout, je dis toujours tout, sauf quelques réflexions intimes, qui en fa |  |

### 042 — 2 gaps, 22 paras, 4,036 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 4900–4917 | 17 | 3,456 | Jeudi 9 septembre 1875 (4874) | — | 042.0052 (1875-09-09) | 043.0002 (1875-09-10) | On n’a rien fait dans mes chambres. Ma tante a ordonné de travailler et mon cher |  |
| 05 | 4922–4930 | 5 | 580 | Jeudi 9 septembre 1875 (4874) | Vendredi 10 septembre 1875 | 042.0052 (1875-09-09) | 043.0002 (1875-09-10) | D'ailleurs n’ai-je pas dit que mes idées changeaient vingt fois par jour. Souven |  |

### 043 — 1 gaps, 9 paras, 356 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 05 | 5009–5019 | 9 | 356 | Vendredi 10 septembre 1875 (4930) | Samedi 11 septembre 1875 | 043.0075 (1875-09-10) | 043.0078 (1875-09-11) | Si je savais faire des vers j’en ferai que je nommerai: Un jour à Nice. Un quatr |  |

### 045 — 2 gaps, 14 paras, 669 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 36–38 | 2 | 104 | — (None) | Dimanche 26 septembre 1875 | — | 045.0002 (1875-09-26) | depuis le samedi 26 septembre 1875 jusqu’au samedi 2 octobre 1875 |  |
| 06 | 550–562 | 12 | 565 | Samedi 2 octobre 1875 (504) | — | 045.0353 (1875-10-02) | 046.0002 (1875-10-03) | [Plusieurs pages non numérotées qui semblent être des brouillons] | bracketed/rayé |

### 047 — 3 gaps, 15 paras, 2,035 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 1460–1470 | 10 | 1,596 | Vendredi 22 octobre 1875 (1445) | — | 047.0400 (1875-10-22) | 047.0402 (1875-10-23) | Je vais de suite au balcon avec Olga et nous regardons dans le crépuscule Girofl |  |
| 06 | 1472–1475 | 3 | 404 | Vendredi 22 octobre 1875 (1445) | Samedi 23 octobre 1875 | 047.0400 (1875-10-22) | 047.0402 (1875-10-23) | Je jette ma fierté inutile et malheureuse, je la jette sous mes pieds, et je vou |  |
| 06 | 1543–1544 | 2 | 35 | Samedi 23 octobre 1875 (1475) | — | 047.0440 (1875-10-23) | 048.0002 (1875-10-24) | Volo omnia | short-only |

### 048 — 5 gaps, 29 paras, 4,302 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 1548–1555 | 2 | 40 | Samedi 23 octobre 1875 (1475) | Dimanche 24 octobre 1875 | 047.0440 (1875-10-23) | 048.0002 (1875-10-24) | [Coin de page manquant ?] | bracketed/rayé, short-only |
| 06 | 1576–1585 | 8 | 1,074 | Dimanche 24 octobre 1875 (1555) | — | 048.0019 (1875-10-24) | 048.0022 (1875-10-24) | Voyez ! fit-il, avec conviction. |  |
| 06 | 1587–1598 | 12 | 2,485 | Dimanche 24 octobre 1875 (1555) | — | 048.0019 (1875-10-24) | 048.0022 (1875-10-24) | Sur cela monsieur a bien l’honneur de nous saluer. |  |
| 06 | 1993–1994 | 2 | 61 | Lundi 1er novembre 1875 (1934) | — | 048.0403 (1875-11-01) | 048.0400 (1875-11-01) | Voyons, quoi ? lui dis-je. | short-only |
| 06 | 2117–2122 | 5 | 642 | Jeudi 4 novembre 1875 (2075) | Vendredi 5 novembre 1875 | 048.0519 (1875-11-04) | 048.0521 (1875-11-05) | Il est bien tard, je veille pour parler de saligauds ! Il faut remplir cette der |  |

### 050 — 25 gaps, 236 paras, 29,647 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 2881–2884 | 4 | 850 | Dimanche 21 novembre 1875 (2878) | — | 050.0096 (1875-11-20) | 053.0066 (1876-01-26) | Revenons au rêve, nous étions au théâtre, dans notre loge habituelle, tous les m |  |
| 06 | 2886–2893 | 8 | 953 | Dimanche 21 novembre 1875 (2878) | — | 050.0096 (1875-11-20) | 053.0066 (1876-01-26) | J’ai envie de retourner à Nice, plus je reste ici, plus mon départ pour Rome se  |  |
| 06 | 2901–2902 | 2 | 250 | Dimanche 21 novembre 1875 (2878) | — | 053.0066 (1876-01-26) | 050.0100 (1875-11-22) | La ravissante pièce que les scandales d’hier ! Et jouée comme un sucre ! Le rôle |  |
| 06 | 2906–2908 | 2 | 149 | Dimanche 21 novembre 1875 (2878) | Lundi 22 novembre 1875 | 053.0066 (1876-01-26) | 050.0100 (1875-11-22) | C’est drôle tout de même ! |  |
| 06 | 3326–3330 | 4 | 343 | Vendredi 3 décembre 1875 (3289) | Samedi 4 décembre 1875 | 050.0442 (1875-12-03) | 050.0444 (1875-12-04) | Oh ! s’ils savaient combien ils me font de mal ! Des plaintes, fi ! Je ne veux p |  |
| 06 | 3537–3545 | 9 | 1,276 | Samedi 11 décembre 1875 (3491) | — | 050.0639 (1875-12-11) | 050.0641 (1875-12-12) | Un seul instant j’ai senti qu’il me regardait et n’eus pas la force de rester im |  |
| 06 | 3547–3555 | 8 | 1,184 | Samedi 11 décembre 1875 (3491) | Dimanche 12 décembre 1875 | 050.0639 (1875-12-11) | 050.0641 (1875-12-12) | Ils sont venus, et il n’y avait pas les gens qui auraient dû me voir entourée; c |  |
| 06 | 3585–3590 | 5 | 436 | Dimanche 12 décembre 1875 (3555) | Lundi 13 décembre 1875 | 050.0666 (1875-12-12) | 050.0670 (1875-12-13) | Et il ne se montre pas, quand il y a une femme prête à l’adorer ! Entends-tu, mi |  |
| 06 | 3632–3647 | 16 | 1,777 | Mardi 14 décembre 1875 (3613) | — | 050.0705 (1875-12-14) | 050.0707 (1875-12-15) | Rester le soir à la maison, c’est pleurer et m’abîmer les yeux, la peau, le sang |  |
| 06 | 3651–3668 | 15 | 1,899 | Mardi 14 décembre 1875 (3613) | Mercredi 15 décembre 1875 | 050.0705 (1875-12-14) | 050.0707 (1875-12-15) | Comme je suis d’humeur à m’attendre à toutes les vilenies de la terre, et au sur |  |
| 06 | 3678–3693 | 15 | 1,700 | Mercredi 15 décembre 1875 (3668) | Jeudi 16 décembre 1875 | 050.0715 (1875-12-15) | 050.0717 (1875-12-16) | Après m’être démenée de tous côtés, m’être tenue le front appuyé contre le mur,  |  |
| 06 | 3725–3739 | 14 | 881 | Jeudi 16 décembre 1875 (3693) | — | 050.0746 (1875-12-16) | 050.0748 (1875-12-17) | Je tenais à la main une boîte de ces fruits confits russes, *des airelles.* Comm |  |
| 06 | 3741–3747 | 6 | 756 | Jeudi 16 décembre 1875 (3693) | — | 050.0746 (1875-12-16) | 050.0748 (1875-12-17) | Eh bien, si je suis charmante, butor, pourquoi me cracher dessus ! |  |
| 06 | 3749–3756 | 6 | 630 | Jeudi 16 décembre 1875 (3693) | — | 050.0746 (1875-12-16) | 050.0748 (1875-12-17) | Si j’aimais, je serais très tourmentée, je ne voudrais pas souffrir que mon homm |  |
| 06 | 3758–3770 | 13 | 1,830 | Jeudi 16 décembre 1875 (3693) | — | 050.0746 (1875-12-16) | 050.0748 (1875-12-17) | Celui-ci est fort blessé de ce qu’on l’ait regardé comme un cheval, comme une ma |  |
| 06 | 3772–3777 | 6 | 906 | Jeudi 16 décembre 1875 (3693) | — | 050.0746 (1875-12-16) | 050.0748 (1875-12-17) | Il était si beau ce soir. |  |
| 06 | 3779–3783 | 5 | 533 | Jeudi 16 décembre 1875 (3693) | — | 050.0746 (1875-12-16) | 050.0748 (1875-12-17) | Je voudrais qu’il me crût un ange du ciel. |  |
| 06 | 3824–3845 | 21 | 1,992 | Samedi 18 décembre 1875 (3807) | — | 050.0776 (1875-12-18) | 050.0779 (1875-12-19) | Si vous voulons allez au théâtre nous pouvons avec de Daillens. |  |
| 06 | 3847–3851 | 4 | 873 | Samedi 18 décembre 1875 (3807) | Dimanche 19 décembre 1875 | 050.0776 (1875-12-18) | 050.0779 (1875-12-19) | Ah ! s’il m’aimait ! C’est mon rêve. |  |
| 06 | 3875–3891 | 17 | 2,616 | Dimanche 19 décembre 1875 (3851) | — | 050.0800 (1875-12-19) | 050.0802 (1875-12-19) | Devant ces pensées mes petits désagréments s’évanouissent. J’ai été un instant f |  |
| 06 | 3896–3921 | 23 | 3,170 | Dimanche 19 décembre 1875 (3851) | — | 050.0800 (1875-12-19) | 050.0802 (1875-12-19) | Non, je le sais, mais je ne vous connais pas d’hier, à onze ans je pensais comme |  |
| 06 | 3928–3932 | 5 | 1,466 | Dimanche 19 décembre 1875 (3851) | — | 050.0800 (1875-12-19) | 050.0802 (1875-12-19) | Vous le voudriez, je sais, mais vous n’aurez pas cette joie ! Je ne vis pas pour |  |
| 06 | 3934–3944 | 10 | 1,460 | Dimanche 19 décembre 1875 (3851) | — | 050.0800 (1875-12-19) | 050.0802 (1875-12-19) | On n’a pas encore refusé. Mais si on refuse ? Quel prétexte donnera le membre pe |  |
| 06 | 4012–4015 | 3 | 204 | Mardi 21 décembre 1875 (3996) | Mercredi 22 décembre 1875 | 050.0861 (1875-12-21) | 050.0115 (1875-11-22) | Ce qu’il y a de plus laid, c’est qu’Audiffret soit mêlé dans mon tourment maudit |  |
| 06 | 4249–4271 | 15 | 1,513 | Samedi 25 décembre 1875 (4094) | — | 050.1083 (1875-12-25) | 051.0002 (1875-12-26) | Mais pensez seulement aux choses que je lui ai écrites ! |  |

### 051 — 7 gaps, 27 paras, 3,490 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 4440–4443 | 3 | 488 | Jeudi 30 décembre 1875 (4393) | — | 051.0144 (1875-12-30) | 051.0213 (1876-01-01) | - S’ils le faisaient avec tout le monde, on ne les recevrait pas. Non c’est trai |  |
| 06 | 4447–4453 | 5 | 344 | Jeudi 30 décembre 1875 (4393) | — | 051.0144 (1875-12-30) | 051.0213 (1876-01-01) | Pourquoi bouillir et se déchirer ? | editorial? |
| 06 | 4455–4458 | 3 | 534 | Jeudi 30 décembre 1875 (4393) | — | 051.0144 (1875-12-30) | 051.0213 (1876-01-01) | Elle essaya plusieurs fois encore de me faire parler, mais je ne répondais pas à |  |
| 06 | 4460–4466 | 6 | 1,119 | Jeudi 30 décembre 1875 (4393) | — | 051.0144 (1875-12-30) | 051.0213 (1876-01-01) | les faits que j’enregistre si précieusement. |  |
| 06 | 4468–4471 | 4 | 659 | Jeudi 30 décembre 1875 (4393) | — | 051.0213 (1876-01-01) | 053.0023 (1876-01-24) | Ainsi, voilà, on s’est moqué de moi, puis on m’a craché dessus et on s’est détou |  |
| 06 | 4608–4611 | 4 | 168 | Samedi 1er janvier 1876 (4562) | — | 051.0224 (1876-01-01) | 051.0229 (1876-01-01) | DieU faitcS Que Hcn Pie me retienne. | short-only |
| 06 | 4666–4667 | 2 | 178 | Lundi 3 janvier 1876 (4620) | — | 051.0279 (1876-01-02-03) | 051.0281 (1876-01-04) | Espérons que tout ira bien. Pourvu que nous ayons des connaissances. |  |

### 052 — 1 gaps, 2 paras, 113 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 4821–4824 | 2 | 113 | Dimanche 9 janvier 1876 (4789) | Lundi 10 janvier 1876 | 051.0402 (1876-01-09) | 052.0002 (1876-01-10) | depuis le lundi 10 janvier 1876 jusqu’au lundi 23 janvier 1876 |  |

### 053 — 3 gaps, 34 paras, 5,270 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 06 | 4474–4490 | 16 | 2,480 | Jeudi 30 décembre 1875 (4393) | — | 053.0023 (1876-01-24) | 050.0516 (1875-12-06) | Voyons, peut-être suis-je laide, bête ? Non, non, mais je suis si humiliée, si p |  |
| 06 | 4492–4507 | 16 | 2,436 | Jeudi 30 décembre 1875 (4393) | — | 053.0023 (1876-01-24) | 050.0516 (1875-12-06) | Ai-je le courage de penser à ma figure, abattue, repoussée de partout. |  |
| 07 | 45–47 | 2 | 354 | 24 Janvier 1876 - 9 Mai 1876 (5) | Lundi 24 janvier 1876 | — | 053.0001 (1876-01-24) | depuis le lundi 24 janvier 1876 jusqu’au 10 février 1876 Rome, hôtel de Londres, |  |

### 054 — 3 gaps, 11 paras, 2,517 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 07 | 634–636 | 2 | 309 | Vendredi 11 février 1876 (603) | Samedi 12 février 1876 | 053.0492 (1876-02-11) | 054.0002 (1876-02-12) | depuis le samedi 12 février 1876 jusqu’au mardi 29 février 1876 Hôtel de Londres |  |
| 07 | 1088–1092 | 5 | 1,088 | Jeudi 24 février 1876 (1064) | — | 054.0434 (1876-02-24) | 054.0437 (1876-02-25) | Je pense aussi à Audiffret. C’est plein d’intérêt comme dirait Galula de Nice. A |  |
| 07 | 1094–1098 | 4 | 1,120 | Jeudi 24 février 1876 (1064) | Vendredi 25 février 1876 | 054.0434 (1876-02-24) | 054.0437 (1876-02-25) | J’ai dit que je ferais plus un pas pour personne, et à chaque instant j’ai envie |  |

### 055 — 5 gaps, 67 paras, 10,657 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 07 | 1359–1362 | 2 | 83 | Mardi 29 février 1876 (1274) | Mercredi 1er mars 1876 | 054.0660 (1876-02-29) | 055.0002 (1876-03-01) | depuis le mercredi 1er mars 1876 jusqu’au lundi 2.1 mars 1876 |  |
| 07 | 1829–1850 | 20 | 3,146 | Mercredi 8 mars 1876 (1641) | — | 055.0462 (1876-03-08) | 055.0464 (1876-03-09) | Deux, en si peu de jours, s’écrie maman. |  |
| 07 | 1852–1855 | 3 | 318 | Mercredi 8 mars 1876 (1641) | Jeudi 9 mars 1876 | 055.0462 (1876-03-08) | 055.0464 (1876-03-09) | Allons, bon ! voilà autre chose. Voilà qu’un malin esprit me souffle dans l'orei |  |
| 07 | 2346–2377 | 28 | 5,329 | Mardi 21 mars 1876 (2341) | — | 055.0933 (1876-03-21) | 055.0935 (1876-03-22) | Je viens de repasser mon dernier livre et je vois que ce n’est pas encore désesp |  |
| 07 | 2379–2401 | 14 | 1,781 | Mardi 21 mars 1876 (2341) | Mercredi 22 mars 1876 | 055.0933 (1876-03-21) | 055.0935 (1876-03-22) | Le bon soldat me baise la main en la touchant à peine de ses lèvres comme toujou |  |

### 056 — 7 gaps, 60 paras, 9,578 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 07 | 3150–3170 | 20 | 3,713 | Jeudi 6 avril 1876 (3125) | — | 056.0427 (1876-04-06) | 056.0429 (1876-04-07) | Oui, voilà le grand mot ! Et moi avec toutes mes tendances, avec tous mes immens |  |
| 07 | 3241–3246 | 5 | 938 | Samedi 8 avril 1876 (3224) | — | 056.0491 (1876-04-08) | 056.0493 (1876-04-09) | Je ne pensais qu’à la joie que j’aurais si ma chambre était isolée, ici je devai |  |
| 07 | 3248–3259 | 12 | 1,880 | Samedi 8 avril 1876 (3224) | — | 056.0491 (1876-04-08) | 056.0493 (1876-04-09) | Non, je ne peux pas croire qu'il m’ait trompée tout le temps en tout ! Ce serait |  |
| 07 | 3261–3267 | 7 | 864 | Samedi 8 avril 1876 (3224) | — | 056.0491 (1876-04-08) | 056.0493 (1876-04-09) | Non, mais me voyez-vous pleurant devant le portrait d’un homme ! Certes la femme |  |
| 07 | 3269–3277 | 9 | 1,252 | Samedi 8 avril 1876 (3224) | — | 056.0491 (1876-04-08) | 056.0493 (1876-04-09) | Tous ceux qui me voient rieuse et folle me disent: Vous finirez dans un couvent. |  |
| 07 | 3279–3280 | 2 | 155 | Samedi 8 avril 1876 (3224) | — | 056.0491 (1876-04-08) | 056.0493 (1876-04-09) | J’ai encore une cigarette et demie. Fumons tout. |  |
| 07 | 3282–3287 | 5 | 776 | Samedi 8 avril 1876 (3224) | — | 056.0491 (1876-04-08) | 056.0493 (1876-04-09) | Mais j’ai son portrait, je vais l’adorer. S'il m’a trompée je le maudis, si on l |  |

### 057 — 6 gaps, 34 paras, 4,789 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 07 | 3461–3472 | 12 | 1,418 | Lundi 10 avril 1876 (3437) | — | 057.0023 (1876-04-10) | 057.0025 (1876-04-11) | Ensuite j’ai changé de chapeau et mis une pelisse et nous sommes allés au Corso. |  |
| 07 | 3474–3477 | 3 | 469 | Lundi 10 avril 1876 (3437) | — | 057.0023 (1876-04-10) | 057.0025 (1876-04-11) | Oui, c’est juste, il ne le savait pas. Oh ! s’il le savait il ne partirait pas.  |  |
| 07 | 3481–3492 | 9 | 1,653 | Lundi 10 avril 1876 (3437) | — | 057.0023 (1876-04-10) | 057.0025 (1876-04-11) | Eh bien, mercredi ou jeudi nous partirons pour Naples, nous reviendrons au bout  |  |
| 07 | 3494–3497 | 3 | 554 | Lundi 10 avril 1876 (3437) | Mardi 11 avril 1876 | 057.0023 (1876-04-10) | 057.0025 (1876-04-11) | Ah ! à propos, maman a envoyé demander des nouvelles de Visconti, à la suite de  |  |
| 07 | 3553–3556 | 3 | 257 | Mercredi 12 avril 1876 (3533) | Jeudi 13 avril 1876 | 057.0075 (1876-04-12) | 057.0077 (1876-04-13) | Il fait un temps gris, je suis d’humeur grise. |  |
| 07 | 3624–3628 | 4 | 438 | Jeudi 13 avril 1876 (3556) | Jeudi 13 avril 1876 - suite | 057.0132 (1876-04-13) | 057.0134 (1876-04-13) | depuis le jeudi 13 avril 1876 |  |

### 058 — 5 gaps, 47 paras, 6,540 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 07 | 3693–3695 | 3 | 214 | Samedi 15 avril 1876 (3673) | — | 058.0052 (1876-04-15) | 058.0054 (1876-04-16) | Mais de retour à Rome, l’y trouverai-je ? Et quelle mine va-t-il faire ? |  |
| 07 | 3697–3705 | 8 | 1,623 | Samedi 15 avril 1876 (3673) | Dimanche 16 avril 1876 - Pâque | 058.0052 (1876-04-15) | 058.0054 (1876-04-16) | Dieu que ma jeune âme a de peine à croire au mensonge, à la petitesse, à la lâch |  |
| 07 | 3830–3834 | 3 | 229 | Mardi 18 avril 1876 (3785) | Mercredi 19 avril 1876 | 058.0169 (1876-04-18) | 058.0171 (1876-04-19) | Et tout cela ne va pas me priver du poulet rôti qui est là. Fi I fi ! autant que |  |
| 07 | 3876–3911 | 30 | 4,095 | Mercredi 19 avril 1876 (3834) | — | 058.0208 (1876-04-19) | 059.0002 (1876-04-20) | Ah I Pietro ! crois-moi, si je pouvais seulement, je te ferais payer cher tous l |  |
| 07 | 3914–3918 | 3 | 379 | Mercredi 19 avril 1876 (3834) | — | 058.0208 (1876-04-19) | 059.0002 (1876-04-20) | Et qui choisirais-tu, lui ou Doenhoff ? |  |

### 059 — 32 gaps, 303 paras, 47,713 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 07 | 3969–3979 | 10 | 1,730 | Jeudi 20 avril 1876 (3933) | — | 059.0044 (1876-04-20) | 059.0046 (1876-04-21) | Peste ! mais il est charmant. Grand, bien fait, des cheveux châtain foncé, un ne |  |
| 07 | 3982–4001 | 19 | 3,793 | Jeudi 20 avril 1876 (3933) | — | 059.0044 (1876-04-20) | 059.0046 (1876-04-21) | [Dans la marge: Eh bien j'en change, Dieu merci, Emile, Pierre, Clément, Doria e | bracketed/rayé |
| 07 | 4003–4006 | 3 | 719 | Jeudi 20 avril 1876 (3933) | Vendredi 21 avril 1876 | 059.0044 (1876-04-20) | 059.0046 (1876-04-21) | - Il m’avait promis de venir à Naples, dit Saint-Joseph, mais à présent il ne ve |  |
| 07 | 4015–4020 | 5 | 772 | Vendredi 21 avril 1876 (4006) | — | 059.0052 (1876-04-21) | 059.0055 (1876-04-22) | La course des gentlemen est un divin amusement, cela rappelle les tournois du Mo |  |
| 07 | 4022–4035 | 12 | 1,025 | Vendredi 21 avril 1876 (4006) | — | 059.0052 (1876-04-21) | 059.0055 (1876-04-22) | Oui, peut-être, dit maman. |  |
| 07 | 4037–4050 | 12 | 2,536 | Vendredi 21 avril 1876 (4006) | — | 059.0052 (1876-04-21) | 059.0055 (1876-04-22) | Personne ne m’avait contrariée et je me tus, et pas trop en colère. J’avais parl |  |
| 07 | 4054–4058 | 4 | 496 | Vendredi 21 avril 1876 (4006) | Samedi 22 avril 1876 | 059.0052 (1876-04-21) | 059.0055 (1876-04-22) | Sans doute non, il savait que nous n’y étions plus en entrant dans Rome. Et pour |  |
| 07 | 4063–4085 | 21 | 3,909 | Samedi 22 avril 1876 (4058) | — | 059.0056 (1876-04-22) | 059.0058 (1876-04-23) | J’ai une ravissante toilette aujourd’hui, tout en cachemire blanc. Une chemisett |  |
| 07 | 4087–4094 | 6 | 645 | Samedi 22 avril 1876 (4058) | Dimanche 23 avril 1876 | 059.0056 (1876-04-22) | 059.0058 (1876-04-23) | Maman me répète sans cesse qu’il ne s’occupe pas de moi. C’est peine inutile, je |  |
| 07 | 4110–4114 | 5 | 1,395 | Dimanche 23 avril 1876 (4094) | — | 059.0069 (1876-04-23) | 059.0072 (1876-04-24) | Ah ! nom d’un hippopotame I En ce moment la cloche sonne, je monte, on ferme la  |  |
| 07 | 4116–4125 | 10 | 2,104 | Dimanche 23 avril 1876 (4094) | — | 059.0069 (1876-04-23) | 059.0072 (1876-04-24) | [En travers: Prenez en note, mes amis.] | bracketed/rayé |
| 07 | 4127–4183 | 52 | 8,380 | Dimanche 23 avril 1876 (4094) | Lundi 24 avril 1876 | 059.0069 (1876-04-23) | 059.0072 (1876-04-24) | On m’a réveillée à la gare de Rome et mon premier mot fut: Larderei, et mon prem |  |
| 07 | 4202–4208 | 4 | 195 | Lundi 24 avril 1876 (4183) | — | 059.0086 (1876-04-24) | 059.0089 (1876-04-25) | Le vrai amour ne raisonne pas. Vous m’aimez ? | short-only |
| 07 | 4210–4223 | 13 | 1,939 | Lundi 24 avril 1876 (4183) | — | 059.0086 (1876-04-24) | 059.0089 (1876-04-25) | Peut-être est-ce mal de lire des romans, car parce qu’il ne dit rien comme dans  |  |
| 07 | 4225–4234 | 9 | 1,394 | Lundi 24 avril 1876 (4183) | — | 059.0086 (1876-04-24) | 059.0089 (1876-04-25) | Quel chaos ! Bon Dieu, faites que je comprenne quelque chose, que je ne sois plu |  |
| 07 | 4236–4239 | 3 | 110 | Lundi 24 avril 1876 (4183) | Mardi 25 avril 1876 | 059.0086 (1876-04-24) | 059.0089 (1876-04-25) | Quel état ennuyeux ! | short-only |
| 07 | 4248–4251 | 4 | 1,099 | Mardi 25 avril 1876 (4239) | — | 059.0095 (1876-04-25) | 059.0098 (1876-04-26) | C’est inutile, Monsieur, je vois bien à quoi m'en tenir sur votre bel amour. Vou |  |
| 07 | 4254–4255 | 2 | 263 | Mardi 25 avril 1876 (4239) | — | 059.0095 (1876-04-25) | 059.0098 (1876-04-26) | Bigre ! je n’aurais pas parlé autrement à sa place, mais néanmoins je le trouve  |  |
| 07 | 4258–4259 | 2 | 128 | Mardi 25 avril 1876 (4239) | — | 059.0095 (1876-04-25) | 059.0098 (1876-04-26) | dégourdit, qui me fait bouillir le sang en me donnant froid dans le dos ! |  |
| 07 | 4343–4360 | 15 | 1,279 | Mardi 25 avril 1876 (4239) | — | 059.0176 (1876-04-26) | 059.0178 (1876-04-27) | Et où irez-vous ? |  |
| 07 | 4362–4380 | 13 | 1,929 | Mardi 25 avril 1876 (4239) | Mercredi 26 avril 1876 | 059.0176 (1876-04-26) | 059.0178 (1876-04-27) | Relevez-vous, Monsieur, je crois que je vais me trouver mal, mais il me soutint. |  |
| 07 | 4436–4443 | 7 | 837 | Mercredi 26 avril 1876 (4380) | Jeudi 27 avril 1876 | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | Ah ! c’est juste. |  |
| 07 | 4445–4455 | 9 | 1,593 | Jeudi 27 avril 1876 (4443) | — | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | Mais je me suis levée fraîche et bien et à neuf heures nous étions à la gare ave |  |
| 07 | 4458–4466 | 7 | 1,103 | Jeudi 27 avril 1876 (4443) | — | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | Vous voulez toujours qu’on s’exprime en détail et mathématiquement, certaines ch |  |
| 07 | 4470–4485 | 10 | 554 | Jeudi 27 avril 1876 (4443) | — | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | Même signe. |  |
| 07 | 4487–4496 | 9 | 1,422 | Jeudi 27 avril 1876 (4443) | — | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | Oui, Monsieur, au revoir. |  |
| 07 | 4503–4506 | 4 | 276 | Jeudi 27 avril 1876 (4443) | — | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | J’aurais été désolée de quitter Rome à laquelle je suis si habituée si je n’avai |  |
| 07 | 4514–4520 | 5 | 432 | Jeudi 27 avril 1876 (4443) | Vendredi 28 avril 1876 | 059.0228 (1876-04-27) | 059.0230 (1876-04-28) | Oui, ce qui fait que dans dix à douze jours je serai de nouveau à Rome tant pour |  |
| 07 | 4532–4544 | 10 | 1,305 | Vendredi 28 avril 1876 (4520) | — | 059.0239 (1876-04-28) | 059.0241 (1876-04-29) | Varpahowsky dîne avec nous. Le temps s’est passé à raconter les nouvelles de Rom |  |
| 07 | 4546–4551 | 5 | 924 | Vendredi 28 avril 1876 (4520) | Samedi 29 avril 1876 | 059.0239 (1876-04-28) | 059.0241 (1876-04-29) | - Non, dis-je me contenant avec peine, non. D’ailleurs je vous prie de n’en plus |  |
| 07 | 4643–4647 | 4 | 1,594 | Mardi 2 mai 1876 (4623) | Mercredi 3 mai 1876 | 059.0325 (1876-05-02) | 059.0327 (1876-05-03) | Revenons à Pietro. Qu’avais-je encore à dire... voyons ? Je ne sais plus, mais j |  |
| 07 | 4687–4697 | 9 | 1,833 | Mercredi 3 mai 1876 (4647) | Jeudi 4 mai 1876 | 059.0360 (1876-05-03) | 059.0362 (1876-05-04) | Si tout cela est vrai et qu’il soit vraiment une saleté je regrette grandement d |  |

### 060 — 5 gaps, 44 paras, 5,060 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 08 | 69–72 | 3 | 527 | 10 Mai 1876 au 16 août 1876 (10) | Mercredi 10 mai 1876 - jeudi 1 | — | 060.0002 (1876-05-10) | depuis le mercredi 10 mai 1876 jusqu’au samedi 20 mai 1876 Rome, hôtel de la Vil |  |
| 08 | 599–610 | 10 | 1,379 | Jeudi 18 mai 1876 (525) | — | 060.0504 (1876-05-18) | 060.0506 (1876-05-19) | Je relisais le jour des courses quand je me suis de nouveau souvenue d’hier ! Je |  |
| 08 | 612–619 | 8 | 636 | Jeudi 18 mai 1876 (525) | — | 060.0504 (1876-05-18) | 060.0506 (1876-05-19) | Il était très rouge en lisant et très embarrassé. |  |
| 08 | 621–642 | 15 | 1,081 | Jeudi 18 mai 1876 (525) | — | 060.0504 (1876-05-18) | 060.0506 (1876-05-19) | Il fait plus frais dans l’autre chambre, dit-il, venez. |  |
| 08 | 644–652 | 8 | 1,437 | Jeudi 18 mai 1876 (525) | Vendredi 19 mai 1876 | 060.0504 (1876-05-18) | 060.0506 (1876-05-19) | Ah ! je veux aller dans le monde, ce monde qui ne veut pas de moi ! Que lui ai-j |  |

### 061 — 5 gaps, 72 paras, 15,908 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 08 | 1130–1144 | 13 | 1,448 | Mercredi 24 mai 1876 (1095) | — | 061.0084 (1876-05-24) | 061.0086 (1876-05-25) | Soigne-toi, continua-t-elle doucement. |  |
| 08 | 1148–1160 | 10 | 1,362 | Mercredi 24 mai 1876 (1095) | Jeudi 25 mai 1876 | 061.0084 (1876-05-24) | 061.0086 (1876-05-25) | Elle embrasse comme Pietro, dit-elle en riant. |  |
| 08 | 1214–1251 | 35 | 9,753 | Vendredi 26 mai 1876 (1203) | — | 061.0138 (1876-05-26) | 061.0140 (1876-05-27) | Au fait, j’avais besoin pour calmer mon amour-propre, d’entendre toutes ces offr |  |
| 08 | 1253–1260 | 6 | 1,145 | Vendredi 26 mai 1876 (1203) | Samedi 27 mai 1876 | 061.0138 (1876-05-26) | 061.0140 (1876-05-27) | Je l’aime tant que cet amour surnaturel et insensé m’étouffe et, si Antonelli vi |  |
| 08 | 1293–1300 | 8 | 2,200 | Samedi 27 mai 1876 (1260) | — | 061.0168 (1876-05-27) | 061.0172 (1876-05-28) | Avant de le refuser il faut bien penser. Mais je sais qu’il n’est pas riche auta |  |

### 062 — 14 gaps, 141 paras, 33,964 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 08 | 1350–1355 | 3 | 135 | Dimanche 28 mai 1876 (1301) | Lundi 29 mai 1876 | 061.0216 (1876-05-28) | 062.0002 (1876-05-29) | Depuis le lundi 29 mai 1876 jusqu’au lundi 3 juillet 1876 | short-only |
| 08 | 1544–1547 | 4 | 1,063 | Dimanche 4 juin 1876 (1513) | — | 062.0193 (1876-06-04) | 062.0195 (1876-06-05) | J’ai des incertitudes sur le compte de la Vierge. |  |
| 08 | 1549–1554 | 5 | 492 | Dimanche 4 juin 1876 (1513) | Lundi 5 juin 1876 | 062.0193 (1876-06-04) | 062.0195 (1876-06-05) | Vous vous égarez aussi, dira-t-on. Non, je ne m’égare point. Je ne puis [leur] f |  |
| 08 | 1867–1870 | 2 | 222 | Samedi 10 juin 1876 (1786) | Dimanche 11 juin 1876 | 062.0310 (1876-06-10) | 062.0311 (1876-06-11) | C’est fini ! Je disais bien que cela ne pouvait durer. |  |
| 08 | 1909–1913 | 3 | 648 | Lundi 12 juin 1876 (1898) | Mardi 13 juin 1876 | 062.0320 (1876-06-12) | 062.0321 (1876-06-13) | Ce matin je trouvai sur mon assiette une lettre. Le timbre portait une figure qu |  |
| 08 | 2366–2393 | 24 | 4,615 | Samedi 24 juin 1876 (2302) | — | 062.0502 (1876-06-21) | 062.0583 (1876-06-25) | N... non., mais je ne l’ai pas refusé, bref je sais ce que je dis. C’est à cause |  |
| 08 | 2397–2416 | 14 | 932 | Samedi 24 juin 1876 (2302) | — | 062.0502 (1876-06-21) | 062.0583 (1876-06-25) | Vous conviendrez que c’est trop fort. |  |
| 08 | 2418–2430 | 13 | 2,878 | Samedi 24 juin 1876 (2302) | — | 062.0502 (1876-06-21) | 062.0583 (1876-06-25) | Alors si Miloradovitch te demande en mariage tu refuseras ? demanda maman oublia |  |
| 08 | 2432–2461 | 28 | 5,229 | Samedi 24 juin 1876 (2302) | Dimanche 25 juin 1876 | 062.0502 (1876-06-21) | 062.0583 (1876-06-25) | Quanti ce n’è che sentendomi cantare, Diran : Viva colei che a il cor contento. |  |
| 08 | 2586–2599 | 14 | 14,218 | Mardi 27 juin 1876 (2570) | — | 062.0632 (1876-06-27) | 062.0634 (1876-06-27) | Il me dit avec un gracieux sourire « dans un moment je suis à vous ! ». Je m’ass | clipping? |
| 08 | 2687–2704 | 16 | 2,044 | Vendredi 30 juin 1876 (2677) | — | 062.0673 (1876-06-30) | 062.0674 (1876-07-01) | Mais ma tante n’écoutait plus, on parlait de mon départ. Il se faisait tard et j |  |
| 08 | 2706–2709 | 4 | 687 | Vendredi 30 juin 1876 (2677) | — | 062.0673 (1876-06-30) | 062.0674 (1876-07-01) | Ce Mastaï Ferretti a la vie dure. Oh ! non, pauvre vieillard. |  |
| 08 | 2794–2799 | 3 | 207 | Lundi 3 juillet 1876 (2739) | Mardi 4 juillet 1876 - mercred | 062.0735 (1876-07-03) | 063.0001 (1876-07-04-05) | Hfis] Gfrace] tfhe] Dfuke] off] Hfamilton] |  |
| 08 | 4274–4283 | 8 | 594 | Mercredi 16 août (4 août 1876) (4236) | — | 062.0605 (1876-06-26) | — | Au lieu du mépris que je voulais provoquer, je n’ai éprouvé que de l’attendrisse |  |

### 063 — 14 gaps, 229 paras, 35,581 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 08 | 2938–2944 | 6 | 745 | Lundi 10 juillet 1876 (2938) | Lundi 10 juillet 1876 | 063.0132 (1876-07-09) | 063.0134 (1876-07-12) | Ah ! je suis contente, on a payé Binder. On n’a plus cette dette. |  |
| 08 | 2946–2958 | 13 | 4,072 | Lundi 10 juillet 1876 (2938) | — | 063.0132 (1876-07-09) | 063.0134 (1876-07-12) | Rémy a passé la soirée chez nous. D’abord la conversation a roulé sur mes charme | editorial? |
| 08 | 2960–2963 | 4 | 1,021 | Lundi 10 juillet 1876 (2938) | — | 063.0132 (1876-07-09) | 063.0134 (1876-07-12) | Non, n’attribuez pas ma conduite à d’affreux calculs ! Je n’aime pas un homme pa |  |
| 08 | 2965–2969 | 4 | 1,708 | Mardi 11 juillet 1876 (2965) | Mardi 11 juillet 1876 | 063.0132 (1876-07-09) | 063.0134 (1876-07-12) | On ne peut pas s’imaginer un être plus malheureux que moi aujourd’hui. J’étais c |  |
| 08 | 3011–3040 | 26 | 5,655 | Jeudi 13 juillet 1876 (3011) | Jeudi 13 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | J’ai reçu Rémy en costume complet de capucin. Oui, en capucin, Caroline m’a fait |  |
| 08 | 3042–3115 | 63 | 7,028 | Jeudi 13 juillet 1876 (3011) | Vendredi 14 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Mon Dieu... ou faites-moi mourir 1 |  |
| 08 | 3117–3133 | 15 | 2,260 | Vendredi 14 juillet 1876 (3043) | Samedi 15 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | - J’en ai, Monsieur, j’en ai, vous verrez d’ailleurs. |  |
| 08 | 3136–3142 | 7 | 1,583 | Samedi 15 juillet 1876 (3126) | — | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | - Sans doute, répondais-je. |  |
| 08 | 3144–3147 | 3 | 316 | Samedi 15 juillet 1876 (3126) | Dimanche 16 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Ah ! si je pouvais savoir si Antonelli est à Rome. Cela m’occupe plus que vous l |  |
| 08 | 3150–3219 | 51 | 5,407 | Dimanche 16 juillet 1876 (3145) | Lundi 17 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Il n’y a que deux hôtels dans les Champs-Elysées que je voudrais avoir. Celui du |  |
| 08 | 3221–3242 | 15 | 1,402 | Lundi 17 juillet 1876 (3158) | — | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Tout à fait, répondit-elle. |  |
| 08 | 3244–3253 | 8 | 365 | Lundi 17 juillet 1876 (3158) | — | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Oui, mais vous aurez une grande fortune. |  |
| 08 | 3256–3257 | 2 | 905 | Lundi 17 juillet 1876 (3158) | — | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Nous avons frappé à la porte et la magnétiseuse vint réveiller l’endormie. |  |
| 08 | 3260–3272 | 12 | 3,114 | Lundi 17 juillet 1876 (3158) | Mardi 18 juillet 1876 | 063.0173 (1876-07-12) | 063.0175 (1876-07-18) | Je suis contente, excitée plutôt. J’accepte l’absence de Pietro, j’explique ains |  |

### 064 — 2 gaps, 71 paras, 13,228 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 08 | 4183–4231 | 43 | 7,778 | Lundi 14 août (2 août 1876) (4183) | Lundi 14 août (2 août 1876); Mardi 15 août (3 août 1876) | 064.0559 (1876-08-13) | 062.0605 (1876-06-26) | Hier à une heure nous avons quitté Moscou pleine de mouvement et pavoisée de dra |  |
| 08 | 4234–4272 | 28 | 5,450 | Mardi 15 août (3 août 1876) (4220) | Mercredi 16 août (4 août 1876) | 064.0559 (1876-08-13) | 062.0605 (1876-06-26) | Alors, j’aime Antonelli ? Quelle idée, j’aime bien mieux le grand-duc. Ah c’est  |  |

### 066 — 27 gaps, 732 paras, 131,826 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 09 | 511–515 | 4 | 2,106 | Jeudi 24 août 1 876 (12 août) (454) | — | 066.0164 (1876-09-13) | 066.0168 (1876-09-15) | Je montai et me mis au piano, Pacha m’écoutait de loin. Et bientôt arrivèrent le |  |
| 09 | 522–587 | 55 | 7,480 | Jeudi 24 août 1 876 (12 août) (454) | Vendredi 25 août 1876 (13 août; Samedi 26 août 1876 (14 août) | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Nous avons encore joué au croquet, papa nous surveillait. Il remarque l’assiduit |  |
| 09 | 589–603 | 12 | 1,790 | Samedi 26 août 1876 (14 août) (584) | — | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Mon père, qui estimait mon talent comme une vaine vantardise, le reconut et fut  |  |
| 09 | 606–631 | 23 | 3,556 | Samedi 26 août 1876 (14 août) (584) | Dimanche 27 août 1876 (15 août | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Alors visiblement soulagé il me fit plusieurs questions sur la manière de passer |  |
| 09 | 633–654 | 20 | 3,129 | Dimanche 27 août 1876 (15 août) (627) | Lundi 28 août 1876 (16 août) | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Il a écrit à sa mère lui demandant la permission de rester en Russie à des gages |  |
| 09 | 656–779 | 111 | 17,368 | Lundi 28 août 1876 (16 août) (645) | Mardi 29 août 1876 (17 août); Mercredi 30 août 1876 (16 août | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Quand ils furent partis pour la maison rouge je me mis au piano et je versais su |  |
| 09 | 781–818 | 34 | 5,628 | Mercredi 30 août 1876 (16 août) (726) | Jeudi 31 août 1876 (19 août) | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Sans doute, mais vous ne pourrez jamais vous donner une idée de la vilenie de ce |  |
| 09 | 821–851 | 26 | 5,332 | Jeudi 31 août 1876 (19 août) (785) | Vendredi 1er septembre 1876 (2; Samedi 2 septembre 1876 (21 ao | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | [Dans la marge: Et dire que je ne connaissais pas les intrigues de toute cette c | bracketed/rayé |
| 09 | 854–954 | 89 | 19,857 | Samedi 2 septembre 1876 (21 août) (836) | Dimanche 3 septembre 1876 (22 ; Lundi 4 septembre 1876 (23 aoû; Mardi 5 septembre 1876 (24 aoû; Mercredi 6 septembre 1876 (25 ; Jeudi 7 septembre 1876 (26 aoû | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | depuis le dimanche 3 septembre 1876 jusqu'au jeudi 12 octobre 1876 | clipping? |
| 09 | 957–967 | 10 | 2,521 | Vendredi 8 septembre 1876 (27 août) (957) | Vendredi 8 septembre 1876 (27  | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Misérable peur je te vaincrai ! Ne me suis-je pas avisée hier de craindre le fus |  |
| 09 | 971–976 | 6 | 458 | Vendredi 8 septembre 1876 (27 août) (957) | — | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | J'ai la tête terriblement montée à propos de Cassagnac. |  |
| 09 | 978–1058 | 72 | 16,671 | Vendredi 8 septembre 1876 (27 août) (957) | Samedi 9 septembre 1876 (28 ao; Dimanche 10 septembre 1876 (29; Lundi 11 septembre 1876 (30 ao; Mardi 12 septembre 1876 (31 ao | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Et Antonelli ? Moi, l'aimer ? Non, est-ce ainsi que l'on aime ? Non. S'il n'étai |  |
| 09 | 1060–1074 | 12 | 3,016 | Mercredi 13 septembre 1 876 (1er sept.) (1060) | Mercredi 13 septembre 1 876 (1; Jeudi 14 septembre 1876 (2 sep | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Hier nous fîmes au théâtre une de ces apparitions comme j'en ai rêvées à Nice du |  |
| 09 | 1077–1103 | 25 | 4,074 | Jeudi 14 septembre 1876 (2 septembre) (1070) | — | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Ah ! ha ! homme vert ! C'est pour cela ! Oh ! que vous êtes donc étrange. Ah ! c |  |
| 09 | 1105–1140 | 29 | 4,189 | Jeudi 14 septembre 1876 (2 septembre) (1070) | Vendredi 15 septembre 1 876 (3; Samedi 16 septembre 1 876 (4 s | 066.0173 (1876-09-15) | 066.0175 (1876-09-16) | Mais aujourd’hui je ne fais que répéter "Tu vois ce beau garçon-là, c’est l’aman |  |
| 09 | 1292–1294 | 3 | 512 | Dimanche 24 septembre 1876 (12 septembre (1259) | — | 066.0323 (1876-09-24) | 066.0326 (1876-09-25) | Cette brillante journée a été terminée par un concert sur l'escalier, ma voix, c |  |
| 09 | 1296–1298 | 2 | 39 | Dimanche 24 septembre 1876 (12 septembre (1259) | Lundi 25 septembre 1876 (13 se | 066.0323 (1876-09-24) | 066.0326 (1876-09-25) | "Italia, raggio del del. | short-only |
| 09 | 1358–1367 | 9 | 1,285 | Mercredi 27 septembre 1876 (15 septembre (1341) | — | 066.0383 (1876-09-27) | 066.0386 (1876-09-28) | Si c'était vrai, ce serait très touchant, mais comme je n'ai pas assisté à tout  |  |
| 09 | 1369–1377 | 9 | 1,156 | Mercredi 27 septembre 1876 (15 septembre (1341) | — | 066.0383 (1876-09-27) | 066.0386 (1876-09-28) | Ce matin à huit heures nous allions partir pour Poltava quand arriva Mme Hélène  |  |
| 09 | 1379–1392 | 12 | 1,655 | Mercredi 27 septembre 1876 (15 septembre (1341) | Jeudi 28 septembre 1 876 (16 s | 066.0383 (1876-09-27) | 066.0386 (1876-09-28) | - Pardon Monsieur, il y en eu, du temps où existait l'OIympe. |  |
| 09 | 1427–1442 | 12 | 997 | Vendredi 29 septembre 1876 (17 septembre (1400) | Samedi 30 septembre 1876 (18 s | 066.0418 (1876-09-29) | 066.0422 (1876-09-30) | - Ah ! disait-il, cela bouleverse tout de même tu sais non, vrai. |  |
| 09 | 1491–1496 | 2 | 59 | Mardi 3 octobre 1876 (21 septembre) (1469) | Mercredi 4 octobre 1876 (22 se | 066.0469 (1876-10-03) | 066.0472 (1876-10-04) | His Grace the Duc of Hamilton | short-only |
| 09 | 1559–1563 | 5 | 1,018 | Vendredi 6 octobre 1876 (24 septembre) (1525) | — | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | Alexandre m'a confié une affaire de paysans qui dépend de mon père et à laquelle |  |
| 09 | 1565–1583 | 17 | 2,902 | Vendredi 6 octobre 1876 (24 septembre) (1525) | Samedi 7 octobre 1876 (25 sept | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | Mon père me fit rager en discutant exprès sur la construction du conpensateur, ( |  |
| 09 | 1585–1650 | 57 | 10,765 | Samedi 7 octobre 1876 (25 septembre) (1576) | Dimanche 8 octobre 1876 (26 se; Lundi 9 octobre 1876 (27 septe; Mardi 10 octobre 1876 (28 sept; Mercredi 11 octobre 1 876 (29  | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | Je ne le deviendrai pas, mon état naturel est de mêler le sérieux et la folie en |  |
| 09 | 1652–1668 | 16 | 2,175 | Mercredi 11 octobre 1 876 (29 septembre) (1629) | — | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | Je me jetais sur mon canapé, on parla de mon chagrin. Mon père m'aime, il a trop |  |
| 09 | 1670–1738 | 60 | 12,088 | Mercredi 11 octobre 1 876 (29 septembre) (1629) | Jeudi 12 octobre 1876 (30 sept; Vendredi 13 octobre 1 876 (1er | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | Mes tantes, sous prétexte de promenade, sont allées faire une visite à la maître |  |

### 067 — 34 gaps, 716 paras, 117,151 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 09 | 1812–1823 | 9 | 422 | Mardi 17 octobre 1 876 (5 octobre) (1805) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Non mais je devine. |  |
| 09 | 1826–1830 | 4 | 608 | Mardi 17 octobre 1 876 (5 octobre) (1805) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Vous savez, repris-je au bout d'un instant, j’ai à vous raconter quelque chose.. |  |
| 09 | 1832–1842 | 10 | 1,146 | Mardi 17 octobre 1 876 (5 octobre) (1805) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Hélène ne fait que faire des remarques à son fils sur son air “écrasé”, “affolé” |  |
| 09 | 1844–1853 | 9 | 1,244 | Mardi 17 octobre 1 876 (5 octobre) (1805) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Tenez, dis-je à l'homme vert en lui jetant une petite touffe de fils d'or roussi |  |
| 09 | 1855–1981 | 103 | 18,757 | Mardi 17 octobre 1 876 (5 octobre) (1805) | Mercredi 18 octobre 1 876 (6 o; Jeudi 19 octobre 1 876 (7 octo; Vendredi 20 octobre 1 876 (8 o; Samedi 21 octobre 1 876 (9 oct; Dimanche 22 octobre 1 876 (10 ; Lundi 23 octobre 1876 (11 octo | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Je donnai à mon presque-frère à lire Corinne et lui tendis la main, il la serra  |  |
| 09 | 1983–2047 | 52 | 10,338 | Lundi 23 octobre 1876 (11 octobre) (1916) | Mardi 24 octobre 1 876 (12 oct; Mercredi 25 octobre 1 876 (13 ; Jeudi 26 octobre 1 876 (14 oct; Vendredi 27 octobre 1 876 ( 15; Samedi 28 octobre 1876 ( 16 oc | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | J'ai vu ma nourrice Martha. |  |
| 09 | 2049–2137 | 82 | 16,314 | Samedi 28 octobre 1876 ( 16 octobre) (2046) | Dimanche 29 octobre 1 876 (17 ; Lundi 30 octobre 1876 (18 octo; Mardi 31 octobre 1 876 ( 19 oc | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Quoiqu'il fasse, je lui pardonne; il me calme, il me fait voir les choses sous u |  |
| 09 | 2139–2162 | 17 | 2,152 | Mardi 31 octobre 1 876 ( 19 octobre) (2111) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | J'allai chez Alexandre et Nadine dont la chambre est à côté de la mienne parler  |  |
| 09 | 2164–2166 | 3 | 531 | Mardi 31 octobre 1 876 ( 19 octobre) (2111) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Petite chérie, vous ne savez rien. Il y a des beautés qu'on regarde comme un obj |  |
| 09 | 2170–2174 | 4 | 327 | Mardi 31 octobre 1 876 ( 19 octobre) (2111) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | [Quatre lignes rayées mais remplacées ci-dessous] | bracketed/rayé |
| 09 | 2176–2177 | 2 | 210 | Mardi 31 octobre 1 876 ( 19 octobre) (2111) | — | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | Voilà donc pourquoi... cela et autre chose et ceci et tout ! |  |
| 09 | 2180–2212 | 31 | 4,674 | Mardi 31 octobre 1 876 ( 19 octobre) (2111) | Mercredi Ier novembre 1 876 (2 | 068.0249 (1877-01-10-18) | 067.0001 (1876-11-01-continued) | - C'est un vilain homme dit-il, et il ne s'arrêterait devant rien au monde. Il n |  |
| 09 | 2231–2238 | 3 | 647 | Mercredi Ier novembre 1 876 (20 octobre) (2202) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Que si, voyons, cher homme vert, ne faisons pas de cérémonies, vous savez qu'à p |  |
| 09 | 2241–2281 | 27 | 2,080 | Mercredi Ier novembre 1 876 (20 octobre) (2202) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Encore vrai...et ma figure ? |  |
| 09 | 2287–2301 | 12 | 984 | Mercredi Ier novembre 1 876 (20 octobre) (2202) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | C'est drôle. Par moment je crois me tromper et vous avoir pris pour plus que vou |  |
| 09 | 2303–2314 | 7 | 345 | Mercredi Ier novembre 1 876 (20 octobre) (2202) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | On m'a manqué de respect. |  |
| 09 | 2316–2358 | 39 | 6,945 | Mercredi Ier novembre 1 876 (20 octobre) (2202) | Jeudi 2 novembre 1876 (21 octo; Vendredi 3 novembre 1 876 (22  | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Ça fait... dis-je, comment ce que ça fait... mais il se couvrira de gloire, il s |  |
| 09 | 2360–2373 | 14 | 1,383 | Vendredi 3 novembre 1 876 (22 octobre) (2347) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Je dînai avec lui, Paul, Pacha, Gedanoff, je tâchai d'être douce, je le fus. Aut |  |
| 09 | 2377–2382 | 6 | 790 | Vendredi 3 novembre 1 876 (22 octobre) (2347) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Je ne comprends pas ce que veut mon père... en attendant il se contente de me fa |  |
| 09 | 2384–2418 | 28 | 4,123 | Vendredi 3 novembre 1 876 (22 octobre) (2347) | Samedi 4 novembre 1876 (23 oct | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Tenez, on le disait bien ! La voilà, voilà ce qu'elle fait, comment elle est. |  |
| 09 | 2421–2461 | 36 | 4,939 | Samedi 4 novembre 1876 (23 octobre) (2388) | Dimanche 5 novembre 1 876 (24  | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Aussi, je ne me fâche point. |  |
| 09 | 2463–2511 | 36 | 5,133 | Dimanche 5 novembre 1 876 (24 octobre) (2453) | Lundi 6 novembre 1876 (25 octo; Mardi 7 novembre 1 876 (26 oct | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Ça n'a pas été comme vous dites... Si j'y suis allé... ce fut avec mon oncle, c' |  |
| 09 | 2514–2525 | 8 | 355 | Mardi 7 novembre 1 876 (26 octobre) [Une (2494) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Vous savez donc ! |  |
| 09 | 2528–2534 | 5 | 417 | Mardi 7 novembre 1 876 (26 octobre) [Une (2494) | — | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | - Oui et pas par caprice, vous me feriez une grâce en venant, et vous ne voulez  |  |
| 09 | 2537–2640 | 79 | 8,133 | Mardi 7 novembre 1 876 (26 octobre) [Une (2494) | Mercredi 8 novembre 1876 (27 o | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | Mais vous le savez... c'est parce qu'en partant avec vous je continuerai de vous |  |
| 09 | 2642–2644 | 2 | 149 | Mercredi 8 novembre 1876 (27 octobre) (2608) | Jeudi 9 novembre 1 876 (28 oct | 067.0001 (1876-11-01-continued) | 067.0009 (1876-11-09) | On martyrise ce saint au lieu de punir un Audiffret. Vénus est injuste. |  |
| 09 | 2864–2872 | 5 | 102 | Vendredi 25 novembre 1876 (2859) | — | 067.0197 (1876-11-24-25) | 067.0197 (1876-11-24-25) | 2erne . Qui, nous marchions. | short-only |
| 09 | 2882–2885 | 4 | 73 | Vendredi 25 novembre 1876 (2859) | — | 067.0197 (1876-11-24-25) | 067.0198 (1876-11-24-25) | 2eme. je /'aj prise. | short-only |
| 09 | 3015–3016 | 1 | 334 | Dimanche 27 novembre 1876 (3015) | Dimanche 27 novembre 1876 | 067.0214 (1876-11-26) | 067.0217 (1876-11-27) | La Mertens est venue le matin pour me dire que le jeune de La Motte était venu h |  |
| 09 | 3076–3078 | 2 | 75 | Dimanche 27 novembre 1876 (3015) | Lundi 28 novembre 1876 | 067.0225 (1876-11-27) | 067.0228 (1876-11-28) | Médire de Paul de Cassagnac... | short-only |
| 09 | 3147–3147 | 1 | 430 | Vendredi 2 décembre 1876 (3128) | — | 067.0249 (1876-12-02-07) | 067.0250 (1876-12-02-07) | Victor avec sa grosse tête noire, Pincio blanc comme la neige, Bagatelle, Prater |  |
| 09 | 3197–3197 | 1 | 358 | Mardi 6 décembre 1876 (3188) | — | 067.0267 (1876-12-02-07) | 067.0268 (1876-12-02-07) | Amelia toujours voilée se joint aux instances que fait Renato. Eh bien, la musiq |  |
| 09 | 3210–3223 | 12 | 2,049 | Mercredi 7 décembre 1876 (3206) | Jeudi 8 décembre 1876 | 067.0271 (1876-12-02-07) | 067.0274 (1876-12-08-11) | Pelikan et Broussais, Broussais est un effroyable blagueur, mais un type, rude,  |  |
| 09 | 3321–3390 | 62 | 20,584 | Lundi 11 décembre 1876 (3300) | Mardi 12 décembre 1876 | 067.0369 (1876-12-08-11) | 068.0003 (1876-12-12) | 220 Nathalie etc. | editorial?, clipping? |

### 068 — 33 gaps, 619 paras, 92,201 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 09 | 1740–1810 | 61 | 15,856 | Vendredi 13 octobre 1 876 (1er octobre ) (1697) | Samedi 14 octobre 1876(2); Dimanche 1 5 octobre 1 876 (3 ; Lundi 16 octobre 1 876 (4 octo; Mardi 17 octobre 1 876 (5 octo | 066.0532 (1876-10-06) | 068.0249 (1877-01-10-18) | La seule vengeance que je veux. C'est que Dieu lui fasse comprendre toute l'horr |  |
| 09 | 3466–3490 | 18 | 1,701 | Vendredi 15 décembre 1876 (3450) | — | 068.0023 (1876-12-14-15) | 068.0026 (1876-12-16) | Broussais, mon petit Broussais, qu'il me tarde de vous demander un conseil ! |  |
| 09 | 3493–3497 | 5 | 1,656 | Vendredi 15 décembre 1876 (3450) | — | 068.0023 (1876-12-14-15) | 068.0026 (1876-12-16) | A vrai dire... mais j'étais si jeune. Emile d'Audiffret, merci. Pierre Antonelli |  |
| 09 | 3499–3501 | 2 | 516 | Vendredi 15 décembre 1876 (3450) | Samedi 16 décembre 1876 | 068.0023 (1876-12-14-15) | 068.0026 (1876-12-16) | [En travers: Non pas de trois mais de quatre. J'oubliais Albert Gautier qui anim | bracketed/rayé |
| 09 | 3569–3587 | 15 | 1,670 | Lundi 18 décembre 1876 (3537) | — | 068.0036 (1876-12-17-18) | 068.0039 (1876-12-19) | Et je pensais à Rome où je pourrais aller si ce monstre le voulait bien !!! |  |
| 09 | 3590–3608 | 19 | 3,051 | Lundi 18 décembre 1876 (3537) | — | 068.0036 (1876-12-17-18) | 068.0039 (1876-12-19) | Maman est de nouveau montée par Mme Souvoroff et, mes plaintes aidant... Savez-v |  |
| 09 | 3610–3635 | 23 | 3,122 | Lundi 18 décembre 1876 (3537) | Mardi 19 décembre 1876 | 068.0036 (1876-12-17-18) | 068.0039 (1876-12-19) | Mais après le London House nous sommes allés à l'Opéra, en chapeaux et, je dois  |  |
| 09 | 3802–3803 | 2 | 122 | Vendredi 5 janvier 1877 (3793) | — | 068.0154 (1877-01-02-06) | 068.0157 (1877-01-02-06) | JJ.n immense concours D e dames qui pour 1 ndemniser leur amour F ont remuer la  |  |
| 09 | 3830–3847 | 17 | 2,074 | Samedi 6 janvier 1877 (3825) | Dimanche 7 janvier 1877 | 068.0181 (1877-01-02-06) | 068.0182 (1877-01-07-09) | Bihovetz me voyant avec la princesse causer longtemps et amicalement, s'anéantis |  |
| 09 | 4150–4172 | 21 | 1,317 | Vendredi 19 janvier 1877 (4150) | Vendredi 19 janvier 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | J’ai commencé un autre portrait d’Olga, qui me retient jusqu’à cinq heures. Alor |  |
| 09 | 4174–4194 | 16 | 2,601 | Vendredi 19 janvier 1877 (4150) | Samedi 20 janvier 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Je n'ai jamais pu rimer que pour cet homme. Pourtant ce soir Broussais a lu quel |  |
| 09 | 4196–4231 | 29 | 3,492 | Samedi 20 janvier 1877 (4179) | Dimanche 21 janvier 1877; Lundi 22 janvier 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Maintenant disons que nous avons rencontré Rangoni avec Angelini. Angelini rayon |  |
| 09 | 4237–4254 | 15 | 4,147 | Mardi 23 janvier 1 877 (4234) | Mercredi 24 janvier 1877; Jeudi 25 janvier 1 877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Je suis allée avec Dina et tous les chiens sur la terrasse où nous trouva Mme An |  |
| 09 | 4256–4277 | 16 | 2,272 | Jeudi 25 janvier 1 877 (4248) | — | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | On ne voit que Galula à qui je dis en désignant ma voiture: |  |
| 09 | 4280–4283 | 4 | 764 | Jeudi 25 janvier 1 877 (4248) | — | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | En janvier et après minuit le bord de la mer offre un désert fort agréable, tout |  |
| 09 | 4285–4300 | 15 | 2,618 | Vendredi 26 janvier 1877 (4284) | Samedi 27 janvier 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Je suis sortie avec Dina, dans le panier, pour prouver que rien n'était cassé et |  |
| 09 | 4302–4340 | 36 | 5,081 | Samedi 27 janvier 1877 (4289) | Dimanche 28 janvier 1877; Lundi 29 janvier 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Demain, si ce n'est ce soir, le journal fera le tour de la ville. Voilà une situ |  |
| 09 | 4342–4345 | 2 | 265 | Lundi 29 janvier 1877 (4338) | Mardi 30 janvier 1 877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Ensuite j'ai promené Mme Anitchkoff et le soir je me suis amusée à têter le sein |  |
| 09 | 4347–4399 | 45 | 8,027 | Mardi 30 janvier 1 877 (4345) | Mercredi 31 janvier 1877; Jeudi Ier février 1877; Vendredi 2 février 1877; Samedi 3 février 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Mon modèle Olga est la plus infernale des figures. Pas un instant de calme, l'ex |  |
| 09 | 4401–4422 | 19 | 3,679 | Samedi 3 février 1877 (4398) | Dimanche 4 février 1877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | M. et Mme Zoubaloff, le général, Collignon, Meyssner, Pelikan, Broussais, Zurmül |  |
| 09 | 4424–4445 | 17 | 4,363 | Dimanche 4 février 1877 (4421) | Lundi 5 février 1 877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Au milieu de la Promenade, d'une foule énorme, je sautai de mon panier pour rent |  |
| 09 | 4447–4479 | 30 | 5,733 | Mardi 6 février 1 877 (4447) | Mardi 6 février 1 877; Mercredi 7 février 1877; Jeudi 8 février 1 877 | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Je suis partie plus gaiement que je ne pouvais m'attendre. |  |
| 09 | 4481–4483 | 2 | 53 | Jeudi 8 février 1 877 (4449) | — | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Comment, me dit-il, c'est sérieux ! | short-only |
| 09 | 4485–4490 | 6 | 393 | Jeudi 8 février 1 877 (4449) | — | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Oh ! c'est trop fort ! |  |
| 09 | 4492–4526 | 32 | 2,682 | Jeudi 8 février 1 877 (4449) | — | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | Le soi-disant Pizzardi me demanda je ne sais plus quoi, qui je suis, je crois. |  |
| 09 | 4528–4557 | 22 | 1,780 | Jeudi 8 février 1 877 (4449) | — | 068.0261 (1877-01-10-18) | 068.0409 (1877-02-10-12) | - A présent, reprit-, es-tu rassurée, suis-je encore féroce, vois, j’ai l’air d’ |  |
| 09 | 4560–4586 | 21 | 2,314 | Jeudi 8 février 1 877 (4449) | — | 068.0409 (1877-02-10-12) | 068.0262 (1877-02-10-12) | Plusieurs de ces messieurs ne faisaient qu'appeler leur Girofla lui disant : com |  |
| 09 | 4588–4629 | 40 | 3,651 | Jeudi 8 février 1 877 (4449) | Vendredi 9 février 1877 | 068.0409 (1877-02-10-12) | 068.0262 (1877-02-10-12) | Antonelli était devant mes yeux, sa voix remplissait mes oreilles, et en cet ins |  |
| 09 | 4632–4634 | 2 | 427 | Vendredi 9 février 1877 (4622) | Samedi 10 février 1877 | 068.0409 (1877-02-10-12) | 068.0262 (1877-02-10-12) | J'avais toujours l'air de demander qu'il m'épouse, de supposer qu'il osait me pa |  |
| 09 | 4862–4868 | 4 | 402 | Lundi 1 2 février 1 877 (4804) | — | 068.0484 (1877-02-10-12) | 068.0486 (1877-02-13-21) | Alors elle y est arrivée à six heures. |  |
| 09 | 4871–4941 | 59 | 5,693 | Lundi 1 2 février 1 877 (4804) | — | 068.0484 (1877-02-10-12) | 068.0486 (1877-02-13-21) | Je crois que le monde de Naples ne va pas à ces bals. |  |
| 09 | 4945–4946 | 2 | 315 | Lundi 1 2 février 1 877 (4804) | — | 068.0484 (1877-02-10-12) | 068.0486 (1877-02-13-21) | Il m'a noué mon grand mouchoir de chenille de Cancello et je l'ai été sans défai |  |
| 09 | 4948–4950 | 2 | 364 | Lundi 1 2 février 1 877 (4804) | Mardi 1 3 février 1877 | 068.0484 (1877-02-10-12) | 068.0486 (1877-02-13-21) | C'est cet Altamura qui m'a retenue longtemps, et pour m'amuser je lui racontais  |  |

### 069 — 8 gaps, 64 paras, 10,898 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 509–523 | 13 | 1,512 | Dimanche 1 8 mars 1 877 (509) | Dimanche 1 8 mars 1 877; Lundi 1 9 mars 1877 | 069.0428 (1877-03-17) | 069.0430 (1877-03-20) | Le joueur de mandoline m'a envoyé ce matin le nom de l'adversaire de Larderei, c |  |
| 10 | 525–535 | 10 | 1,469 | Lundi 1 9 mars 1877 (522) | Mardi 20 mars 1 877 | 069.0428 (1877-03-17) | 069.0430 (1877-03-20) | Les Fabbricatore et Mme et Mlle Hamontoff viennent nous voir. |  |
| 10 | 552–557 | 5 | 994 | Mercredi 21 mars 1877 (544) | Jeudi 22 mars 1 877 | 069.0438 (1877-03-21) | 069.0440 (1877-03-22) | Demain j'enverrai la réponse à Florence, c'est une feuille carrée presque entièr |  |
| 10 | 578–582 | 5 | 1,023 | Vendredi 23 mars 1877 (572) | — | 069.0455 (1877-03-23) | 069.0457 (1877-03-24) | Santasiglia est un enfant tout à fait gentil, lui et Bikowsky sont mes cavaliers |  |
| 10 | 593–598 | 6 | 398 | Samedi 24 mars 1877 (585) | — | 069.0459 (1877-03-24) | 069.0459 (1877-03-24) | J'ai l'air de recevoir un affront, le diable sait pourquoi. |  |
| 10 | 606–730 | 14 | 3,343 | Dimanche 25 mars 1877 (600) | Lundi 26 mars 1 877 | 069.0463 (1877-03-25) | 069.0466 (1877-03-26) | En entrant une terreur panique s'empara de moi. Si toutes les autres allaient êt |  |
| 10 | 1017–1025 | 9 | 1,582 | Dimanche Ier avril 1 877 - Pâques (924) | — | 069.0625 (1877-04-01) | 069.0627 (1877-04-02) | Que m'est cet homme ? |  |
| 10 | 1027–1029 | 2 | 577 | Dimanche Ier avril 1 877 - Pâques (924) | Lundi 2 avril 1 877 | 069.0625 (1877-04-01) | 069.0627 (1877-04-02) | Croirait-on que je sois agacée sérieusement en entendant parler de cela ! J'écou |  |

### 070 — 30 gaps, 561 paras, 86,193 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 1168–1179 | 12 | 1,799 | Mercredi 4 avril 1877 (1147) | — | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | - Si nous allions leur acheter du poisson ? |  |
| 10 | 1181–1338 | 21 | 3,004 | Mercredi 4 avril 1877 (1147) | Jeudi 5 avril 1877 | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | - Rien du tout, mais vous vous êtes montré cynique et bas. | editorial? |
| 10 | 1341–1376 | 30 | 4,429 | Vendredi 6 avril 1877 (1341) | Vendredi 6 avril 1877 | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | Maman dit qu'elle s'est amusée comme une folle à Sorrento. Je ne dis rien parce  |  |
| 10 | 1378–1384 | 5 | 763 | Vendredi 6 avril 1877 (1341) | — | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | Larderei ne m'aime pas, c'est bien certain. Mais ce n'est pas une déception, ce  |  |
| 10 | 1386–1389 | 4 | 311 | Vendredi 6 avril 1877 (1341) | — | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | Non, pourquoi vivre quand tout se tourne de travers ou au rebours ! |  |
| 10 | 1391–1396 | 6 | 691 | Vendredi 6 avril 1877 (1341) | — | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | Ah ! que c'est vrai. |  |
| 10 | 1398–1405 | 7 | 815 | Vendredi 6 avril 1877 (1341) | — | 070.0008 (1877-04-04) | 070.0010 (1877-04-07) | Alexandre fait en ce moment la cour à Mme de Piccolelis au Skating. |  |
| 10 | 1551–1556 | 5 | 597 | Samedi 7 avril 1 877 (1407) | — | 070.0035 (1877-04-07) | 070.0037 (1877-04-08) | Je me suis secouée comme une possédée et je suis allée me livrer à trente-six ex |  |
| 10 | 1559–1588 | 27 | 4,579 | Samedi 7 avril 1 877 (1407) | Dimanche 8 avril 1 877 - Pâque | 070.0035 (1877-04-07) | 070.0037 (1877-04-08) | Il voulait venir II! |  |
| 10 | 1624–1663 | 30 | 3,175 | Lundi 9 avril 1 977 (1624) | Lundi 9 avril 1 977 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Ah ! mon empereur, fichus-lecteurs l'intérêt de mon illustre livre va croissant. |  |
| 10 | 1665–1667 | 3 | 331 | Lundi 9 avril 1 977 (1624) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Oh ! Mademoiselle, Mademoiselle, je ne l'ai jamais cru, mais... enfin, je vous d |  |
| 10 | 1669–1686 | 12 | 1,190 | Lundi 9 avril 1 977 (1624) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Vous resterez gentille pour moi n’est-ce pas ? Vous serez bonne ? Nous resterons |  |
| 10 | 1688–1707 | 13 | 989 | Lundi 9 avril 1 977 (1624) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Oh ! non, je vous jure. |  |
| 10 | 1714–1731 | 13 | 1,746 | Lundi 9 avril 1 977 (1624) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Et il sortit me laissant étourdie, hébétée, effroyablement calme. |  |
| 10 | 1733–1756 | 20 | 2,656 | Lundi 9 avril 1 977 (1624) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Oh ! le rêve de Sorrento dans lequel je me voyais couverte de boue par Larderei. |  |
| 10 | 1758–1779 | 19 | 3,670 | Lundi 9 avril 1 977 (1624) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Ah ! si j'avais su, si j'avais pressenti; je me serais jetée à ses pieds, je lui |  |
| 10 | 1781–1801 | 19 | 2,892 | Lundi 9 avril 1 977 (1624) | Mardi 1 0 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Va ! reine, déesse, créature exceptionnelle, heureuse, conquérante ! Va ma fille |  |
| 10 | 1805–1833 | 27 | 3,796 | Mardi 1 0 avril 1877 (1791) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Et à moi donc ! ah ! c'est une triste fin, Rosalie... Je regrette à présent. |  |
| 10 | 1838–1849 | 12 | 2,543 | Mardi 1 0 avril 1877 (1791) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Dans des circonstances semblables trente heures suffisent pour retourner les idé |  |
| 10 | 1882–1903 | 19 | 3,461 | Mardi 1 0 avril 1877 (1791) | Mercredi 11 avril 1877; Jeudi 1 2 avril 1 877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Voyez-vous tout cela dépend des circonstances. Mettant de côté comme non existan |  |
| 10 | 1905–1913 | 8 | 1,498 | Jeudi 1 2 avril 1 877 (1896) | Vendredi 13 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Melissano dit qu'il arrive demain. Je ne sais pas du tout quelle contenance il v |  |
| 10 | 1915–1934 | 18 | 2,495 | Vendredi 13 avril 1877 (1909) | — | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Au lieu d'aller aux Fiorentini ([Mots noircis : le Français de Naples]) où nous  |  |
| 10 | 1936–1950 | 13 | 1,719 | Vendredi 13 avril 1877 (1909) | Samedi 14 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Plus que jamais je veux... faire ce que je ne dirai qu'au moment même. |  |
| 10 | 1952–2029 | 42 | 8,597 | Samedi 14 avril 1877 (1949) | Dimanche 15 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | On m'a présenté hier au Skating un Monsieur Schettino qui a déposé ses cartes au |  |
| 10 | 2036–2085 | 42 | 6,544 | Dimanche 15 avril 1877 (1972) | Samedi 1 6 avril 1 877; Mardi 1 7 avril 1877; Mercredi 18 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Cette délicatesse de ne pas effleurer même par une parole ne se trouve que chez  |  |
| 10 | 2088–2136 | 43 | 6,877 | Mercredi 18 avril 1877 (2082) | Jeudi 1 9 avril 1 877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | moyen de vous attraper, est-ce que vous avez peur ? |  |
| 10 | 2138–2163 | 22 | 4,428 | Jeudi 1 9 avril 1 877 (2125) | Vendredi 20 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Cette idée me tourmente, les cartes disent que c'est vrai. Suis-je assez abrutie |  |
| 10 | 2165–2172 | 7 | 1,129 | Vendredi 20 avril 1877 (2139) | Samedi 21 avril 1 877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Que rien ne te rappelle plus, au nom de Dieu et de la Vierge Marie, retire-toi.  |  |
| 10 | 2174–2220 | 43 | 7,643 | Samedi 21 avril 1 877 (2166) | Dimanche 22 avril 1877 | 070.0071 (1877-04-08) | 070.0072 (1877-04-22) | Fi ! horreur ! Larderei vient d'avoir la visite des deux plus |  |
| 10 | 2357–2380 | 19 | 1,826 | Mercredi 25 avril 1877 (2344) | Jeudi 26 avril 1 877; Vendredi 27 avril 1877 | 070.0197 (1877-04-25) | 071.0001 (1877-04-27) | Gloriae Cupi dit ate |  |

### 071 — 24 gaps, 252 paras, 59,752 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 2396–2454 | 50 | 11,355 | Samedi 28 avril 1 877 (2396) | Samedi 28 avril 1 877; Dimanche 29 avril 1 877; Lundi 30 avril 1 877; Mardi 1er mai 1 877 | 071.0015 (1877-04-27) | 071.0016 (1877-05-02) | Ce n’est qu’au moment du départ que j’ai éprouvé un soupçon de regret pour les p |  |
| 10 | 2457–2466 | 10 | 2,564 | Mardi 1er mai 1 877 (2449) | — | 071.0015 (1877-04-27) | 071.0016 (1877-05-02) | J’ai de nouveau blagué Marcuard. Blaguer ! fi ! Que voulez- vous ! |  |
| 10 | 2468–2473 | 5 | 627 | Mardi 1er mai 1 877 (2449) | Mercredi 2 mai 1877 | 071.0015 (1877-04-27) | 071.0016 (1877-05-02) | Si vous avez tout lu, je n’ai pas besoin de m’expliquer, d’ailleurs je ne pourra |  |
| 10 | 2490–2492 | 2 | 1,688 | Jeudi 3 mai 1 877 (2490) | Jeudi 3 mai 1 877 | 071.0030 (1877-05-02) | 071.0031 (1877-05-04) | [Rayé : Nous avons déjeuné chez] Marcuard [Mots noircis: demeure dans] le palais | bracketed/rayé |
| 10 | 2494–2501 | 8 | 2,003 | Jeudi 3 mai 1 877 (2490) | — | 071.0030 (1877-05-02) | 071.0031 (1877-05-04) | On causait tranquillement de mille choses tranquilles; Dina faisait la Madone da |  |
| 10 | 2503–2507 | 5 | 1,202 | Jeudi 3 mai 1 877 (2490) | — | 071.0030 (1877-05-02) | 071.0031 (1877-05-04) | Oui, ma famille, mon empereur oui, ma famille, je sors si bien pour elle que je  |  |
| 10 | 2509–2515 | 6 | 749 | Jeudi 3 mai 1 877 (2490) | Vendredi 4 mai 1877 | 071.0030 (1877-05-02) | 071.0031 (1877-05-04) | J’ai tant fait, tant couru ! |  |
| 10 | 2528–2529 | 1 | 444 | Samedi 5 mai 1 877 (2528) | Samedi 5 mai 1 877 | 071.0042 (1877-05-04) | 071.0043 (1877-05-06) | Quand il pleut et quand on ne voit personne voilà une triste situation. La Righi |  |
| 10 | 2531–2535 | 4 | 404 | Samedi 5 mai 1 877 (2528) | Dimanche 6 mai 1877 | 071.0042 (1877-05-04) | 071.0043 (1877-05-06) | Dieu garde tout honnête chrétien de se trouver à Florence comme moi qui en ai vu |  |
| 10 | 2547–2564 | 16 | 3,595 | Lundi 7 mai 1 877 (2547) | Lundi 7 mai 1 877; Mardi 8 mai 1 877 | 071.0052 (1877-05-06) | 071.0053 (1877-05-11) | La fidélité est un sentiment égoïste qui cesse d’exister du moment où il aurait  |  |
| 10 | 2568–2669 | 42 | 9,559 | Mardi 8 mai 1 877 (2555) | Mercredi 9 mai 1 877; Jeudi 1 0 mai 1 877 | 071.0052 (1877-05-06) | 071.0053 (1877-05-11) | Son joli château vendra Et pourrira, et pourrira ! |  |
| 10 | 2671–2696 | 24 | 5,238 | Jeudi 1 0 mai 1 877 (2611) | Vendredi 11 mai 1877 | 071.0052 (1877-05-06) | 071.0053 (1877-05-11) | De dépit j’ai dîné seule. Marcuard est arrivé vers dix heures et passant par-des |  |
| 10 | 2710–2715 | 4 | 870 | Samedi 1 2 mai 1 877 (2710) | Samedi 1 2 mai 1 877 | 071.0065 (1877-05-11) | 071.0066 (1877-05-13) | C’est ridicule à dire mais mon cœur se serre quand je regarde par la fenêtre. Un |  |
| 10 | 2756–2757 | 1 | 677 | Lundi 1 4 mai 1 877 (2756) | Lundi 1 4 mai 1 877 | 071.0101 (1877-05-13) | 071.0102 (1877-05-15) | Pauvre grand-papa est toujours couché et comme il est impatient, on ne le quitte |  |
| 10 | 2760–2771 | 10 | 2,495 | Lundi 1 4 mai 1 877 (2756) | Mardi 1 5 mai 1877 | 071.0101 (1877-05-13) | 071.0102 (1877-05-15) | Je vous écris pour vous remercier au nom de nous trois de vos excellents soins.  |  |
| 10 | 2831–2840 | 8 | 1,702 | Samedi 1 9 mai 1 877 (2831) | Samedi 1 9 mai 1 877; Dimanche 20 mai 1877 | 071.0155 (1877-05-18) | 071.0156 (1877-05-20) | Je suis allée peupler le Skating, fort élégante. Dina patinait avec Lise et moi  |  |
| 10 | 2846–2853 | 5 | 921 | Dimanche 20 mai 1877 (2840) | Lundi 21 mai 1 877 | 071.0160 (1877-05-20) | 071.0161 (1877-05-23) | [Rayé: Lundi 21 mai 1877] | bracketed/rayé |
| 10 | 2856–2866 | 8 | 958 | Lundi 21 mai 1 877 (2848) | Mardi 22 mai 1 877; Mercredi 23 mai 1877 | 071.0160 (1877-05-20) | 071.0161 (1877-05-23) | Cela s’est accompli de point en point. |  |
| 10 | 2892–2896 | 3 | 1,929 | Jeudi 24 mai 1 877 (2892) | Jeudi 24 mai 1 877; Vendredi 25 mai 1877 | 071.0184 (1877-05-23) | 071.0185 (1877-05-25) | On a trop peu de deux yeux, ou bien il faut ne rien faire. La lecture et le dess |  |
| 10 | 2912–2915 | 3 | 1,139 | Samedi 26 mai 1 877 (2912) | Samedi 26 mai 1 877 | 071.0199 (1877-05-25) | 071.0200 (1877-05-27) | Nous avons pris une leçon de tarentelle qui est la danse la plus belle et la plu |  |
| 10 | 2918–2930 | 11 | 1,925 | Samedi 26 mai 1 877 (2912) | Dimanche 27 mai 1877 | 071.0199 (1877-05-25) | 071.0200 (1877-05-27) | Et puis... le soir, la même lune, la même mer, les mêmes arbres noirs. Lise et m |  |
| 10 | 2941–2953 | 10 | 3,740 | Lundi 28 mai 1 877 (2941) | Lundi 28 mai 1 877; Mardi 29 mai 1 877; Mercredi 30 mai 1877 | 071.0207 (1877-05-27) | 071.0210 (1877-05-30) | Je suis allée à Monaco pour gagner vingt mille francs. Nous y étions tout à fait |  |
| 10 | 2971–2980 | 9 | 2,185 | Jeudi 31 mai 1 877 (2971) | Jeudi 31 mai 1 877 | 071.0225 (1877-05-30) | 071.0226 (1877-06-01) | C’est pour me donner cette lettre qu’on m’a dérangée au milieu d’une peinture fe |  |
| 10 | 2983–2991 | 7 | 1,783 | Jeudi 31 mai 1 877 (2971) | Vendredi 1er juin 1877 | 071.0225 (1877-05-30) | 071.0226 (1877-06-01) | A ceci est joint un morceau de papier carré avec un charmant bouton de rose et c |  |

### 072 — 8 gaps, 51 paras, 5,060 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 3100–3102 | 2 | 116 | Dimanche 1 0 juin 1877 (3089) | Lundi 11 juin 1 877 | 071.0325 (1877-06-10) | 072.0001 (1877-06-11) | Depuis le lundi 11 juin 1877 jusqu’au samedi 14 juillet 1877 Nice |  |
| 10 | 3336–3354 | 18 | 1,774 | Mardi 1 9 juin 1877 (3324) | — | 072.0233 (1877-06-19) | 072.0237 (1877-06-21) | Rosalie qui aime beaucoup Monsieur le comte n’en parle qu’avec difficulté parce  |  |
| 10 | 3357–3374 | 10 | 437 | Mardi 1 9 juin 1877 (3324) | — | 072.0233 (1877-06-19) | 072.0237 (1877-06-21) | Ça l’a repris en voyage. |  |
| 10 | 3376–3382 | 7 | 1,167 | Mardi 1 9 juin 1877 (3324) | — | 072.0233 (1877-06-19) | 072.0237 (1877-06-21) | Si je n’avais fait aucun mensonge à cette fille je croirais davantage. Mais je c |  |
| 10 | 3384–3389 | 4 | 585 | Mardi 1 9 juin 1877 (3324) | Mercredi 20 juin 1877; Jeudi 21 juin 1 877 | 072.0233 (1877-06-19) | 072.0237 (1877-06-21) | Enfin, je me fais répéter ça comme un conte bleu. |  |
| 10 | 3431–3434 | 2 | 113 | Samedi 23 juin 1877 (3412) | Dimanche 24 juin 1877 | 072.0274 (1877-06-23) | 072.0276 (1877-06-24) | Oh ! ho ! alors c’est à Naples qu’on vous aura fait ce tour- là. |  |
| 10 | 3582–3583 | 2 | 14 | Lundi 9 juillet 1 877 (3573) | — | 072.0420 (1877-07-09) | 072.0420 (1877-07-09) | p. 250 | editorial?, short-only |
| 10 | 3642–3649 | 6 | 854 | Jeudi 1 2 juillet 1 877 (3617) | — | 072.0474 (1877-07-12) | 072.0476 (1877-07-13) | - Ils ont tâché d’attraper Antonelli qui était très amoureux et puis moi - aura  |  |

### 073 — 12 gaps, 68 paras, 12,743 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 3733–3735 | 3 | 659 | Dimanche 1 5 juillet 1877 (3727) | — | 073.0044 (1877-07-15) | 073.0046 (1877-07-16) | Pour en revenir à Marcuard, Alexandre même le croyait entièrement pris. La veill |  |
| 10 | 3737–3748 | 9 | 1,542 | Dimanche 1 5 juillet 1877 (3727) | Lundi 1 6 juillet 1 877 | 073.0044 (1877-07-15) | 073.0046 (1877-07-16) | Et pour poétiser ces paroles il les dit d’un air de Hamlet. |  |
| 10 | 3777–3779 | 3 | 420 | Mercredi 18 juillet 1877 (3775) | — | 073.0072 (1877-07-18) | 073.0076 (1877-07-20) | Mais avant cela j’ai été voir les Boyd, c’est-à-dire faire ma cour à Mme Boyd. |  |
| 10 | 3784–3786 | 2 | 220 | Mercredi 18 juillet 1877 (3775) | — | 073.0072 (1877-07-18) | 073.0076 (1877-07-20) | Ce seul mot, Italie ! me fait tressaillir et frissonner comme jamais aucun nom,  |  |
| 10 | 3788–3791 | 4 | 907 | Mercredi 18 juillet 1877 (3775) | — | 073.0072 (1877-07-18) | 073.0076 (1877-07-20) | C’est que, voyez-vous, je veux changer, je veux écrire très simplement et je cra |  |
| 10 | 3793–3802 | 8 | 1,476 | Mercredi 18 juillet 1877 (3775) | Jeudi 1 9 juillet 1 877; Vendredi 20 juillet 1877 | 073.0072 (1877-07-18) | 073.0076 (1877-07-20) | Non, continuons avec patience, j’ai tout dit, je crois, oui, il est donc bien ét | editorial? |
| 10 | 3843–3850 | 6 | 1,299 | Lundi 23 juillet 1 877 (3839) | — | 073.0114 (1877-07-23) | 073.0116 (1877-07-24) | Mon ami Alexandre, vous devriez bien garder cette photographie maintenant que vo |  |
| 10 | 3855–3866 | 9 | 1,568 | Lundi 23 juillet 1 877 (3839) | Mardi 24 juillet 1 877 | 073.0114 (1877-07-23) | 073.0116 (1877-07-24) | Puisque je ne puis être sa femme je l’empêcherai de se marier ou le prendrai à s |  |
| 10 | 3913–3920 | 7 | 1,379 | Mercredi 25 juillet 1877 (3889) | Jeudi 26 juillet 1 877 | 073.0156 (1877-07-25) | 073.0158 (1877-07-26) | Fauvel m’a envoyé un masseur qui à ce qu’il paraît... guérit les entorses etc. i |  |
| 10 | 4049–4051 | 3 | 953 | Dimanche 6 août 1877 (4047) | — | 073.0285 (1877-08-06) | 073.0287 (1877-08-07) | Je hais ce luxe mesquin et ces illuminations de cafés, j’aime cent fois mieux un |  |
| 10 | 4053–4056 | 3 | 459 | Dimanche 6 août 1877 (4047) | Lundi 7 août 1 877 | 073.0285 (1877-08-06) | 073.0287 (1877-08-07) | Rien ne redonne la confiance perdue. Et comme tout ce que qui est irrévocable, c |  |
| 10 | 4228–4240 | 11 | 1,861 | Jeudi 1 6 août 1 877 (4219) | Vendredi 17 août 1877 | 073.0458 (1877-08-16) | 073.0460 (1877-08-17) | J’ai peint jusqu’à sept heures du soir; je les déteste ces barons ! Fi, le vilai |  |

### 074 — 1 gaps, 2 paras, 228 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 4311–4313 | 2 | 228 | Dimanche 19 août 1877 (4264) | Lundi 20 août 1 877 | 073.0527 (1877-08-19) | 074.0002 (1877-08-20) | commencé le lundi 20 août 1877 terminé le mardi 25 septembre 1877 |  |

### 075 — 7 gaps, 34 paras, 3,711 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 181–188 | 5 | 727 | Dimanche 30 septembre 1877 (173) | — | 075.0099 (1877-09-30) | 075.0102 (1877-10-01) | Je prends la vie en patience, seulement je m’en vais de bonne heure chez moi et  |  |
| 11 | 392–394 | 3 | 462 | Samedi 13 octobre 1877 (343) | — | 075.0271 (1877-10-13) | 075.0273 (1877-10-14) | Après sa visite chez nous ce pauvre Robert a causé avec ce bon Julian, or je vou |  |
| 11 | 396–397 | 2 | 97 | Samedi 13 octobre 1877 (343) | — | 075.0271 (1877-10-13) | 075.0273 (1877-10-14) | Allez toujours, Monsieur, je vais tâcher d’écouter sans trop... |  |
| 11 | 403–411 | 6 | 1,130 | Samedi 13 octobre 1877 (343) | Dimanche 14 octobre 1877 | 075.0271 (1877-10-13) | 075.0273 (1877-10-14) | Mon Dieu, non, et en me parlant il était encore un peu incrédule de sorte que je |  |
| 11 | 710–716 | 6 | 356 | Lundi 29 octobre 1877 (628) | — | 075.0525 (1877-10-29) | 075.0527 (1877-10-30) | C’est défendu ? |  |
| 11 | 720–733 | 10 | 746 | Lundi 29 octobre 1877 (628) | — | 075.0525 (1877-10-29) | 075.0527 (1877-10-30) | Même demander ? |  |
| 11 | 736–737 | 2 | 193 | Lundi 29 octobre 1877 (628) | — | 075.0525 (1877-10-29) | 075.0527 (1877-10-30) | Ah ! dis-je moitié riant et moitié sérieuse, c’est lavé à présent ! |  |

### 076 — 5 gaps, 44 paras, 9,803 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 826–842 | 11 | 2,687 | Lundi 5 novembre 1877 (826) | Lundi 5 novembre 1877; Mardi 6 novembre 1877 | 076.0045 (1877-11-04) | 076.0049 (1877-11-06) | Je devrais être bien triste. Georges fait son ivrognerie chez nous. J’ai horribl |  |
| 11 | 933–933 | 1 | 456 | Samedi 10 novembre 1877 (903) | — | 076.0121 (1877-11-10) | 076.0123 (1877-11-11) | Pour vous initier à notre manière d’être avec Popaul je vous raconterai que nous |  |
| 11 | 935–949 | 11 | 1,938 | Samedi 10 novembre 1877 (903) | Dimanche 11 novembre 1877 | 076.0121 (1877-11-10) | 076.0123 (1877-11-11) | Je crois que nous nous prenons assez au sérieux... je crains de le dire, on n’au |  |
| 11 | 1207–1217 | 8 | 2,049 | Jeudi 6 décembre 1877 (1204) | Vendredi) 7 décembre 1877 | 076.0337 (1877-12-06) | 076.0339 (1877-12-07) | A vingt ans je ne saurai encore rien ! J’ai dix-neuf ans, juste, ou bien moins u |  |
| 11 | 1312–1330 | 13 | 2,673 | Samedi 15 décembre 1877 (1293) | Dimanche 16 décembre 1877 | 076.0418 (1877-12-15) | 076.0423 (1877-12-16) | arrive en effet. Alors je lance par Rosalie qui le dit à la bonne que si tout l’ |  |

### 077 — 3 gaps, 8 paras, 1,738 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 1411–1416 | 4 | 720 | Dimanche 23 décembre 1877 (1410) | — | 077.0004 (1877-12-23) | 076.0396 (1877-12-13) | Je lui répondrai un de ces jours. |  |
| 11 | 1420–1421 | 2 | 228 | Dimanche 23 décembre 1877 (1410) | — | 076.0396 (1877-12-13) | 077.0010 (1877-12-24) | Il fait froid. Je lis la Grammaire de dessin par Charles Blanc, livre très intér |  |
| 11 | 1427–1429 | 2 | 790 | Dimanche 23 décembre 1877 (1410) | Lundi 24 décembre 1877 | 076.0396 (1877-12-13) | 077.0010 (1877-12-24) | courte... assez longue si l’on l’emploie entière... mais je voudrais n’avoir à v |  |

### 079 — 3 gaps, 56 paras, 15,459 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 3435–3487 | 38 | 9,945 | Vendredi 19 avril 1878 (3435) | Vendredi 19 avril 1878; Samedi 20 avril 1878; Dimanche 21 avril 1878 - Pâque | 079.0517 (1878-04-18) | 079.0520 (1878-04-19) | Nous allons à l’église où je pèche beaucoup [Mots noircis: parce que je] ne puis |  |
| 11 | 3492–3498 | 6 | 1,307 | Dimanche 21 avril 1878 - Pâques (3477) | — | 079.0517 (1878-04-18) | 079.0520 (1878-04-19) | en entendre dire du mal, que je l’aimais et l’estimais et que cela ne changerait |  |
| 11 | 3501–3518 | 12 | 4,207 | Dimanche 21 avril 1878 - Pâques (3477) | Lundi 22 avril 1 878; Mardi 23 avril 1878 | 079.0517 (1878-04-18) | 079.0520 (1878-04-19) | Si vous saviez ce que j’ai demandé et promis au Bon Dieu ! |  |

### 080 — 1 gaps, 2 paras, 141 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 11 | 4582–4583 | 2 | 141 | Mercredi 19 juin 1878 (4552) | — | 080.0773 (1878-06-19) | 080.0775 (1878-06-20) | J’ai dit : “jeune fille” en parlant de Mlle Acard. |  |

### 081 — 34 gaps, 132 paras, 31,379 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 12 | 437–447 | 9 | 2,945 | Samedi 6 juillet 1878 (433) | Dimanche 7 juillet 1878; Lundi 8 juillet 1 878 | 081.0303 (1878-07-06) | 081.0305 (1878-07-07) | Je me suis beaucoup amusée à le tourmenter pendant une heure, je le lui ai dit,  |  |
| 12 | 455–456 | 2 | 337 | Lundi 8 juillet 1 878 (447) | — | 081.0314 (1878-07-08) | 081.0315 (1878-07-08) | Elle a raison ! elle pense à moi. Si elle n’avait rien dit... mais |  |
| 12 | 470–472 | 3 | 709 | Lundi 8 juillet 1 878 (447) | — | 081.0319 (1878-07-08) | 081.0322 (1878-07-09) | Le Dr. Thilenius sort d’ici, il a fait les questions nécessaires sur ma maladie  |  |
| 12 | 475–478 | 4 | 1,380 | Lundi 8 juillet 1 878 (447) | — | 081.0319 (1878-07-08) | 081.0322 (1878-07-09) | Enfin nous verrons cela... d’ailleurs un autre ne le mériterait pas, je l’aimera |  |
| 12 | 493–495 | 3 | 371 | Mercredi 10 juillet 1878 (486) | — | 081.0331 (1878-07-10) | 081.0334 (1878-07-11) | Il est très adroit, dis-je, vous verrez qu’il fera quelque chose de très avantag |  |
| 12 | 497–499 | 3 | 497 | Mercredi 10 juillet 1878 (486) | — | 081.0331 (1878-07-10) | 081.0334 (1878-07-11) | Folle, imbécile, criminelle ! Je n'y voyais que Popaul... Parbleu Popaul peut se |  |
| 12 | 510–510 | 1 | 324 | Jeudi 1 1 juillet 1878 (502) | — | 081.0338 (1878-07-11) | 081.0339 (1878-07-11) | Non, savez-vous que je crois vraiment que je n’aime pas le Défunt ?! Et si je n’ |  |
| 12 | 515–518 | 3 | 652 | Vendredi 12 juillet 1878 (512) | Samedi 13 juillet 1878 | 081.0342 (1878-07-12) | 081.0344 (1878-07-13) | Madame Abaza petite femme brune, élégante, un peu grosse, a chanté aujourd’hui.  |  |
| 12 | 535–540 | 5 | 417 | Dimanche 14 juillet 1878 (524) | — | 081.0353 (1878-07-14) | 081.0355 (1878-07-15) | Pour le moment je suis aux Iles chez ma mère et Lise entrera à l’Institut au moi |  |
| 12 | 543–564 | 19 | 5,619 | Dimanche 14 juillet 1878 (524) | Lundi 1 5 juillet 1 878 | 081.0353 (1878-07-14) | 081.0355 (1878-07-15) | Ne vous gênez pas, si Je peux être agréable en quoi ce soi disposez de moi. | clipping? |
| 12 | 570–573 | 2 | 672 | Lundi 1 5 juillet 1 878 (564) | Mardi 1 6 juillet 1878 | 081.0358 (1878-07-15) | 081.0361 (1878-07-16) | cherait à me tracasser sur la façon dont ma femme de chambre accroche mes vêteme |  |
| 12 | 578–579 | 2 | 491 | Mardi 1 6 juillet 1878 (573) | — | 081.0364 (1878-07-16) | 081.0365 (1878-07-16) | Je suis fâchée et pourquoi ? Si je ne disais pas ces choses-là je ne les pensera |  |
| 12 | 581–586 | 5 | 2,525 | Mardi 1 6 juillet 1878 (573) | Mercredi 17 juillet 1878 | 081.0365 (1878-07-16) | 081.0367 (1878-07-17) | S’il grandit je gémirai sur sa mort et me reprocherai de ne l’avoir pas empêché. |  |
| 12 | 600–606 | 7 | 940 | 5 juillet 1878 Mademoiselle, (590) | — | 081.0369 (1878-07-17) | 081.0371 (1878-07-18) | Inutile, si vous me faites l'honneur de m’écrire, ce que je n’ose espérer, d’ind | clipping? |
| 12 | 615–616 | 2 | 222 | Jeudi 1 8 juillet 1878 (607) | — | 081.0374 (1878-07-18) | 081.0377 (1878-07-19) | Quant au petit Dourassoff il me parle tout à fait. Tout le monde se moque de sa  |  |
| 12 | 634–643 | 8 | 398 | Dimanche 21 juillet 1878 (629) | — | 081.0387 (1878-07-21) | 081.0387 (1878-07-21) | Vous n'y perdrez pas un bécarre. |  |
| 12 | 659–659 | 1 | 500 | Lundi 22 juillet 1878 (656) | — | 081.0394 (1878-07-22) | 081.0394 (1878-07-22) | Parmi vos conseils, il y en a que j’accepte. Il en est d’autres que je considère |  |
| 12 | 661–664 | 4 | 666 | Lundi 22 juillet 1878 (656) | — | 081.0394 (1878-07-22) | 081.0395 (1878-07-22) | Si vous aimez les spadassins, les chercheurs de querelles je ne ferai jamais vot |  |
| 12 | 667–671 | 5 | 1,676 | Lundi 22 juillet 1878 (656) | — | 081.0395 (1878-07-22) | 081.0397 (1878-07-23) | D’ailleurs il ne convient pas à une jeune fille de trancher sur tout le monde: u |  |
| 12 | 673–678 | 6 | 793 | Lundi 22 juillet 1878 (656) | — | 081.0395 (1878-07-22) | 081.0397 (1878-07-23) | Pourquoi vous appelez-vous Mlle de Bashkirtzsff ? Le De n’existe pas en Russie.  |  |
| 12 | 682–682 | 1 | 532 | Lundi 22 juillet 1878 (656) | — | 081.0398 (1878-07-23) | 081.0399 (1878-07-23) | Vous savez ce que vous devez penser de toutes les choses qu’il ose me reprocher, |  |
| 12 | 684–686 | 3 | 347 | Lundi 22 juillet 1878 (656) | — | 081.0399 (1878-07-23) | 081.0400 (1878-07-23) | Quant à écrire de Bashkirtesff je ne le fais jamais pour les mêmes raisons que d |  |
| 12 | 689–692 | 2 | 215 | Lundi 22 juillet 1878 (656) | Mardi 23 juillet 1878; Mercredi 24 juillet 1878 | 081.0400 (1878-07-23) | 081.0402 (1878-07-24) | Quant au monde que nous recevons... je pendrai ma revanche cet hiver, non pas à  |  |
| 12 | 698–702 | 2 | 659 | Mercredi 24 juillet 1878 (692) | 22 juillet 1878 | 081.0404 (1878-07-24) | 081.0405 (1878-07-24) | Voici encore une lettre de Multedo partie de Mont de Marsan le 22, le jour même  |  |
| 12 | 705–707 | 3 | 252 | 22 juillet 1878 (700) | — | 081.0405 (1878-07-24) | 081.0406 (1878-07-24) | Je vous en prie, oubliez. |  |
| 12 | 712–714 | 3 | 439 | 22 juillet 1878 (700) | — | 081.0406 (1878-07-24) | 081.0408 (1878-07-25) | Monsieur Rumbelinsky revient de Paris ce soir, d’ailleurs voici une lettre que j |  |
| 12 | 749–750 | 2 | 456 | Jeudi 1er août 1878 (745) | — | 081.0437 (1878-08-01) | 081.0438 (1878-08-01) | Et [Mots noircis : comme je riais de ces] confidences au premier garçon, Rosalie |  |
| 12 | 753–755 | 2 | 325 | Jeudi 1er août 1878 (745) | Vendredi 2 août 1878 | 081.0439 (1878-08-01) | 081.0441 (1878-08-02) | Je suis impatiente jusqu’à demain pour me retrouver à côté du pauvre malade, tou |  |
| 12 | 759–764 | 5 | 802 | Vendredi 2 août 1878 (755) | — | 081.0442 (1878-08-02) | 081.0443 (1878-08-02) | Je me suis promenée le matin et après dîner voyant sortir les princes je suis so |  |
| 12 | 767–768 | 2 | 750 | Vendredi 2 août 1878 (755) | — | 081.0442 (1878-08-02) | 081.0443 (1878-08-02) | Et vous ne pouvez pas deviner les tourments Qu'il vous plaît d’imposer par un so |  |
| 12 | 772–772 | 1 | 525 | Vendredi 2 août 1878 (755) | — | 081.0444 (1878-08-02) | 081.0445 (1878-08-02) | Quand Pincio a été perdu, je n’ai pas voulu qu’on le cherche pendant vingt-quatr |  |
| 12 | 775–784 | 9 | 2,904 | Vendredi 2 août 1878 (755) | Samedi 3 août 1878 | 081.0445 (1878-08-02) | 081.0447 (1878-08-03) | Ce comparer au Tasse ! Mais de pareils vers je les pardonnerais à peine à un gal |  |
| 12 | 802–802 | 1 | 338 | Dimanche 4 août 1878 (791) | — | 081.0458 (1878-08-05) | 081.0459 (1878-08-05) | Ça ne m’étonne pas, le baron est grand, blond, gras, plein de sang. Du temps de  |  |
| 12 | 809–810 | 2 | 701 | Lundi 5 août 1878 (806) | — | 081.0461 (1878-08-05) | 081.0463 (1878-08-06) | Je suis rentrée avec un chapeau tout à fait charmant trouvé à Hombourg. Figurez- |  |

### 082 — 19 gaps, 137 paras, 36,009 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 12 | 913–930 | 17 | 3,274 | Lundi 1 2 août 1878 (904) | — | 082.0064 (1878-08-12) | 082.0070 (1878-08-13) | [Trois lignes cancellées: Expression en jetant par terre, etc. imitation. | bracketed/rayé |
| 12 | 935–954 | 18 | 3,625 | Mardi 1 3 août 1878 (932) | — | 082.0068 (1878-08-13) | 082.0071 (1878-08-13) | Je m’étais bien promise de jouer la comédie qu’a jouée la petite tante avec Mult |  |
| 12 | 970–979 | 8 | 3,573 | Mercredi 14 août 1878 (956) | Jeudi 15 août 1 878 | 082.0083 (1878-08-14) | 082.0088 (1878-08-15) | Sac à papier ! Sapristi quelle folie. Quelle chose détestable !... Je ne veux pl |  |
| 12 | 986–992 | 4 | 926 | Jeudi 15 août 1 878 (979) | 15 août 1878 | 082.0091 (1878-08-15) | 082.0094 (1878-08-16) | Dourassoff est parti à trois heures, le pauvre garçon l’a échappé belle, encore  |  |
| 12 | 994–1013 | 16 | 4,051 | 15 août 1878 (989) | Vendredi 16 août 1878 | 082.0091 (1878-08-15) | 082.0094 (1878-08-16) | raison (ce qui me fait passer pour folle)et qu’il se vengerait. Une vieille prin |  |
| 12 | 1033–1033 | 1 | 497 | Lundi 1 9 août 1878 (1027) | — | 082.0110 (1878-08-19) | 082.0113 (1878-08-19) | J’ai déjà accompli la moitié de mes commissions pour moi. Notre appartement est  |  |
| 12 | 1037–1037 | 1 | 400 | Lundi 1 9 août 1878 (1027) | — | 082.0112 (1878-08-19) | 082.0113 (1878-08-19) | Abaza m’écrit que Mühle s’est grisé et qu’il y a eu tout un scandale. Je me cons |  |
| 12 | 1044–1049 | 5 | 973 | Mardi 20 août 1878 (1040) | 19 août 1878 Mademoiselle, | 082.0123 (1878-08-21) | 082.0125 (1878-08-21) | Multedo écrit à Dina, voici sa lettre. |  |
| 12 | 1051–1052 | 2 | 205 | 19 août 1878 Mademoiselle, (1046) | — | 082.0125 (1878-08-21) | 082.0125 (1878-08-21) | Veuillez me répondre vite; je suppute combien de jours et d’heures il me faudra  |  |
| 12 | 1065–1067 | 2 | 63 | Jeudi 22 août 1 878 (1059) | Vendredi 23 août 1878 | 082.0133 (1878-08-22) | 082.0136 (1878-08-23) | Une toute petite tasse japonaise. | short-only |
| 12 | 1095–1103 | 6 | 645 | Mardi 27 août 1878 (1095) | Mardi 27 août 1878 | 082.0155 (1878-08-26) | 082.0158 (1878-08-27) | Je ne pardonnerai jamais à ma famille ces trois années de souffrance, à l’âge où |  |
| 12 | 1107–1110 | 4 | 1,903 | Mardi 27 août 1878 (1095) | — | 082.0155 (1878-08-26) | 082.0158 (1878-08-27) | Le nom ne me convient pas et l’alliance ne me flatte guère. Je vous serais même  |  |
| 12 | 1129–1135 | 7 | 2,104 | Jeudi 29 août 1878 (1119) | — | 082.0174 (1878-08-29) | 082.0190 (1878-08-31) | Il a fallu envoyer chercher des faiseuses de deuil etc. Ma famille serait capabl |  |
| 12 | 1152–1166 | 14 | 3,320 | Samedi 31 août 1878 (1147) | Dimanche 1er septembre 1878 | 082.0189 (1878-08-31) | 082.0193 (1878-09-01) | Maintenant tout est fini. |  |
| 12 | 1197–1198 | 2 | 898 | Mercredi 4 septembre 1878 (1193) | — | 082.0223 (1878-09-04) | 082.0226 (1878-09-05) | parlé et m’a dit telles et telles choses, nous avons plaisanté ensemble sur tell |  |
| 12 | 1201–1209 | 9 | 4,751 | Mercredi 4 septembre 1878 (1193) | — | 082.0223 (1878-09-04) | 082.0226 (1878-09-05) | J’étais déjà enchantée parce que cela m’amusait et me rendait fière de jouer un  |  |
| 12 | 1211–1214 | 3 | 945 | Mercredi 4 septembre 1878 (1193) | Jeudi 5 septembre 1878 | 082.0223 (1878-09-04) | 082.0226 (1878-09-05) | Je voudrais en causer avec quelqu’un, je suis bien seule. Mais je vous jure que  |  |
| 12 | 1373–1376 | 2 | 40 | Mercredi 25 septembre 1878 (1371) | — | 082.0372 (1878-09-25) | 082.0377 (1878-09-25) | 4 Le 22 Septembre 1878 | short-only |
| 12 | 1381–1396 | 16 | 3,816 | Mercredi 25 septembre 1878 (1371) | — | 082.0379 (1878-09-25) | 082.0381 (1878-09-26) | Seulement si le sort vous retient dans votre Pays Natal ne m’oubliez pas tout à  |  |

### 083 — 57 gaps, 183 paras, 52,464 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 12 | 1676–1676 | 1 | 368 | Samedi 2 novembre 1878 (1671) | — | 083.0096 (1878-11-02) | 083.0099 (1878-11-03) | Que m’importent quelques heures d’agitation après ? Mais au moins je me serai am |  |
| 12 | 1681–1682 | 2 | 580 | Dimanche 3 novembre 1878 (1678) | — | 083.0099 (1878-11-03) | 083.0104 (1878-11-04) | Il y a beaucoup de sentiment dans la muisque du marquis d’Ivry. Il s’est pénétré |  |
| 12 | 1684–1685 | 2 | 228 | Dimanche 3 novembre 1878 (1678) | — | 083.0099 (1878-11-03) | 083.0104 (1878-11-04) | Vous comprenez, je me fais un raisonnement sensé et parfaitement juste. |  |
| 12 | 1693–1693 | 1 | 499 | Mardi 5 novembre 1878 (1691) | — | 083.0105 (1878-11-04) | 083.0110 (1878-11-05) | Mais avant la réception de ces billets j’avais envoyé Mlle Oelsnitz chez Gambett |  |
| 12 | 1696–1697 | 2 | 622 | Mardi 5 novembre 1878 (1691) | — | 083.0110 (1878-11-05) | 083.0111 (1878-11-05) | Voici son discours semé de mots drôles mais pas aussi éloquent que je le voudrai |  |
| 12 | 1701–1701 | 1 | 395 | Mardi 5 novembre 1878 (1691) | — | 083.0111 (1878-11-05) | 083.0116 (1878-11-06) | Je la trouvai adorable cette femme parce que je me disais qu’il l’aimait, et ell |  |
| 12 | 1706–1708 | 2 | 570 | Mardi 5 novembre 1878 (1691) | Mercredi 6 novembre 1878 | 083.0111 (1878-11-05) | 083.0116 (1878-11-06) | Potechine et Mme Tarnowsky dînent et je leur raconte Cassagnac. Ma tante veut qu |  |
| 12 | 1710–1711 | 2 | 1,043 | Mercredi 6 novembre 1878 (1708) | — | 083.0116 (1878-11-06) | 083.0118 (1878-11-06) | Dans (’Estafette qui est un mélange de républicanisme on cite Mme de Cassagnac à |  |
| 12 | 1721–1721 | 1 | 2,857 | Vendredi 8 novembre 1878 (1716) | — | 083.0124 (1878-11-08) | 083.0131 (1878-11-09) | C’est drôle pourtant, je ne suis pas enthousiasmée; je l’aurais désiré mieux. Le |  |
| 12 | 1723–1723 | 1 | 363 | Vendredi 8 novembre 1878 (1716) | — | 083.0124 (1878-11-08) | 083.0131 (1878-11-09) | Le retour s’opère en compagnie de MM. Abbatucci, Amigues, Jolibois, baron Eschas |  |
| 12 | 1725–1727 | 2 | 331 | Vendredi 8 novembre 1878 (1716) | Samedi 9 novembre 1878 | 083.0124 (1878-11-08) | 083.0131 (1878-11-09) | [En travers: Les bonapartistes le portent aux nues.] | bracketed/rayé |
| 12 | 1730–1732 | 3 | 687 | Samedi 9 novembre 1878 (1727) | — | 083.0131 (1878-11-09) | 083.0132 (1878-11-09) | Mais ce doit être un canard, Mme Gavini dit que tout le monde le dit. D’abord on |  |
| 12 | 1734–1741 | 6 | 261 | Samedi 9 novembre 1878 (1727) | — | 083.0132 (1878-11-09) | 083.0134 (1878-11-09) | Des traits effacés je crois, dit Gavini. |  |
| 12 | 1746–1747 | 2 | 256 | Dimanche 10 novembre 1878 (1744) | — | 083.0136 (1878-11-10) | 083.0144 (1878-11-12) | Monsieur d’Alt est venu... et puis Lacon le mari de Fio, il est ici pour trois j |  |
| 12 | 1749–1752 | 2 | 746 | Dimanche 10 novembre 1878 (1744) | Lundi 11 novembre 1878; Mardi 12 novembre 1878 | 083.0136 (1878-11-10) | 083.0144 (1878-11-12) | Je crois que je regrette vraiment de n’être pas sa femme et je crois que si je l |  |
| 12 | 1757–1765 | 7 | 797 | Mardi 12 novembre 1878 (1752) | — | 083.0144 (1878-11-12) | 083.0146 (1878-11-12) | [Rayé : - C’est curieux, c’est} étonnant, disait-il. | bracketed/rayé |
| 12 | 1778–1782 | 5 | 1,020 | Samedi 16 novembre 1878 (1774) | — | 083.0159 (1878-11-16) | 083.0160 (1878-11-16) | Et puis voici un numéro du “Patriote Niçois” que j’ai fait venir et dans lequel  |  |
| 12 | 1790–1790 | 1 | 316 | Lundi 18 novembre 1878 (1788) | — | 083.0165 (1878-11-18) | 083.0167 (1878-11-18) | Moi je l’ai assurée tout le temps, que j’ai toujours ri de Cassagnac et que si c |  |
| 12 | 1798–1801 | 4 | 1,893 | Lundi 18 novembre 1878 (1788) | — | 083.0170 (1878-11-19) | 083.0176 (1878-11-20) | Quand j’eus compris la grande affaire, je ne la compris plus du tout et c’est ju |  |
| 12 | 1813–1816 | 2 | 305 | Jeudi 21 novembre 1878 (1810) | — | 083.0181 (1878-11-21) | 083.0183 (1878-11-21) | Ils ont rencontré en voyage un Russe qui les a pris pour des amoureux lorsque Na |  |
| 12 | 1823–1826 | 2 | 185 | Vendredi 22 novembre 1878 (1819) | Samedi 23 novembre 1878 | 083.0188 (1878-11-22) | 083.0193 (1878-11-23) | J’ai été voir Gavini, elle faisait un bésigue avec la chanoi- nesse qui a assist |  |
| 12 | 1830–1831 | 2 | 1,308 | Samedi 23 novembre 1878 (1825) | — | 083.0193 (1878-11-23) | 083.0195 (1878-11-24) | Avec Breslau et moi il a une manière de corriger à part. |  |
| 12 | 1840–1841 | 2 | 761 | Dimanche 24 novembre 1878 (1833) | — | 083.0201 (1878-11-25) | 083.0202 (1878-11-25) | Mme Gavini m’a envoyé un coussin brodé par elle et je suis allée l’en remercier  |  |
| 12 | 1847–1849 | 2 | 146 | Lundi 25 novembre 1878 (1845) | Mardi 26 novembre 1878 | 083.0200 (1878-11-25) | 083.0205 (1878-11-26) | Toutes les après-midi je courrai comme aujourd'hui les boutiques avec Nadine. |  |
| 12 | 1853–1855 | 2 | 240 | Mardi 26 novembre 1878 (1849) | Mercredi 27 novembre 1878 | 083.0207 (1878-11-26) | 083.0210 (1878-11-27) | Les trois fois que je l’ai vue à la Chambre elle n’avait pas du tout l’air d’êtr |  |
| 12 | 1858–1858 | 1 | 729 | Mercredi 27 novembre 1878 (1855) | — | 083.0211 (1878-11-27) | 083.0215 (1878-11-28) | Pourquoi exagérer... pourquoi dire des bêtises qui me plaisent... elle peut être |  |
| 12 | 1864–1865 | 2 | 392 | Jeudi 28 novembre 1878 (1861) | — | 083.0216 (1878-11-28) | 083.0217 (1878-11-28) | J’étais seule lorsque le plus Marcuard de tous les Marcuard vint chez nous. Natu |  |
| 12 | 1873–1881 | 9 | 1,334 | Vendredi 29 novembre 1878 (1868) | — | 083.0222 (1878-11-29) | 083.0223 (1878-11-29) | Ces dames ont ri et ont dit que c’est absurde, qu’elles sont les mêmes et que mo |  |
| 12 | 1886–1890 | 4 | 823 | Vendredi 29 novembre 1878 (1868) | Samedi 30 novembre 1878 | 083.0225 (1878-11-30) | 083.0226 (1878-11-30) | Je suis en chapeau Rembrandt et très intéressante. La pièce m’a entièrement occu |  |
| 12 | 1892–1899 | 8 | 2,847 | Samedi 30 novembre 1878 (1890) | — | 083.0226 (1878-11-30) | 083.0228 (1878-11-30) | Il ne peut douter de l’auteur de ces lettres, pourtant t \ c’était si extraordin |  |
| 12 | 1901–1906 | 6 | 1,654 | Samedi 30 novembre 1878 (1890) | — | 083.0228 (1878-11-30) | 083.0230 (1878-12-01) | Je repasse mes souvenirs... il y a trois ans à Rome. J'étais bien jeune, je m’ép |  |
| 12 | 1910–1914 | 5 | 1,720 | Samedi 30 novembre 1878 (1890) | — | 083.0228 (1878-11-30) | 083.0230 (1878-12-01) | Si on admet qu’il me considérait comme une femme méprisable avec laquelle les es |  |
| 12 | 1940–1944 | 4 | 2,014 | Samedi 7 décembre 1878 (1938) | Dimanche 8 décembre 1878 | 083.0248 (1878-12-06) | 083.0255 (1878-12-08) | Il faudrait voir aussi la Gauche mais c’est difficile. Aujourd’hui j’ai observé  |  |
| 12 | 1953–1954 | 2 | 164 | Mardi 10 décembre 1878 (1948) | — | 083.0262 (1878-12-10) | 083.0263 (1878-12-10) | Mais, repris-je, excusez-moi Monsieur si je vous fais une question indiscrète, p |  |
| 12 | 1992–1993 | 2 | 360 | Samedi 21 décembre 1878 (1988) | — | 083.0301 (1878-12-21) | 083.0302 (1878-12-21) | [ Cancellé: Et lorsque je suis allée dire à Jacques de chasser cette horreur ma  | bracketed/rayé |
| 12 | 1996–1998 | 3 | 656 | Samedi 21 décembre 1878 (1988) | — | 083.0303 (1878-12-21) | 083.0307 (1878-12-23) | Elle sera sûrement une femme extraordinaire. Pensez donc, elle est absolument vi |  |
| 12 | 2000–2009 | 6 | 810 | Samedi 21 décembre 1878 (1988) | Dimanche 22 décembre 1878; Lundi 23 décembre 1878 | 083.0303 (1878-12-21) | 083.0307 (1878-12-23) | L’air gêné de Blanc a commencé juste au moment ou l’on a commencé à causer d’un  |  |
| 12 | 2016–2024 | 8 | 1,673 | Mardi 24 décembre 1878 (2012) | — | 083.0310 (1878-12-24) | 083.0315 (1878-12-25) | Il est affreusement soupçonneux et despote au point de s’embêter lui-même pourvu |  |
| 12 | 2026–2038 | 11 | 2,577 | Mardi 24 décembre 1878 (2012) | Mercredi 25 décembre 1878 - No | 083.0310 (1878-12-24) | 083.0315 (1878-12-25) | Il m’offre une boîte de satin blanc, brodée, de 350 francs. |  |
| 12 | 2040–2040 | 1 | 469 | Mercredi 25 décembre 1878 - Noël (2038) | — | 083.0315 (1878-12-25) | 083.0318 (1878-12-25) | Je suis allée me promener à pied dans les Champs-Elysées avec Paul, nous avons a |  |
| 12 | 2045–2046 | 2 | 269 | Mercredi 25 décembre 1878 - Noël (2038) | — | 083.0315 (1878-12-25) | 083.0318 (1878-12-25) | Instintictvement je me suis mise à réciter des prières, pour écarter de moi les  |  |
| 12 | 2048–2050 | 3 | 962 | Mercredi 25 décembre 1878 - Noël (2038) | — | 083.0318 (1878-12-25) | 083.0321 (1878-12-26) | Mais je te jure que non, et si j’ai dit quoi que ce soit... enfin je te demande  |  |
| 12 | 2052–2054 | 3 | 1,637 | Mercredi 25 décembre 1878 - Noël (2038) | — | 083.0318 (1878-12-25) | 083.0321 (1878-12-26) | Il me l’a dit textuellement au Grand Hôtel il y a deux ans. Il a osé raconter à  |  |
| 12 | 2062–2064 | 3 | 2,283 | Vendredi 27 décembre 1878 (2059) | — | 083.0325 (1878-12-27) | 083.0329 (1878-12-28) | Depuis trois jours j’ai envie d’écrire je ne sais plus au juste quelles réflexio | editorial? |
| 12 | 2071–2071 | 1 | 308 | Dimanche 29 décembre 1878 (2068) | — | 083.0333 (1878-12-29) | 083.0336 (1878-12-29) | C’est drôle et amusant. Salle assez intéressante. Blanc le vieux beau et le vieu |  |
| 12 | 2077–2088 | 11 | 4,825 | Dimanche 29 décembre 1878 (2068) | Lundi 30 décembre 1878 | 083.0336 (1878-12-29) | 083.0339 (1878-12-30) | Oh ! je me suis détrompée, allez. Je ne suis ni adroite, ni heureuse. J’ai envie |  |
| 12 | 2095–2095 | 1 | 327 | Mardi 31 décembre 1878 (2093) | — | 083.0343 (1878-12-31) | 083.0344 (1878-12-31) | Il le tourmente et lui fait entrevoir une année de pointes d’épingles en cas de  |  |
| 12 | 2100–2101 | 2 | 1,531 | Mardi 31 décembre 1878 (2093) | — | 083.0345 (1878-12-31) | 083.0347 (1878-12-31) | 1 Le Figaro du samedi 28 décembre 1878, dans sa rubrique “Gazette des tribunaux” | clipping? |
| 12 | 2103–2105 | 2 | 322 | Mardi 31 décembre 1878 (2093) | Mercredi 1er janvier 1879 | 083.0347 (1878-12-31) | 083.0350 (1879-01-01) | J’y pense encore... pas à lui précisément... mais je me fais une seconde existen | editorial? |
| 12 | 2115–2121 | 6 | 343 | Jeudi 2 janvier 1 879 (2112) | — | 083.0356 (1879-01-02) | 083.0357 (1879-01-02) | La pensée est enchaînée par suite de cette gêne stupide et énervante. Même en me |  |
| 12 | 2123–2123 | 1 | 544 | Jeudi 2 janvier 1 879 (2112) | — | 083.0357 (1879-01-02) | 083.0358 (1879-01-02) | Quand même on dirait des choses sensées on serait sous le coup de ces moqueries  |  |
| 12 | 2136–2136 | 1 | 330 | Dimanche 5 janvier 1879 (2131) | — | 083.0368 (1879-01-05) | 083.0369 (1879-01-05) | J’allais me plaindre, mais je me suis souvenue de mon arrangement [Comme pis all |  |
| 12 | 2141–2142 | 2 | 317 | Lundi 6 janvier 1 879 (2138) | — | 083.0372 (1879-01-06) | 083.0374 (1879-01-06) | Je vais faire une complainte comme celle d’Audiffret. La Robinson... elle n’est  |  |
| 12 | 2151–2154 | 2 | 812 | Mercredi 8 janvier 1879 (2148) | Jeudi 9 janvier 1 879 | 083.0381 (1879-01-09) | 083.0382 (1879-01-09) | Marie était innocente ! Je crois que M. Dumas lui-même se méprend sur le sens du |  |
| 12 | 2159–2159 | 1 | 353 | Jeudi 9 janvier 1 879 (2154) | — | 083.0383 (1879-01-09) | 083.0384 (1879-01-09) | Je ne parle pas de la musique puisque j’étais avec Mme Gavini et devais causer e |  |
| 12 | 2163–2165 | 3 | 954 | Vendredi 10 janvier 1879 (2161) | — | 083.0384 (1879-01-09) | 084.0002 (1879-01-11) | Je m’ennuie à périr. Nous dînons et déjeunons au Café Anglais où l’on mange bien |  |
| 12 | 2167–2184 | 8 | 1,348 | Vendredi 10 janvier 1879 (2161) | Mardi, Jeudi 27 juin 1878; Dimanche 27 janvier 1878 les c; Samedi 11 janvier 1879 | 083.0384 (1879-01-09) | 084.0002 (1879-01-11) | Le prince Italien d’abord et le suicide si cela ne réussit pas, de cette manière |  |

### 084 — 23 gaps, 110 paras, 28,671 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 12 | 2187–2194 | 6 | 1,693 | Samedi 11 janvier 1879 (2184) | Dimanche 1 2 janvier 1879; Lundi 1 3 janvier 1 879 - Nouv | 084.0003 (1879-01-11) | 084.0005 (1879-01-12) | Elle dit pis que pendre d’Amélie et puis avec un air loyal va lui |  |
| 12 | 2203–2210 | 7 | 2,631 | Mardi 1 4 janvier 1879 (2199) | Mercredi 1 5 janvier 1879 | 084.0013 (1879-01-14) | 084.0016 (1879-01-15) | Il faut que vous compreniez bien l’importance et la vraie signification des conc |  |
| 12 | 2213–2225 | 12 | 2,472 | Mercredi 1 5 janvier 1879 (2210) | Jeudi 1 6 janvier 1 879 | 084.0016 (1879-01-15) | 084.0018 (1879-01-16) | Attendez d’abord, nous avons dîné hier chez Mouzay. Je me suis tellement ennuyée |  |
| 12 | 2238–2248 | 9 | 712 | Vendredi 17 janvier 1879 (2230) | Samedi 1 8 janvier 1879 | 084.0028 (1879-01-17) | 084.0030 (1879-01-18) | J’étais rouge et maladroite en écoutant ce qui m’a même diminué le plaisir de l’ |  |
| 12 | 2277–2278 | 2 | 612 | Jeudi 23 janvier 1879 (2274) | — | 084.0050 (1879-01-23) | 084.0051 (1879-01-23) | Je lui ai répondu sèchement, il faut remettre ces gens-là à leur place de temps  |  |
| 12 | 2284–2288 | 2 | 407 | Jeudi 23 janvier 1879 (2274) | Vendredi 24 janvier 1879; Samedi 25 janvier 1879; Dimanche 26 janvier 1879 | 084.0053 (1879-01-23) | 084.0057 (1879-01-25) | Vous savez dans quel état j’étais allée à Naples, j’aurais pu être encore plus f |  |
| 12 | 2292–2292 | 1 | 727 | Dimanche 26 janvier 1879 (2287) | — | 084.0058 (1879-01-25) | 084.0060 (1879-01-25) | Je me rends justice allez, et je vois bien que j’ai enlaidi ces derniers temps m |  |
| 12 | 2296–2296 | 1 | 445 | Dimanche 26 janvier 1879 (2287) | — | 084.0063 (1879-01-26) | 084.0064 (1879-01-26) | Relisez vite depuis le mardi 22 janvier 1876 jusqu’au mardi 29, relisez-le avec  |  |
| 12 | 2298–2299 | 2 | 519 | Dimanche 26 janvier 1879 (2287) | — | 084.0064 (1879-01-26) | 084.0065 (1879-01-26) | tant de gens heureux, riches, aimés qui meurent et plongent dans le désespoir le |  |
| 12 | 2303–2306 | 3 | 812 | Dimanche 26 janvier 1879 (2287) | — | 084.0066 (1879-01-26) | 084.0069 (1879-01-27) | Il est le seul être que je voie vraiment fort, vraiment homme comme doit être l’ |  |
| 12 | 2310–2311 | 1 | 560 | Dimanche 26 janvier 1879 (2287) | Lundi 27 janvier 1879 | 084.0070 (1879-01-27) | 084.0068 (1879-01-27) | culent pas comme moi ! Mourir sans avoir vécu. Désespérée et flétrie... Je crois |  |
| 12 | 2325–2329 | 4 | 743 | Mercredi 29 janvier 1879 (2320) | Jeudi 30 janvier 1879 | 084.0081 (1879-01-29) | 084.0083 (1879-01-30) | Il y a trois catégories de gens. Les premiers aiment tout cela, sont artistes et | editorial? |
| 12 | 2340–2340 | 1 | 1,991 | Samedi 1er février 1879 (2336) | — | 084.0091 (1879-02-01) | 084.0096 (1879-02-02) | Il m’arrive toujours des choses contrariantes. J’ai rêvé et désiré pour le nouve | editorial? |
| 12 | 2351–2362 | 11 | 1,907 | Lundi 3 février 1879 (2348) | Mardi 4 février 1879 | 084.0099 (1879-02-03) | 084.0101 (1879-02-04) | Et puis on a fait un petit article dans “La vie mondaine” de Nice, je l’ai montr |  |
| 12 | 2374–2376 | 3 | 1,437 | Mercredi 5 février 1879 (2365) | — | 084.0110 (1879-02-05) | 084.0112 (1879-02-06) | J’ai vingt ans après tout. Pour une fille c’est suffisant. On se demande pourquo |  |
| 12 | 2397–2401 | 2 | 120 | Dimanche 9 février 1 879 (2387) | Lundi 10 février 1879; Mardi 11 février 1879 | 084.0130 (1879-02-09) | 084.0134 (1879-02-11) | Berthe est venue hier. Chaque fois que je vois son muffle je pense à son masque. |  |
| 12 | 2464–2465 | 2 | 265 | Vendredi 21 février 1879 (2453) | — | 084.0193 (1879-02-21) | 084.0194 (1879-02-21) | Je voudrais voir Gautier. Gautier est une chose superbe à voir. On en ferait un  |  |
| 12 | 2509–2514 | 6 | 674 | Mardi 25 février 1879 (2500) | — | 084.0236 (1879-02-25) | 084.0237 (1879-02-25) | Je vous prie de parler français Monsieur, je désire que tout le monde sache quel |  |
| 12 | 2517–2522 | 6 | 442 | Mardi 25 février 1879 (2500) | — | 084.0236 (1879-02-25) | 084.0237 (1879-02-25) | Je suis à vos ordres Monsieur. |  |
| 12 | 2524–2526 | 3 | 1,251 | Mardi 25 février 1879 (2500) | — | 084.0236 (1879-02-25) | 084.0237 (1879-02-25) | Puis il vint nous retrouver et nous raconter l’affaire. Je suis contente. C’est  |  |
| 12 | 2533–2540 | 7 | 1,862 | Jeudi 27 février 1879 (2530) | — | 084.0241 (1879-02-27) | 084.0242 (1879-02-27) | Je vous cherchais depuis quelque temps déjà pour vous demander raison de l’infam |  |
| 12 | 2545–2557 | 12 | 1,587 | Vendredi 28 février 1879 (2542) | — | 084.0245 (1879-02-28) | 084.0247 (1879-03-01) | Eristoff ou celle-ci lui dit toutes sortes d’injures. Si [Mot noirci: j’avais] é | editorial? |
| 12 | 2797–2803 | 7 | 4,802 | Mardi 1er avril 1 879 (2794) | — | 084.0474 (1879-04-01) | 084.0477 (1879-04-02) | Je me suis résignée, les faiblesses d’hier me font honte. |  |

### 085 — 12 gaps, 149 paras, 30,852 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 13 | 158–163 | 4 | 1,282 | Lundi 1 2 mai 1 879 (150) | — | 085.0061 (1879-05-12) | 085.0062 (1879-05-13) | La peinture de Breslau est une grande belle toille occupée par un grand beau fau |  |
| 13 | 213–215 | 2 | 122 | Lundi 1 9 mai 1 879 (202) | — | 085.0093 (1879-05-19) | 085.0094 (1879-05-20) | Non, c’est vous qui lui ferez la cour. Vous ne chercherez pas l’occasion mais vo |  |
| 13 | 219–227 | 5 | 730 | Lundi 1 9 mai 1 879 (202) | — | 085.0093 (1879-05-19) | 085.0094 (1879-05-20) | Ah ! ha ! voyez, comme vous êtes rusée ! Vous avez compris cela; mais qu’importe |  |
| 13 | 265–280 | 13 | 5,192 | Vendredi 23 mai 1879 (261) | — | 085.0117 (1879-05-23) | 085.0118 (1879-05-24) | [Annotation: 1905. pour nous tous et surtout pour moi, notre malheureux frère ét | bracketed/rayé |
| 13 | 445–470 | 19 | 1,918 | Mardi 1 0 juin 1 879 (438) | Mercredi 1 1 juin 1 879 | 085.0227 (1879-06-10) | 085.0228 (1879-06-11) | C’est vrai, très ambitieuse. |  |
| 13 | 488–503 | 13 | 1,884 | Samedi 1 4 juin 1 879 (486) | Dimanche 1 5 juin 1879 | 085.0238 (1879-06-13) | 085.0240 (1879-06-17) | Assez de monde, M. Randouin, Madame est souffrante; et M. Obidine un Russe dont  |  |
| 13 | 507–508 | 2 | 434 | Dimanche 1 5 juin 1879 (489) | — | 085.0238 (1879-06-13) | 085.0240 (1879-06-17) | Je travaillerai beaucoup, autant que possible tout le temps ! Demain j’irai à Ve |  |
| 13 | 510–552 | 33 | 9,739 | Lundi 1 6 juin 1 879 (510) | Lundi 1 6 juin 1 879; Mardi 1 7 juin 1 879 | 085.0238 (1879-06-13) | 085.0240 (1879-06-17) | Je vais donc vous rendre compte de la mémorable et |  |
| 13 | 595–640 | 40 | 7,840 | Samedi 21 juin 1 879 (587) | — | 085.0265 (1879-06-21) | 085.0266 (1879-06-22) | Je vous assure que je poussai un vrai cri et m’assis sur le coffre à charbon. Et |  |
| 13 | 642–646 | 5 | 668 | Samedi 21 juin 1 879 (587) | — | 085.0265 (1879-06-21) | 085.0266 (1879-06-22) | Je ne sais si on peut donner le nom d’homme à celui qui ne s’inclinerait pas ave |  |
| 13 | 648–657 | 7 | 902 | Samedi 21 juin 1 879 (587) | Dimanche 22 juin 1879 | 085.0265 (1879-06-21) | 085.0266 (1879-06-22) | C’est comme l’invraisemblable, l’infâme et le révoltant “Roman d’une femme” de D |  |
| 13 | 957–963 | 6 | 141 | Mercredi 6 août 1879 (939) | 27 juin 1878 | 085.0475 (1879-08-06) | 086.0089 (1879-08-16) | Dessin 3 octobre 1879 | short-only |

### 086 — 17 gaps, 237 paras, 57,525 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 13 | 1291–1302 | 7 | 2,369 | Jeudi 11 septembre 1879 (1291) | Jeudi 11 septembre 1879; Vendredi 12 septembre 1879; Samedi 13 septembre 1879 | 086.0252 (1879-09-10) | 086.0254 (1879-09-13) | A quoi me sert Hecht ! Non ! Non, je suis trop découragée II Rien ne me réussit, |  |
| 13 | 1317–1375 | 42 | 8,020 | Samedi 13 septembre 1879 (1302) | Dimanche 14 septembre 1879; Lundi 15 septembre 1879; Mardi 16 septembre 1879; Mercredi 17 septembre 1879; Jeudi 18 septembre 1879; Vendredi 19 septembre 1879 (+2) | 086.0265 (1879-09-13) | 086.0269 (1879-10-01) | Non, ne le croyez pas si bête, car il l’a dit seulement parce que je lui avait d |  |
| 13 | 1377–1403 | 14 | 3,092 | Lundi 22 septembre 1879 (1377) | Lundi 22 septembre 1879; Mardi 23 septembre 1879; Mercredi 24 septembre 1879; Jeudi 25 septembre 1879; Vendredi 26 septembre 1879; Samedi 27 septembre 1879 (+2) | 086.0265 (1879-09-13) | 086.0269 (1879-10-01) | Doenhoff est ici, il est déjà venu plusieurs fois et ce soir il a |  |
| 13 | 1657–1667 | 6 | 1,152 | Samedi 1 5 novembre 1 879 (1644) | Dimanche 16 novembre 1879; Lundi 17 novembre 1879; Mardi 18 novembre 1879 | 086.0479 (1879-11-15) | 086.0511 (1879-12-01) | Chaudordy est resté très tard à raconter des histoires sur M. Thiers et Gortchak |  |
| 13 | 1669–1688 | 12 | 4,978 | Mardi 18 novembre 1879 (1667) | Jeudi 20 novembre 1879; Vendredi 21 novembre 1879; Samedi 22 novembre 1879 | 086.0479 (1879-11-15) | 086.0511 (1879-12-01) | Mercredi19 novembre 1879 |  |
| 13 | 1690–1745 | 36 | 10,807 | Samedi 22 novembre 1879 (1686) | Dimanche 23 novembre 1879; Lundi 24 novembre 1879; Mardi 25 novembre 1879; Mercredi 26 novembre 1879; Jeudi 27 novembre 1879; Vendredi 28 novembre 1879 (+3) | 086.0479 (1879-11-15) | 086.0511 (1879-12-01) | Je m’enhardis déjà et n’en ai presque plus peur. Après l’avoir vu une ou deux fo |  |
| 13 | 1767–1813 | 30 | 9,468 | Jeudi 4 décembre 1879 (1767) | Jeudi 4 décembre 1879; Vendredi 5 décembre 1879; Samedi 6 décembre 1879; Dimanche 7 décembre 1879; Lundi 8 décembre 1879; Mardi 9 décembre 1879 (+2) | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | J’ai parlé de l’exposition de Nice à mes maîtres, ils m’approuvent. Mais cela m’ |  |
| 13 | 1815–1817 | 2 | 590 | Jeudi 11 décembre 1879 (1804) | Vendredi 12 décembre 1879 | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | La soirée finit en farce, ces dames, la Princesse, Bojidar, Alexis et Blanc s’en |  |
| 13 | 1819–1833 | 8 | 2,578 | Samedi 13 décembre 1879 (1819) | Samedi 13 décembre 1879; Dimanche 14 décembe 1879; Lundi 15 décembre 1879 | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | Berthe est venue me prendre et accompagnées de Bojidar nous nous en allons à pie |  |
| 13 | 1835–1855 | 13 | 4,658 | Lundi 15 décembre 1879 (1833) | Mardi 16 décembre 1879; Mercredi 17 décembre 1879; Jeudi 18 décembre 1879 | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | Ce soir j’ai eu Mlle Marie Delsarte qui vient me montrer la sculpture, je l’invi |  |
| 13 | 1858–1861 | 4 | 1,251 | Jeudi 18 décembre 1879 (1841) | — | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | Enfin nous allions nous en aller lorsque je trouve Joseph près de la boutique de |  |
| 13 | 1864–1883 | 18 | 2,324 | Jeudi 18 décembre 1879 (1841) | — | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | Moi aussi mais apprenez d’abord ceci cher Antinoüs, je ne vous demanderai [rayé: |  |
| 13 | 1885–1886 | 2 | 124 | Jeudi 18 décembre 1879 (1841) | — | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | Ou m’as-tu vu ? |  |
| 13 | 1888–1925 | 29 | 3,128 | Jeudi 18 décembre 1879 (1841) | Vendredi 19 décembre 1879 | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | Tenez tout ce que je puis c’est de vous montrer mon oreille. |  |
| 13 | 1927–1940 | 10 | 2,832 | Vendredi 19 décembre 1879 (1924) | Samedi 20 décembre 1879; Dimanche 21 décembre 1879 | 086.0525 (1879-12-03) | 086.0527 (1879-12-21) | On dit qu’il a vingt-deux ou vingt-trois ans. Et les rides et cet air vieux ? Ça |  |
| 13 | 1971–1972 | 2 | 105 | Dimanche 21 décembre 1879 (1940) | — | 086.0548 (1879-12-21) | 086.0089 (1879-08-16) | Dessin, 3 octobre 1877 peinture 30 septembe 1878 médaille 14 janvier 1879 | editorial? |
| 13 | 3088–3092 | 2 | 49 | Vendredi 23 avril 1880 (3074) | Samedi 24 avril 1880 | 086.0089 (1879-08-16) | 088.0002 (1880-04-24) | page 86 faire un livre | short-only |

### 087 — 1 gaps, 4 paras, 101 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 13 | 3083–3086 | 4 | 101 | Vendredi 23 avril 1880 (3074) | — | 087.0895 (1880-04-23) | 086.0089 (1879-08-16) | Dessin 3 octobre 1877 | editorial?, short-only |

### 088 — 1 gaps, 7 paras, 340 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 13 | 4163–4170 | 7 | 340 | Samedi 1 9 juin 1 880 (4117) | Dimanche 20 juin 1 880 | 088.0826 (1880-06-18) | 089.0002 (1880-06-20) | Dessin 3 octobre 1871 | editorial? |

### 090 — 7 gaps, 164 paras, 44,142 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 14 | 186–194 | 6 | 1,829 | Mardi 19 octobre 1880 (181) | Mercredi 20 octobre 1880 | 090.0124 (1880-10-19) | 090.0125 (1880-10-20) | Je n’ai pas beaucoup maigri, je suis tout à fait comme on doit être, seulement j |  |
| 14 | 694–760 | 44 | 14,040 | Vendredi 31 décembre 1880 (694) | Vendredi 31 décembre 1880; Samedi 1er janvier 1881; Dimanche 2 janvier 1881; Lundi 3 janvier 1 881; Mardi 4 janvier 1 881; Mercredi 5 janvier 1881 (+1) | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Je vais à l’atelier faire une esquisse, je suis toute seule, arrive Julian; Amél |  |
| 14 | 762–810 | 31 | 9,571 | Jeudi 6 janvier 1 881 (748) | Vendredi 7 janvier 1881; Samedi 8 janvier 1881; Dimanche 9 janvier 1881; Lundi 1 0 janvier 1 881; Mardi 1 1 janvier 1881; Mercredi 12 janvier 1881 (+1) | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | C’est une scie exaspérante. |  |
| 14 | 812–818 | 5 | 1,544 | Jeudi 13 janvier 1881 - (1er janvier) (804) | — | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Je passe mes soirées à jouer de la guitare devant la cheminée et à lire. |  |
| 14 | 820–829 | 6 | 2,307 | Vendredi 14 janvier 1881 (820) | Vendredi 14 janvier 1881; Samedi 1 5 janvier 1881 | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Voici un morceau de Cassagnac. C’est court mais bête. Considérez la seconde moit |  |
| 14 | 831–895 | 46 | 8,797 | Samedi 1 5 janvier 1881 (828) | Dimanche 1 6 janvier 1881; Lundi 1 7 janvier 1881; Mardi 1 8 janvier 1 881; Mercredi 19 janvier 1881; Jeudi 20 janvier 1881; Vendredi 21 janvier 1881 (+1) | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Julian est venu me dire ensuite qu’il avait parlé de moi à Cot comme d’une élève |  |
| 14 | 898–939 | 26 | 6,054 | Samedi 22 janvier 1881 (894) | Dimanche 23 janvier 1881; Lundi 24 janvier 1 881; Mardi 25 janvier 1 881; Mercredi 26 janvier 1881; Jeudi 27 janvier 1881; Vendredi 28 janvier 1881 | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Julian qui vient après est aussi gentil et je vois que mon travail l’amuse car i |  |

### 091 — 1 gaps, 17 paras, 2,696 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 14 | 941–965 | 17 | 2,696 | Vendredi 28 janvier 1881 (937) | Vendredi 29 janvier 1881; Dimanche 30 janvier 1881; Lundi 31 janvier 1881; Mardi 1er février 1881; Mercredi 2 février 1881 | 090.0474 (1880-12-30) | 091.0002 (1881-02-02) | Il raconte aussi les affaires de Russie, il serait fastidieux d’en parler ici ca |  |

### 092 — 6 gaps, 17 paras, 6,645 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 14 | 1733–1736 | 3 | 126 | Samedi 1 4 mai 1881 (1710) | Dimanche 15 mai 1881 | 091.0602 (1881-05-14) | 092.0001 (1881-05-15) | du dimanche 15 mai 1881 au jeudi 18 août 1881 | short-only |
| 14 | 1885–1888 | 3 | 2,017 | Dimanche 5 juin 1881 - 24 mai (1878) | Lundi 6 juin 1881 - 25 mai | 092.0096 (1881-06-05) | 092.0097 (1881-06-06) | On va dire qu’on ne raconte les “pressentiments" qu’après l’évènement, c’est que |  |
| 14 | 1894–1895 | 1 | 413 | Lundi 6 juin 1881 - 25 mai (1888) | Mardi 7 juin 1881 - 26 mai | 092.0098 (1881-06-06) | 092.0099 (1881-06-07) | Voilà ce que Zola dit de Jules Vallès... Une sensibilité cachée comme un ridicul |  |
| 14 | 1904–1910 | 5 | 2,126 | Samedi 1 1 juin 1881 - 30 mai (1900) | Dimanche 12 juin 1881 -31 mai; Lundi 13 juin 1881 -1er juin | 092.0099 (1881-06-07) | 092.0104 (1881-06-12) | vide et puis le soir papa par de petits détours enfantins et voilés se mit à s’e |  |
| 14 | 1915–1919 | 4 | 1,267 | Lundi 13 juin 1881 -1er juin (1910) | Mardi 14 juin 1881-2 juin | 092.0104 (1881-06-12) | 092.0108 (1881-06-16) | Maman, Paul, Nini, papa, Michel, Dina et Sperandio restent là une partie de la j |  |
| 14 | 2338–2338 | 1 | 696 | Vendredi 12 août 1881 (2335) | — | 092.0398 (1881-08-12) | 092.0400 (1881-08-12) | Et tout s’en mêle. Je renonce au tableau et me décide à peindre Oelsnitz mais el |  |

### 093 — 1 gaps, 7 paras, 1,702 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 14 | 2404–2415 | 7 | 1,702 | Jeudi 18 août 1 881 (2376) | Jeudi 18 août 1881; Vendredi 19 août 1881; Samedi 20 août 1881 | 092.0440 (1881-08-18) | 093.0002 (1881-08-20) | du jeudi 18 août 1881 au mardi 22 novembre 1881 |  |

### 094 — 1 gaps, 9 paras, 2,062 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 14 | 3148–3161 | 9 | 2,062 | Jeudi 15 décembre 1881 (3148) | Jeudi 15 décembre 1881; Jeudi 15 décembre 1881 | 094.0018 (1881-12-14) | 094.0019 (1881-12-15) | Voilà quatre semaines et deux jours que je suis malade. |  |

### 095 — 1 gaps, 7 paras, 1,708 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 383–393 | 7 | 1,708 | Vendredi 30 juin 1882 (383) | Vendredi 30 juin 1882; Samedi 1er juillet 1882 | 095.0215 (1882-06-28) | 095.0216 (1882-07-01) | Eh bien tout cela me fatigue, me dégoûte. J’en ai assez... |  |

### 096 — 3 gaps, 10 paras, 998 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 628–632 | 3 | 302 | Lundi 31 juillet 1 882 (608) | Mardi 1 er août 1882; Mercredi 2 août 1882 | 095.0362 (1882-07-31) | 096.0002 (1882-08-02) | depuis le mardi 1er août 1882 jusqu’au dimanche 29 octobre 1882 30, rue Ampère,  | editorial? |
| 15 | 1145–1151 | 3 | 445 | Jeudi 19 octobre 1882 (1133) | Vendredi 20 octobre 1882; Samedi 21 octobre 1882; Dimanche 22 octobre 1882; Lundi 23 octobre 1882 | 096.0390 (1882-10-19) | 096.0395 (1882-10-23) | Donc pour en revenir à nos princes. |  |
| 15 | 1225–1232 | 4 | 251 | Dimanche 29 octobre 1882 (1200) | Dimanche 29 octobre 1882-suite; Lundi 30 octobre 1882 | 096.0443 (1882-10-29) | 097.0002 (1882-10-30) | [Livre] 97ème | bracketed/rayé, editorial? |

### 097 — 2 gaps, 8 paras, 4,384 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 1278–1289 | 6 | 4,284 | Mardi 7 novembre 1882 (1278) | Mardi 7 novembre 1882; Mercredi 8 novembre 1882 | 097.0038 (1882-11-06) | 097.0041 (1882-11-08) | Donc sans qu’on s’y attende il y a un festin ce soir. |  |
| 15 | 1770–1773 | 2 | 100 | Jeudi 1 1 janvier 1 883 (1764) | Vendredi 1 2 janvierl 883; Samedi 1 3 janvier 1 883 - 1er | 097.0414 (1883-01-11) | 098.0004 (1883-01-13) | [Livre] 98ème | bracketed/rayé |

### 098 — 2 gaps, 7 paras, 432 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 2224–2229 | 2 | 112 | Lundi 1 9 février 1 883 (2207) | Mardi 20 février 1883; Mercredi 21 février 1883 | 098.0365 (1883-02-19) | 098.0369 (1883-02-21) | Et Paris est là pour le dire. |  |
| 15 | 2540–2546 | 5 | 320 | Vendredi 30 mars 1883 (2517) | — | 098.0629 (1883-03-30) | 099.0393 (1883-05-23) | Je viens de recevoir la lettre suivante: |  |

### 099 — 3 gaps, 14 paras, 2,466 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 2548–2563 | 8 | 1,006 | Vendredi 30 mars 1883 (2517) | Samedi 31 mars 1883 | 099.0393 (1883-05-23) | 099.0002 (1883-03-31) | Cette année c’est un vrai succès pour vous et j’en suis bien heureux. |  |
| 15 | 2839–2846 | 4 | 1,107 | Samedi 26 août 1 883 (2839) | Samedi 26 août 1 883 | 099.0232 (1883-04-27) | 099.0235 (1883-04-29) | Matinée au Trocadéro au profit des ateliers des aveugles. Tout Paris est là. Sar |  |
| 15 | 2849–2851 | 2 | 353 | Samedi 26 août 1 883 (2839) | Dimanche 29 avril 1883 | 099.0232 (1883-04-27) | 099.0235 (1883-04-29) | Nous allons à la messe de minuit et comme chaque année j’en reviens, le cœur ple |  |

### 100 — 2 gaps, 8 paras, 2,256 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 15 | 3479–3482 | 2 | 560 | Vendredi 1er juin 1883 (3479) | Vendredi 1er juin 1883; Samedi 2 juin 1 883 | 100.0005 (1883-05-31) | 100.0007 (1883-06-02) | Les gosses qui posent m’exaspèrent à la folie ! J’ai l’autorisation des parents  |  |
| 15 | 3496–3507 | 6 | 1,696 | Dimanche 3 juin 1 883 - Grand Prix (3496) | Dimanche 3 juin 1 883 - Grand ; Lundi 4 juin 1883; Mardi 5 juin 1883 | 100.0007 (1883-06-02) | 100.0008 (1883-06-05) | Ma tante, Dina, Mme Gavini et moi. |  |

### 101 — 3 gaps, 21 paras, 2,899 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 16 | 353–355 | 2 | 269 | Vendredi 31 août 1883 (348) | Samedi 1er septembre 1883 | 101.0307 (1883-08-31) | 101.0309 (1883-09-01) | Il y a des moments ou sans qu’on sache pourquoi tout paraît rose, on rirait au n |  |
| 16 | 619–628 | 9 | 1,514 | Dimanche 7 octobre 1883 (610) | — | 101.0524 (1883-10-07) | 101.0525 (1883-10-08) | Ça... enfin. S’il est vraiment incomplet, ce qui me paraît très probable, et s’i |  |
| 16 | 737–750 | 10 | 1,116 | Lundi 15 octobre 1883 (719) | Mardi 16 octobre 1883 | 101.0618 (1883-10-15) | 102.0001 (1883-10-16) | Non, voyez dans le cahier suivant. |  |

### 102 — 1 gaps, 2 paras, 116 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 16 | 1522–1524 | 2 | 116 | Samedi 12 janvier 1884 (1502) | Samedi 1 2 janvier 1 884 - sui | 102.0149 (1884-01-12) | 102.0150 (1884-01-12) | Gloriae Cupiditas [Livre] 1 03 |  |

### 104 — 1 gaps, 2 paras, 150 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 16 | 2497–2499 | 2 | 150 | Mercredi 30 avril 1884 (2497) | Mercredi 30 avril 1884 | 104.0033 (1884-04-27) | 104.0035 (1884-04-30) | Le désastre n’est pas complet, car “Le Gaulois” parle de moi très bien. J’ai une | clipping? |

### 106 — 1 gaps, 4 paras, 633 chars

| Tome | docx | Paras | Chars | Under heading (docx) | Headings inside | After | Before | First ~80 chars | Flags |
|---|---|---|---|---|---|---|---|---|---|
| 16 | 4220–4224 | 4 | 633 | Dimanche 21 septembre 1884 (4217) | Lundi 22 septembre 1884 | 106.0092 (1884-09-21) | 106.0093 (1884-09-22) | Les autres sont chez eux, on ne les voit que pomponnés, habillés, à leur avantag |  |


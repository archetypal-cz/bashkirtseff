# Carnet 065 rebuild plan: review (2026-09-28)

Plan: `plan-065.json` (multi-carnet: run it together with 066 and 067, `just rebuild-carnets plan-065.json plan-066.json plan-067.json`). A variant that is valid on its own, with the 066 paragraphs left in 066, is `standalone/plan-065.json`.
Built by `build.py` from `t09.json` (tome09.docx dump with italic runs), `orig.json` (parsed `_original` 065+066+067) and the alignment `align.py` → `stage.json`. The draft tool (`just rebuild-draft-plan 065 066 067`, output in `draft/`) was run as a cross-check; the differences are listed in §6.
Source range: tome09.docx ¶71 («Gloriae Cupiditate», the Livre 65 title page) to ¶851 (last line of «Samedi 2 septembre 1876»); ¶852 opens the Livre 66 title page.

## Summary

- **Livre 65 = docx ¶71–851**, 17 August – 2 September 1876 (Marie's own title page: «depuis le jeudi 17 août 1876 jusqu'au samedi 2 septembre 1876»).
- The 284 old 065 IDs split into 276 carried and 8 dropped. **166 paragraphs move in from 066** (066.0001–0173 minus 7 dropped: they are Livre 65 text of 21–24 August that the extraction filed as 066 under invented September dates). There are 318 new paragraphs (48,000 chars). New total **760**, numbered 065.0001–0760.
- The 16 old files become **16 entries**, one per manuscript date (no cover entry: KRR 2026-09-28), 17 August – 2 September. 21 and 22 August share one date line in the manuscript («Lundi 21 août 1876 (9 août) / et Mardi 22 août 1876 (10 août)»), so they are one entry, `1876-08-21.md`.
- **set_french: 6.** Four weekday fixes on reused heading clusters and two letter quotings (§2).
- **Kinds.** New: margin ×3, editorial ×2. Old: letter ×2 (065.0040–0041), margin ×2 (065.0033, 065.0118), rayé ×1 (065.0002).
- Every new paragraph's RSR note cites «Mon Journal t.9 p.X» next to the docx ¶ (page map `tome09_pagemap.json`).
- Gates were run in a throwaway worktree on the three plans together (§5): all PASS, splicescan empty, completeness 0 missing.

## 1. Prerequisites

None. The identity dry run accepts 065. cz, uk, en and fr each hold the same 284 IDs as `_original`, with no duplicates, and every embedded French copy matches its `_original` paragraph. There is no es/065.

## 2. Structure decisions

**Why 066.0001–0173 come here.** Every file from 065/1876-08-19 to 066/1876-09-15 holds 18–24 August text under invented dates (heading-date sweep, 2026-09-26, §3). The real 25 August – 2 September text (docx ¶522–851) was missing altogether. The manuscript order is: 065.0001–0126 (17–20 Aug), 065.0127–0283 + 065.0284/066.0002–0007 (21–22 Aug), 066.0001, 0008–0103 (23 Aug), 066.0104–0173 plus 18 new paragraphs (24 Aug), then new text (25 Aug – 2 Sep).

**Heading-only clusters.** Each date line keeps the old heading cluster nearest to it, and the invented or duplicate ones are dropped.

| Old ID | Old heading | New role |
|---|---|---|
| 065.0001 | Jeudi, 17 août | kept, 17 Aug |
| 065.0015 | Vendredi, 18 août | kept, 18 Aug |
| 065.0021 | Samedi, 19 août | kept, 19 Aug (empty day, see below) |
| 065.0024 | Dimanche, 20 août | kept, 20 Aug |
| 065.0127 | Lundi, 21 août … et Mardi, 22 août | kept, 21–22 Aug (the manuscript's own double date line, ¶201–202) |
| 066.0001 | Mercredi, 23 août | moved in, 23 Aug |
| 066.0104 | Jeudi, 24 août | moved in, 24 Aug |
| 066.0046 / 0061 / 0071 / 0080 / 0165 | Vendredi 25 / Samedi 26 / Dimanche 27 / Lundi 28 / Mardi 29 août | moved in: each is the correct date line of its day (¶536, 584, 627, 645, 658) and now heads it |
| 065.0204 / 0226 / 0253 / 0263 | Samedi 30 août / Dimanche 31 août / Lundi 1er sept / Mardi 2 sept | kept for 30 Aug – 2 Sep with **set_french** to the manuscript weekday: «Mercredi 30 août 1876 (16 août)», «Jeudi 31 août 1876 (19 août)», «Vendredi 1er septembre 1876 (20 août)», «Samedi 2 septembre 1876 (21 août)». «(16 août)» on 30 Aug is what the docx and the print have (Marie's slip for 18 août); it is not corrected. |
| 065.0035, 0066, 0083, 0111, 0154, 0170, 0184 | invented or duplicate | **dropped** (reason in the plan) |

The kept old headings keep their comma form («Jeudi, 17 août 1876»); new entries get the manuscript form without the comma through `heading`. See owner question 3.

**Other drops:** 065.0205 duplicates 065.0203 (the sentence at ¶275 was extracted twice across a file boundary).

**Split paragraph across the old carnet boundary:** docx ¶351 is 065.0284 (first half) + 066.0002 (second half). Both now sit next to each other in 1876-08-21. They are left as two paragraphs, and no text is missing. The draft tool proposes a `set_french` on 066.0002; that is wrong, because it would duplicate 065.0284.

**Empty day:** 19 August (¶100 is followed directly by ¶101 «Dimanche 20 août»). 065.0021 is followed by a new «[Aucun texte - date seule mentionnée]». Old 065.0022–0023 (¶97–99) are 18 August text and move there.

**Copied letter.** 065.0040–0041 («J'arrive à Poltava…» / «Marie Bashkirtseff.») are the letter Marie writes to her father from the hotel. The print sets it in from both margins (p.8). They get kind `letter` and `> ` quoting via `set_french`, so there are SOURCE CHANGED notes in 4 trees.

**New-paragraph text:**
- The text is the exact docx text, one cluster per docx paragraph, with italic runs as `*…*`.
- The same minimal OCR normalisation as 068 is applied: `II!`→`!!!`, `I!`→`!!`, a trailing ` I]`→` !]`, and split years rejoined.
- Line-break hyphens are repaired: «Lève- toi»→«Lève-toi», «demi- mots»→«demi-mots», «c'est-à- dire»→«c'est-à-dire».
- New paragraphs carry no glossary tags, so run glossary-tagger afterwards.

**Kinds (new):**
- margin: ¶680, ¶769, ¶821 («[En travers…]», «[Dans la marge…]»).
- editorial: ¶849 «[page cancellée : p. 182 du manuscrit]» and ¶850 «[pages probablement arrachées : p. 183-184 du manuscrit]».
- ¶851 «1/ escaliers pour tenir son salon…» is Marie's text resuming after the torn pages, so it is plain.

**Cover page (¶71–76): withdrawn** (KRR 2026-09-28); the text is recorded under «Withdrawn cover pages». «19 août, Poltava, Gavronzi.» is a title-page line, not a date line; the draft tool wrongly took it for one.

**Frontmatter:** every entry uses the old 065 file of the same name (else the nearest earlier one), so `carnet: "065"` is kept for entries made of 066 clusters. Their entity lists describe the old invented-date content: rerun RSR/glossary-tagger.

## 3. Cross-carnet moves into 065 (all from 066)

The full per-ID list, with source file, target file and position, is in `plan-065.json` → `_cross_carnet` (166 rows).

| Old IDs (066) | Old files | → 065 entry |
|---|---|---|
| 066.0002–0007 | 1876-09-03.md | 1876-08-21.md, after 065.0284 (end of the entry) |
| 066.0001, 0008–0016, 0018–0045, 0047–0060, 0062–0070, 0072–0079, 0081–0103 | 1876-09-03 … 09-08.md | 1876-08-23.md (0001 is its heading) |
| 066.0104–0118, 0120–0128, 0130–0136, 0138–0155, 0157–0164, 0168–0173 | 1876-09-09 … 09-15.md | 1876-08-24.md (new ¶511–515 between 0164 and 0168; new ¶522–535 at the end) |
| 066.0046 / 0061 / 0071 / 0080 / 0165 | 1876-09-05/06/07/08/14.md | heading of 1876-08-25 / 26 / 27 / 28 / 29.md |

The seven 066 IDs dropped in this stretch are 0017, 0119, 0129, 0137, 0156, 0166 and 0167. Their reasons are in REVIEW-066 and they are listed in 066's `drop`.

## 4. Owner questions

1. **Old letters quoted.** 065.0040–0041 become `> ` blockquotes via `set_french`, per the 2026-09-27 decision. This adds SOURCE CHANGED notes; confirm.
2. **Weekday fixes on four reused headings** (065.0204/0226/0253/0263). The alternative is to drop them and let `heading` add fresh ones. Reuse keeps the translated heading IDs, and the translator only fixes the weekday.
3. **Heading style.** Old kept headings read «Jeudi, 17 août 1876 (5 août)» with a comma, new ones «Vendredi 25 août 1876 (13 août)». Normalise the old ones in a later pass?
4. **Flag reset:** 15 of 16 entries per tree lose their approval flags (every day gains, loses or moves paragraphs).

## 5. Gate results

See REVIEW-067 §7. The three plans were applied together in one worktree.

## 6. Differences from the draft tool (`draft/plan-065.json`)

- The draft keeps 8 heading/duplicate clusters that this plan drops (§2).
- The draft places 065.0220 in 20 Aug, because it took the short repeated line «C'est à prendre ou à laisser.» ¶134 as its home. Its real place is ¶290 (21–22 Aug), which is how this plan has it.
- The draft moves **068.0779** into 065/1876-08-29 («Moi ? Non, je n'ai pas remarqué.» ¶673). That is a false match: here ¶673 is a new paragraph.
- The draft proposes the wrong `set_french` on 066.0002, and builds a wrong cover from ¶73–75 (moot now that covers are withdrawn).
- New text: 313 of 319 texts are identical; the rest are grouping or OCR-repair differences.


## Withdrawn cover pages (for when the manuscript is available)

Owner decision KRR 2026-09-28: no cover entries until the manuscript is scanned (the printed edition does not show which lines are Marie's). Text as printed, Mon Journal t.9 p.5 (docx ¶71–76; OCR «Dfuke] off]» read from the print):

```
Gloriae Cupiditate
H[is] G[race] t[he] D[uke] o[f] H[amilton]
Livre 65ème
depuis le jeudi 17 août 1876
jusqu'au samedi 2 septembre 1876
Chpatovska
19 août, Poltava, Gavronzi.
```

### Old layout (16 files with IDs, 284 IDs)

| Old file | IDs |
|---|---|
| 1876-08-17.md | 14 |
| 1876-08-18.md | 6 |
| 1876-08-19.md | 3 |
| 1876-08-20.md | 11 |
| 1876-08-21.md | 31 |
| 1876-08-22.md | 17 |
| 1876-08-23.md | 28 |
| 1876-08-24.md | 16 |
| 1876-08-25-26.md | 27 |
| 1876-08-27.md | 16 |
| 1876-08-28.md | 14 |
| 1876-08-29.md | 20 |
| 1876-08-30.md | 22 |
| 1876-08-31.md | 27 |
| 1876-09-01.md | 10 |
| 1876-09-02.md | 22 |

### New layout (16 entries)

| New file | Heading | carried | moved in | new | new chars | set_french | kinds |
|---|---|---|---|---|---|---|---|
| 1876-08-17.md | Jeudi 17 août 1876 (5 août) | 14 | 0 | 0 | 0 |  | rayé×1 |
| 1876-08-18.md | Vendredi 18 août 1876 (6 août) | 8 | 0 | 0 | 0 |  |  |
| 1876-08-19.md | Samedi 19 août 1876 (7 août) | 1 | 0 | 1 | 37 |  |  |
| 1876-08-20.md | Dimanche 20 août 1876 (8 août) | 99 | 0 | 0 | 0 | 0040 0041 | margin×2, letter×2 |
| 1876-08-21.md | Lundi 21 août 1876 (9 août) et Mardi 22 août 1876 (10 août) | 150 | 6 | 0 | 0 |  |  |
| 1876-08-23.md | Mercredi 23 août 1876 (11 août) | 0 | 92 | 0 | 0 |  |  |
| 1876-08-24.md | Jeudi 24 août 1876 (12 août) | 0 | 63 | 18 | 3,981 |  |  |
| 1876-08-25.md | Vendredi 25 août 1876 (13 août) | 0 | 1 | 47 | 5,400 |  |  |
| 1876-08-26.md | Samedi 26 août 1876 (14 août) | 0 | 1 | 42 | 5,250 |  |  |
| 1876-08-27.md | Dimanche 27 août 1876 (15 août) | 0 | 1 | 17 | 2,614 |  |  |
| 1876-08-28.md | Lundi 28 août 1876 (16 août) | 0 | 1 | 12 | 2,037 |  |  |
| 1876-08-29.md | Mardi 29 août 1876 (17 août) | 0 | 1 | 65 | 10,200 |  | margin×1 |
| 1876-08-30.md | Mercredi 30 août 1876 (16 août) | 1 | 0 | 57 | 7,723 | 0204 | margin×1 |
| 1876-08-31.md | Jeudi 31 août 1876 (19 août) | 1 | 0 | 37 | 5,878 | 0226 | margin×1 |
| 1876-09-01.md | Vendredi 1er septembre 1876 (20 août) | 1 | 0 | 8 | 1,704 | 0253 |  |
| 1876-09-02.md | Samedi 2 septembre 1876 (21 août) | 1 | 0 | 14 | 3,176 | 0263 | editorial×2 |

Total new paragraphs: 318, 48,000 chars.

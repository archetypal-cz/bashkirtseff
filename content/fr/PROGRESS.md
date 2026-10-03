# French Modern Edition Progress

<!-- Last updated: 2026-10-03 -->
<!-- Updated by: fr-edition agent (FRE+REV), session 2026-10-03 -->

## Overview

| Metric | Value |
|--------|-------|
| **Total carnets** | 107 (000–106), all present in `content/fr/` |
| **Entry files** | 4,274 |
| **`edition_complete: true`** | 80 entries (003, 085, 087–091, 093, 097, 102); all others `false` |
| **`review_complete: true`** | 0 |
| **Paragraphs rendering identically to `_original`** | ~54,500 of ~54,600, the rest differing only by translated foreign passages (site-loader check, 2026-10-03) |

## How the edition is stored

- Since commit 905831d96 (2026-02-14), most fr paragraphs carry no visible text. The site shows their embedded `%% … %%` French copy instead (`src/frontend/src/lib/content.ts`, «French edition: the original text in comments IS the content»).
- A paragraph needs visible text only when the edition changes something: a translated foreign passage, a corrected transcription, or a repair. Visible text always overrides the embedded copy, so it must match the current `_original` apart from those FRE changes.

## Status (2026-10-03)

- **Foreign passages:** the translations listed in FRE notes are now in the text.
  - 694 paragraphs restored from the edition state of 2026-02-14 (905831d96^), matched by text.
  - 114 paragraphs translated fresh where the old edition never did it.
  - Commits run one per carnet, from `fix(fr): restore lost FRE translations in …` to `fix(fr): translate remaining foreign passages in …`.
- **Still open (owner/editor decision):** 9 doubtful foreign passages left untranslated: 018.0304, 018.0306, 018.0364, 029.0285, 029.0286, 039.0023, 052.0207, 054.0481, 066.0427. These are garbled Italian or Latin and an unclear English idiom. Details are in `~/rebuild-state/fr-scan-2026-10-03.md` and the session report.
- **Visible-text repairs:**
  - 290 paragraphs fixed: partial text, date heading only, English placeholder, or stale OCR.
  - 22 split heads in 068, 093 and 094 fixed.
  - 068 had a full pass (every paragraph now renders like `_original`).
- **SOURCE CHANGED:** all 1,411 rebuild-era ED notes are resolved. New ones can appear when `_original` is rebuilt.
- **Known display issue:** in 547 paragraphs the date heading inside the embedded copy is shown as a plain line. It will be fixed in the frontend.
- **Pending source check:** 082.0056 «télicieux / délicieux», with fix-source-2.

## Next steps

1. Full REV pass (`review_complete`) carnet by carnet: annotation consistency and translated footnotes (many `_original` footnotes are still in English).
2. Decide on the 9 doubtful foreign passages.
3. Set `edition_complete` per entry once a carnet's FRE pass is complete.

## How to Contribute

1. Read `content/fr/CLAUDE.md` (editorial rules: Marie's French verbatim, foreign passages translated, FRE/REV notes).
2. Check rendering against `_original` with the site loader, then run `just verify-carnet fr <c>` and `just splicescan fr <c>`.

---

_This file tracks French modern edition progress. Run `/project-status fr` for detailed status._

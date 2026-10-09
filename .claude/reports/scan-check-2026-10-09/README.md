# Scan check of carnets 001–044 against «Mon Journal» t.1–5 (2026-10-09)

Source: the searchable PDFs of the printed edition, `content/_raw/scans/Tome1..5.pdf` (committed 5d3329e005).
Tool: `just scan-compare N` (`src/scripts/scans/scan_vs_original.py`) aligns the scan text layer with `_original`.

## Pipeline and results

1. `just scan-compare 1 2 3 4 5` → 1,203 differences after dropping word splits/joins and page-top line repeats.
2. 173 «I/l/1 for !» in the scan dropped mechanically (scan error).
3. Sonnet 5.5 triaged the other 1,030 (`triage-brief.md`): 530 scan errors, 167 equivalent, 114 owner spelling calls, 81 fixes, 50 cover pages, 31 apparatus, 26 extra, 15 restore, 13 moved, 3 unsure.
4. Opus checked every proposed change plus 76 English-clipping rechecks (`check-brief.md`, `opus-checks-all.json`): page images, docx, `_original/_archive/raw_carnets`.
5. Applied: accents in 46 stripped lines (d9b4fd5c12), 93 inline source fixes (f12fa22e65), 030 slips (63acda81f1); carried into cz/uk/en/fr embeds, then into the visible translations.
6. Thin-page image check (`thin-pages.json`): three pages whose printed text is missing from BOTH the text layer and the docx — invisible to any text comparison.

## Files

- `open-checks.json` — items routed to the owner, to a placement decision or to new paragraphs (rebuild-carnet), with evidence and transcriptions.
- `thin-pages.json` — the image check of 39 thin pages; full transcriptions of the lost lines (T4 p.36 exact; T4 p.34 and T5 p.47 best-effort, blurred 75-dpi images).
- `owner-spelling.json` — 114 print-vs-_original spelling calls (OPEN-ITEMS A-53).
- `model-test/` — the Haiku 5.5 vs Sonnet 5.5 pilot: 72 stratified items, both outputs, the Opus reference (`gold-opus.json`, corrected on 6 items after review) and `score.py` (run from this folder: `python3 score.py sonnet haiku`). Result: Sonnet 67/68 with no harmful change; Haiku 64/68 with one harmful RESTORE (did not grep for text already elsewhere).

## Lessons

- The PDFs' text layer drops or repeats lines at page breaks and scatters text near drawings into page-foot fragments; the docx shares some of the losses. Check the page image before trusting either.
- `_original` holds a few unsourced "bridge" sentences where an earlier pass filled a printed gap (021.0382, 021.0214, 021.0086, 013.0052, 013.0239, 014.0050 clipping). Text in neither the print, the docx nor raw_carnets is suspect.
- Tomes 3–5 PDF page images are 75 dpi: fine for text, too blurred for a few faded pages.

# Scan-vs-_original triage (tomes 1–5, carnets 001–044)

You are triaging differences between two texts of Marie Bashkirtseff's diary:

- **scan**: the text layer of the printed edition «Mon Journal – texte intégral» (Cercle des amis de Marie Bashkirtseff, 1995–), `content/_raw/scans/TomeN.pdf`.
- **_original**: our French source, `content/_original/CCC/*.md` (one file per diary day; paragraphs start with `%% CCC.NNNN %%`; `%% … %%` lines are comments; `[^n]` are our own footnotes).

A script aligned the two as word streams (punctuation other than `!` `?` dropped; words lower-cased for matching) and listed every difference. **Some findings are alignment noise.** Your job: decide, for each item, what the difference really is and what (if anything) we should change in `_original`.

Input: `.cache/scan-compare/model-test/items.json` — a list of items with:
`item`, `tome`, `kind` (the script's guess: scan-only / original-only / word / bang-ocr / accent), `scan_page` (PDF page), `pid` (nearest _original paragraph), `original_file`, `scan_text` / `original_text` (the differing words, ⟦marked⟧ inside the `*_context` fields), `scan_text_in_docx` (does the older OCR docx `content/_raw/tomeNN.docx` contain the scan words; null = not checked).

**Look at the evidence** before you answer: open `original_file` around `pid` (Read/Grep), and where the context is not enough, read the scan page text, e.g.
`uv run --quiet --with pymupdf python -c "import pymupdf,sys;print(pymupdf.open('content/_raw/scans/Tome1.pdf')[PAGE-1].get_text())"` (PAGE = scan_page; neighbouring pages if the text crosses a page). The text may also sit elsewhere in _original (moved): Grep for a distinctive phrase across `content/_original/`.

## Project policies (owner rulings — apply them)

1. _original must contain ALL of Marie's own text, in manuscript order. Text the scan has and _original lacks, if it is Marie's, must be restored.
2. **Cover / title pages are NOT included**: blocks like «Carnet N° 3. Mon journal commencé le … terminé le … appartenant à Mlle Marie de …», «His Grace the Duke of Hamilton … Livre 36ème commencé le …». Exception: Marie's own notes on a title page that are diary content go in as a paragraph.
3. **Printed-edition footnotes stay out** (e.g. «1 Il s'agit de son anniversaire officiel…», «2 Office orthodoxe pour le défunt»). The editor's preface, index, running heads, page numbers, «sic» insertions by the editor are apparatus, not text to restore. Editorial bracketed notes that _original already carries as `kind: editorial` paragraphs are fine.
4. Struck-out words are kept as `[Rayé: …]`, blacked-out as `[Mots noircis : …]`, as in the print.
5. **Typos**: obvious typesetting/OCR slips are corrected (in either text). Marie's genuine spellings and slips (names spelled her way, e.g. «Audiffer» if the print has it, period spellings) are KEPT as printed. When _original deviates from the print, the print is the authority unless the _original reading is a documented correction (an `RSR:` comment near the paragraph says so).
6. OCR «I», «II», «l», «11» for «!» are known slips: «!» is right.

## Verdicts (pick exactly one)

- `RESTORE` — Marie's text is missing from _original; give the text to add and where (after which pid).
- `FIX_ORIGINAL` — _original has a wrong reading (typo, OCR slip, wrong word, missing accent, wrong spelling vs the print); give the corrected words.
- `SCAN_ERROR` — the scan text layer is wrong (OCR garbage, I/l for !, split letters); _original is right. No change.
- `APPARATUS` — printed footnote, preface, index, running head, editor's «sic», page number: stays out. No change.
- `COVER_PAGE` — cover/title-page block withdrawn by policy. No change.
- `MOVED` — the text exists in _original at another place (give the pid where you found it); say whether the placement looks deliberate (RSR comment) or wrong.
- `EQUIVALENT` — no real difference (alignment artefact, number formatting like 1er/1, punctuation, already documented in an RSR comment). No change.
- `ORIGINAL_EXTRA` — _original has text the print lacks; say whether it is legitimate (documented: RSR/editorial/kind) or should go.
- `UNSURE` — evidence insufficient; say what is needed.

## Output

Write a JSON list to the output path given in your task, one object per item, in item order:

```json
{"item": 1, "verdict": "FIX_ORIGINAL", "confidence": "high|medium|low",
 "fix": "exact replacement text or null", "where": "pid / file, or null",
 "reason": "one or two sentences: the evidence you used"}
```

Rules: **do not edit any file** except your output file. Do not run git. Judge every item; do not skip. Be concrete in `reason` (what you saw in which file/page). Accuracy matters more than speed; a wrong RESTORE or FIX_ORIGINAL is the most costly error, a missed real gap the second.

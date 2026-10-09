# Opus check — scan-vs-_original changes proposed by Sonnet (carnets 001–044)

You are the checking pass. Sonnet triaged differences between the printed edition «Mon Journal – texte intégral» (scan text layer, `content/_raw/scans/TomeN.pdf`) and our French source `content/_original/`. Read `.cache/scan-compare/full/BRIEF.md` first: it has the project policies (cover pages out, printed footnotes out, `[Rayé: …]` kept, Marie's spellings kept, print is the authority unless an RSR note documents a deviation) and the verdict definitions.

Your items: a slice of `.cache/scan-compare/full/check-items.json` (given in your task, by `check_no`). Each has the finding (`scan_context`, `original_context`, `pid`, `original_file`, `scan_page`, `tome`) and Sonnet's answer under `sonnet` (verdict, file/old/new/after_pid, reason). Items with a `recheck` field were marked SCAN_ERROR in a garbled English clipping: check whether the scan's clean word exposes a real slip in _original (precedent: «Town-ball» was a docx OCR slip for the print's «Town-hall»); most will be garbage.

## Evidence you must use

- The scan page **image**, not only its text layer, whenever a word is in doubt: render it, e.g. `uv run --quiet --with pymupdf python -c "import pymupdf;d=pymupdf.open('content/_raw/scans/Tome3.pdf');d[144].get_pixmap(dpi=150).save('/home/krr/.cache/scan-check/t3p145.png')"` (`mkdir -p ~/.cache/scan-check` first; page index = scan_page − 1), then Read the PNG. The text layer is known to drop/repeat lines at page breaks and to scatter text near drawings into page-foot fragments.
- The docx `content/_raw/tome0N.docx` (python-docx). It shares some OCR errors with the scan, so agreement of the two is not proof.
- `content/_original/_archive/raw_carnets/NN_carnet_raw.md`: another text conversion of the same edition (where most of _original came from). Text that _original has and the PDF lacks is legitimate if raw_carnets has it (the PDF lost a line) → keep it.
- Grep `content/_original/` for the phrase before accepting any RESTORE (moved text is never restored twice).

## For each item decide

- `CONFIRM` — Sonnet's change is right exactly as given.
- `AMEND` — a change is needed but different: give the corrected `old`/`new` (or `after_pid`).
- `REJECT` — no change (say why).
- For `MOVED`/`UNSURE`/`ORIGINAL_EXTRA`: decide `REJECT` (no change, placement/extra text is fine) or route it (below).

And classify what must happen (`route`):
- `inline` — an exact in-line replacement in `_original` (`old` is unique in `file`, the change stays within one paragraph's text lines; a `[Rayé: …]` insertion or a clause added inside an existing paragraph is inline).
- `new-paragraph` — needs a new paragraph (new ID): cannot be applied by hand, it goes to a `rebuild-carnet` plan; give the text and `after_pid`.
- `placement` — text in the wrong place/order (e.g. entries out of manuscript order): goes to the lead/owner; describe.
- `owner` — a policy question for the owner (describe the two options).
- `none` — nothing to do.

Never fact-correct Marie (her weekday slips, misnamings stay as printed). Changes are to her text as printed, not improvements.

## Output

Write a JSON list to the output path in your task, one object per item:
`{"check_no": n, "item": i, "decision": "CONFIRM|AMEND|REJECT", "route": "inline|new-paragraph|placement|owner|none", "file": …, "old": …, "new": …, "after_pid": …, "evidence": "what you looked at (page image / docx / raw_carnets / grep) and what it showed", "rsr_note": "for inline/new-paragraph: one-sentence RSR note to add, citing «Mon Journal» t.N, scan p.X"}`

For `inline`, verify yourself that `old` occurs exactly once in `file` (`grep -cF`). Do not edit any file except your output. No git.

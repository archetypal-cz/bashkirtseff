# Brief — strip process notes from `_original` (owner ruling 2026-10-22)

KRR 2026-10-22: «poznámky nechat jen výsledné, ne proces». The `%%` comments in `content/_original` keep
**results** (what a reader, translator or scholar needs to know about the text as it now stands) and lose
**process** (how the file got this way: extraction, rebuild, waves, reviews, tool runs). Copies of a removed
note in the trees (cz uk en fr es carry many RSR notes verbatim) go too.

## Delete (process)

- «Restored from tomeNN.docx ¶… (missing from original extraction, … rebuild)» and «French completed/corrected
  from tomeNN.docx …», «Accents restored …», «dialogue dash(es) restored …», «Heading suffix … restored»,
  «OCR «I»→«!» corrected …» when the text now matches the print.
- «Split (paragraph wave) …», «Re-cut (paragraph wave 2) …», «Split out of CCC.NNNN …», «Moved out of
  CCC.NNNN …», «ED: Dedup …», «ED: Paragraph kinds marked …», «Hashtags reorganized …», «Text set from the
  manuscript edition …», «The English placeholder … is replaced …», «SOURCE RESTORED: the English placeholder …».
- «Entry from Book N, raw carnet lines A-B.» / «Entry extracted from book N raw carnet, lines …» — the
  provenance sentence only; keep the rest of the line (summary, notes) as `RSR:` text. Drop the line if
  nothing else is left («Empty entry.» alone → drop).
- «footnote … revised / removed in the … review — …» history lines (the footnote as it stands is the result).
- «Larderei corrected to Larderel …» and similar normalisations where the text now matches the print.
- «fixed by rebuild …», «reworded 2026-10-22», «(2026-09-29 audit fix)» tails and similar process tails on
  otherwise useful notes: cut the tail, keep the note.

## Keep (results)

- Every note on a **deviation of our text from the printed edition or the manuscript**: «printed X corrected
  to Y», «[sic]», «so printed», «Bashkirseff → Bashkirtseff (print has …)», «PRESERVE-AS-WRITTEN», scan page
  references that justify a reading — keep the scan/page reference (it is the evidence), drop only the
  docx-paragraph/rebuild-date provenance if it adds nothing.
- Why an entry or day is empty («the date line … has no text under it»), clipping and letter provenance
  («Newspaper clipping pasted at the end of Livre 67, reproduced in facsimile …»), `kind:` lines.
- All RSR research, LAN, CORRECTION, NOTE, «Identity uncertain», source attributions of footnotes
  («source: en.wikipedia …», «per Kernberger (2013)», Gallica ids) — when a «footnote … added in the pull …;
  source: X» line mixes both, keep only «Footnote N source: X».
- KRR/owner rulings quoted in notes.

When unsure, keep. Never touch Marie's French, IDs, tag lines, footnote definitions, frontmatter.

## Method

1. Classify every `%%` comment in `_original` 000–106 with a script (patterns above) into delete / trim / keep /
   unsure; review a random 100 of each class by eye before applying; resolve «unsure» by hand.
2. Apply to `_original`; then remove (or trim identically) the exact same comment lines in the trees.
   A tree line that is the same note but already translated/edited stays unless it is pure process.
3. Gates per carnet and tree: `just verify-carnet LANG C` PASS, `just splicescan LANG C` empty,
   `just check-comments LANG` OK; `p6`-style check: visible text and all non-comment lines unchanged.
4. Report counts per class and per carnet; list kept «unsure» lines.

Rules: Python (never printf/echo/sed on `%%` lines); never git checkout/restore/stash/reset; no commits.
Don't edit `src/scripts/rebuild-plan/draft.py` — list it: it still emits «Restored from …» notes on rebuild.

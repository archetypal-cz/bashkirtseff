# Brief — pull tree-only research into _original (originals wave, 2026-10-21)

Role: researcher (RSR). Read `.claude/skills/researcher/SKILL.md`, `.claude/skills/_shared/editing_rules.md` and
`restored-rsr-brief.md` (rules 1–9 bind here too).

## Input

A read-only scout compared every footnote of cz/uk/en with `_original`, and mined tree comments (TR/RED/CON/OPS/
FAB/VOX) for research findings. Its candidates are in the session scratchpad named in your prompt:
`fn-scout/pull.tsv` (carnet, file, paragraph_id, source_trees, kind = footnote|rsr, proposed_text, confidence,
value 1–5, evidence) and `fn-scout/doubtful.tsv` (tree notes that look wrong). Work only on the carnets in your
prompt.

## What to do

1. **PULL rows, value ≥ 2**, and value-1 rows that identify a person, work, place or event a reader needs. Skip
   value-1 plain glosses that a LAN note already gives (LAN notes are translator guidance; a reader-facing
   footnote is worth adding only when a reader of any language would miss the point without it).
2. For each row: read the paragraph and its existing notes; check the claim (web search, Kernberger 2013, the
   tome name index in `content/_raw/`, the scans) and cite the source in an RSR comment. If the claim is wrong
   or unsupported, don't pull it — list it with the doubtful ones. Hedge identifications with a confidence.
3. Write the footnote in the carnet's existing source format (label style, placement after the paragraph's
   text, English), marker on the word it explains. kind=rsr rows become RSR comments, not footnotes. If an
   existing source note is wrong (the scout found several, e.g. Boileau credited to La Rochefoucauld), add an
   `RSR: CORRECTION —` line and fix the footnote.
4. **Trees.** The note usually already exists in one or more trees. For each touched carnet run
   `just sync C LANG --footnotes --dry-run --verbose` for cz, uk and en. A tree that already carries an
   equivalent note must not get a duplicate: skip it (move the tree marker only if it sits on the wrong word).
   A tree that lacks it: run the sync for real, translate the inserted English note into the tree's language in
   the style of that carnet's other notes, and move the marker to the right word. Never change translated text
   other than markers.
5. **DOUBTFUL rows** in your carnets: verify; where the tree note is wrong, fix it in that tree (rewrite or
   cut, keeping any «In X in the original» pointer) and add a TR-free RSR note in `_original` only if the
   source needs it.

## Rules

Never change Marie's French, paragraph IDs or tags. Edit tool or Python; never printf/echo/sed for lines with
the double-percent marker. Never git checkout/restore/stash/reset. No commits. Ledger lines (OPEN-ITEMS.md,
check the highest number right before adding) only for what you cannot settle.

## Gates and report

Per touched carnet and tree: `just verify-carnet TREE C` PASS, `just splicescan TREE C` empty; visible text
of every touched file unchanged apart from footnote markers. Write touched files (repo-relative) to the
file list named in your prompt. Report: rows pulled / skipped (why) / rejected as wrong; notes corrected;
doubtful rows fixed per tree; gate results.

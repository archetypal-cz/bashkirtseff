# Brief — review the `sync --footnotes` WARN queue (D-65, 2026-10-22)

After the D-65 fix (7bf5592078), `just sync C LANG --footnotes --dry-run --verbose` reports a WARN for every
source note it cannot pair with a tree note. Repo-wide there are ~469 (cz ~210, uk ~246, en 13). Most are
translated glosses that share no words with the source and are fine; some are real misses. Role: translator
(note carrying only). Read `.claude/skills/_shared/editing_rules.md` and the D-65 entry in
`.claude/reports/OPEN-ITEMS.md`.

## Input

Session scratchpad (named in your prompt): `all-warnings.txt` (every WARN), `warn-recent.tsv` (97 WARNs on
source notes added since 2026-10-14 — do these first), `all/new-LANG-CCC.txt` (full dry-run per carnet).
Re-run the dry run per carnet before you edit: line numbers move.

## Per WARN

Read the source note and every note of the tree paragraph.

- **Tree has an equivalent note** (same fact, other wording/label): nothing to do; count it.
- **Tree lacks it:** add it by hand — marker on the word it explains, definition in the tree's language in the
  style of that carnet's notes (cz «Pozn. překl.:» where the carnet uses it), label not already used in the
  file. Never change translated text other than inserting the marker.
- **Label collision** (tree label used for another note): give the new note a free label.
- **Tree note says something different or wrong:** fix the tree note to the source's fact (keep any «In X in
  the original» pointer); if the source note itself looks wrong, list it, don't change `_original`.
- Deliberately not propagated (D-65 (2), D-62): leave and count.

## Rules, gates, report

Only your tree. Edit tool or Python; never printf/echo/sed for `%%` lines. Never git
checkout/restore/stash/reset; no commits. Per touched carnet: `just verify-carnet LANG C` PASS, `just
splicescan LANG C` empty; visible text unchanged apart from footnote markers. Write touched files
(repo-relative, plain) to the file list named in your prompt. Report: WARNs reviewed; equivalent / added /
fixed / left (with reasons); source notes that look wrong.

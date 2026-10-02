# Split wave, tome 12 (081–084), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-081.json`, `plan-082.json`, `plan-083.json`, `plan-084.json` here.
Maps: `content/_renumber/081-2026-10-02-2.json`, `content/_renumber/082-2026-10-02-2.json`, `content/_renumber/083-2026-10-02.json`, `content/_renumber/084-2026-10-02-2.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 081 | 23 | 67 | 081.0663 |
| 082 | 6 | 8 | 082.0636 |
| 083 | 2 | 9 | 083.0587 |
| 084 | 1 | 1 | 084.0752 |
| **total** | **32** | **85** | |

## Translations

Mechanical distribution (flags kept) for 87 tree-groups. Left for the drivers (todo IDs / reset entries): cz 11 / 3, uk 27 / 2, en 4 / 2, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Footnotes: 082/1878-08-25 had an old short-form label ([^82.174.1]) in a split piece; fnwave now renames short labels too (only to a label defined in the file).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 081, 082, 083, 084: PASS / OK; `splicescan` empty.

# Split wave, tome 8 (060–063), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-060.json`, `plan-062.json`, `plan-063.json` here.
Maps: `content/_renumber/060-2026-10-02.json`, `content/_renumber/062-2026-10-02-2.json`, `content/_renumber/063-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 060 | 3 | 3 | 060.0970 |
| 062 | 3 | 18 | 062.0895 |
| 063 | 2 | 2 | 063.0783 |
| **total** | **8** | **23** | |

## Translations

Mechanical distribution (flags kept) for 21 tree-groups. Left for the drivers (todo IDs / reset entries): cz 0 / 0, uk 0 / 0, en 21 / 1, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 060, 062, 063: PASS / OK; `splicescan` empty.

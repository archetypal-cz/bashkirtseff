# Split wave, tome 6 (045–052), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-045.json`, `plan-046.json`, `plan-051.json` here.
Maps: `content/_renumber/045-2026-10-02.json`, `content/_renumber/046-2026-10-02.json`, `content/_renumber/051-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 048, 050, 052 | 0 (no confirmed points) | 0 | unchanged |
| 045 | 48 | 130 | 045.0488 |
| 046 | 24 | 81 | 046.0394 |
| 051 | 5 | 9 | 051.0480 |
| **total** | **77** | **220** | |

## Translations

Mechanical distribution (flags kept) for 178 tree-groups. Left for the drivers (todo IDs / reset entries): cz 135 / 10, uk 8 / 3, en 26 / 9, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 045, 046, 051: PASS / OK; `splicescan` empty.

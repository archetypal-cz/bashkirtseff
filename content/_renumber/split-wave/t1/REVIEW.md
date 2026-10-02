# Split wave, tome 1 (001–007), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-002.json`, `plan-003.json` here.
Maps: `content/_renumber/001-2026-10-02.json`, `content/_renumber/002-2026-10-02.json`, `content/_renumber/003-2026-10-02.json`, `content/_renumber/004-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 001, 004, 005, 006, 007 | 0 (no confirmed points) | 0 | renumbered where comment-only IDs were folded |
| 002 | 2 | 8 | 002.0306 |
| 003 | 10 | 10 | 003.0313 |
| **total** | **12** | **18** | |

## Translations

Mechanical distribution (flags kept) for 36 tree-groups. Left for the drivers (todo IDs / reset entries): cz 0 / 0, uk 0 / 0, en 0 / 0, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Comment-only IDs folded: 43 (001: 2, 002: 24, 003: 13, 004: 4). Each was dropped (plan `drop`, reason in the map); its RSR comments and tag lines moved to the end of the last real paragraph of its entry, its other lines (role notes, footnote definitions) to the end of that paragraph's cluster, in every tree. References to a folded ID were pointed at that paragraph before the rebuild. Approval flags restored from HEAD in fold-only entries. Tags moved: 13 (listed for the tag audit in ~/rebuild-state/split-wave/folded-tags-CCC.json, keyed by the new paragraph ID).

Not folded: 004.0054 (1873-04-17) — the en tree holds a translated paragraph there («Mais le sujet qui m'a tant préoccupée…») whose French is not in _original at all; left for a source check.

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 002, 003: PASS / OK; `splicescan` empty.

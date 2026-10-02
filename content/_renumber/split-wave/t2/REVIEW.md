# Split wave, tome 2 (008–014), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-008.json`, `plan-009.json`, `plan-010.json` here.
Maps: `content/_renumber/008-2026-10-02.json`, `content/_renumber/009-2026-10-02.json`, `content/_renumber/010-2026-10-02.json`, `content/_renumber/011-2026-10-02.json`, `content/_renumber/012-2026-10-02.json`, `content/_renumber/013-2026-10-02.json`, `content/_renumber/014-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 011, 012, 013, 014 | 0 (no confirmed points) | 0 | renumbered where comment-only IDs were folded |
| 008 | 1 | 1 | 008.0309 |
| 009 | 2 | 8 | 009.0317 |
| 010 | 1 | 1 | 010.0441 |
| **total** | **4** | **10** | |

## Translations

Mechanical distribution (flags kept) for 10 tree-groups. Left for the drivers (todo IDs / reset entries): cz 4 / 1, uk 0 / 0, en 8 / 3, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Comment-only IDs folded: 125 (008: 18, 009: 20, 010: 21, 011: 17, 012: 18, 013: 13, 014: 18). Each was dropped (plan `drop`, reason in the map); its RSR comments and tag lines moved to the end of the last real paragraph of its entry, its other lines (role notes, footnote definitions) to the end of that paragraph's cluster, in every tree. References to a folded ID were pointed at that paragraph before the rebuild. Approval flags restored from HEAD in fold-only entries. Tags moved: 8 (listed for the tag audit in ~/rebuild-state/split-wave/folded-tags-CCC.json, keyed by the new paragraph ID).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 008, 009, 010: PASS / OK; `splicescan` empty.

# Split wave, tome 5 (031–044), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-033.json`, `plan-034.json`, `plan-039.json` here.
Maps: `content/_renumber/033-2026-10-02.json`, `content/_renumber/034-2026-10-02.json`, `content/_renumber/035-2026-10-02.json`, `content/_renumber/037-2026-10-02.json`, `content/_renumber/038-2026-10-02.json`, `content/_renumber/039-2026-10-02.json`, `content/_renumber/040-2026-10-02.json`, `content/_renumber/041-2026-10-02.json`, `content/_renumber/042-2026-10-02.json`, `content/_renumber/043-2026-10-02.json`, `content/_renumber/044-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 031, 032, 035, 036, 037, 038, 040, 041, 042, 043, 044 | 0 (no confirmed points) | 0 | renumbered where comment-only IDs were folded |
| 033 | 2 | 2 | 033.0535 |
| 034 | 1 | 1 | 034.0604 |
| 039 | 1 | 1 | 039.0268 |
| **total** | **4** | **4** | |

## Translations

Mechanical distribution (flags kept) for 7 tree-groups. Left for the drivers (todo IDs / reset entries): cz 6 / 2, uk 0 / 0, en 4 / 1, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Comment-only IDs folded: 210 (033: 21, 034: 40, 035: 6, 037: 18, 038: 30, 039: 40, 040: 20, 041: 12, 042: 9, 043: 9, 044: 5). Each was dropped (plan `drop`, reason in the map); its RSR comments and tag lines moved to the end of the last real paragraph of its entry, its other lines (role notes, footnote definitions) to the end of that paragraph's cluster, in every tree. References to a folded ID were pointed at that paragraph before the rebuild. Approval flags restored from HEAD in fold-only entries. Tags moved: 0 (listed for the tag audit in ~/rebuild-state/split-wave/folded-tags-CCC.json, keyed by the new paragraph ID).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 033, 034, 039: PASS / OK; `splicescan` empty.

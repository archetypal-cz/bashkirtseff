# Split wave, tome 4 (021–030), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-023.json`, `plan-027.json`, `plan-028.json`, `plan-029.json` here.
Maps: `content/_renumber/022-2026-10-02.json`, `content/_renumber/023-2026-10-02.json`, `content/_renumber/027-2026-10-02.json`, `content/_renumber/028-2026-10-02.json`, `content/_renumber/029-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 021, 022, 024, 025, 026, 030 | 0 (no confirmed points) | 0 | renumbered where comment-only IDs were folded |
| 023 | 24 | 399 | 023.0674 |
| 027 | 13 | 17 | 027.0414 |
| 028 | 5 | 7 | 028.0286 |
| 029 | 8 | 123 | 029.0352 |
| **total** | **50** | **546** | |

## Translations

Mechanical distribution (flags kept) for 98 tree-groups. Left for the drivers (todo IDs / reset entries): cz 207 / 16, uk 212 / 10, en 362 / 20, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Comment-only IDs folded: 23 (022: 11, 023: 12). Each was dropped (plan `drop`, reason in the map); its RSR comments and tag lines moved to the end of the last real paragraph of its entry, its other lines (role notes, footnote definitions) to the end of that paragraph's cluster, in every tree. References to a folded ID were pointed at that paragraph before the rebuild. Approval flags restored from HEAD in fold-only entries. Tags moved: 0 (listed for the tag audit in ~/rebuild-state/split-wave/folded-tags-CCC.json, keyed by the new paragraph ID).

Footnotes: ★ labels of the form [^CCC.NNNN.rK] in split pieces are renamed too (027/1874-12-02).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 023, 027, 028, 029: PASS / OK; `splicescan` empty.

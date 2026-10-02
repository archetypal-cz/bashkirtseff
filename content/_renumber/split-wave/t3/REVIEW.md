# Split wave, tome 3 (016–020), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans:  here.
Maps: `content/_renumber/016-2026-10-02.json`, `content/_renumber/019-2026-10-02.json`, `content/_renumber/020-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 016, 017, 018, 019, 020 | 0 (no confirmed points) | 0 | renumbered where comment-only IDs were folded |
| **total** | **0** | **0** | |

## Translations

Mechanical distribution (flags kept) for 0 tree-groups. Left for the drivers (todo IDs / reset entries): cz 0 / 0, uk 0 / 0, en 0 / 0, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Comment-only IDs folded: 54 (016: 2, 019: 20, 020: 32). Each was dropped (plan `drop`, reason in the map); its RSR comments and tag lines moved to the end of the last real paragraph of its entry, its other lines (role notes, footnote definitions) to the end of that paragraph's cluster, in every tree. References to a folded ID were pointed at that paragraph before the rebuild. Approval flags restored from HEAD in fold-only entries. Tags moved: 0 (listed for the tag audit in ~/rebuild-state/split-wave/folded-tags-CCC.json, keyed by the new paragraph ID).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × : PASS / OK; `splicescan` empty.

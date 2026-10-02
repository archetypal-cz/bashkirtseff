# Split wave, tome 10 (069–073), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-069.json`, `plan-072.json` here.
Maps: `content/_renumber/069-2026-10-02.json`, `content/_renumber/072-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 070, 071, 073 | 0 (no confirmed points) | 0 | unchanged |
| 069 | 8 | 8 | 069.0725 |
| 072 | 1 | 1 | 072.0579 |
| **total** | **9** | **9** | |

## Translations

Mechanical distribution (flags kept) for 13 tree-groups. Left for the drivers (todo IDs / reset entries): cz 16 / 5, uk 0 / 0, en 12 / 3, fr 0 / 0.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

Comment-only IDs folded (072): 20 IDs dropped (old RSR entry summaries / tag-only placeholders); their comments and tags moved to the last real paragraph of the entry in every tree; approval flags restored from HEAD in 80 fold-only tree files. Moved tags (072.0338: Antonelli, Alexandre, Marcuard) are listed for the tag audit in ~/rebuild-state/split-wave/folded-tags-072.json.

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 069, 072: PASS / OK; `splicescan` empty.

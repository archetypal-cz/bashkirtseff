# Split wave: second fold pass (comment-only IDs holding footnote definitions), 2026-10-02

The first fold pass treated a footnote definition as visible text, so 43 comment-only IDs (old RSR entry summaries
with footnote definitions at the end of the entry) were not folded; wave-cz saw them as id-alignment warnings.
This pass folds them by the same rule (docs/REBUILD_CARNET.md), in every tree including the es pilot:

| carnet | folded |
|---|---|
| 001 | 13 |
| 004 | 1 (004.0067 before this pass; wave-en had removed an invented en paragraph there, c285b5ffc) |
| 008 | 1 |
| 009 | 2 |
| 012 | 2 |
| 013 | 5 |
| 014 | 5 |
| 016 | 1 |
| 019 | 9 |
| 020 | 4 |

- Footnote definitions go to the cluster whose text references them (else to the end of the target).
- RSR comments and tags go to the last real paragraph of the entry; moved tags (001: 7, 004: 2) are listed for the
  tag audit in ~/rebuild-state/split-wave/folded-tags-001.json / -004.json.
- uk/004/1873-04-18: a stray embedded copy of the 1873-04-23 margin note sat in the folded cluster; removed with an
  ED note.
- Approval flags restored from HEAD in fold-only entries; nothing else in the entries changed.
- Plans here (`plan-CCC.json`); maps `content/_renumber/CCC-2026-10-02*.json` (the newest of the day).

Gates (on main, identical to the worktree validation): rebuild-carnet renumber-check PASS for all 10 carnets;
verify-carnet, check-links, splicescan on _original/cz/uk/en/fr/es: PASS.

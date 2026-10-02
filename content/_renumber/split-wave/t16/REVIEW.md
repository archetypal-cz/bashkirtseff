# Split wave, tome 16 (101–106), 2026-10-02

Multi-paragraph split wave (rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave"). One ID that held several
printed paragraphs now has one ID per printed paragraph. Confirmed split points only (docx paragraph breaks + scan
indentation); scan-flush and unsure points, MIXED clusters, letters and clippings are not split.

Plans: `plan-1NN.json` here (identity plan + `set_french` on the head + one `new` paragraph per further piece).
Maps: `content/_renumber/101-2026-10-02.json`, `102-2026-10-02-2.json`, `103…106-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 101 | 2 | 5 | 101.0636 |
| 102 | 59 | 533 | 102.0684 |
| 103 | 56 | 69 | 103.0779 |
| 104 | 5 | 5 | 104.0762 |
| 105 | 5 | 22 | 105.0782 |
| 106 | 4 | 7 | 106.0194 |
| **total** | **131** | **641** | |

## Translations

Where a tree's translation of a split paragraph had as many lines as the French pieces together, the lines were
distributed over the pieces unchanged, with an `ED: paragraph split into …` note (check the split points), and the
entry's approval flags were restored from HEAD. Otherwise the tree keeps `TODO` + `SOURCE CHANGED` under the new
IDs (the old translation still under the head) and the entry's flags are reset:

| tree | todo IDs | reset entries |
|---|---|---|
| cz | 436 | 35 |
| uk | 546 | 54 |
| en | 430 | 34 |
| fr | 1 (101.0497, visible fr text) | 0 |

Most of it is 102, whose paragraphs were very long. Footnote labels in split pieces were renamed to the relabelled
definitions with the run's map.

## Gates (on main)

- Result identical (timestamps aside) to the validation run in a detached worktree at 1fea9cab1.
- `renumber-check`: PASS 101–106 (7 WARNs about dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet` _original, cz, uk, en, fr × 101–106: PASS, 0 fail, 0 warn (30/30).
- `splicescan` cz, uk, en, fr × 101–106: empty.
- `check-links` _original, cz, uk, en, fr × 101–106: OK.
- Cross-references rewritten outside the carnets: 23 glossary files, cz/083/1879-01-02.md, fr manifests (ID-only changes).

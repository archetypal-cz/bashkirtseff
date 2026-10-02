# Split wave, tome 9 (066–068), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-067.json`, `plan-068.json` here.
Maps: `content/_renumber/067-2026-10-02.json`, `content/_renumber/068-2026-10-02.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 066 | 0 (no confirmed points) | 0 | unchanged |
| 067 | 54 | 247 | 067.1610 |
| 068 | 67 | 345 | 068.1645 |
| **total** | **121** | **592** | |

## Translations

Mechanical distribution (flags kept) for 392 tree-groups. Left for the drivers (todo IDs / reset entries): cz 0 / 0, uk 0 / 0, en 4 / 1, fr 20 / 0.
fr heads left with SOURCE CHANGED (visible fr text does not match the pieces): 068.0271: 2 translation lines vs 12 French lines — left TODO; 068.0284: 1 translation lines vs 3 French lines — left TODO; 068.0288: 3 translation lines vs 4 French lines — left TODO; 068.0449: 1 translation lines vs 2 French lines — left TODO; 068.0452: 1 translation lines vs 2 French lines — left TODO; 068.0456: 1 translation lines vs 7 French lines — left TODO; 068.0465: 1 translation lines vs 5 French lines — left TODO; 068.0482: 1 translation lines vs 2 French lines — left TODO; 068.0489: 1 translation lines vs 67 French lines — left TODO; 068.0587: 1 translation lines vs 2 French lines — left TODO; 068.0591: 1 translation lines vs 5 French lines — left TODO; 068.0605: 1 translation lines vs 7 French lines — left TODO; 068.0621: 1 translation lines vs 2 French lines — left TODO; 068.0624: 1 translation lines vs 11 French lines — left TODO; 068.0642: 1 translation lines vs 21 French lines — left TODO; 068.0669: 1 translation lines vs 5 French lines — left TODO; 068.0674: 1 translation lines vs 10 French lines — left TODO; 068.0694: 1 translation lines vs 6 French lines — left TODO; 068.0699: 1 translation lines vs 16 French lines — left TODO; 068.0723: 1 translation lines vs 2 French lines — left TODO.
fr: pieces of heads that render no text render nothing; visible piece lines carry no footnote refs the fr file cannot resolve (split-wave fixfr).

fr: 068 heads with visible fr text that does not match the French pieces keep SOURCE CHANGED (20 IDs, fr edition owner).

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (any warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 067, 068: PASS / OK; `splicescan` empty.

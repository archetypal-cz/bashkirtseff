# Split wave, tome 15 (097–100), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-099.json`, `plan-100.json` here.
Maps: `content/_renumber/099-2026-10-02-2.json`, `100-2026-10-02-2.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 097, 098 | 0 (survey has only unconfirmed/MIXED points there) | 0 | unchanged |
| 099 | 16 | 170 | 099.0605 |
| 100 | 31 | 131 | 100.0467 |

Left for later: 100.0001 (its text has 23 lines now against 22 at the survey).

## Translations

Mechanical distribution (flags kept) for 138 tree-groups. Left for the drivers (todo IDs / reset entries):
cz 7 / 1 (099.0577), uk 0 / 0, en 11 / 2 (100.0008, 100.0351), fr 0 / 0.

fr edition: a split piece shows visible French only when its head does (the rebuild gave every new piece of a fr
carnet with visible text the French verbatim; 337 such lines in 099–100 were removed, embedded copies kept; same for
one line of fr/101/1883-09-21 from tome 16). Heads that render only their heading count as rendering nothing; their SOURCE CHANGED note was removed.

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree at 9a9e5101a.
- `renumber-check` PASS (warnings: dropped-paragraph references in old comments, 31 in 099, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 099–100: PASS / OK; `splicescan` empty.

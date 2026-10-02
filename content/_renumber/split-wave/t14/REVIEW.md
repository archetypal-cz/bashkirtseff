# Split wave, tome 14 (090–094), 2026-10-02

Rule: docs/REBUILD_CARNET.md → "Multi-paragraph split wave". Plans: `plan-093.json`, `plan-094.json` here.
Maps: `content/_renumber/093-2026-10-02.json`, `094-2026-10-02-2.json`.

| carnet | clusters split | new IDs | last ID |
|---|---|---|---|
| 090, 091, 092 | 0 (no confirmed points) | 0 | unchanged |
| 093 | 45 | 265 | 093.0400 |
| 094 | 16 | 70 | 094.0468 |

## Translations

Mechanical distribution (flags kept) for 168 tree-groups. Left for the drivers (todo IDs / reset entries):
cz 52 / 11, uk 0 / 0, en 24 / 4. fr: 093.0154 and 094.0058 keep a SOURCE CHANGED note — their visible fr text is an
older, shorter reading of the first piece only; the pieces show the French verbatim.

fr: pieces of heads that render no text render nothing (318 lines); a visible piece line lost one footnote reference
the fr file has no definition for (fr/093/1881-10-02, Cartuja note; fr shows no source footnotes).

`set_french drops footnote marker(s)` warnings for 093.0051/0058/0059: the markers moved with their text into the
new pieces; the definitions stay in the same file and resolve.

## Gates (on main)

- Identical (timestamps aside) to the validation run in a detached worktree.
- `renumber-check` PASS (warnings: dropped-paragraph references in old comments, present at HEAD).
- `verify-carnet`, `check-links` _original/cz/uk/en/fr × 093–094: PASS / OK; `splicescan` empty.

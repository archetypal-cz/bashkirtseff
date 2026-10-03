# Split wave 2, batch A (019 023 045 052 067 070 099 100 102 104), 2026-10-03

Second pass of the split wave (owner GO 2026-10-03): the survey points the first wave left out (unresolved, flush, MIXED clusters, 100.0001) were verified on the scans (tomes 6–16: scan text layer, first-line indent and previous-line ending; crops checked by eye where unclear) or on the docx (tomes 1–5). Rule: in this edition a prose paragraph starts with an indent; dialogue-dash and editorial-bracket lines on their own line are paragraphs too. Ambiguous points are listed for the owner (~/rebuild-state/split-wave/owner-list.md), not split.

Each affected run of clusters (the survey cluster: head + its wave-1 pieces) is re-cut to the verified paragraphs in one rebuild-carnet run per carnet (plans here; tool: ~/rebuild-state/split-wave/verify/recut.py). Mid-line cuts split one _original line in two.

| survey cluster | carnet | IDs | new cut points (line) | cuts undone | mid-line cuts |
|---|---|---|---|---|---|
| 019.0105 | 019 | 1 → 2 | 1 | — | 0 |
| 023.0246 | 023 | 21 → 23 | 14, 20 | — | 0 |
| 023.0256 | 023 | 14 → 15 | 9 | — | 0 |
| 023.0262 | 023 | 15 → 16 | 3 | — | 0 |
| 045.0103 | 045 | 3 → 4 | 1 | — | 0 |
| 052.0404 | 052 | 1 → 2 | 1 | — | 0 |
| 067.1116 | 067 | 17 → 25 | 7, 8, 9, 10, 15, 20, 21, 22 | — | 0 |
| 067.1198 | 067 | 6 → 7 | 6 | — | 0 |
| 070.0196 | 070 | 1 → 5 | 1 | — | 3 |
| 099.0395 | 099 | 1 → 16 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14 | — | 2 |
| 099.0396 | 099 | 1 → 9 | 1, 2, 3, 6, 7, 9, 10 | — | 1 |
| 100.0001 | 100 | 1 → 20 | 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21 | — | 0 |
| 100.0002 | 100 | 1 → 14 | 1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 15, 16 | — | 1 |
| 100.0003 | 100 | 1 → 6 | 2, 7, 9, 10, 12 | — | 0 |
| 100.0093 | 100 | 1 → 3 | 5 | — | 1 |
| 100.0120 | 100 | 1 → 4 | 1, 2 | — | 1 |
| 100.0191 | 100 | 1 → 19 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | — | 2 |
| 100.0192 | 100 | 1 → 28 | 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31 | — | 1 |
| 102.0051 | 102 | 10 → 11 | 11 | — | 0 |
| 102.0060 | 102 | 42 → 45 | 21, 33, 34 | — | 0 |
| 104.0009 | 104 | 1 → 3 | 1 | — | 1 |
| 070.0206 | 070 | 1 → 2 | — | — | 1 |

## Translations

The translation lines of each run were taken out before the rebuild and put back after it: by line where the tree has one line per French line (a piece that starts mid-line gets TODO and the piece before it a «trim» note), else by segment where line counts match, else under the first piece with TODO on the rest. Driver lists: ~/rebuild-state/split-wave/tomew2a-<lang>.md. Totals (todo IDs / reset entries): cz 67 todo IDs, 10 reset entries; uk 58 todo IDs, 11 reset entries; en 57 todo IDs, 10 reset entries; fr 1 todo IDs, 0 reset entries.

## Gates (on main)

rebuild-carnet renumber-check PASS; verify-carnet, check-links, splicescan × _original/cz/uk/en/fr/es: PASS. Renumber SQL from the deploy-ledger generator.

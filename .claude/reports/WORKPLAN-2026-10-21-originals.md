# Work plan — started 2026-10-21 (originals first)

Owner priority (KRR, 2026-10-21): bring `_original` into perfect order — research (RSR), linguistic
notes (LAN), tags, glossary. Translation sweeps come second.

## Reset incident (2026-10-21 ~08:30)

The checkout was 157 commits behind origin/main (origin work 10-06..10-11: cz FAB 078–106, uk D-sweeps,
the rebuild of 008/021/030/037, glossary merges/moves, works entries). This morning's waves partly duplicated
that work. With owner approval, main was reset to origin/main. Everything local is kept on branch
`backup/local-2026-10-21` (tip 441e9a4014 = the WIP state). Duplicates dropped: cz FAB 078–083 + WIP 081,
uk D-26 part. Unique work re-applied:

| Local | Re-applied as |
|---|---|
| bb8dee56a5 Russian passages 002 (B-02) | e296edcea7 (ledger C-11 → C-17) |
| b489454bdc A-17/A-18 + uk TM | 55d5eea0e9 (D-30/D-31 → D-45/D-46) |
| b6760023a9 C-03 legacy lines | 5ea699dc45 (tree leftovers → D-47) |
| 45ccd3189e entities-sync tool | 41e373bdf3 |
| a5328944dd C-01/02/07/08 source notes | a96355de6d |
| 6986bd15a2 cz/en/fr footnote carry | re-applied (A-04 prefix dropped in 102) |
| 424b0699b4 034 RSR+LAN | 2784066a10 (tags → origin's works entries) |
| bf173d3746 entities frontmatter | regenerated on origin: 9d369be094 |
| 07edd69ba4 uk sweeps | D-45/D-46 re-run on origin (agent uk-redo) |
| WIP 037 RSR+LAN | rebased onto renumbered 037 (agent rebase-037) |

## Baseline audit (pre-reset counts; recount on origin)

- ~6,000 "bare" restored paragraphs (~218k words): text restored in the 2026-09-28 rebuild that carries
  only a `Restored from tomeNN.docx ¶…` note, with no research and no LAN. Biggest: 067, 070, 066, 059,
  071, 050, 086, 035, 063, 037, 034, 083, 041, 065.

## Track O — originals annotation wave (TOP PRIORITY)

Binding briefs: `.claude/reports/briefs/restored-{rsr,lan}-brief.md` (from the 034 pilot review).
Models: RSR Opus; LAN Sonnet with a density cap; Opus spot review ~1 carnet in 10.
Per carnet: RSR → LAN → `just entities-sync --carnet C --apply` → gates → commit.

| Carnet | bare | status |
|---|---|---|
| 034 | 181 | done 2784066a10 |
| 037 | 185 | rebasing onto origin + review |
| next | | 035, 041, then by size |

## Follow-ups

- Tag candidates from entities-sync (scratchpad entities-tag-candidates-v2.tsv, 1,019) → glossary-tagger review.
- uk carry of the source-note fixes (agent uk-redo), then tick C-01/C-02/C-07/C-08.
- Ledger: re-add the session's new items under origin's numbering (A-61+, B-15+, C-18+, D-48+),
  after checking each against origin's text (cz FAB-found issues may already be fixed by origin's 10-10 pass).

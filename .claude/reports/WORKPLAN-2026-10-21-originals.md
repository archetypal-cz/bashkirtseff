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
| WIP 037 RSR+LAN | rebased onto renumbered 037: b9333d26ce |

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
| 037 | 185 | done b9333d26ce (Opus review: 46 LAN filler deleted, ~140 trimmed/corrected) |
| 035 | 203 | done cc40ffe5d1 (RSR 52 notes; LAN 99) |
| 041 | 163 | done d2ccea3c49 (RSR 31 notes; LAN 56, capped brief works) |
| 050 | 215 | done (RSR 51 notes, 22 tags; LAN 76) |
| 067 | 668 | split a/b/c (230/251/187, by file); 067a RSR done (101 notes, t.9 index) → LAN running; 067b RSR done (60 notes, 2 locations fixed) → LAN running; 067c RSR running. Commit 067 as one carnet when all three parts pass. Needs footnote at 067.0047 (Poltava date, Marie's «21 juin 1709» vs 27 June O.S.) |
| 063 | 201 | done 638820f748 (RSR 46 notes, 30 tags; LAN 81) |
| 059 | 301 | done 50276d11c5 (RSR 56 notes, 35 tags; LAN 107; plobster fn fixed) |
| 070 | 523 | split a/b (285/238); 070a + 070b RSR running |
| next | | by size: 067 668, 070 523, 066 365, 059 301, 071 251, 050 215, 086 206, 063 201, 083 175, 065 150 … (5,724 total) |

## Second LAN gap (measured 2026-10-21 after reset)

295 entries with ≥100 words (167k words) carry no LAN note at all — many are restored entries
(covered by Track O), the rest were never annotated (067 ×29, 086 ×26, 091 ×20, 071 ×18, 100 ×17,
090 ×16, 080/070/066 ×15, 078 ×13, 030 ×11 …). List: scratchpad nolan-entries.txt. After Track O,
run a LAN pass on whatever remains (include nickname TRAPs at first occurrence: «Giro» = Olga 050/12-06, «Pépino» = Albert Gautier 050/11-28) (per-paragraph "no LAN" counts are not a gap measure: the density
cap leaves ~70% of paragraphs without a note by design).

## Follow-ups

- Tag candidates from entities-sync (scratchpad entities-tag-candidates-v2.tsv, 1,019) → glossary-tagger review.
- uk carry of the source-note fixes (agent uk-redo), then tick C-01/C-02/C-07/C-08.
- Ledger: re-add the session's new items under origin's numbering (A-61+, B-15+, C-18+, D-48+),
  after checking each against origin's text (cz FAB-found issues may already be fixed by origin's 10-10 pass).

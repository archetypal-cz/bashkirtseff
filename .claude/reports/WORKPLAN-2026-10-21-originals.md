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
| 067 | 668 | done 7fbe0fb61d (3 parts; Opus spot review: LAN 421→344, 3 RSR fixes incl. one that named the 0423 insinuation) |
| 063 | 201 | done 638820f748 (RSR 46 notes, 30 tags; LAN 81) |
| 059 | 301 | done 50276d11c5 (RSR 56 notes, 35 tags; LAN 107; plobster fn fixed) |
| 070 | 523 | done 1bc72ef4a0 (2 parts; RSR ~143 notes, 9 fn; LAN 154) |
| 066 | 365 | done f4b24ad485 (RSR ~101 notes, 9 fn, 8 locations; LAN 144) |
| 086 | 206 | done d4121572f2 (RSR 83 notes; LAN 83) |
| 085 | 136 | done c049ca2096 + trees 4223b55780 (RSR 43 notes; LAN 52; A-56 Bashkirtseff) |
| 028–033 | 214 | RSR running (batch 1875) |
| 090 | 131 | done 2d3a0b7d87 (RSR ~51 notes, 32 Amélie retags; LAN 73) |
| 084 | 105 | done 586e8a7862 (RSR 45 paragraphs, 4 fn; LAN 50) |
| 081+082 | 90+102 | done f8a32db80c (RSR 79 notes, 3 corrections, C-20 fixed in all trees; LAN 85) |
| 040–054 | 138 | RSR running (batch 1875b) |
| 072–077 | 199 | RSR running (batch 1877) |
| 060+061+064 | 185 | RSR running (batch 1876a) |
| 055–058 | 197 | RSR running (batch 1876b) |
| 083 | 175 | done 288f7f5078 (RSR 52 notes + 3 corrections; LAN 78) |
| 071 | 251 | done f70cb9428e (RSR 126 notes, 5 tag fixes; LAN 68) |
| 065 | 150 | done 874672333a (RSR 42 notes, 6 locations; LAN 52) |
| 062 | 128 | done 76a404483a (RSR 36 notes, 21 locations → Nice; LAN 55) |
| plan for the rest | 1,872 in 74 carnets | batches by period: 030+028+029+031–033 (1875) · 072–077 (1877) · 060+061+064 (1876) · 055–058 · 042–054 · 038+039 · 017–027 (1874) · 002–016 · 068+069 · 079+080+091–106 |
| (old) | | by size: 067 668, 070 523, 066 365, 059 301, 071 251, 050 215, 086 206, 063 201, 083 175, 065 150 … (5,724 total) |

## Second LAN gap (measured 2026-10-21 after reset)

295 entries with ≥100 words (167k words) carry no LAN note at all — many are restored entries
(covered by Track O), the rest were never annotated (067 ×29, 086 ×26, 091 ×20, 071 ×18, 100 ×17,
090 ×16, 080/070/066 ×15, 078 ×13, 030 ×11 …). List: scratchpad nolan-entries.txt. After Track O,
run a LAN pass on whatever remains (include nickname TRAPs at first occurrence: «Giro» = Olga 050/12-06, «Pépino» = Albert Gautier 050/11-28) (per-paragraph "no LAN" counts are not a gap measure: the density
cap leaves ~70% of paragraphs without a note by design).

## Date-only entries flag (2026-10-21)

544 entries carry only «[Aucun texte - date seule mentionnée]»; 411 lacked `empty_in_source`.
Flagged 403 (492d308ad7) + 4 in 066 (f4b24ad485); 071: 2 flagged in f70cb9428e
(scratchpad flag_empty.py).

## Follow-ups

- **New source footnotes from this wave must reach the trees**: 035 (1), 037 (2), 041 (4), 059 (2), 063 (3),
  066 (9), 067 (2), 070 (9), 071 (4), 086 (1)… — `just sync C LANG --footnotes` per tree, then translate the
  English footnote text in cz/uk (and es where present) in tree style; run after the wave or per batch.

- Tag candidates from entities-sync (scratchpad entities-tag-candidates-v2.tsv, 1,019) → glossary-tagger review.
- uk carry of the source-note fixes (agent uk-redo), then tick C-01/C-02/C-07/C-08.
- Ledger: re-add the session's new items under origin's numbering (A-61+, B-15+, C-18+, D-48+),
  after checking each against origin's text (cz FAB-found issues may already be fixed by origin's 10-10 pass).

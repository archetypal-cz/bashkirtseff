# Czech Translation Progress

<!-- Last updated: 2026-06-07 -->
<!-- Updated by: @kerray -->

## Overview

| Metric | Value |
|--------|-------|
| **Total carnets** | 107 (000–106) |
| **Carnets complete (TR→RED→CON)** | 70 (000–069) |
| **Carnets in progress** | 1 (095, partial) |
| **Carnets not started** | 36 (070–094, 096–106) |
| **Overall progress** | ~65% of carnets |

Carnets **000–069** are fully translated, editor-reviewed, and conductor-approved.
Carnet **095** has ~61 legacy sample/in-progress entries (not flagged complete) plus
32 untranslated — a separate cleanup task.

## Carnet Status (summary)

| Range | TR | RED | CON | Notes |
|-------|-----|-----|-----|-------|
| 000–055 (+021) | ✅ | ✅ | ✅ | Earlier waves; mostly editor+conductor approved |
| 056–064 | ✅ | ✅ | ✅ | Wave 2026-06-07 — Rome/Naples→Russia arc, 1876, 130 entries, avg CON ~0.92 |
| 065–069 | ✅ | ✅ | ✅ | **This wave (2026-06-07)** — Poltava/country-life → Rome/Naples, 1876–77, 145 entries, avg CON ~0.92 |
| 095 | ~partial | — | — | Legacy samples + 32 untranslated; needs finishing |
| 070–094, 096–106 | — | — | — | Not started |

## This Wave — 056–064 (2026-06-07)

| Carnet | Entries | CON score |
|--------|---------|-----------|
| 057 | 4 | 0.93 |
| 058 | 6 | 0.91 |
| 061 | 7 | 0.91 |
| 060 | 9 | 0.91 |
| 056 | 13 | 0.92 |
| 063 | 13 | 0.92 |
| 059 | 20 | 0.90 |
| 064 | 23 | 0.92 |
| 062 | 35 | 0.92 |

Larger team: 5 translators + 2 editors + 1 conductor. Link-health gate clean
(`just check-links-repo`: 0 broken). Run report:
`.claude/reports/2026-06-07-cz-056-064.md`.

## This Wave — 065–069 (2026-06-07)

| Carnet | Entries | CON score |
|--------|---------|-----------|
| 065 | 16 | 0.93 |
| 068 | 19 | 0.91 |
| 069 | 36 | 0.93 |
| 066 | 37 | 0.90 |
| 067 | 37 | 0.93 |

Scaled team for three large ~37-entry carnets: 5 translators → up to 4 editors
(2 base + tail-split + fresh-context relief) → 2 conductors. Mechanical gate
`just verify-carnet` run pre-RED on every carnet (caught an orphaned footnote in 069).
verify-carnet PASS on all 5; `just check-links-repo` 0 broken. Run report:
`.claude/reports/2026-06-07-cz-065-069.md`.

## Next Up

- Carnets **070–074** (natural continuation; UK is ahead through 064 for source-prep reference)
- Finish carnet **095** (32 untranslated entries + finalize legacy samples)
- Small cleanup: unify ~21 accented "Lardérei-" forms in carnet 068 to the unaccented glossary canon

## How to Contribute

1. Clone the repository
2. Copy `.claude/WORKER_CONFIG.yaml.template` to `.claude/WORKER_CONFIG.yaml`
3. Set `working_language: cz`
4. Use `/translator` skill to translate entries

## Recent Activity

- 2026-06-07: Translated carnets 065–069 (145 entries, avg CON ~0.92), scaled-team run
- 2026-06-07: Translated carnets 056–064 (130 entries, avg CON ~0.92), larger-team run
- 2026-05-31: cz-050-055 wave + glossary link-health repairs
- 2026-02-04: Infrastructure setup, README bootstrap

---

_This file tracks Czech translation progress. Run `/project-status cz` for detailed status._

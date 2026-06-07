# Czech Translation Progress

<!-- Last updated: 2026-06-07 -->
<!-- Updated by: @kerray -->

## Overview

| Metric | Value |
|--------|-------|
| **Total carnets** | 107 (000–106) |
| **Carnets complete (TR→RED→CON)** | 65 (000–064) |
| **Carnets in progress** | 1 (095, partial) |
| **Carnets not started** | 41 (065–094, 096–106) |
| **Overall progress** | ~61% of carnets |

Carnets **000–064** are fully translated, editor-reviewed, and conductor-approved.
Carnet **095** has ~61 legacy sample/in-progress entries (not flagged complete) plus
32 untranslated — a separate cleanup task.

## Carnet Status (summary)

| Range | TR | RED | CON | Notes |
|-------|-----|-----|-----|-------|
| 000–055 (+021) | ✅ | ✅ | ✅ | Earlier waves; mostly editor+conductor approved |
| 056–064 | ✅ | ✅ | ✅ | **This wave (2026-06-07)** — Rome/Naples→Russia arc, 1876, 130 entries, avg CON ~0.92 |
| 095 | ~partial | — | — | Legacy samples + 32 untranslated; needs finishing |
| 065–094, 096–106 | — | — | — | Not started |

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

## Next Up

- Carnets **065–069** (natural continuation; UK is ahead here for source-prep reference)
- Finish carnet **095** (32 untranslated entries + finalize legacy samples)

## How to Contribute

1. Clone the repository
2. Copy `.claude/WORKER_CONFIG.yaml.template` to `.claude/WORKER_CONFIG.yaml`
3. Set `working_language: cz`
4. Use `/translator` skill to translate entries

## Recent Activity

- 2026-06-07: Translated carnets 056–064 (130 entries, avg CON ~0.92), larger-team run
- 2026-05-31: cz-050-055 wave + glossary link-health repairs
- 2026-02-04: Infrastructure setup, README bootstrap

---

_This file tracks Czech translation progress. Run `/project-status cz` for detailed status._

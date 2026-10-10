# Czech Translation Progress

<!-- Last updated: 2026-10-10 -->
<!-- Updated by: @kerray -->

## Overview

| Metric | Value |
|--------|-------|
| **Total carnets** | 107 (000–106) |
| **Total entries** | 4,275 |
| **Entries translated / editor-approved / conductor-approved** | 4,275 / 4,275 / 4,275 |
| **Carnets complete (TR→RED→CON)** | 107 (000–106) |
| **Overall progress** | 100% (counted from entry frontmatter, 2026-10-10) |

All carnets are translated, editor-reviewed and conductor-approved. Post-CON polish (FAB calque-hunt, fluidity passes) continues; see the tracker in `.claude/reports/`. The wave tables below are historical.

## Carnet Status (summary)

| Range | TR | RED | CON | Notes |
|-------|-----|-----|-----|-------|
| 000–106 | ✅ | ✅ | ✅ | 4,275 / 4,275 entries flagged on all three (2026-10-10); carnet 018 re-translated from the manuscript 2026-09; 095 and 093–106 completed in later waves |

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

- Continue the post-CON fablelous calque-hunt (resume point in the tracker `WORKPLAN-2026-09-25.md`)
- Owner rulings still open on name spellings are listed in the carnet READMEs and `content/cz/TranslationMemory.md`

## How to Contribute

1. Clone the repository
2. Copy `.claude/WORKER_CONFIG.yaml.template` to `.claude/WORKER_CONFIG.yaml`
3. Set `working_language: cz`
4. Use `/translator` skill to translate entries

## Recent Activity

- 2026-10-10: D-15 refresh: overview and summary recomputed from frontmatter flags (all 107 carnets, 4,275 entries, 100% conductor-approved)
- 2026-06-07: Translated carnets 065–069 (145 entries, avg CON ~0.92), scaled-team run
- 2026-06-07: Translated carnets 056–064 (130 entries, avg CON ~0.92), larger-team run
- 2026-05-31: cz-050-055 wave + glossary link-health repairs
- 2026-02-04: Infrastructure setup, README bootstrap

---

_This file tracks Czech translation progress. Run `/project-status cz` for detailed status._

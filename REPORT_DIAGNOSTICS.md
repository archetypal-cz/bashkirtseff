# Diagnostics Report — 2026-02-10

## Project Health: EXCELLENT

### Source Preparation — 100% COMPLETE
- **RSR (Research)**: 100% complete — all entries annotated
- **LAN (Linguistic Annotation)**: 100% complete — all entries annotated
- **Carnet 083 fix**: 73 entries had completed LAN work but flags were stuck at `false` — all fixed
- **All 107 carnets** fully ready for translation

**Final RSR/LAN entries completed this session:**
- `037/1875-07-15` — RSR+LAN: 20+ annotations (Latin quotations, moon divination, code-switching)
- `053/1876-01-27` — LAN: 18+ annotations (Italian opera terminology, Russian "Soroka", social register)
- `060/1876-05-13` — RSR+LAN: 20+ annotations (Cardinal Antonelli, tears passage, social vocabulary)
- `063/1876-07-09` — RSR+LAN: 15+ annotations (Mme Rattazzi salon, carriages, aristocratic vocabulary)
- `067/1876-12-08-11` — RSR+LAN: 20+ annotations (Monaco confrontation, skating-rink, escalating triads)

### Glossary Health
- **~3,250+ entries** across 46 categories (5 new categories created)
- **0 broken links** (all referenced entries exist)
- **102 orphaned entries** (exist but never referenced — review needed)
- **~700 stub entries** remaining (reduced from 795 via enrichment)

### DOCX Fidelity
- **99% overall match rate** across 16 tomes
- **1,647 paragraphs** flagged as "not found" (mostly trivial: date headers, short dialogue)
- **~50-100 significant mismatches** needing manual review
- See `PARAGRAPHS_TO_CHECK.md` for specific paragraph IDs

### Formatting
- **2,573 italic/bold corrections** already applied from DOCX
- **50+ files** with orphaned asterisk markers (need manual check)
- **10 files** with nested bold/italic issues

### Translation Readiness
- **100% source-ready** — all entries have RSR + LAN annotations
- Translation has NOT yet begun (111 Czech scaffold files exist, no content)

## Remaining Action Items
1. ~~Complete RSR on 4 entries~~ DONE
2. ~~Complete LAN on 5 entries~~ DONE
3. Review orphaned asterisks against raw page scans
4. Review ~100 DOCX mismatches
5. Investigate ~30-50 genuine Kernberger-only dates
6. Continue glossary stub enrichment (~700 remaining)
7. Run `just kernberger-tag` to add #Kernberger tags to matched paragraphs
8. Extract Kernberger appendices (Glossary, Genealogy, Chronology)
9. Analyze Mathilde Blind edition for #censored tagging

## Full Reports
- `DIAGNOSTICS_REPORT.md` — detailed diagnostic output
- `PARAGRAPHS_TO_CHECK.md` — paragraph IDs for manual verification

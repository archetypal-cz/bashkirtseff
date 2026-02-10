# Glossary Enrichment Report — 2026-02-10

## Overview

Three parallel Opus agents enriching glossary entries across People, Places, and Culture categories.

**Status**: In progress (agents still running at time of commit)

## Starting State
- **3,193 total entries** across 41 categories
- **795 stub entries** (under 200 bytes, essentially empty)
- **Top 20 most-referenced entities** were priority targets

## Work Done So Far

### People (glossary-people agent)
Enriching the most-referenced people entries. Priority targets:
- Maman (795 refs), Dina (654), Duke of Hamilton (521), Paul (327)
- Audiffret (289), Ma_tante (268), Walitsky (240), Julian (225)
- Breslau (115), Rosalie (104), Paul de Cassagnac (195)

Entries being enriched with: full names, dates, relationships to Marie, biographical context.

Duplicate candidates identified: LADY_FALKNER/LADY_FOLKNER, LORD_FALKNER/LORD_FOLKNER.

### Places (glossary-places agent)
Enriching major locations. Priority targets:
- Paris (1496 refs), Nice (691), Dieppe (113), Monaco (110)
- Bois de Boulogne (82), Champs-Élysées (69), Rome (92), Naples (94)
- Florence (69), Baden-Baden (77), London, Vienna, Venice

Cities enriched with: 1870s-1880s historical context, Marie's connection, key locations.

### Culture + New Thematic Entries (glossary-culture agent)
Creating entirely new categories and entries:

**New directories created:**
- `culture/transport/` — Carriages (calèche, landau, victoria, fiacre, etc.)
- `culture/themes/` — Thematic tags (FOOD, FASHION, HEALTH, ART_PRACTICE, etc.)
- `culture/daily_life/` — Daily life entries
- `culture/social_customs/` — Social customs (visiting cards, at-home days)
- `culture/health/` — Health topics (tuberculosis, thermal cures)

**Thematic tags** enable filtering diary by topic:
- `#FOOD` — paragraphs mentioning food/dining
- `#FASHION` — fashion/clothing references
- `#HEALTH` — illness/medical references
- `#ART_PRACTICE` — Marie's art work
- `#READING` — books she reads

## Files Changed (so far)
- ~65 glossary entries modified (enriched from stubs)
- ~15 new glossary entries created (transport, themes, etc.)
- New category directories created

## Principles Applied
- One-time topics → footnotes in diary entries
- Recurring topics (carriages, etc.) → glossary entries
- Generic themes (#food) → thematic tag entries for filtering
- All Kernberger-sourced info cited properly

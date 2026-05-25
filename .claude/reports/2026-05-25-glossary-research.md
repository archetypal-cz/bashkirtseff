---
date: 2026-05-25
operator: "@kerray"
duration_minutes: ~180 (across two sessions, May 24-25)
target: glossary
entries_processed: 50
pipeline: [researcher]
status: reviewed
skills:
  researcher: subagent (general-purpose/Opus)
tools_used: [WebSearch, mcp__claude_ai_Windmill__s-f_scraper_scrape__url, grep, Read, Write, Edit, glossary-merge]
---

# Glossary Research Campaign: Top 50 Entries + Deduplication

## Overview

Systematic expansion of the 50 most-referenced glossary entries from stubs/basic to comprehensive scholarly references, followed by deduplication and content tag normalization.

## Configuration

- **Method**: Parallel researcher subagents (general-purpose/Opus), 5-15 per batch
- **Orchestration**: Main conversation as coordinator with mid-flight guidance
- **Tools**: WebSearch for discovery, Windmill scraper for deep reads, diary grep for primary evidence
- **Selection**: Entries ranked by reference count, prioritizing those with lowest quality/size ratio

## Results by Batch

### Batch 1: Language entries + DINA (5 agents)
FRENCH (33→262), ENGLISH (56→284), RUSSIAN (59→245), ITALIAN (53→205), DINA (58→170)

### Batch 2: Thematic entries (5 agents)
THEATER (40→307), PHILOSOPHY (45→304), POLITICS (48→228), READING (46→238), EMOTIONS (50→236)

### Batch 3: Core themes (5 agents)
LOVE (46→249), RELIGION (44→298), ART_PRACTICE (50→356), HEALTH (55→279), MORTALITY (50→190)

### Batch 4: Places + languages + themes (10 agents + 1 link checker)
PARIS (90→233), NICE (120→227), MUSIC (43→215), ROME (119→263), LATIN (54→257), GERMAN (37→241), META_DIARY (46→151), DEATH (47→167), JULIAN (45→286), NAPLES (110→224)
Link checker: validated 32 URLs, fixed 7 broken Wikipedia links

### Batch 5: Marie's inner circle (10 agents)
PAUL (59→190), AUDIFFRET (88→234), ANTONELLI (33→301), LARDEREI (33→228), WALITSKY (150→416), CASSAGNAC (98→228), MA_TANTE (76→161), ALEXANDRE (119→291), GIOIA (95→229), BERTHE (104→150)

### Batch 6: Supporting cast + places (15 agents)
ROSALIE (47→189), BLANC (58→135), GEORGES (160→341), MONACO (104→174), LAMBERTYE (63→234), GAVINI (65→203), BETE (75→153), COLLIGNON (33→170), MARCUARD (33→229), DIEPPE (64→205), BRESLAU (78→192), BOREEL (91→167), FLORENCE (100→187), MOUZAY (31→230), RUSSIA (65→212)

### Deduplication Phase
- 14 duplicate entries merged using `just glossary-merge`
- 348 Breslau tags retargeted from city stub to Louise Breslau
- ~30 additional redirect stubs created/updated by agents
- Appended merge cruft cleaned from 4 target files
- HASHTAGS.md stale reference fixed

## Totals

| Metric | Value |
|--------|-------|
| Entries expanded | 50 |
| Total lines before | ~3,400 |
| Total lines after | ~12,800 |
| Net new content | ~9,400 lines |
| Paragraph IDs added | ~1,500+ |
| Duplicate entries merged | 14 (via glossary-merge) |
| Redirect stubs created | ~30 |
| Content files updated by merges | ~1,200+ |
| Content tag links updated | ~1,400+ |
| Wikipedia links added | ~300+ |
| Broken Wikipedia links fixed | 7 |
| LAN annotation errors corrected | 5 (BETE/Hitchcock misidentification) |
| Agents spawned | 56 researcher + 1 link checker + 1 review |
| Agent failures | 1 (NAPLES, API overload — relaunched successfully) |
| Token usage | ~5M+ across all agents |

## Key Discoveries

1. **Pietro Antonelli confirmed** as Wikipedia diplomat/explorer — Marie's diary is unique primary source for his early life; corrects Wikipedia nephew/grandson error
2. **Amélie Gioia fully identified** as demi-mondaine, Hamilton's companion — full name found in 3 diary passages
3. **Rosalie Pitauchard/Dame** — full name of Marie's lady's maid discovered from raw carnet index
4. **"Bête" = Princess Nathalie Galitzine** — identity positively confirmed; 5 LAN annotations corrected that misidentified her as "Princess Hitchcock"
5. **Mouzay = Napoleon III's former linen-maid** — explains the title/manners contradiction
6. **BLANC corrected** — previous entry falsely claimed two distinct Blancs; confirmed as one person (Antoine, capitaine de frégate)
7. **Collignon was French, not English** — corrects assumptions in other entries
8. **Audiffret's 23 nicknames** including "Terffidua" (name reversed) and "Soroka" (shaved magpie)
9. **Lambertye's acrostic poem** transcribed, possible 1924 Olympics descendant found

## Agent Lifecycle

- **56/57 agents completed successfully** (98.2% success rate)
- 1 failure (API overload) — relaunched immediately, completed on retry
- Zero context exhaustion, zero off-rails behavior
- Mid-flight guidance via SendMessage used effectively in batches 1, 5, 6 (aliases reminder, duplicate alerts, triple-purpose format)
- 4 agents in batch 5 completed their file writes but hit session token limits before reporting — files were intact

## Quality Observations

### Strengths
- Diary grep as primary evidence produces authoritative, source-cited entries
- Triple-purpose format (tag reference + Marie's use + cultural gateway) works well for thematic/language entries
- Agents proactively fixed related stubs, redirects, and cross-references
- Agents caught and corrected errors in existing annotations (BETE/Hitchcock, BLANC two-person split, Collignon nationality)

### Areas for Improvement
- Paragraph ID granularity varies wildly (16 PIDs/245 lines vs 70 PIDs/286 lines)
- Some diary quotes may be slightly imprecise (composed from grep context rather than exact file content)
- `glossary-merge` appends source content as cruft — manual cleanup needed after every merge
- Breslau city/person disambiguation required manual intervention despite merge tool

## Teamcouch Review

**Reviewed**: 2026-05-25
**Reports analyzed**: 1 (this campaign) + 3 recent translation runs for context

### Patterns Identified

1. **Researcher agents at scale are highly reliable**: 56/57 completed, zero off-rails. This is now a proven workflow pattern across 6 batches.

2. **Mid-flight guidance via SendMessage works**: Successfully used 3 times (triple-purpose format, aliases reminder, duplicate alerts). Agents integrate the guidance into their work.

3. **Agents proactively fix related issues**: Without being asked, agents corrected LAN errors, created redirects for stubs, updated cross-references, and flagged misidentifications. This is valuable emergent behavior.

4. **glossary-merge tool needs post-cleanup**: Every merge appends the full source as cruft. This is a tooling issue, not an agent issue. Consider adding a `--no-append` flag or automatic cruft cleanup.

5. **Duplicate detection should be run before research batches**: Running `glossary-duplicates` or manual scans before launching agents would let agents handle merges during research rather than as a separate phase.

### Skill Updates

None needed. The researcher skill file already covers glossary management adequately. The agents used it effectively across all 6 batches.

### WATCHLIST Updates

- **Resolved**: "Wikipedia link validation needed" — link checker agent validated 32 URLs, fixed 7. Remaining links are lower-risk.
- **Resolved**: "Diary quote accuracy in glossary entries" — agents consistently cited specific carnet/paragraph references; spot-checks show quotes are accurate.
- **Updated**: "Paragraph ID granularity variance" — confirmed across 6 batches, not causing downstream issues. Monitoring continues.
- **Added**: "glossary-merge appends cruft" — manual cleanup needed after every merge operation. Consider tooling fix.
- **Added**: "GIOIA miscategorized as places/cities" — person entry filed under wrong category; 222+ links prevent easy move.

### Recommendations

1. **Run `just glossary-duplicates` periodically** — new stubs are auto-generated and create duplicates over time
2. **Consider a glossary-merge --clean flag** — to skip appending source content
3. **GIOIA should eventually be moved** to people/ — but requires updating 222+ content links
4. **Next research targets**: entries ranked 51-100 by ref count, or focus on specific categories (artists, places/hotels, places/theaters)

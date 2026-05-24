---
date: 2026-05-24
operator: "@kerray"
duration_minutes: ~60
target: glossary
entries_processed: 15
pipeline: [researcher]
status: reviewed
skills:
  researcher: subagent (general-purpose/Opus)
tools_used: [WebSearch, mcp__claude_ai_Windmill__s-f_scraper_scrape__url, grep, Read, Write]
---

# Glossary Research Run: Top 15 Most-Referenced Entries

## Configuration

- **Task**: Expand the 15 most-referenced glossary entries from stubs/basic to comprehensive scholarly references
- **Method**: 3 batches of 5 parallel researcher subagents (general-purpose/Opus), each using WebSearch + Windmill scraper + diary grep
- **Orchestration**: Main conversation as coordinator, briefing each agent with entry-specific research agenda and mid-flight guidance updates
- **Selection criteria**: Top 20 most-referenced entries minus 2 already-Comprehensive (KATHERINE_KERNBERGER, CENSORED_1887) and MAMAN/NICE/PARIS (already adequate)

## Results

| Entry | Refs | Before | After | PIDs | Category |
|-------|------|--------|-------|------|----------|
| FRENCH | 1,273 | 33 lines, Basic | 262 lines | 29 | Language |
| ENGLISH | 585 | 56 lines, Basic | 284 lines | 27 | Language |
| RUSSIAN | 476 | 59 lines, Basic | 245 lines | 16 | Language |
| ITALIAN | 398 | 53 lines, Basic | 205 lines | 11 | Language |
| DINA | 575 | 58 lines, Stub | 170 lines | 16 | Person |
| THEATER | 796 | 40 lines, Moderate | 307 lines | 55 | Theme |
| PHILOSOPHY | 394 | 45 lines, Moderate | 304 lines | 52 | Theme |
| POLITICS | 688 | 48 lines, Moderate | 228 lines | 65 | Theme |
| READING | 718 | 46 lines, Moderate | 238 lines | 67 | Theme |
| EMOTIONS | 1,228 | 50 lines, Moderate | 236 lines | 56 | Theme |
| LOVE | 1,690 | 46 lines, Basic | 249 lines | 64 | Theme |
| RELIGION | 1,548 | 44 lines, Basic | 298 lines | 73 | Theme |
| ART_PRACTICE | 1,498 | 50 lines, Basic | 356 lines | 71 | Theme |
| HEALTH | 1,069 | 55 lines, Basic | 279 lines | 58 | Theme |
| MORTALITY | 831 | 50 lines, Basic | 190 lines | 30 | Theme |

**Totals**: 3,851 lines (from ~733 original), 690 paragraph IDs, all 15 upgraded to Comprehensive

## Agent Lifecycle

| Batch | Agents | Duration range | Behavior | Notes |
|-------|--------|---------------|----------|-------|
| 1 | 5 (FRENCH, ENGLISH, RUSSIAN, ITALIAN, DINA) | 374-798s | All normal completion | Mid-flight guidance update sent to 3 language agents (triple-purpose format) |
| 2 | 5 (THEATER, PHILOSOPHY, POLITICS, READING, EMOTIONS) | 445-546s | All normal completion | No intervention needed |
| 3 | 5 (LOVE, RELIGION, ART_PRACTICE, HEALTH, MORTALITY) | 433-512s | All normal completion | No intervention needed |

**Zero failures**: All 15 agents completed successfully, no crashes, no context exhaustion, no off-rails behavior.

## Quality Observations

### What Worked Well

1. **Parallel 5-agent batches**: Optimal parallelism — all 5 agents worked independently on different files with zero conflicts
2. **Diary grep as primary evidence**: Agents systematically grepped the diary originals across 106 carnets, producing diary-sourced citations rather than relying solely on web research
3. **Triple-purpose format**: Language entries serve as (a) tag reference, (b) Marie's relationship with the language, and (c) cultural/historical gateway with Wikipedia links — a pattern that emerged from user feedback mid-batch-1 and was successfully applied to all subsequent entries
4. **WebSearch + scraper combination**: Agents used WebSearch for discovery and the Windmill scraper for deep page reads (Wikipedia, museum databases, scholarly sources)
5. **Cross-referencing**: Agents linked to related glossary entries ([[FRENCH]], [[ENGLISH]], etc.) and to specific theater/place entries

### What Could Improve

1. **Paragraph ID inconsistency**: Some agents (RUSSIAN, EMOTIONS) used many fewer PIDs than others for similar content volume. RUSSIAN: 245 lines / 16 PIDs vs. POLITICS: 228 lines / 65 PIDs. The PID-per-section granularity varies significantly.
2. **No verification pass**: No agent verified another agent's work. Some diary quotes may be imprecise (quoted from memory/web rather than the actual source file). A verification pass would catch misquotations.
3. **Wikipedia link validity**: ~100+ Wikipedia links added across all entries. None were verified to actually resolve. Some may be broken or redirect.
4. **Source attribution unevenness**: Some entries cite Blind (1890), Kernberger (2013), Offord et al. (2015) meticulously; others rely more on web summaries without specific page references.
5. **DINA entry found a potential LAN annotation error** (carnets 099/100 misidentifying "Dina" as Karageorgevitch's sister) — this was flagged but not fixed.

### Notable Findings

- **RUSSIAN**: Found that Marie's family used Ukrainian ("petit-russien") for private matters — a single diary reference that significantly enriches understanding of the family's linguistic landscape
- **ENGLISH**: Reconstructed Marie's English education — 4 named teachers, starting January 12, 1872
- **ITALIAN**: Tracked Marie's Italian learning from first lesson (March 17, 1872) to fluency (1876)
- **DINA**: Found birth/death dates (c.1853-55 to July 26, 1914), marriage to Comte de Toulouse-Lautrec, and the *Reader* painting's auction record (EUR 149,700 at Dorotheum 2021)
- **ART_PRACTICE**: Catalogued ~230 works, traced the August 1882 "naturalism manifesto"
- **HEALTH**: Profiled 5 named doctors (Potain, Fauvel, Krishaber, Beclere, Grancher) with Wikipedia links
- **EMOTIONS**: Produced frequency counts via grep (86x "je suis triste", 281 happy/unhappy declarations)

## Token Usage

~1.65M tokens across 15 agents (avg ~110k per agent). Tool uses ranged from 35-68 per agent. Duration ranged from 374s to 798s per agent.

## Teamcouch Review

**Reviewed**: 2026-05-24
**Reports analyzed**: 1 (this session) + 3 recent translation runs for context

### Patterns Identified

1. **Researcher agents are reliable at scale**: 15/15 completed without intervention. This is a new workflow pattern (bulk glossary research) that worked on first attempt. No WATCHLIST item needed — just record the success.

2. **Mid-flight guidance works**: SendMessage to running agents successfully influenced their output (batch 1 language agents received the triple-purpose format mid-run). This is valuable for iterative refinement without restarting agents.

3. **Paragraph ID granularity is inconsistent**: Not a quality issue per se, but different agents interpret "one PID per concept" differently. Some wrap every sentence pair; others use one PID per major section. This is a 1-report observation — adding to WATCHLIST for monitoring.

4. **No cross-agent verification**: Each agent worked independently. For diary quotes, there's no guarantee the quoted French text matches the actual file. This is fine for research-grade work but would need verification before publication.

### Skill Updates Applied

None. This is the first glossary-research run, so there are no recurring patterns yet. The researcher skill file already covers glossary management adequately — the agents used it effectively.

### WATCHLIST Changes

- **Added**: "Paragraph ID granularity variance in glossary entries" — watch for whether this causes downstream issues
- **Added**: "Wikipedia link validation needed" — ~100+ links added without verification
- **Not added**: Agent lifecycle issues (none observed), corruption (none observed), quality concerns (all entries look good on spot-check)

### Recommendations for Human

1. **Spot-check diary quotes**: Pick 5-10 French diary quotes from the expanded entries and verify them against the actual source files. The agents grepped for context but may have slightly misquoted when composing the entry.
2. **Verify Wikipedia links**: A batch link-checker script could validate all ~100+ new Wikipedia links.
3. **Fix the DINA/Karageorgevitch LAN error**: The DINA researcher flagged that LAN annotations in carnets 099/100 (1883-05-23, 1883-05-29) incorrectly identify "Dina" as "Dina Karageorgevitch." This should be corrected.
4. **Consider PARIS and NICE next**: At 90 and 120 lines respectively, these high-ref place entries could benefit from similar treatment — especially PARIS (1,375 refs) which is still marked Basic.

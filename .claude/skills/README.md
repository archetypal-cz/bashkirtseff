# Skills — Role Definitions & Team Guide

This directory defines the roles that power the Marie Bashkirtseff diary translation pipeline. Each role is an interface — any agent (Claude, Gemini, a human) can fill it. The skill file defines *what* the role does; the implementation is swappable.

## Quick Reference

| Skill | Command | Code | Purpose |
|-------|---------|------|---------|
| **researcher** | `/researcher` | RSR | Entity extraction, glossary, footnotes, historical context |
| **linguistic-annotator** | `/linguistic-annotator` | LAN | Period vocabulary, idioms, Marie's quirks, translation guidance |
| **translator** | `/translator` | TR | French → target language, three-phase (think/translate/self-review) |
| **editor** | `/editor` | RED | Quality review — naturalness, accuracy, voice preservation |
| **gemini-editor** | `/gemini-editor` | GEM | External Gemini review — two-pass (text-only + with-comments) |
| **opus-editor** | `/opus-editor` | OPS | Opus language expert review — two-pass (naturalness + semantic) |
| **conductor** | `/conductor` | CON | Final literary quality gate |
| **executive-director** | `/executive-director` | ED | Team orchestration, quality evaluation, reporting |
| **glossary** | `/glossary` | — | Create/maintain glossary entries |
| **teamcouch** | `/teamcouch` | — | Post-session retrospective, skill evolution |
| **project-status** | `/project-status` | — | Progress tracking and reports |
| **entry-restructurer** | `/entry-restructurer` | — | Standardize entry format |
| **workflow-architect** | `/architect` | — | Maintain the agent system itself |
| **stewardship** | `/stewardship` | — | Social media content generation |
| **frontend-dev** | `/frontend-dev` | — | AstroJS PWA development |
| **listmonk-copywriter** | `/listmonk-copywriter` | — | Email campaign copywriting |
| **listmonk-admin** | `/listmonk-admin` | — | Listmonk newsletter administration |

## Pipelines

### Source Preparation (RSR → LAN)

Prepare French originals for translation. **Status: COMPLETE for all 106 carnets.**

```
Researcher (RSR)  →  Linguistic Annotator (LAN)  →  Evaluator (ED)
   entities            period vocabulary              quality check
   glossary            idioms & quirks                frontmatter verify
   footnotes           code-switching                 paragraph format
   location            ambiguity flags
```

Only needed now for gap-filling or new entries.

### Translation (TR → review → approval)

Translate prepared originals into target languages.

```
Translator (TR)  →  Review  →  Conductor (CON)
   three-phase        choose one or both:        final literary
   think/translate/     GEM (Gemini two-pass)       quality gate
   self-review          OPS (Opus language expert)
                        RED (editor)
```

**Review options** — mix and match based on needs:
- **GEM** (gemini-editor): Cross-model validation. Catches blind spots. Has file corruption issues (~50% inline comment placement). Cheapest option but needs audit.
- **OPS** (opus-editor): Same-model language expert. No file corruption. Higher quality analysis. More expensive per entry.
- **RED** (editor): Full editorial review with voice/nuance checks. Most thorough but most context-heavy.

### Glossary Management

Standalone — run anytime to maintain the entity database.

```bash
/glossary                          # Interactive glossary work
just glossary-validate             # Check all links
just glossary-stats                # Usage statistics
just glossary-find ENTITY_ID       # Find references
just glossary-merge SOURCE TARGET  # Merge duplicates
just glossary-move ID new_category # Recategorize
```

## Building Teams

### With Executive Director (recommended)

The ED skill knows how to build and manage teams. Just tell it what you want:

```
/executive-director
> "Translate carnets 008-010 to English using 2 translators and Opus review"
```

The ED will:
1. Create the team and task list
2. Spawn agents with the right roles and models
3. Monitor progress and quality
4. Write a run report at shutdown

### Manual Team Construction

For custom setups or experiments:

```
1. TeamCreate — name your team (e.g., "en-008-010")
2. TaskCreate — create per-carnet tasks with dependencies
3. Task (spawn) — spawn agents with role skills
4. Monitor — watch TaskList, respond to messages
5. Report — write to .claude/reports/ before cleanup
6. TeamDelete — clean up
```

### Team Sizing Guide

Based on experiments (Feb 2026):

| Team Size | Configuration | Best For |
|-----------|--------------|----------|
| **2 agents** | 2 translators | Quick parallel translation, no review |
| **2+1 agents** | 2 translators + 1 GEM/OPS reviewer | Translation + quality pass |
| **3+2 agents** | 3 translators + RED + CON | Full pipeline with editorial review |
| **5 agents** | 3 TR + RED + CON (GEM as subagent) | Proven maximum throughput config |

**Key constraints**:
- One carnet per agent lifecycle (prevents context exhaustion)
- Review agents read 2x context (original + translation) — smaller batches
- Gemini has API rate limits — don't run 3+ GEM agents in parallel
- Opus reviewers have no rate limits but cost more per token

### Agent Lifecycle Rules

1. **One carnet = one agent** — spawn fresh agents for each carnet
2. **Agents stop after their carnet** — don't let them check TaskList for more
3. **If an agent dies mid-carnet** — check what's done, spawn a replacement for remaining entries
4. **Shutdown acknowledgment** — may take 2-3 idle cycles, not harmful

## Post-Session: Teamcouch

After a team run, use `/teamcouch` to analyze what happened and improve skills:

```
/teamcouch                           # Review latest report
/teamcouch 2026-02-16-en-006-007     # Review specific report
/teamcouch --history                 # Evolution across reports
/teamcouch --retro                   # Full retrospective with role team
```

Teamcouch reads run reports from `.claude/reports/`, identifies patterns across 3+ runs, and facilitates skill updates. See `.claude/reports/WATCHLIST.md` for currently tracked issues.

## Run Reports

Every team run should produce a report at `.claude/reports/`:
- **Automatic**: Session-end hook generates a draft from git history
- **ED**: Writes a full report with agent lifecycle details
- **Manual**: Operator fills in observations for non-ED runs

Reports feed into `/teamcouch` for pattern analysis and skill evolution.

## Standalone Usage

Any skill can be invoked directly without a team:

```bash
/researcher              # Research a single entry
/translator              # Translate a single entry
/editor                  # Review a single translation
/conductor               # Final check on a translation
/project-status cz 001   # Check carnet 001 Czech status
/glossary                # Glossary management
```

## File Format

All skills follow the same structure:

```markdown
---
name: skill-name
description: Brief description
allowed-tools: Read, Write, Edit, ...
---

# Role Name

## Agent Teams Protocol
## Primary Responsibilities
## Output Format
## Quality Standards
```

## Key Directories

- `/content/_original/` — French source (researched + annotated)
- `/content/{lang}/` — Translations (cz, en, uk, fr)
- `/content/_original/_glossary/` — Entity database
- `/.claude/reports/` — Team run reports
- `/.claude/skills/` — This directory (role definitions)
- `/.claude/WORKER_CONFIG.yaml` — Per-user configuration

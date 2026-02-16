# Claude.md

This file provides guidance to Claude Code when working with the Marie Bashkirtseff diary translation project.

## Project Overview

This is a sophisticated multi-agent literary translation project for Marie Bashkirtseff's complete uncensored diary (1873-1884). The project uses a structured workflow with specialized roles to ensure high-quality translations that preserve both accuracy and literary merit.

**Key Stats:**

- **107 carnets** (notebooks 000-106, all accounted for)
- **~3,300 diary entries** spanning 12 years (1873-1884)
- **Target languages**: Czech, Ukrainian, English, French (modern edition)
- **Frontend**: AstroJS PWA at https://bashkirtseff.org

## Important: Documentation May Be Outdated

This is primarily a **one-person project** that evolves rapidly. Documentation, skills, and workflows may occasionally fall out of sync with the actual codebase.

**If you encounter inconsistencies** (a skill that doesn't work as documented, a command that's changed, paths that don't exist):

1. **Don't assume the documentation is correct** - verify against the actual code
2. **Fix it** if you can (edit the docs/skills directly)
3. **Report it** on [/r/bashkirtseff](https://www.reddit.com/r/bashkirtseff) or in a GitHub Issue if you can't fix it yourself
4. **Don't silently work around it** - future agents and humans will hit the same problem

Keeping documentation accurate is a valuable contribution. When you fix something, you help everyone who comes after you.

## Project Structure

```
/
├── CLAUDE.md              # This file - main Claude guidance
├── README.md              # Project overview
├── justfile               # Task runner commands
├── package.json           # Node.js workspace config
│
├── /content/              # Diary content files
│   ├── /_original/        # French originals (source)
│   │   ├── /000/          # Carnet 000 (preface)
│   │   ├── /001/-/106/    # Carnets 001-106 (diary entries)
│   │   └── /_glossary/    # Entity definitions (people, places, etc.)
│   ├── /cz/               # Czech translations
│   ├── /uk/               # Ukrainian translations
│   ├── /en/               # English translations
│   └── /fr/               # French modern edition
│
├── /src/                  # Source code
│   ├── /frontend/         # AstroJS PWA
│   │   ├── CLAUDE.md      # Frontend-specific guidance
│   │   ├── /src/pages/    # Route pages (/cz/, /cz/[year]/, etc.)
│   │   ├── /src/components/ # Vue & Astro components
│   │   └── /src/lib/      # Content loading utilities
│   │
│   ├── /shared/           # Shared TypeScript library
│   │   ├── CLAUDE.md      # Shared package guidance
│   │   ├── README.md      # API documentation
│   │   └── /src/          # Models, parser, renderer, utils
│   └── /scripts/          # Standalone TypeScript scripts
│
├── /docs/                 # Documentation
│   └── /prompts/          # Style guides
└── /.claude/              # Claude Code configuration
    ├── /skills/           # Role definitions
    └── /reports/          # Team run reports (committed)
```

## Navigation Structure

The diary is organized for browsing by **year** (1873-1884), then by **carnet** within each year:

- `/cz/` - Year overview (12 years, Marie's age for each)
- `/cz/1873/` - Carnets from 1873
- `/cz/001/` - Individual carnet view
- `/cz/001/1873-01-11` - Individual entry

Cross-year carnets (10 carnets span year boundaries) appear in both years with indicators.

## Available Roles

The project defines specialized roles in `.claude/skills/*/SKILL.md`:

| Role                     | Skill Command           | Purpose                                        |
| ------------------------ | ----------------------- | ---------------------------------------------- |
| **researcher**           | `/researcher`           | Research and annotate entries, create glossary |
| **linguistic-annotator** | `/linguistic-annotator` | Add translation guidance (LAN notes)           |
| **translator**           | `/translator`           | Translate French → Czech                       |
| **gemini-editor**  | `/gemini-editor`  | External AI review (Gemini)                    |
| **opus-editor**    | `/opus-editor`    | Opus language expert review (no corruption)    |
| **editor**               | `/editor`               | Review translations for quality                |
| **conductor**            | `/conductor`            | Final quality gate                             |
| **executive-director**   | `/executive-director`   | Orchestrate workflow                           |
| **project-status**       | `/project-status`       | Track progress, report status                  |
| **workflow-architect**   | `/architect`            | Maintain the agent system                      |
| **frontend-dev**        | `/frontend-dev`         | AstroJS PWA development, UI features           |
| **listmonk-copywriter** | `/listmonk-copywriter`  | Email copywriting, campaign content            |
| **listmonk-admin**       | `/listmonk-admin`       | Newsletter infrastructure, lists, subscribers  |
| **teamcouch**            | `/teamcouch`            | Post-session retrospective, skill evolution    |

## Core Workflow

### Standard Translation Pipeline

1. **Research Phase** (researcher) - Extract entities, historical context, RSR comments
2. **Annotation Phase** (linguistic-annotator) - Translation guidance, LAN comments
3. **Translation Phase** (translator) - Translate preserving Marie's voice, TR comments
4. **Gemini Review** (gemini-editor) - External AI review, GEM comments
5. **Editor Review** (editor) - Check naturalness and accuracy, RED comments
6. **Final Approval** (conductor) - Ensure literary quality, CON comments

## File Format Standards

### Entry Files

Each entry file (e.g., `content/_original/001/1873-01-11.md`) contains:

1. **YAML frontmatter** with metadata, location, entities
2. **Paragraph clusters** - each paragraph with its ID and annotations

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
entities:
  people: [Howard_family]
  places: [Nice, Promenade_des_Anglais]
---

%% 001.0001 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
Samedi 11 janvier 1873. Il fait un temps superbe...
%% 2025-12-07T16:00:00 RSR: First entry of the diary... %%

%% 001.0002 %%
Next paragraph here...
```

### Comment Notation

All roles use timestamped comments:

```
%% YYYY-MM-DDThh:mm:ss ROLE: Comment text %%
```

Role codes: RSR (Researcher), LAN (Linguistic), TR (Translator), GEM (Gemini), RED (Editor), CON (Conductor), PPX (Perplexity)

### Paragraph IDs

Format: `%% XXX.YYYY %%` (carnet.paragraph)

- IDs are sequential across the ENTIRE carnet, never resetting
- Example: Carnet 002 runs from 002.0001 to 002.2453

### Glossary Tags

Format: `[#Entity_Name](../_glossary/category/ENTITY_NAME.md)`

- Filenames use CAPITAL_ASCII: uppercase, underscores only
- Categories: people/, places/, culture/, society/, languages/

## Tooling Conventions

- **All project scripts are TypeScript** (in `/src/scripts/` and `/src/shared/`)
- **Python is used only for ad-hoc tasks** (e.g., docx analysis) and is always run via **`uv`**, never bare `pip` or `python`
- **`just` commands** wrap all common operations — prefer them over direct npm/npx
- **Always run `git diff` in a subagent** — diffs consume large amounts of context window. Use a Task subagent (e.g., Bash or general-purpose) for any git diff, git log with patches, or similar output-heavy git operations. Summarize the results back to the main conversation.

## CRITICAL: Use Justfile Commands

**ALWAYS prefer `just` commands over direct npm/npx commands.**

The project has a comprehensive `justfile` in the root directory. Show available commands with:

```bash
just          # List all commands
just help     # Detailed help
```

### Common Commands

```bash
# Setup & Build
just setup              # Install deps + build TypeScript
just build-ts           # Build shared package
just clean-ts           # Clean TypeScript artifacts

# Frontend
just fe-dev             # Start dev server
just fe-build           # Production build
just fe-preview         # Preview build

# Glossary Management
just glossary-validate  # Validate all links
just glossary-stats     # Usage statistics
just glossary-find ID   # Find references to entry
just glossary-orphaned  # List unreferenced entries

# Compilation
just compile 001 cz     # Compile carnet 001 for Czech
just build cz           # Compile all Czech carnets
just open 001 cz        # Open in browser

# AI Workflow
just ed 015             # Start Executive Director
just research ENTRY     # Run researcher on entry
just pipeline ENTRY     # Full translation pipeline

# Deployment (automatic on push)
just deploy-status      # Check container status
just deploy-logs        # View logs
```

### Why Justfile?

1. **Consistency** - Same commands work across all environments
2. **Discovery** - `just --list` shows all available operations
3. **Documentation** - Each command is self-documenting
4. **Safety** - Complex operations tested and verified

## Key Resources

- **Justfile**: `/justfile` - ALL commands (use `just help`)
- **Project Journey**: `/JOURNEY.md` - How the project evolved (narrative changelog)
- **Stewardship**: `/docs/STEWARDSHIP.md` - Principles, norms, ethical framework
- **Infrastructure**: `/docs/INFRASTRUCTURE.md` - Progress tracking & collaboration
- **Content Guide**: `/content/CLAUDE.md` - Diary content structure
- **Frontend Guide**: `/src/frontend/CLAUDE.md`
- **Shared Package Guide**: `/src/shared/CLAUDE.md` + `/src/shared/README.md`
- **Role Details**: `/.claude/skills/*/SKILL.md`
- **Glossary Skill**: `/.claude/skills/glossary/SKILL.md`
- **Glossary Entries**: `/content/_original/_glossary/`
- **Run Reports**: `/.claude/reports/` - Team run reports and WATCHLIST
- **Teamcouch**: `/.claude/skills/teamcouch/SKILL.md` - Post-session retrospective

## Progress Tracking

Use `/project-status` to check and track progress:

```bash
/project-status              # Full project overview
/project-status cz           # Czech translation status
/project-status cz 001       # Specific carnet status
/project-status log cz 001 "Description of work done"
```

See `/docs/INFRASTRUCTURE.md` for the full documentation hierarchy and collaboration system.

## Quality Standards

1. **Maintain Marie's Voice**: 19th century sophistication with youthful energy
2. **Cultural Adaptation**: Make references accessible without losing meaning
3. **Natural Target Language**: Should read as literature, not translation
4. **Complete Documentation**: Every decision tracked in comments
5. **Research First**: No entry should be translated until research is complete

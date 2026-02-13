# .claude/skills/ — Role Definitions

This directory contains skill definitions for Claude Code agents working on the project.

## Structure

```
skills/
├── CLAUDE.md                      # This file
│
├── _shared/                       # Shared resources across skills
│   └── paragraph_format.md        # Standard paragraph format spec
│
├── researcher/
│   └── SKILL.md                   # Historical research + footnotes
├── linguistic-annotator/
│   └── SKILL.md                   # Translation guidance
├── translator/
│   └── SKILL.md                   # Translation role (future)
├── editor/
│   └── SKILL.md                   # Quality review role (future)
├── conductor/
│   └── SKILL.md                   # Final approval role (future)
├── executive-director/
│   └── SKILL.md                   # Team lead & orchestration
├── glossary/
│   └── SKILL.md                   # Glossary management
├── entry-restructurer/
│   └── SKILL.md                   # Entry format standardization
├── project-status/
│   └── SKILL.md                   # Progress tracking & reporting
├── workflow-architect/
│   └── SKILL.md                   # System maintenance
├── gemini-czech-editor/
│   └── SKILL.md                   # External Gemini review (future)
├── stewardship/
│   └── SKILL.md                   # Social content generation
└── frontend-dev/
    └── SKILL.md                   # Frontend development (AstroJS PWA)
```

## Pipelines

### Pipeline 1: Source Preparation (ACTIVE)

Get every original French entry properly researched, annotated, and footnoted before any translation begins. Uses **Agent Teams** for parallel processing.

| Order | Role | Code | Model | Purpose |
|-------|------|------|-------|---------|
| 1 | Researcher | RSR | Sonnet/Opus | Entity extraction, glossary, footnotes, historical context |
| 2 | Linguistic Annotator | LAN | Sonnet/Opus | Period vocabulary, idioms, Marie's quirks, translation guidance |
| 3 | Evaluator | EVAL | Sonnet | Quality verification (ED or subagent) |

**Agent Teams setup**: ED is team lead in delegate mode. RSR and LAN are persistent teammates that self-claim tasks from a shared task list with dependency chains. EVAL is handled by ED or a Sonnet subagent. Sonnet is sufficient for verification work; Opus for complex entries.

**Status**: Source preparation is COMPLETE for all 106 carnets. This pipeline is now only needed for gap-filling.

### Pipeline 2: Translation (ACTIVE)

| Order | Role | Code | Model | Purpose |
|-------|------|------|-------|---------|
| 1 | Translator (x3) | TR | Opus | French → target language (3 parallel agents) |
| 2 | Editor | RED | Opus | Real-time quality review (reviews as entries appear) |
| 3 | Gemini Editor | GEM | External | Cross-model review (Bash subagent, not teammate) |
| 4 | Conductor | CON | Opus | Final literary approval |

**Proven configuration** (Feb 12 runs): 5 persistent agents (3 TR + RED + CON), GEM dispatched as needed. No RSR/LAN needed — source prep complete for all 106 carnets.

## Support Roles

| Role | Purpose |
|------|---------|
| Executive Director | Team lead, orchestration, quality evaluation |
| Glossary | Create and maintain glossary entries |
| Entry Restructurer | Standardize entry format |
| Project Status | Track progress, generate reports |
| Workflow Architect | Maintain the agent system itself |
| Stewardship | Generate social media content |
| Frontend Dev | AstroJS PWA development, UI features, components |

## Invoking Skills

### Standalone (single entry, manual)
```
/researcher              # Research a specific entry
/linguistic-annotator    # Annotate a specific entry
/project-status cz 001   # Check carnet 001 status
```

### Agent Teams (bulk processing)
```
/executive-director 015   # ED creates team for carnet 015
```

ED will:
1. Create team "source-015"
2. Spawn RSR (Opus) and LAN (Opus) teammates
3. Create tasks with dependency chains for all entries
4. Monitor, evaluate, report

## Skill File Format

Each `SKILL.md` follows this structure:

```markdown
---
name: skill-name
description: Brief description for skill listing
---

# Role Name

You are the [role] for the Marie Bashkirtseff project.

## Agent Teams Protocol
[How to work in a team: self-claiming, messaging, etc.]

## Primary Responsibilities
...

## Output Format
...

## Quality Standards
...
```

## Adding New Skills

1. Create directory: `.claude/skills/skill-name/`
2. Create `SKILL.md` with frontmatter and instructions
3. Document in this file
4. Add to `/CLAUDE.md` Available Roles table

## Related Documentation

- `/CLAUDE.md` - Project-wide guidance
- `/docs/INFRASTRUCTURE.md` - Collaboration system
- `/.claude/project_config.md` - Model allocation, thresholds, pipeline config

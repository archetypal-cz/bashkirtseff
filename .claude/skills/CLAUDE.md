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
│   └── SKILL.md                   # Translation role
├── editor/
│   └── SKILL.md                   # Quality review role
├── conductor/
│   └── SKILL.md                   # Final approval role
├── executive-director/
│   └── SKILL.md                   # Team lead & orchestration
├── glossary/
│   └── SKILL.md                   # Glossary management
├── glossary-tagger/
│   └── SKILL.md                   # Auto-tagging pipeline (alias scan + AI eval)
├── entry-restructurer/
│   └── SKILL.md                   # Entry format standardization
├── project-status/
│   └── SKILL.md                   # Progress tracking & reporting
├── workflow-architect/
│   └── SKILL.md                   # System maintenance
├── opus-editor/
│   └── SKILL.md                   # Opus language expert review
├── fablelous/
│   └── SKILL.md                   # Fable word-level polish pass (post-CON)
├── vox/
│   └── SKILL.md                   # Voice of the Reader — opposing artistic review (Fable)
├── teamcouch/
│   └── SKILL.md                   # Post-session retrospective
├── stewardship/
│   └── SKILL.md                   # Social content generation
├── frontend-dev/
│   └── SKILL.md                   # Frontend development (AstroJS PWA)
├── listmonk-copywriter/
│   └── SKILL.md                   # Email copywriting & campaign content
├── listmonk-admin/
│   └── SKILL.md                   # Listmonk API administration
└── codex-review-loop/
    └── SKILL.md                   # Codex-driven correctness review loop (frontend)
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

**Status**: Source preparation is COMPLETE for all 107 carnets (000–106). This pipeline is now only needed for gap-filling.

### Pipeline 2: Translation (ACTIVE)

| Order | Role | Code | Model | Purpose |
|-------|------|------|-------|---------|
| 1 | Translator (x3) | TR | Opus | French → target language (3 parallel agents) |
| 2 | Opus Editor (optional) | OPS | Opus | Language expert cross-validation review (no corruption) |
| 3 | Editor | RED | Opus | Quality review; reviews in near-real-time when OPS is skipped |
| 4 | Conductor | CON | Opus | Final literary approval |

**Order note**: OPS (when used) runs before or alongside RED; CON is always last. FAB (fablelous) is an optional word-level polish pass that runs after CON. VOX (vox) is an optional opposing review — an adversarial reader-side counterpart to FAB — that also runs post-CON, on files clean in git.

**Proven configuration** (Feb 12 runs): 5 persistent agents (3 TR + RED + CON), OPS dispatched as needed. No RSR/LAN needed — source prep complete for all 107 carnets.

## Support Roles

| Role | Purpose |
|------|---------|
| Executive Director | Team lead, orchestration, quality evaluation |
| Glossary | Create and maintain glossary entries |
| Glossary Tagger | Auto-tag entries with glossary references |
| Entry Restructurer | Standardize entry format |
| Project Status | Track progress, generate reports |
| Workflow Architect | Maintain the agent system itself |
| Stewardship | Generate social media content |
| Frontend Dev | AstroJS PWA development, UI features, components |
| Listmonk Copywriter | Email copywriting, campaign drafting & review |
| Listmonk Admin | Newsletter infrastructure, lists, subscribers, templates |

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

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
│   └── SKILL.md                   # Historical research role
├── linguistic-annotator/
│   └── SKILL.md                   # Translation guidance role
├── translator/
│   └── SKILL.md                   # Translation role
├── editor/
│   └── SKILL.md                   # Quality review role
├── conductor/
│   └── SKILL.md                   # Final approval role
├── executive-director/
│   └── SKILL.md                   # Workflow orchestration
├── glossary/
│   └── SKILL.md                   # Glossary management
├── entry-restructurer/
│   └── SKILL.md                   # Entry format standardization
├── project-status/
│   └── SKILL.md                   # Progress tracking & reporting
├── workflow-architect/
│   └── SKILL.md                   # System maintenance
├── gemini-czech-editor/
│   └── SKILL.md                   # External Gemini review
└── stewardship/
    └── SKILL.md                   # Social content generation
```

## Translation Pipeline Roles

The core translation workflow uses these roles in order:

| Order | Role | Code | Purpose |
|-------|------|------|---------|
| 1 | Researcher | RSR | Historical context, entity extraction |
| 2 | Linguistic Annotator | LAN | Translation guidance |
| 3 | Translator | TR | French → Czech translation |
| 4 | Gemini Editor | GEM | External AI review |
| 5 | Editor | RED | Quality check, naturalness |
| 6 | Conductor | CON | Final literary approval |

## Support Roles

| Role | Purpose |
|------|---------|
| Executive Director | Orchestrate multi-entry workflows |
| Glossary | Create and maintain glossary entries |
| Entry Restructurer | Standardize entry format |
| Project Status | Track progress, generate reports |
| Workflow Architect | Maintain the agent system itself |
| Stewardship | Generate social media content |

## Invoking Skills

Use slash commands in Claude Code:

```
/researcher              # Start research role
/translator              # Start translation role
/project-status cz 001   # Check Czech carnet 001 status
```

## Skill File Format

Each `SKILL.md` follows this structure:

```markdown
---
name: skill-name
description: Brief description for skill listing
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch
---

# Role Name

You are the [role] for the Marie Bashkirtseff project.

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
- `/prompts/` - Style guides and workflows

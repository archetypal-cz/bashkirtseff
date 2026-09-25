# .claude/skills/ — Role Definitions

This directory contains skill definitions for Claude Code agents working on the project.

## Structure

```
skills/
├── CLAUDE.md                      # This file
│
├── _shared/                       # Shared resources across skills
│   ├── editing_rules.md           # Splice-safe edits, _original as reference, locks, gates, commits
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
│   └── SKILL.md                   # Word-level polish pass (post-CON)
├── vox/
│   └── SKILL.md                   # Voice of the Reader — opposing artistic review
├── teamcouch/
│   └── SKILL.md                   # Post-session retrospective
├── report-triage/
│   └── SKILL.md                   # Reader bug reports → fixes
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

### Pipeline 1: Source Preparation (COMPLETE — gap-filling only)

Get every original French entry properly researched, annotated, and footnoted before any translation begins. Uses **Agent Teams** for parallel processing.

| Order | Role | Code | Model | Purpose |
|-------|------|------|-------|---------|
| 1 | Researcher | RSR | Sonnet/Opus | Entity extraction, glossary, footnotes, historical context |
| 2 | Linguistic Annotator | LAN | Sonnet/Opus | Period vocabulary, idioms, Marie's quirks, translation guidance |
| 3 | Evaluator | EVAL | Sonnet | Quality verification (ED or subagent) |

**Agent Teams setup**: ED is team lead in delegate mode. RSR and LAN are persistent teammates that self-claim tasks from a shared task list with dependency chains. EVAL is handled by ED or a Sonnet subagent. Sonnet is sufficient for verification work; Opus for complex entries.

**Status**: Source preparation is COMPLETE for all 107 carnets (000–106). This pipeline is now only needed for gap-filling.

### Pipeline 2: Translation (ACTIVE) — canonical order

This table is the single statement of the pipeline; other files link here.

| Step | Role | Code | Sets flag | Gate after the step (lead runs) |
|------|------|------|-----------|---------------------------------|
| 1 | Translator | TR | `translation_complete` | `just verify-carnet {lang} {c}` PASS + `just splicescan {lang} {c}` empty, before RED |
| 2 | Opus Editor [optional, lead's choice per wave] | OPS | `opus_reviewed` | same gate |
| 3 | Editor | RED | `editor_approved` | same gate |
| 4 | Conductor | CON | `conductor_approved` | same gate, **re-run after CON** → lead commits the carnet |
| 5 | Fablelous [optional, post-CON] | FAB | `redaction_passes` entry | same gate → lead commits |
| 6 | Vox [optional, post-CON] | VOX | `redaction_passes` entry | same gate → lead commits; runs only on committed files |

- One writer per carnet at a time: a stage starts only after the previous stage's agent has finished (ED "Translation wave").
- Workers never commit; the lead commits per carnet with explicit paths after the gate passes (`_shared/editing_rules.md` §6).
- All roles run on the session's model (Opus 5.5 or Fable — the owner chooses per run); none is pinned to a smaller model.
- After an edit wave the lead also runs an independent read-only reviewer (ED skill).

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

### Bulk processing
```
/executive-director cz 015   # ED runs a translation wave for carnet 015 in cz
```

ED runs each stage as a background agent per carnet, runs the gates between stages, commits per carnet and writes a run report (see the ED skill). Source-prep teams (RSR+LAN) are only for gap-filling.

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

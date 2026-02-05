# Project Infrastructure & Collaboration System

This document describes the progress tracking, documentation hierarchy, and collaborative workflow infrastructure for the Marie Bashkirtseff diary translation project.

## Documentation Hierarchy

The project uses a hierarchical documentation system where each level describes the appropriate abstraction for that context.

### CLAUDE.md Files (Working Context)

CLAUDE.md files provide guidance for AI agents working at that level:

```
/
├── CLAUDE.md                      # Project-wide: mission, navigation, roles
│
├── src/
│   ├── CLAUDE.md                  # Diary content: formats, IDs, workflow states
│   ├── _original/
│   │   ├── CLAUDE.md              # French sources: annotation types, research
│   │   └── _glossary/
│   │       └── CLAUDE.md          # Glossary system: categories, linking
│   └── cz/
│       └── CLAUDE.md              # Czech translations: conventions, memory
│
├── frontend/
│   └── CLAUDE.md                  # ✅ Exists - frontend-specific
│
├── shared/
│   └── CLAUDE.md                  # ✅ Exists - shared library
│
├── scripts/
│   └── CLAUDE.md                  # CLI commands, hooks, utilities
│
└── .claude/
    └── skills/
        └── CLAUDE.md              # Skills registry, role relationships
```

### README.md Files (Progress Tracking)

README.md files in content directories track progress with structured TODOs and changelogs:

```
src/
├── _original/
│   ├── PROGRESS.md                # French source overall status
│   ├── 001/
│   │   └── README.md              # Carnet 001 source progress
│   ├── 002/
│   │   └── README.md              # Carnet 002 source progress
│   └── ...
│
├── cz/
│   ├── PROGRESS.md                # Czech translation overall status
│   ├── 001/
│   │   └── README.md              # Carnet 001 Czech progress
│   └── ...
│
└── en/                            # Future: English translations
    ├── PROGRESS.md
    └── 001/
        └── README.md
```

## Carnet README.md Format

Each carnet folder contains a README.md tracking progress:

```markdown
# Carnet XXX — [Language] [Translation|Source]

<!-- SYNC: This file syncs with src/_original/XXX/README.md -->
<!-- WORKER: @github_username since YYYY-MM-DD -->

## Summary
Brief description of this carnet's content and time period.

## Status
| Phase       | Done | Total | Worker     |
|-------------|------|-------|------------|
| Research    | 35   | 35    | @username  |
| Annotation  | 35   | 35    | @username  |
| Translation | 30   | 35    | @username  |
| Gemini      | 25   | 35    | —          |
| Edited      | 25   | 35    | —          |
| Approved    | 20   | 35    | —          |

## TODOs

### From Original (auto-synced)
<!-- BEGIN:SYNC:ORIGINAL -->
<!-- Items here are synced from src/_original/XXX/README.md -->
<!-- END:SYNC:ORIGINAL -->

### Local
- [ ] `TR-FIX` entry-date: Description of issue
- [ ] `RED-FLAG` entry-date: Description of issue

### Propose to Original
<!-- BEGIN:SYNC:PROPOSE -->
<!-- Items here will be synced upstream to original -->
<!-- END:SYNC:PROPOSE -->

## What's Done
Summary of completed work with attribution.

## Changelog
<!-- Newest first, ISO timestamps -->

### YYYY-MM-DDThh:mm:ss @username
Description of changes made.
```

## TODO Tag Convention

Tags in README.md files trigger synchronization and categorization:

| Tag | Direction | Meaning |
|-----|-----------|---------|
| `RSR-NEEDED` | Original → Translations | Research needed in source |
| `RSR-DONE` | Close item | Research completed |
| `LAN-UPDATE` | Original → Translations | Annotation changed |
| `LAN-NEEDED` | Original only | Needs linguistic annotation |
| `RSR-PROPOSE` | Translation → Original | Found research issue |
| `LAN-PROPOSE` | Translation → Original | Suggests annotation |
| `RSR-LAN-UPDATE` | Auto-generated | Original source text or annotations changed |
| `TR-FIX` | Local only | Translation-specific fix |
| `RED-FLAG` | Local only | Editor flagged issue |
| `CON-BLOCK` | Local only | Conductor blocked approval |
| `CRITICAL` | All directions | High-priority issue |

## Source Change Detection

When an original entry file is edited (RSR or LAN comments added/changed), the system
automatically notifies translations that may need updating.

### How It Works

1. **Source hashing**: Each translation stores a `source_hash` in frontmatter
2. **Change detection**: When original edited, hash is recalculated
3. **Notification**: If hash differs, `RSR-LAN-UPDATE` TODO added to translation README

### Translation Frontmatter

```yaml
---
date: 1873-01-11
carnet: "001"
source_hash: "a1b2c3d4e5f6g7h8"   # Hash of French text content
translation_complete: true
---
```

### Initializing Source Hashes

Run once to populate hashes in existing translations:

```bash
npx tsx scripts/hooks/init-source-hashes.ts           # All
npx tsx scripts/hooks/init-source-hashes.ts cz        # Czech only
npx tsx scripts/hooks/init-source-hashes.ts cz 001    # Specific carnet
```

### Workflow

1. Researcher adds RSR comment to `_original/001/1873-01-11.md`
2. Post-edit hook detects source hash changed
3. TODO added to `cz/001/README.md`: `RSR-LAN-UPDATE 1873-01-11: Original source updated`
4. Translator sees TODO, reviews changes, updates translation if needed
5. After updating, translator can update `source_hash` to new value

### Sync Markers

```markdown
<!-- BEGIN:SYNC:ORIGINAL -->
Items auto-populated from original README.md
<!-- END:SYNC:ORIGINAL -->

<!-- BEGIN:SYNC:PROPOSE -->
Items to be pushed upstream to original
<!-- END:SYNC:PROPOSE -->
```

## Branch Strategy

Each translation language has its own branch:

```
main                    # French originals + infrastructure
├── cz                  # Czech translations
├── en                  # English translations (future)
└── de                  # German translations (future)
```

### Workflow

1. **Source work** (research, annotation) happens on `main`
2. **Translation work** happens on language branches
3. **Sync**: Language branches regularly merge from `main` to get source updates
4. **Infrastructure**: Changes to shared code go to `main`, then propagate

### Commit Convention

```
[lang-carnet] Brief description

Detailed description if needed.

Co-Authored-By: @github_username
Co-Authored-By: Claude <noreply@anthropic.com>
```

Examples:
- `[cz-001] Translated entries 1873-01-11 to 1873-01-15`
- `[main-glossary] Added 12 new person entries`
- `[infra] Updated TODO sync script`

## Claude Code Hooks (Planned)

TypeScript hooks will automate progress tracking:

```
scripts/
└── hooks/
    ├── index.ts              # Hook runner entry point
    ├── pre-session.ts        # Show work status on Claude start
    ├── post-edit.ts          # Update README after edits
    ├── pre-commit.ts         # Sync TODOs, update PROGRESS
    └── lib/
        ├── readme-parser.ts  # Parse/update README.md files
        ├── todo-sync.ts      # TODO propagation logic
        └── progress.ts       # Aggregate progress stats
```

### Hook Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  PRE-SESSION (on Claude Code start)                         │
│  ├─ Read worker config                                      │
│  ├─ Show assigned work and status                           │
│  └─ Check for upstream changes or conflicts                 │
├─────────────────────────────────────────────────────────────┤
│  POST-EDIT (after Write to src/**/*)                        │
│  ├─ Update carnet README.md progress table                  │
│  ├─ Append changelog entry with timestamp + @user           │
│  └─ Check for TODO triggers                                 │
├─────────────────────────────────────────────────────────────┤
│  PRE-COMMIT (before git commit)                             │
│  ├─ Sync TODOs: original ↔ translations                     │
│  ├─ Update PROGRESS.md aggregates                           │
│  └─ Validate touched files                                  │
└─────────────────────────────────────────────────────────────┘
```

## Worker Configuration (Planned)

Contributors configure their work in `.claude/WORKER_CONFIG.yaml`:

```yaml
github_user: kerray
working_language: cz

assigned_carnets:
  - "001"
  - "002"

roles:
  - researcher
  - translator
  - editor

auto_commit:
  enabled: true
  frequency: "after_session"
  message_prefix: "[cz]"
```

This file is gitignored or kept in personal forks.

## Future Features (Roadmap)

### GitHub Issues Integration

Each carnet+language combination as a GitHub issue:
- Assigned to worker
- Labels for phase (research, translation, review)
- Hooks can query via `gh` CLI

### Staleness Detection

Work claimed but not updated for N days becomes "stale":
- Offered to other contributors
- Original worker notified

### Automatic Work Discovery

New contributors see available work:
- Unclaimed carnets by language
- Stale claims available for takeover
- Priority ordering by project needs

### Multi-Contributor Coordination

- Lock files prevent simultaneous edits
- Conflict detection and resolution
- Progress dashboards

## Using the Project Status Skill

The `/project-status` skill provides:

```
/project-status              # Overall project status
/project-status cz           # Czech translation status
/project-status cz 001       # Carnet 001 Czech status
/project-status --bootstrap  # Create missing README/PROGRESS files
```

See `.claude/skills/project-status/SKILL.md` for details.

## Related Documentation

- `/CLAUDE.md` - Main project guidance
- `/README.md` - Project overview
- `/docs/FRONTMATTER.md` - Entry format specification
- `/prompts/Style.md` - Translation style guide
- `/.claude/skills/` - Role definitions

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
├── content/
│   ├── CLAUDE.md                  # Diary content: formats, IDs, workflow states
│   ├── _original/
│   │   ├── CLAUDE.md              # French sources: annotation types, research
│   │   └── _glossary/
│   │       └── CLAUDE.md          # Glossary system: categories, linking
│   └── cz/
│       └── CLAUDE.md              # Czech translations: conventions, memory
│
├── src/
│   ├── frontend/
│   │   └── CLAUDE.md              # Frontend-specific
│   ├── shared/
│   │   └── CLAUDE.md              # Shared TypeScript library
│   └── scripts/
│       └── CLAUDE.md              # CLI commands, hooks, utilities
│
└── .claude/
    └── skills/
        └── CLAUDE.md              # Skills registry, role relationships
```

### README.md Files (Progress Tracking)

README.md files in content directories track progress with structured TODOs and changelogs:

```
content/
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

<!-- SYNC: This file syncs with content/_original/XXX/README.md -->
<!-- WORKER: @github_username since YYYY-MM-DD -->

## Summary

Brief description of this carnet's content and time period.

## Status

| Phase       | Done | Total | Worker    |
| ----------- | ---- | ----- | --------- |
| Research    | 35   | 35    | @username |
| Annotation  | 35   | 35    | @username |
| Translation | 30   | 35    | @username |
| Gemini      | 25   | 35    | —         |
| Edited      | 25   | 35    | —         |
| Approved    | 20   | 35    | —         |

## TODOs

### From Original (auto-synced)

<!-- BEGIN:SYNC:ORIGINAL -->
<!-- Items here are synced from content/_original/XXX/README.md -->
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

| Tag              | Direction               | Meaning                                     |
| ---------------- | ----------------------- | ------------------------------------------- |
| `RSR-NEEDED`     | Original → Translations | Research needed in source                   |
| `RSR-DONE`       | Close item              | Research completed                          |
| `LAN-UPDATE`     | Original → Translations | Annotation changed                          |
| `LAN-NEEDED`     | Original only           | Needs linguistic annotation                 |
| `RSR-PROPOSE`    | Translation → Original  | Found research issue                        |
| `LAN-PROPOSE`    | Translation → Original  | Suggests annotation                         |
| `RSR-LAN-UPDATE` | Auto-generated          | Original source text or annotations changed |
| `TR-FIX`         | Local only              | Translation-specific fix                    |
| `RED-FLAG`       | Local only              | Editor flagged issue                        |
| `CON-BLOCK`      | Local only              | Conductor blocked approval                  |
| `CRITICAL`       | All directions          | High-priority issue                         |

## Keeping Translations in Sync with Originals

### The Problem

The French originals are a living document. Researchers keep adding context, correcting annotations, and refining glossary links — even after a translation has been completed. Without a system, translators would never know that the source they translated from has been updated, and their translations would silently drift out of date.

### The Solution: Source Change Detection

The system automatically detects when a French original changes and notifies the affected translations. It works in three layers:

#### 1. Content hashing

Each translation file stores a `source_hash` in its [frontmatter](https://jekyllrb.com/docs/front-matter/) — a short [fingerprint](https://en.wikipedia.org/wiki/Hash_function#Overview) of the French text at the time of translation. When the original is edited, the system recalculates the hash and compares it:

```yaml
---
date: 1873-01-11
carnet: "001"
source_hash: "a1b2c3d4e5f6g7h8" # Fingerprint of the French text this was translated from
translation_complete: true
---
```

#### 2. Automatic notification

When a hash mismatch is detected (meaning the original changed), a TODO is added to the translation carnet's README:

```
RSR-LAN-UPDATE 1873-01-11: Original source updated — review translation
```

The translator sees this, reviews what changed, updates their translation if needed, and the hash is updated to the new value.

#### 3. Annotation sync

For changes that don't affect the translated text itself (new RSR research notes, updated glossary links), the sync script can propagate them directly into translation files without touching existing translations:

```bash
npx tsx src/scripts/sync-translation.ts 001              # Sync carnet 001
npx tsx src/scripts/sync-translation.ts 001 --dry-run    # Preview what would change
npx tsx src/scripts/sync-translation.ts 001 --lang en    # Specific language only
```

### Initializing Source Hashes

Run once to populate hashes in existing translations:

```bash
npx tsx src/scripts/hooks/init-source-hashes.ts           # All languages
npx tsx src/scripts/hooks/init-source-hashes.ts cz        # Czech only
npx tsx src/scripts/hooks/init-source-hashes.ts cz 001    # Specific carnet
```

### Bidirectional TODO Sync

Translators can also propose changes upstream — for example, if they notice a research error while translating. README sync markers define the direction of flow:

```markdown
<!-- BEGIN:SYNC:ORIGINAL -->

Items auto-populated from the French original's README

<!-- END:SYNC:ORIGINAL -->

<!-- BEGIN:SYNC:PROPOSE -->

Items translators want to push upstream to the original

<!-- END:SYNC:PROPOSE -->
```

## Branch Strategy

Each translation language has its own [branch](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) (a parallel version of the project that can be worked on independently):

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

## Claude Code Hooks

TypeScript [hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) automate progress tracking and sync. These run automatically during Claude Code sessions:

```
src/scripts/hooks/
├── pre-session.ts        # Show work status on Claude Code start
├── guard-git.ts          # Block working-tree-destroying git (PreToolUse/Bash)
├── post-edit.ts          # Update README and detect source changes after edits
├── validate-write.ts     # Validate file format before writing
├── session-end.ts        # End-of-session cleanup
├── bootstrap-readmes.ts  # Create missing README/PROGRESS files
├── init-source-hashes.ts # Initialize source hashes for sync
└── lib/
    ├── readme-parser.ts  # Parse/update README.md files
    ├── todo-sync.ts      # TODO propagation logic
    ├── source-sync.ts    # Source hash calculation and comparison
    ├── progress.ts       # Aggregate progress stats
    ├── config.ts         # Worker configuration
    └── types.ts          # Shared type definitions
```

### How Hooks Fit Together

```
┌─────────────────────────────────────────────────────────────┐
│  PRE-SESSION (on Claude Code start)                         │
│  ├─ Read worker config                                      │
│  ├─ Show assigned work and status                           │
│  └─ Check for upstream changes or conflicts                 │
├─────────────────────────────────────────────────────────────┤
│  GUARD-GIT (PreToolUse, before every Bash call)            │
│  ├─ Inspect the command string                             │
│  ├─ Block working-tree/history-destroying git              │
│  └─ Pass through everything else untouched                 │
├─────────────────────────────────────────────────────────────┤
│  POST-EDIT (after Write/Edit to content/**/*)              │
│  ├─ Update carnet README.md progress table                  │
│  ├─ Compare source hashes → notify translations if changed  │
│  └─ Append changelog entry with timestamp + @user           │
├─────────────────────────────────────────────────────────────┤
│  VALIDATE-WRITE (after Write/Edit completes)               │
│  └─ Check that diary files have valid format                │
├─────────────────────────────────────────────────────────────┤
│  SESSION-END (on Claude Code exit)                          │
│  └─ Cleanup and summary                                     │
└─────────────────────────────────────────────────────────────┘
```

### Git Working-Tree Safety Guard (`guard-git.ts`)

A `PreToolUse` hook (matcher `Bash`) runs `src/scripts/hooks/guard-git.ts`
before every Bash command. It exists because a subagent once ran
`git checkout -- <paths>`, `git stash`, and `git reset` that silently discarded
**uncommitted** work (broken-link fixes that lived only in the working tree).

**Blocked by default** (working-tree- or history-destroying):
`git reset --hard`, `git checkout`/`git restore` targeting paths or `.`,
`git stash` (bare / `push` / `pop` / `drop` / `clear` / `save`),
`git clean -f/-d/-x`, `git push --force`/`--force-with-lease`, `git rebase`
(except `--abort`/`--continue`/`--skip`), `git branch -D`.

**Always allowed:** `git status/diff/log/show/add/commit/fetch/rev-parse/
rev-list/reflog`, `git branch` (list), `git switch -c`, normal `git push`,
`git checkout -b`, and a plain `git checkout <ref>` / `git switch <ref>` branch
switch — including refs with a slash like `feature/x` — plus all non-git Bash
commands. The guard only inspects segments whose command word is `git` (after
stripping `sudo`/`ENV=…` prefixes), so `echo git reset` is allowed.
`checkout`/`restore` is treated as a destructive path overwrite (and blocked)
only on `--`, a bare `.`, `-f`/`--force`, or a positional arg that resolves to an
existing file/dir on disk (relative to the payload `cwd`) — a slash in the name
alone does NOT make it a path, so legit slash-named branches switch cleanly.

**Override + subagent policy.** Subagent (Task) PreToolUse payloads in this
Claude Code version (verified 2.1.158, 2026-05-31, via a one-shot probe hook
that captured the raw stdin JSON) carry an `agent_type` field (e.g.
`"general-purpose"`) and an `agent_id`; the **main agent's payload has no
`agent_type`**. The guard uses this:

- **Subagent** (`agent_type` present) → **hard-block**: destructive git is
  refused and the `GIT_ALLOW_DESTRUCTIVE=1` override is ignored. A subagent that
  thinks it needs a mutating git op must stop and report to its parent.
- **Main agent** (no `agent_type`) → **soft-block**: destructive git is refused
  by default, but prefixing the command with `GIT_ALLOW_DESTRUCTIVE=1` lets a
  human-in-the-loop main agent proceed deliberately.

The guard blocks via the current PreToolUse decision contract
(`hookSpecificOutput.permissionDecision: "deny"` on stdout) and also exits 2
with a stderr message as a fallback for the legacy contract.

## Worker Configuration

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
- `/.claude/skills/` - Role definitions

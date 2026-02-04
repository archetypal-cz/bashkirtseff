---
name: project-status
description: Report project status, track progress, document changes, and manage README/PROGRESS files across the translation project. Use to check what needs to be done, record completed work, or bootstrap tracking files.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Project Status

You manage progress tracking and documentation for the Marie Bashkirtseff diary translation project.

## Primary Commands

### 1. Status Report

Show what's done and what needs to be done:

```
/project-status                    # Full project overview
/project-status cz                 # Czech translation status
/project-status cz 001             # Specific carnet status
/project-status original           # French source status
/project-status original 001       # Specific carnet source status
```

**Output includes:**
- Progress percentages by phase (research, annotation, translation, edit, approval)
- Active workers and their assignments
- Blocked items and dependencies
- Recent changelog entries

### 2. Document Changes

Record completed work in the appropriate README.md:

```
/project-status log cz 001 "Completed editor review for entries 1873-01-20 to 1873-01-25"
```

This will:
- Append a timestamped changelog entry
- Update progress counts if detectable
- Include @username from WORKER_CONFIG.yaml or git config

### 3. Bootstrap Files

Create missing README.md and PROGRESS.md files:

```
/project-status bootstrap              # All missing files
/project-status bootstrap cz           # Czech language files
/project-status bootstrap cz 001       # Specific carnet
```

Uses templates from `docs/templates/`.

### 4. Sync TODOs

Propagate TODO items between original and translations:

```
/project-status sync                   # Full sync
/project-status sync cz                # Sync Czech ↔ original
```

## File Locations

### Progress Files
- `src/_original/PROGRESS.md` - French source overall
- `src/_original/{carnet}/README.md` - Per-carnet source status
- `src/cz/PROGRESS.md` - Czech overall
- `src/cz/{carnet}/README.md` - Per-carnet Czech status
- `src/{lang}/PROGRESS.md` - Other languages

### Templates
- `docs/templates/CARNET_README.md` - Translation carnet template
- `docs/templates/ORIGINAL_CARNET_README.md` - Source carnet template
- `docs/templates/LANGUAGE_PROGRESS.md` - Language overview template

### Configuration
- `.claude/WORKER_CONFIG.yaml` - Per-contributor settings (gitignored)

## README.md Structure

Each carnet README.md contains:

1. **Header** with sync markers and worker attribution
2. **Summary** of carnet content
3. **Status table** with progress by phase
4. **TODOs** in three sections:
   - From Original (auto-synced)
   - Local (this file only)
   - Propose to Original (will sync upstream)
5. **What's Done** summary
6. **Changelog** with timestamped entries

## TODO Tags

Use these tags in TODO items for categorization and sync:

| Tag | Scope | Meaning |
|-----|-------|---------|
| `RSR-NEEDED` | Syncs to translations | Research needed |
| `RSR-DONE` | Closes item | Research completed |
| `LAN-NEEDED` | Original only | Needs annotation |
| `LAN-UPDATE` | Syncs to translations | Annotation changed |
| `RSR-PROPOSE` | Syncs to original | Found research issue |
| `LAN-PROPOSE` | Syncs to original | Suggests annotation |
| `TR-FIX` | Local | Translation fix needed |
| `RED-FLAG` | Local | Editor flagged |
| `CON-BLOCK` | Local | Conductor blocked |
| `CRITICAL` | All | High priority |

## Workflow Integration

### After Translation Work
1. Run `/project-status log cz {carnet} "description"` to record changes
2. Progress counts update automatically from frontmatter analysis

### After Research Work
1. Run `/project-status log original {carnet} "description"`
2. New RSR-NEEDED items propagate to translation READMEs

### Before Committing
1. Run `/project-status sync` to propagate TODOs
2. Review changes to README.md files
3. Include in commit

## Progress Calculation

Progress is calculated by analyzing entry frontmatter:

```yaml
# Entry frontmatter flags
research_complete: true
linguistic_annotation_complete: true
translation_complete: true
gemini_reviewed: true
editor_approved: true
conductor_approved: true
```

The skill counts entries with each flag to generate percentages.

## Example Output

```
=== Czech Translation Status ===

Overall: 127/3300 entries (3.8%)

| Carnet | Entries | RSR | LAN | TR  | GEM | ED  | CON | Worker  |
|--------|---------|-----|-----|-----|-----|-----|-----|---------|
| 000    | 1       | 100%| 100%| 100%| 100%| 100%| 100%| @kerray |
| 001    | 35      | 100%| 100%| 100%| 90% | 86% | 71% | @kerray |
| 002    | 28      | 100%| 100%| 50% | 0%  | 0%  | 0%  | @kerray |
| 003    | 32      | 100%| 0%  | 0%  | 0%  | 0%  | 0%  | —       |
| 004    | 31      | 0%  | 0%  | 0%  | 0%  | 0%  | 0%  | —       |

Active TODOs: 12
- 3 RSR-NEEDED (blocking translation)
- 5 TR-FIX (translation issues)
- 4 RED-FLAG (editor concerns)

Recent Activity:
- 2026-02-04 @kerray: Edited cz/001 entries 1873-01-26 to 1873-01-30
- 2026-02-03 @kerray: Completed cz/002 translation for 14 entries
```

## Implementation Notes

### Reading Progress
1. Glob for `src/{lang}/{carnet}/*.md` files
2. Parse frontmatter for completion flags
3. Count and calculate percentages

### Updating README
1. Read existing README.md
2. Parse sections (Status, TODOs, Changelog)
3. Update relevant section
4. Write back with preserved structure

### Syncing TODOs
1. Read original README.md, extract TODOs with sync tags
2. For each translation README.md:
   - Update `<!-- BEGIN:SYNC:ORIGINAL -->` section
   - Extract `<!-- BEGIN:SYNC:PROPOSE -->` items
3. Merge proposals into original's `<!-- BEGIN:SYNC:TRANSLATIONS -->` section

## Related Documentation

- `/docs/INFRASTRUCTURE.md` - Full infrastructure documentation
- `/docs/templates/` - README templates
- `/CLAUDE.md` - Project guidance

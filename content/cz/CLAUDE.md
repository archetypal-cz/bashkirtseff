# cz/ — Czech Translations

This directory contains Czech translations of Marie Bashkirtseff's diary.

## Structure

```
cz/
├── CLAUDE.md            # This file
├── PROGRESS.md          # Overall Czech translation status
├── Style.md             # Czech-specific style guide
├── TranslationMemory.md # Established terminology
│
├── 000/                 # Translated preface
│   └── README.md        # Carnet progress
├── 001/-106/            # Translated entries
│   └── README.md        # Per-carnet progress
│
└── _archive/            # Old translation versions
```

## Translation File Format

Czech translation files mirror the French originals but include both languages:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
translation_complete: true
editor_approved: true
conductor_approved: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
%% Samedi 11 janvier 1873. Il fait un temps superbe... %%
Sobota 11. ledna 1873. Je nádherné počasí...
%% 2025-12-08T10:00:00 TR: Used "nádherné" for "superbe" to match
Marie's enthusiastic tone. %%
```

**Key points:**
- French original in `%% ... %%` comment before Czech text
- Glossary links use path to `_original/_glossary/`
- TR comments document translation decisions

## Translation Phases

### 1. Translation (TR)
- Translate from annotated French source
- Preserve Marie's voice and style
- Follow established terminology
- Add TR comments for non-obvious choices

**Frontmatter flag**: `translation_complete: true`

### 2. Gemini Review (GEM)
- External AI review for fresh perspective
- Check consistency and naturalness
- Suggest alternative phrasings
- Catch issues Claude might miss

**Frontmatter flag**: `gemini_reviewed: true`

### 3. Editor Review (RED)
- Check naturalness in Czech
- Verify accuracy against French
- Flag awkward phrasing
- Suggest improvements

**Frontmatter flag**: `editor_approved: true`

### 4. Conductor Approval (CON)
- Final literary quality check
- Ensure Marie's voice preserved
- Approve or request revision

**Frontmatter flag**: `conductor_approved: true`

## Style Guidelines

See `Style.md` for full Czech style guide. Key points:

### Marie's Voice
- 19th century sophistication with youthful energy
- Dramatic, sometimes exaggerated emotions
- Sharp wit and self-awareness
- Natural Czech that reads as literature, not translation

### Terminology Consistency
Check `TranslationMemory.md` for established translations of:
- Recurring phrases
- Character names and titles
- Places and institutions
- Period vocabulary

### Cultural Adaptation
- Keep French terms that add flavor (with footnotes)
- Adapt references for Czech readers
- Explain what needs explaining, preserve what should feel foreign

## Comment Types

| Code | Role | Purpose |
|------|------|---------|
| TR | Translator | Translation decisions |
| GEM | Gemini | External AI review notes |
| RED | Editor | Quality notes, suggestions |
| CON | Conductor | Approval, final notes |

## Progress Tracking

Each carnet has a `README.md` tracking:
- Translation/edit/approval counts
- TODOs (local and synced from original)
- Changelog

Use `/project-status cz 001` to check status.

### TODO Tags for Translation Work

| Tag | Meaning |
|-----|---------|
| `TR-FIX` | Translation needs correction |
| `RED-FLAG` | Editor concern |
| `CON-BLOCK` | Conductor blocked approval |
| `TERMINOLOGY` | Check TranslationMemory.md |
| `VOICE` | Marie's voice not captured |

## Common Tasks

### Translate an entry
```bash
/translator    # Invoke translator skill with entry path
```

### Review a translation
```bash
/editor        # Invoke editor skill
```

### Final approval
```bash
/conductor     # Invoke conductor skill
```

### Check what needs work
```bash
/project-status cz           # Overall Czech status
/project-status cz 001       # Carnet 001 status
```

### Record completed work
```bash
/project-status log cz 001 "Edited entries 1873-01-20 to 1873-01-25"
```

## Branch Strategy

Czech translations live on the `cz` branch:
- Regularly merge from `main` to get source updates
- Translation commits use format: `[cz-001] Description`

## Related Documentation

- `/src/_original/CLAUDE.md` - French source materials
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
- `/prompts/Style.md` - General style guide
- `/.claude/skills/translator/SKILL.md` - Translator role
- `/.claude/skills/editor/SKILL.md` - Editor role
- `/.claude/skills/conductor/SKILL.md` - Conductor role

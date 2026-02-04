# en/ — English Translations

This directory contains English translations of Marie Bashkirtseff's diary.

## Structure

```
en/
├── CLAUDE.md            # This file
├── PROGRESS.md          # Overall English translation status
├── Style.md             # English-specific style guide (to create)
├── TranslationMemory.md # Established terminology (to create)
│
├── 000/                 # Translated preface
│   └── README.md        # Carnet progress
├── 001/-106/            # Translated entries
│   └── README.md        # Per-carnet progress
│
└── _archive/            # Old translation versions
```

## Historical Context

Previous English translations (1890 Cassell edition, later editions) were heavily censored. This project aims for the first complete, uncensored English translation.

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

**Frontmatter flag**: `gemini_reviewed: true`

### 3. Editor Review (RED)
- Check naturalness in English
- Verify accuracy against French
- Flag awkward phrasing

**Frontmatter flag**: `editor_approved: true`

### 4. Conductor Approval (CON)
- Final literary quality check
- Ensure Marie's voice preserved
- Approve or request revision

**Frontmatter flag**: `conductor_approved: true`

## Translation File Format

English translation files mirror the French originals:

```markdown
---
date: 1873-01-11
carnet: "001"
source_hash: "a1b2c3d4e5f6g7h8"
translation_complete: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
%% Samedi 11 janvier 1873. Il fait un temps superbe... %%
Saturday, 11 January 1873. The weather is superb...
%% 2026-02-04T12:00:00 TR: Translation note... %%
```

## Comment Types

| Code | Role | Purpose |
|------|------|---------|
| TR | Translator | Translation decisions |
| GEM | Gemini | External AI review notes |
| RED | Editor | Quality notes, suggestions |
| CON | Conductor | Approval, final notes |

## Style Considerations

- Target: educated contemporary English reader
- Preserve 19th century flavor without being archaic
- French terms: keep where they add color, translate where they obstruct
- Titles and honorifics: explain on first use via glossary
- Maintain Marie's dramatic, passionate voice

## Related Documentation

- `/src/_original/CLAUDE.md` - French source materials
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
- `/prompts/Style.md` - General style guide

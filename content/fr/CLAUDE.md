# fr/ — French Modern Edition

This directory contains a modernized French edition of Marie Bashkirtseff's diary.

## Purpose

While `_original/` contains the raw transcription of Marie's manuscripts, this directory provides:
- Standardized spelling and punctuation
- Consistent formatting
- Editorial annotations for modern French readers
- Accessible presentation while preserving authenticity

## Structure

```
fr/
├── CLAUDE.md            # This file
├── PROGRESS.md          # Overall French edition status
├── Style.md             # French edition style guide (to create)
├── EditorialNotes.md    # Editorial conventions (to create)
│
├── 000/                 # Edited preface
│   └── README.md        # Carnet progress
├── 001/-106/            # Edited entries
│   └── README.md        # Per-carnet progress
│
└── _archive/            # Previous versions
```

## Editorial Phases

### 1. Normalization (NRM)
- Standardize 19th century spelling variations
- Consistent punctuation
- Paragraph structure

**Frontmatter flag**: `normalization_complete: true`

### 2. Annotation (ANN)
- Add explanatory footnotes for modern readers
- Clarify obscure references
- Note textual variants if any

**Frontmatter flag**: `annotation_complete: true`

### 3. Review (REV)
- Check consistency
- Verify against original
- Final polish

**Frontmatter flag**: `review_complete: true`

## File Format

French edition files reference the original:

```markdown
---
date: 1873-01-11
carnet: "001"
source_hash: "a1b2c3d4e5f6g7h8"
normalization_complete: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
Samedi 11 janvier 1873. Il fait un temps superbe...
%% 2026-02-04T12:00:00 NRM: Standardized "tems" → "temps" %%
```

## Comment Types

| Code | Role | Purpose |
|------|------|---------|
| NRM | Normalizer | Spelling/punctuation standardization |
| ANN | Annotator | Explanatory notes |
| REV | Reviewer | Editorial review |

## Editorial Principles

1. **Preserve Marie's voice** - Don't modernize her style, only surface forms
2. **Minimal intervention** - Change only what's necessary for readability
3. **Transparent changes** - Document all normalizations in comments
4. **Scholarly integrity** - Original always accessible in `_original/`

## Difference from _original/

| Aspect | _original/ | fr/ |
|--------|------------|-----|
| Spelling | As in manuscript | Standardized |
| Punctuation | As in manuscript | Normalized |
| Annotations | RSR/LAN for translators | For French readers |
| Purpose | Source for translations | Reading edition |

## Related Documentation

- `/src/_original/CLAUDE.md` - Raw manuscript transcription
- `/docs/INFRASTRUCTURE.md` - Progress tracking system

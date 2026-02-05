# content/ — Diary Content

This directory contains all diary content: French originals and translations.

## Structure

```
content/
├── original/            # French source materials
│   ├── 000/             # Carnet 000 (Marie's preface, May 1884)
│   ├── 001/-106/        # Carnets 001-106 (diary entries)
│   ├── _glossary/       # Entity definitions
│   ├── _carnets/        # Carnet metadata
│   ├── _summary/        # Book summaries
│   └── _workflow/       # Machine state (JSON)
│
├── cz/                  # Czech translations
│   ├── CLAUDE.md        # Czech-specific guidance
│   ├── PROGRESS.md      # Overall Czech status
│   ├── 000/-106/        # Translated entries
│   └── Style.md         # Czech style guide
│
├── uk/                  # Ukrainian translations
│   ├── CLAUDE.md        # Ukrainian-specific guidance
│   ├── PROGRESS.md      # Overall Ukrainian status
│   └── 000/-106/        # Translated entries
│
├── en/                  # English translations
│   ├── CLAUDE.md        # English-specific guidance
│   ├── PROGRESS.md      # Overall English status
│   └── 000/-106/        # Translated entries
│
└── fr/                  # French modern edition
    ├── CLAUDE.md        # French edition guidance
    ├── PROGRESS.md      # Overall French status
    └── 000/-106/        # Edited entries
```

## Entry File Format

Every entry follows this structure:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
entities:
  people: [Howard_family, Maman]
  places: [Nice, Promenade_des_Anglais]
research_complete: true
linguistic_annotation_complete: true
---

%% 001.0001 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
Samedi 11 janvier 1873. Il fait un temps superbe...
%% 2025-12-07T16:00:00 RSR: First entry of the diary... %%
%% 2025-12-07T17:00:00 LAN: "superbe" - consider "nádherný" %%

%% 001.0002 %%
Next paragraph...
```

## Paragraph IDs

Format: `%% XXX.YYYY %%`
- `XXX` = 3-digit carnet number (001-106)
- `YYYY` = 4-digit sequential paragraph number

**Critical**: IDs are sequential across the ENTIRE carnet, never resetting between entries.

## Comment Types

All annotations use: `%% YYYY-MM-DDThh:mm:ss CODE: Text %%`

| Code | Role | Purpose |
|------|------|---------|
| RSR | Researcher | Historical context, entity identification |
| LAN | Linguistic Annotator | Translation guidance, idioms |
| TR | Translator | Translation decisions, alternatives |
| RED | Editor | Quality issues, suggestions |
| CON | Conductor | Final approval notes |
| GEM | Gemini | External AI contributions |
| PPX | Perplexity | External AI contributions |

## Glossary Links

Format: `%% [#Display_Name](../_glossary/category/FILENAME.md) %%`

- Filenames: CAPITAL_ASCII (uppercase, underscores, no accents)
- Categories: `people/`, `places/`, `culture/`, `society/`, `languages/`
- Always use relative paths from entry location

## Progress Tracking

Each carnet has a `README.md` tracking:
- Completion status by phase
- Active TODOs
- Changelog with timestamps

See `/docs/INFRASTRUCTURE.md` for full progress tracking documentation.

## Working with Content

### To research an entry
```bash
just research 1873-01-11    # Or use /researcher skill
```

### To translate an entry
```bash
just translate 1873-01-11 cz    # Or use /translator skill
```

### To check progress
```bash
/project-status cz 001    # Carnet 001 Czech status
```

## Related Documentation

- `/original/CLAUDE.md` - French source specifics
- `/cz/CLAUDE.md` - Czech translation specifics
- `/uk/CLAUDE.md` - Ukrainian translation specifics
- `/en/CLAUDE.md` - English translation specifics
- `/fr/CLAUDE.md` - French modern edition specifics
- `/original/_glossary/CLAUDE.md` - Glossary system
- `/docs/FRONTMATTER.md` - Detailed frontmatter spec

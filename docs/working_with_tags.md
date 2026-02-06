# Working with Tags (Glossary System)

## Overview

The Bashkirtseff diary project uses a comprehensive tagging system to cross-reference people, places, and concepts throughout Marie's journals. Each tag corresponds to a glossary entry that provides context and research notes.

## Tag Format Standards

### CAPITAL_ASCII Standard

- **Format**: `CAPITAL_LETTERS_ONLY.md`
- **Character Set**: [ASCII](https://en.wikipedia.org/wiki/ASCII) only (no accents or special characters)
- **Examples**:
  - `MARIE_BASHKIRTSEFF.md`
  - `THEATRE_FRANCAIS.md` (not Théâtre_Français.md)
  - `CHATEAU_D_AZAY.md` (not Château_d'Azay.md)

### Benefits

- Prevents duplicate files with different casing
- Eliminates encoding issues with accented characters
- Ensures consistent references across all platforms
- Simplifies programmatic access and validation

## Directory Structure

```
content/_original/_glossary/
├── culture/
│   ├── art/          # Artworks, artistic movements
│   ├── historical/   # Historical events and figures
│   ├── history/      # General historical references
│   ├── holidays/     # Holidays and celebrations
│   ├── literature/   # Books, authors, literary references
│   ├── music/        # Musical works, composers
│   ├── newspapers/   # Publications and periodicals
│   └── theater/      # Plays, theatrical references
├── people/
│   ├── aristocracy/  # Titled nobility
│   ├── artists/      # Painters, sculptors, performers
│   ├── core/         # Central figures in Marie's life
│   ├── doctors/      # Medical professionals
│   ├── family/       # Family members
│   ├── mentioned/    # Briefly mentioned individuals
│   ├── politicians/  # Political figures
│   ├── recurring/    # Regular acquaintances
│   ├── religious/    # Clergy and religious figures
│   ├── servants/     # Household staff
│   ├── teachers/     # Instructors and tutors
│   └── writers/      # Authors and journalists
├── places/
│   ├── churches/     # Religious buildings
│   ├── cities/       # Major cities
│   ├── hotels/       # Hotels and inns
│   ├── residences/   # Houses and villas
│   ├── schools/      # Educational institutions
│   ├── social/       # Social venues (clubs, cafes)
│   ├── theaters/     # Performance venues
│   ├── towns/        # Smaller towns
│   └── travel/       # Travel destinations
└── society/
    ├── aristocracy/  # Noble institutions
    ├── artists/      # Artistic societies
    ├── clubs/        # Social clubs
    └── politics/     # Political organizations
```

## Using Tags in Diary Entries

Tags belong to **paragraph clusters** within diary entries. They appear as comment lines (`%% ... %%`) immediately after the paragraph ID, before any annotations or text. For the full paragraph format specification, see [`.claude/skills/_shared/paragraph_format.md`](../.claude/skills/_shared/paragraph_format.md).

In the **entry frontmatter**, entities are also listed for entry-level indexing (see [`content/CLAUDE.md`](../content/CLAUDE.md)).

### Tag Line Format

```markdown
%% [#FILENAME](../_glossary/category/subcategory/FILENAME.md) [#OTHER](../_glossary/category/OTHER.md) %%
```

Multiple tags for the same paragraph go on a single comment line, space-separated.

### Example in Context

```markdown
%% 001.0020 %%
%% [#NICE](../_glossary/places/cities/NICE.md) [#DUKE_OF_HAMILTON](../_glossary/people/core/DUKE_OF_HAMILTON.md) %%
%% 2025-12-07T10:00:00 LAN: "promenade" - fashionable walk %%
A la promenade, j'ai vu le duc de Hamilton.
```

### Guidelines

1. Always use the relative fully categorized path
2. Tag format: `[#Display_Name](../_glossary/category/subcategory/FILENAME.md)`
3. Display name and filename should match exactly (CAPITAL_ASCII format)
4. Tags are placed on a **comment line** (`%% ... %%`), not inline in the text

## Creating New Glossary Entries

Glossary entries use [YAML frontmatter](https://jekyllrb.com/docs/front-matter/) and paragraph clusters (same system as diary entries). For the full glossary format specification, see [`.claude/skills/glossary/SKILL.md`](../.claude/skills/glossary/SKILL.md).

The easiest way to create or manage glossary entries is via the `/glossary` skill in Claude Code.

### Template

```markdown
---
id: ENTRY_ID
name: Human Readable Name
type: Person | Place | Culture | Society
category: people/core
research_status: Stub | Moderate | Comprehensive
last_updated: 2026-02-06
---

%% GLO_ENTRY_ID.0001 %%
## Overview

%% GLO_ENTRY_ID.0002 %%
%% YYYY-MM-DDThh:mm:ss RSR: Research note about this entry %%
Description of the person/place/concept...

%% GLO_ENTRY_ID.0003 %%
## Connection to Marie Bashkirtseff

%% GLO_ENTRY_ID.0004 %%
%% [#Related_Entry](../category/RELATED_ENTRY.md) %%
How this relates to Marie's life and diary...

%% GLO_ENTRY_ID.0005 %%
## Research Notes

%% GLO_ENTRY_ID.0006 %%
See annotations above for detailed research notes.
```

### Key differences from diary entries
- Paragraph IDs use `GLO_` prefix: `GLO_DINA.0004` (not `001.0004`)
- Cross-references use relative paths from the entry's location
- `research_status` tracks how complete the entry is

## Best Practices

1. **Consistency**: Always use CAPITAL_ASCII format for filenames
2. **Categorization**: Choose the most specific category available
3. **Research**: Fill in stub entries as research progresses
4. **Cross-references**: Link between related glossary entries
5. **Sources**: Always cite sources for historical information
6. **Updates**: Keep glossary entries updated as new diary books are processed

## ASCII Conversion Rules

| Original       | ASCII Replacement |
| -------------- | ----------------- |
| À, Á, Â, Ä     | A                 |
| È, É, Ê, Ë     | E                 |
| Ì, Í, Î, Ï     | I                 |
| Ò, Ó, Ô, Ö     | O                 |
| Ù, Ú, Û, Ü     | U                 |
| Ç              | C                 |
| Ñ              | N                 |
| ' (apostrophe) | \_                |
| - (hyphen)     | \_                |
| Space          | \_                |

## CLI Tools

All glossary management commands are available via `just`. Run `just` or `just help` for the full list.

### Discovery & Reporting

```bash
just glossary-stats              # Usage statistics (total entries, per-category counts)
just glossary-find ENTRY_ID      # Find all diary entries referencing a glossary entry
just glossary-search PATTERN     # Search glossary entries by name pattern
just glossary-entry-report ID    # Detailed report for a single entry
```

### Validation

```bash
just glossary-missing            # List referenced entries that don't exist (broken links)
just glossary-orphaned           # List glossary entries not referenced anywhere
```

### Migration

```bash
# Convert old-format entries to paragraph cluster format
npx tsx src/scripts/restructure-glossary.ts --category people/core
npx tsx src/scripts/restructure-glossary.ts --category people/core --dry-run --verbose
```

### Programmatic Utilities

The shared TypeScript package (`@bashkirtseff/shared`) provides ID validation:

```typescript
import { isValidGlossaryId, toCapitalAscii } from '@bashkirtseff/shared';

isValidGlossaryId('THEATRE_FRANCAIS')  // true
toCapitalAscii('Théâtre Français')     // "THEATRE_FRANCAIS"
```

## Troubleshooting

### Broken Links

1. Run `just glossary-missing` to identify broken links
2. Check if file exists with different casing
3. Create stub if genuinely missing (use `/glossary` skill)
4. Update link if path is incorrect

### Duplicate Entries

1. Check for case variations (Marie.md vs MARIE.md)
2. Check for accent variations (Théâtre.md vs Theatre.md)
3. Merge content into CAPITAL_ASCII version
4. Update all references

### Category Confusion

1. Review category definitions above
2. Consider primary role/function
3. When in doubt, use most general category
4. Can be moved later if needed

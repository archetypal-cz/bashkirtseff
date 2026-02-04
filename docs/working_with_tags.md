# Working with Tags (Glossary System)

## Overview

The Bashkirtseff diary project uses a comprehensive tagging system to cross-reference people, places, and concepts throughout Marie's journals. Each tag corresponds to a glossary entry that provides context and research notes.

## Tag Format Standards

### Current Standard (To Be Implemented)
- **Format**: `CAPITAL_LETTERS_ONLY.md`
- **Character Set**: ASCII only (no accents or special characters)
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
src/_original/_glossary/
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

### Format
```markdown
Marie visited the [#LOUVRE](../_glossary/places/social/LOUVRE.md) with [#PAUL](../_glossary/people/mentioned/PAUL.md).
```

### Guidelines
1. Always use the full categorized path
2. Tag format: `[#DISPLAY_NAME](../_glossary/category/subcategory/FILENAME.md)`
3. Display name can be mixed case for readability
4. Filename must match exactly (CAPITAL_ASCII format)

## Maintenance Tools

### 1. migrate_glossary.py
Moves glossary files from flat structure to categorized directories based on CSV mapping.
```bash
python3 migrate_glossary.py
```

### 2. categorize_remaining.py
Auto-categorizes uncategorized files based on name patterns.
```bash
python3 categorize_remaining.py
```

### 3. create_glossary_mapping.py
Creates JSON mapping of all glossary files and their locations.
```bash
python3 create_glossary_mapping.py
```

### 4. update_glossary_links.py
Updates all diary entry links to use new categorized paths.
```bash
python3 update_glossary_links.py
```

### 5. validate_glossary_links.py
Validates all glossary links in diary entries.
```bash
python3 validate_glossary_links.py
```

### 6. create_missing_glossary_stubs.py
Creates stub files for missing glossary entries referenced in diaries.
```bash
python3 create_missing_glossary_stubs.py
```

### 7. standardize_glossary_names.py (To Be Created)
Converts all glossary filenames to CAPITAL_ASCII format.
```bash
python3 standardize_glossary_names.py
```

## Creating New Glossary Entries

### Template
```markdown
# [Name/Title]

## Basic Information
- Type: [category - subcategory]
- Full Name: [If applicable]
- Birth/Death: [If applicable]
- Role: [Brief description]

## Description
[Detailed description of the person/place/concept]

## Connection to Marie Bashkirtseff
[How this relates to Marie's life and diary]

## Historical Context
[Relevant historical background]

## References in Diary
- Book X, Date: [Context of mention]
- Book Y, Date: [Context of mention]

## Research Notes
- Created: [Date]
- Sources: [List sources]
- Confidence: [High/Medium/Low]
- Needs Research: [What aspects need more investigation]

## External References
- [Wikipedia or other reliable sources]
```

### Stub Format (Auto-generated)
```markdown
# [Name]

## Basic Information
- Type: [category - subcategory]
- Status: Stub entry (automatically generated)

## Description
[No description available - stub entry created from diary references]

## References in Diary
[Multiple references found - needs research]

## Research Notes
- Created: [Date]
- Auto-generated stub from broken link detection
- Needs proper research and content
```

## Best Practices

1. **Consistency**: Always use CAPITAL_ASCII format for filenames
2. **Categorization**: Choose the most specific category available
3. **Research**: Fill in stub entries as research progresses
4. **Cross-references**: Link between related glossary entries
5. **Sources**: Always cite sources for historical information
6. **Updates**: Keep glossary entries updated as new diary books are processed

## ASCII Conversion Rules

| Original | ASCII Replacement |
|----------|-------------------|
| À, Á, Â, Ä | A |
| È, É, Ê, Ë | E |
| Ì, Í, Î, Ï | I |
| Ò, Ó, Ô, Ö | O |
| Ù, Ú, Û, Ü | U |
| Ç | C |
| Ñ | N |
| ' (apostrophe) | _ |
| - (hyphen) | _ |
| Space | _ |

## Troubleshooting

### Broken Links
1. Run `validate_glossary_links.py` to identify broken links
2. Check if file exists with different casing
3. Create stub if genuinely missing
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
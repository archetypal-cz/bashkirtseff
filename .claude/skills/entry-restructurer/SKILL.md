---
name: entry-restructurer
description: Restructure Marie Bashkirtseff diary entries with proper frontmatter and paragraph clustering. Use when original entries need format standardization.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# Entry Restructurer

You restructure Marie Bashkirtseff diary entries to conform to the canonical format with proper frontmatter and paragraph clustering.

## Your Task

Given a diary entry file path, restructure it to follow the canonical format. You will:
1. Ensure frontmatter exists and is complete
2. Properly cluster paragraphs with correct numbering
3. Ensure ONE empty line between paragraph clusters
4. Ensure NO empty lines within a paragraph cluster

## Canonical Format

### Overall File Structure:
```
---
YAML frontmatter
---

%% BB.PP1 %%
%% [#tags] %%
%% annotations %%
First paragraph text (usually heading/date)

%% BB.PP2 %%
%% [#tags] %%
%% annotations %%
Second paragraph text
[^footnote_id]: Footnote text

%% BB.PP3 %%
...
```

### Frontmatter Template:
```yaml
---
date: YYYY-MM-DD              # from filename
title: French date heading    # full date (e.g., "Samedi 11 janvier 1873")
book: NN                      # book number (01, 02, etc.)
location: City                # Marie's location on this day
para_start: N                 # first paragraph number (for validation)
people:                       # list of people mentioned (CAPITAL_ASCII format)
  - Person1
  - Person2
places:                       # list of places mentioned
  - Place1
  - Place2
themes:                       # thematic tags
  - theme1
  - theme2
status: source_ready          # or needs_research, needs_annotation
---
```

**`para_start`**: Required for entries that don't start at paragraph 1. The paragraph numbering is continuous across the entire book, so entries after the first need this field for validation to work correctly. Check the previous entry's last paragraph ID to determine the correct value.

### Paragraph Cluster Structure:

A **paragraph cluster** contains:
1. **Paragraph ID** (first line): `%% BB.PP %%` where BB = book number, PP = paragraph number
2. **Tags line** (optional): `%% [#Tag1](path) [#Tag2](path) %%`
3. **Annotations** (any number, in order: LAN, RSR, RED, CON): `%% YYYY-MM-DDThh:mm:ss TYPE: note %%`
4. **Original French text** (one or more lines)
5. **Footnotes** (if any): `[^BB.PP.N]: Footnote text`

**Critical Rules:**
- NO empty lines within a cluster
- ONE empty line between clusters
- Paragraph ID is ALWAYS the first line of the cluster
- All annotations come BEFORE text, never after
- Footnotes belong with the paragraph they reference

## Date Heading: First Paragraph Cluster

**CRITICAL**: The date heading (e.g., `# Samedi 11 janvier 1873`) is:
1. **Its own paragraph cluster** - the FIRST paragraph after frontmatter
2. **Mirrored in frontmatter** - copied to the `title:` field
3. **A tiny cluster** - just the paragraph ID and the heading text

Example:
```
---
date: 1873-01-12
title: Dimanche 12 janvier 1873
...
---

%% 01.08 %%
# Dimanche 12 janvier 1873

%% 01.09 %%
%% [#tags] %%
A la musique on a beaucoup parlé...
```

**DO NOT** remove the date heading from the text body. Keep it as a paragraph AND mirror it in frontmatter.

## What Follows the Date Heading

Subsequent paragraphs may include:
- **Carnet heading**: "Carnet N° 1" (at start of a new notebook)
- **Editorial note**: "[Passages reproduits par...]"
- **Date/period indicator**: "Du 11 janvier 1873 au 12 février 1873"
- **Location marker**: Just a location tag if entry starts with location
- **Regular diary content**: The actual diary text

## Processing Algorithm

### Step 1: Read the file and analyze structure
- Check if frontmatter exists (starts with `---`)
- Identify all paragraph IDs (`%% NN.PP %%`)
- Note positions of tags, annotations, and text

### Step 2: Create or verify frontmatter
If frontmatter is missing or incomplete:
- Extract date from filename (YYYY-MM-DD)
- Extract title from markdown heading (e.g., "# Samedi 11 janvier 1873")
- Determine book number from path (e.g., `/01/` → "01")
- Identify location from tags (usually first location mentioned or Nice/Paris/Rome)
- Extract people from `[#Person]` tags
- Extract places from `[#Place]` tags
- Infer themes from content

### Step 3: Restructure paragraph clusters
For each paragraph ID found:
1. Collect all content that belongs to this paragraph (until next ID)
2. Identify: tags, annotations (LAN/RSR/RED/CON), text, footnotes
3. Reorder to canonical order: ID → Tags → Annotations → Text → Footnotes
4. Remove internal empty lines
5. Add single empty line after cluster

### Step 4: Handle edge cases
- **Stray `#Document_Humain` or similar tags**: Convert to proper comment format or remove if redundant
- **Annotations after text**: Move before text
- **Multiple empty lines**: Consolidate to single empty line between clusters
- **Tags not on their own line**: Extract to separate line
- **Markdown headings within content**: Decide if they need their own paragraph ID

### Step 5: Validate
- Every paragraph should have a unique ID
- IDs should be sequential (01.01, 01.02, 01.03...)
- No empty lines within clusters
- Single empty line between clusters
- All annotations before text

## Example Transformation

### BEFORE (problematic):
```
# Mercredi 5 février 1873

%% [#Nice](../_glossary/places/cities/NICE.md) [#Duke_of_Hamilton](../_glossary/people/core/DUKE_OF_HAMILTON.md) %%

%% 2025-12-07T16:25:00 RSR: The Var races... %%

%% 01.73 %%

Le jour des courses du Var.
%% 01.74 %%

#Document_Humain
Le matin sont passés devant la villa...
```

### AFTER (correct):
```
---
date: 1873-02-05
title: Mercredi 5 février 1873
book: 01
location: Nice
para_start: 72
people:
  - Duke_of_Hamilton
  - Howard_family
  - Boreel
places:
  - Nice
  - Var_Races
themes:
  - horse_racing
  - society_life
status: source_ready
---

%% 01.72 %%
# Mercredi 5 février 1873

%% 01.73 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
Le jour des courses du Var. Le plus grand jour de la saison pour moi.

%% 01.74 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
%% 2025-12-07T16:25:00 RSR: The Var races - a major social event... %%
Le matin sont passés devant la villa une dizaine de chevaux conduits par des jockeys. Mon Dieu, qu'y a-t-il de plus beau qu'un cheval de course ?
```

## Output

After restructuring, return a summary:
```json
{
  "file": "1873-02-05.md",
  "changes": {
    "frontmatter_created": true,
    "paragraphs_restructured": 10,
    "annotations_moved": 3,
    "empty_lines_fixed": 15,
    "stray_tags_fixed": 2
  },
  "warnings": [
    "Paragraph 01.76 has no text content"
  ],
  "paragraph_ids": ["01.73", "01.74", "01.75", ...],
  "first_paragraph_content": "Le jour des courses du Var..."
}
```

## Reference Files

- Canonical format spec: `./.claude/skills/_shared/paragraph_format.md`
- Example well-formatted entry: `./content/_original/01/1873-01-11.md`
- Glossary location: `./content/_original/_glossary/`

## Validation Scripts

After restructuring, use these uv Python scripts to validate the result:

### 1. Paragraph Parser Validation
```bash
cd ./scripts
uv run paragraph_parser.py validate /path/to/entry.md
```
This validates:
- Paragraph ID sequence (should be sequential: 01.01, 01.02, 01.03...)
- Book number consistency
- Glossary link validity

### 2. Parse and View Statistics
```bash
uv run paragraph_parser.py parse /path/to/entry.md
uv run paragraph_parser.py stats /path/to/entry.md
```
Shows paragraph count, notes by role, word counts.

### 3. Validate Entire Book
```bash
uv run paragraph_parser.py validate /path/to/book_dir/
```
Validates all entries in a book directory.

### 4. Fix Paragraph IDs (if needed)
```bash
uv run paragraph_parser.py fix-ids /path/to/entry.md --start-from 1
```
Renumbers paragraphs starting from a given number.

### Key Validation Functions (from paragraph_utils.py):
- `validate_paragraph_sequence(entry)`: Checks ID sequence
- `validate_glossary_links(entry, glossary_dir)`: Checks glossary links exist
- `get_entry_statistics(entry)`: Returns stats for verification

## Important Notes

1. **Preserve all content**: Never delete text, annotations, or footnotes - only reorganize them
2. **Maintain paragraph numbering**: If the file already has paragraph IDs, preserve them (don't renumber)
3. **Be conservative with themes**: Only add themes clearly evident from content
4. **Location determination**: Check previous entries if location unclear
5. **Book number from path**: `/01/` = book 01, `/00/` = book 00 (preface), etc.

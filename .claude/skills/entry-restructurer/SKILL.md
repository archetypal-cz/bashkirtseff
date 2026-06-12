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

%% CCC.PPP1 %%
%% [#tags] %%
%% annotations %%
First paragraph text (usually heading/date)

%% CCC.PPP2 %%
%% [#tags] %%
%% annotations %%
Second paragraph text
[^footnote_id]: Footnote text

%% CCC.PPP3 %%
...
```

### Frontmatter Template:

The authoritative spec is `docs/FRONTMATTER.md`. The current schema (see e.g. `content/_original/001/1873-01-11.md`):

```yaml
---
date: 1873-01-11              # ISO date from filename
entry_id: "1873-01-11"        # usually same as date
carnet: "081"                 # 3-digit carnet number from path, QUOTED
location: Nice                # Marie's location on this day
locations: [Nice, Promenade_des_Anglais]  # all locations, primary FIRST (optional)
entities:
  people:
    - Duke_of_Hamilton        # CAPITAL_ASCII-compatible names
  places:
    - Nice
workflow:
  research_complete: true
  linguistic_annotation_complete: true
  last_modified: 2026-02-10T23:30:00
  modified_by: RSR
para_start: 1                 # first paragraph number in this entry
para_end: 7                   # last paragraph number
---
```

Do NOT use the obsolete fields `title:`, `book:`, top-level `people:`/`places:`/`themes:`, or `status:` — entity lists live under `entities:`, workflow state under `workflow:`.

**`para_start`**: Required — paragraph numbering is continuous across the entire carnet, so every entry after the first starts mid-sequence. Check the previous entry's `para_end` (or last paragraph ID) to determine the correct value. Validate with `just check-para-start {carnet}`.

After setting static fields, run `just update-frontmatter {carnet}` to populate calculated fields (counts, Marie's age).

### Paragraph Cluster Structure:

A **paragraph cluster** contains:
1. **Paragraph ID** (first line): `%% CCC.PPPP %%` — 3-digit carnet number, 4-digit zero-padded paragraph number (e.g. `%% 081.0003 %%`). Some older files still use 2-digit IDs or `[//]: # (NN.XXXX)` markers — preserve the file's existing ID values (don't renumber), but use `%% ... %%` format for anything you add.
2. **Tags line(s)** (optional): `%% [#Tag1](path) [#Tag2](path) %%` — may span several lines
3. **Annotations** (any number, in order: LAN, RSR, RED, CON): `%% YYYY-MM-DDThh:mm:ss TYPE: note %%`
4. **Original French text** (one or more lines)
5. **Footnotes** (if any): `[^CC.PP.N]: Footnote text`

**Critical Rules:**
- NO empty lines within a cluster
- ONE empty line between clusters
- Paragraph ID is ALWAYS the first line of the cluster
- All annotations come BEFORE text, never after
- Footnotes belong with the paragraph they reference

## Date Heading: First Paragraph Cluster

**CRITICAL**: The date heading (e.g., `# Samedi 11 janvier 1873`) is:
1. **Its own paragraph cluster** - the FIRST paragraph after frontmatter
2. **A tiny cluster** - just the paragraph ID and the heading text

Example:
```
---
date: 1873-01-12
...
---

%% 001.0008 %%
# Dimanche 12 janvier 1873

%% 001.0009 %%
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
- Identify all paragraph IDs (`%% CCC.PPPP %%`, or legacy variants)
- Note positions of tags, annotations, and text

### Step 2: Create or verify frontmatter
If frontmatter is missing or incomplete:
- Extract `date`/`entry_id` from filename (YYYY-MM-DD)
- Determine `carnet` number from path (e.g., `/081/` → "081", quoted)
- Identify `location` from tags (usually first location mentioned or Nice/Paris/Rome)
- Extract `entities.people` from `[#Person]` tags
- Extract `entities.places` from `[#Place]` tags
- Set `para_start`/`para_end` from the first/last paragraph IDs
- Preserve any existing `workflow:` flags

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
- IDs should be sequential (001.0001, 001.0002, 001.0003... — continuous across the carnet)
- No empty lines within clusters
- Single empty line between clusters
- All annotations before text

## Example Transformation

### BEFORE (problematic):
```
# Mercredi 5 février 1873

%% [#Nice](../_glossary/places/cities/NICE.md) [#Duke_of_Hamilton](../_glossary/people/core/DUKE_OF_HAMILTON.md) %%

%% 2025-12-07T16:25:00 RSR: The Var races... %%

%% 001.0073 %%

Le jour des courses du Var.
%% 001.0074 %%

#Document_Humain
Le matin sont passés devant la villa...
```

### AFTER (correct):
```
---
date: 1873-02-05
entry_id: "1873-02-05"
carnet: "001"
location: Nice
entities:
  people:
    - Duke_of_Hamilton
    - Howard_family
    - Boreel
  places:
    - Nice
    - Var_Races
workflow:
  research_complete: true
  linguistic_annotation_complete: false
  last_modified: 2026-06-12T12:00:00
  modified_by: RSR
para_start: 72
para_end: 74
---

%% 001.0072 %%
# Mercredi 5 février 1873

%% 001.0073 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
Le jour des courses du Var. Le plus grand jour de la saison pour moi.

%% 001.0074 %%
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
  "paragraph_ids": ["001.0073", "001.0074", "001.0075", ...],
  "first_paragraph_content": "Le jour des courses du Var..."
}
```

## Reference Files

- Canonical format spec: `.claude/skills/_shared/paragraph_format.md`
- Frontmatter spec: `docs/FRONTMATTER.md`
- Example well-formatted entry: `content/_original/001/1873-01-11.md`
- Glossary location: `content/_original/_glossary/`

## Validation Commands

After restructuring, validate with the `just` commands (the old `paragraph_parser.py` scripts no longer exist):

```bash
just check-frontmatter {carnet}        # Missing/incomplete frontmatter in a carnet
just check-para-start {carnet}         # Missing para_start fields
just update-frontmatter {carnet}       # Recalculate counts/age after structural changes
just glossary-missing                  # Glossary links pointing at nonexistent entries
just verify-carnet {lang} {carnet}     # Full mechanical gate (for translation trees)
```

## Important Notes

1. **Preserve all content**: Never delete text, annotations, or footnotes - only reorganize them
2. **Maintain paragraph numbering**: If the file already has paragraph IDs, preserve them (don't renumber)
3. **Location determination**: Check previous entries if location unclear
4. **Carnet number from path**: `/001/` = carnet 001, `/000/` = carnet 000 (preface), etc.

---
name: glossary
description: Manage Marie Bashkirtseff diary glossary entries. Create, restructure, and maintain glossary entries with paragraph clusters. Use when working with glossary entries, cross-references, or the glossary system.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Glossary Manager

You manage the glossary system for the Marie Bashkirtseff diary translation project. The glossary contains encyclopedic entries about people, places, cultural references, and concepts mentioned in Marie's diary.

> **Doing broken-link cleanup or cross-tree tag propagation?** Read
> [`docs/GLOSSARY_LINK_MAINTENANCE.md`](../../../docs/GLOSSARY_LINK_MAINTENANCE.md)
> first. The three broken-link fixes are **REMAP** (link points to an entry that
> moved/renamed → repoint it), **CREATE** (the entity genuinely has no entry → write
> a sourced one at the linked path), and **PRUNE** (the tag is spurious → remove just
> that link). The doc also covers the safe `just propagate-tag` path (and the
> "union all tags" anti-pattern that caused a repo-wide blow-up), the path-depth rule,
> and tool-output caveats.
>
> **Git safety:** subagents must perform NO git mutations (no `checkout`/`reset`/
> `stash`/`clean`/`rebase`/force-push) — read-only git only; if a subagent thinks it
> needs git, it must stop and report. Commit early; uncommitted work is one stray
> `git checkout` from gone. (A `PreToolUse` hook now enforces this.)

## Glossary Entry Format

### New Paragraph Cluster Format

Glossary entries now use the same paragraph cluster format as diary entries, enabling:
- Fine-grained linking between glossary entries
- Timestamped research notes per paragraph
- Language-specific glossary versions
- Deep linking to specific paragraphs

### Example Entry: `content/_original/_glossary/people/core/DINA.md`

```markdown
---
id: DINA
name: Dina Babanina
type: Person
category: people/core
research_status: Stub
last_updated: 2026-02-03
---

%% GLO_DINA.0001 %%
## Basic Information

%% GLO_DINA.0002 %%
Dina Babanina (also spelled Babanin) was Marie Bashkirtseff's cousin and a significant figure in her life.

%% GLO_DINA.0003 %%
## Family Background

%% GLO_DINA.0004 %%
%% [#Georges_Babanine](../people/core/GEORGES_BABANINE.md) %%
%% 2025-12-07T14:47:00 RSR: Updated family background based on 1884-05-02 preface %%
Dina was the daughter of Georges Babanine, Marie's maternal uncle, making her Marie's first cousin.

%% GLO_DINA.0005 %%
## Relationship with Marie

%% GLO_DINA.0006 %%
Despite their different circumstances, Dina and Marie shared a close, lifelong bond.

%% GLO_DINA.0007 %%
## Research Notes

See annotations above for detailed research notes.
```

## Frontmatter Fields

All glossary entries MUST have YAML frontmatter with these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | CAPITAL_ASCII identifier (e.g., `DINA`, `DUKE_OF_HAMILTON`) |
| `name` | Yes | Human-readable display name |
| `type` | Yes | `Person`, `Place`, `Culture`, or `Society` |
| `category` | Yes | Full path (e.g., `people/core`, `places/cities`) |
| `research_status` | Yes | `Stub`, `Moderate`, or `Comprehensive` |
| `last_updated` | Yes | ISO date (YYYY-MM-DD) |

### ID Naming Convention

**CRITICAL**: All glossary IDs MUST use CAPITAL_ASCII format:
- UPPERCASE letters only (A-Z)
- Numbers (0-9) and underscores (_)
- NO accents or special characters (è→E, ç→C)
- Examples: `MARIE_BASHKIRTSEFF`, `THEATRE_FRANCAIS`, `NICE`

### ID Validation Utilities

The shared package provides utilities for ID validation (`src/shared/src/models/glossary.ts`):

```typescript
import {
  isValidGlossaryId,
  toCapitalAscii,
  normalizeGlossaryId,
  GLOSSARY_ID_PATTERN
} from '@bashkirtseff/shared';

// Check if ID is valid CAPITAL_ASCII
isValidGlossaryId('THEATRE_FRANCAIS')  // true
isValidGlossaryId('Théâtre_Français')  // false

// Convert any text to CAPITAL_ASCII
toCapitalAscii('Théâtre Français')     // "THEATRE_FRANCAIS"
toCapitalAscii("Marie Bashkirtseff")   // "MARIE_BASHKIRTSEFF"
toCapitalAscii("Café")                 // "CAFE"

// Pattern: /^[A-Z][A-Z0-9_]*$/
GLOSSARY_ID_PATTERN.test('DUKE_OF_HAMILTON')  // true
```

## Paragraph ID Format

Glossary paragraphs use the `GLO_` prefix to distinguish from diary paragraphs:

```
GLO_{ENTRY_ID}.{NNNN}
```

- `ENTRY_ID`: The glossary entry's ID (e.g., `DINA`, `VISCONTI`)
- `NNNN`: 4-digit sequential number within entry (0001, 0002, etc.)

### Examples:
- `GLO_DINA.0001` - First paragraph of DINA entry
- `GLO_DUKE_OF_HAMILTON.0015` - 15th paragraph of Duke of Hamilton entry

## Paragraph Block Structure

Each paragraph block follows this order:

```
%% GLO_ENTRYID.NNNN %%
%% [#Tag1](relative/path.md) [#Tag2](relative/path.md) %%
%% YYYY-MM-DDThh:mm:ss RSR: research note %%
Content text here...
```

### Rules:
1. **Paragraph ID** on its own line
2. **Tags line** (optional) - cross-references to other glossary entries
3. **RSR annotations** (optional) - research notes with timestamps
4. **Content** - the actual paragraph text
5. **Single empty line** between paragraph blocks

### Section Headers as Paragraphs

Section headers (## and ###) are also paragraph blocks:

```
%% GLO_DINA.0003 %%
## Family Background

%% GLO_DINA.0004 %%
Content about family background...
```

## Cross-References

Link to other glossary entries using the standard tag format:

```markdown
%% [#Duke_of_Hamilton](../people/core/DUKE_OF_HAMILTON.md) [#Nice](../places/cities/NICE.md) %%
```

- Use relative paths from the current entry's location
- Tag format: `[#Display_Name](relative/path/ENTRY_ID.md)`
- Multiple tags on one line, space-separated

## Directory Structure

There are three top-level categories — `people/`, `places/`, `culture/` (there is no top-level `society/`; institutions and social customs live under `culture/`). The authoritative category list is `content/_original/_glossary/_categories.yaml`.

```
content/_original/_glossary/
├── _categories.yaml         # Authoritative category definitions
├── people/                  # aristocracy, artists, core, doctors, family,
│                            # historical, mentioned, politicians, recurring,
│                            # religious, royalty, service, society, writers
├── places/                  # buildings, churches, cities, countries, hotels,
│                            # landmarks, neighborhoods, parks, regions, residences,
│                            # schools, shops, social, streets, theaters, travel,
│                            # venues, villas
└── culture/                 # art, daily_life, fashion, health, history,
                             # institutions, languages, literature, music,
                             # newspapers, social_customs, theater, themes, transport
```

Translations do NOT have their own `_glossary/` trees — all languages link back to `content/_original/_glossary/` (from `content/{lang}/{carnet}/` the relative path is `../../_original/_glossary/…`).

## CLI Tools

### Frontmatter & Aliases

Glossary entries should have YAML frontmatter with an `aliases` field listing the text forms by which the entity appears in Marie's diary. These aliases power the auto-tagger.

```bash
# Ensure all entries have frontmatter (all ~3,260 entries currently have it)
just glossary-fm-ensure --dry-run        # Preview
just glossary-fm-ensure                  # Apply

# Auto-derive aliases from headings/IDs (initial bootstrap)
just glossary-aliases --dry-run          # Preview all
just glossary-aliases --category people  # Apply to people only

# Manual alias management (preferred for researcher refinement)
just glossary-add-alias MAMAN "ma mère"
just glossary-add-alias DUKE_OF_HAMILTON "le duc"
just glossary-remove-alias MAMAN "Maria"

# Set any frontmatter field
just glossary-fm-set MAMAN research_status Comprehensive
just glossary-fm-set DUKE_OF_HAMILTON aliases '["Hamilton", "le duc", "duc de H."]'

# Read frontmatter
just glossary-fm-get MAMAN

# Query across entries (supports --field, --category, --has-field, --no-field, --json, --limit)
just glossary-query --category people/core --field aliases --json
just glossary-query --category people --no-field aliases --limit 20
just glossary-query --has-field aliases --field aliases --json

# Coverage statistics
just glossary-alias-stats
```

#### Alias guidelines

- Aliases should match how Marie actually writes names in the diary text
- Include common variants: "la Howard", "Mlle Howard", "cette Howard"
- Include French forms: "le duc", "la duchesse", "Mme Anitchkoff"
- Auto-derived aliases are a starting point — researchers should refine them
- Generic words (Baron, Comtesse, etc.) are filtered as standalone aliases but kept in multi-word forms

### Finding References

```bash
just glossary-find WALITSKY        # Find all diary entries referencing WALITSKY
just glossary-search PAUL          # Search entries by pattern
just glossary-entry-report DINA    # Detailed report for an entry
just glossary-stats                # Usage statistics
just glossary-orphaned             # List entries with no references
just glossary-missing              # List referenced entries that don't exist
```

### Moving Entries (Recategorization)

Move a glossary entry to a different category and update ALL references across originals and translations:

```bash
just glossary-move BARBIER_DE_SEVILLE culture/music         # Move and update refs
just glossary-move WALITSKY people/recurring --dry-run       # Dry run first
```

**File**: `src/scripts/glossary-move.ts`

The script:
1. Finds the file wherever it currently lives in the glossary tree
2. Moves it to the new category (creating directories if needed)
3. Updates all references in `content/_original/` and `content/{cz,en,uk,fr,es}/`
4. Cleans up empty source directories

### Merging Duplicate Entries

Merge two glossary entries about the same entity. Uses Claude to intelligently combine content:

```bash
just glossary-merge SOPHIE SOPHIE_DOLGIKOFF              # Merge (AI-powered content merge)
just glossary-merge SOPHIE SOPHIE_DOLGIKOFF --dry-run    # Dry run
just glossary-duplicates                                 # Find potential duplicates
```

**File**: `src/scripts/glossary-merge.ts`

The script:
1. Renames all `[#SOURCE]` links to `[#TARGET]` across all content files
2. Updates frontmatter entity lists
3. Calls `claude -p` to intelligently merge the content (deduplicates, preserves all facts)
4. Deletes the source file

Options:
- `--simple` — Skip AI merge, use mechanical append instead
- `--no-delete` — Keep source file after merge
- `--verbose` — Show detailed output

### Format Maintenance

All ~3,260 glossary entries now have YAML frontmatter (the old restructure-glossary.ts migration script no longer exists). For format maintenance use:

```bash
just glossary-fm-ensure --dry-run    # Detect/repair entries lacking frontmatter
just glossary-migrate-flat --dry-run # Migrate flat-path refs to categorized paths
```

When restructuring an entry's body into paragraph clusters by hand, follow the format in this skill: `GLO_ENTRYID.NNNN` IDs, sections as their own paragraph blocks, RSR notes preserved with timestamps.

## Frontend Integration

### Content Loading

The frontend parses glossary entries in `src/frontend/src/lib/content.ts`:

```typescript
// Get all glossary entries
getGlossaryEntries(language?: string): GlossaryEntry[]

// Get single entry by ID
getGlossaryEntry(id: string, language?: string): GlossaryEntry | null
```

### GlossaryEntry Interface

```typescript
interface GlossaryEntry {
  id: string;                    // DINA
  name: string;                  // Dina Babanina
  type?: string;                 // Person
  category?: string;             // people/core
  researchStatus?: string;       // Stub
  lastUpdated?: string;          // 2026-02-03
  summary?: string;              // First paragraph text
  content: string;               // Full markdown content
  paragraphs?: GlossaryParagraph[]; // Parsed paragraph clusters
  hasParagraphClusters?: boolean;   // true if new format
}

interface GlossaryParagraph {
  id: string;          // GLO_DINA.0001
  text: string;        // Raw paragraph content
  html: string;        // HTML-rendered content
  isHeader: boolean;   // true for ## headings
  headerLevel: number; // 1, 2, or 3
  glossaryTags?: GlossaryTag[]; // Cross-references
}
```

### URL Structure

| Language | URL Pattern |
|----------|-------------|
| French (original) | `/glossary/{id}` |
| Czech | `/cz/glossary/{id}` |
| English (future) | `/en/glossary/{id}` |

### Deep Linking

Link to specific paragraphs using hash:
```
/glossary/DINA#p-GLO_DINA-0004
```

Note: Dots in paragraph IDs are converted to dashes for HTML IDs.

## Shared Parser Support

The shared package supports glossary paragraph IDs:

### Patterns (`src/shared/src/parser/patterns.ts`)

```typescript
// Matches both diary and glossary IDs
const PARAGRAPH_ID_PATTERN = /^%%\s*((?:\d{2,3}|GLO_[A-Z0-9_]+))\.(\d+)\s*%%$/;

// Content-only pattern
const PARAGRAPH_ID_CONTENT_PATTERN = /^(?:\d+|GLO_[A-Z0-9_]+)\.\d+$/;
```

## Creating New Entries

### 1. Choose appropriate category:

- `people/core/` - Main figures (family, close friends, obsessions)
- `people/recurring/` - Frequently mentioned people
- `people/mentioned/` - Single or rare mentions
- `places/cities/` - Cities and towns
- `places/venues/` - Hotels, theaters, shops
- `culture/art/` - Paintings, sculptures
- `culture/music/` - Operas, concerts
- `culture/social_customs/` - Balls, races, exhibitions (there is no top-level `society/` — see the directory structure above and `_categories.yaml` for the full list)

### 2. Create file with CAPITAL_ASCII name:

```bash
touch content/_original/_glossary/people/mentioned/BARON_BACH.md
```

### 3. Add frontmatter and content:

```markdown
---
id: BARON_BACH
name: Baron Bach
type: Person
category: people/mentioned
research_status: Stub
last_updated: 2026-02-03
---

%% GLO_BARON_BACH.0001 %%
## Overview

%% GLO_BARON_BACH.0002 %%
%% 2026-02-03T12:00:00 RSR: Mentioned in 1873-02-09 as potential match for Dina %%
Baron Bach was a Russian nobleman mentioned in Marie's diary as a potential marriage prospect for her cousin Dina.

%% GLO_BARON_BACH.0003 %%
## In Marie's Diary

%% GLO_BARON_BACH.0004 %%
First mentioned on February 9, 1873, where Marie writes that he is "assez bon pour Dina" (good enough for Dina).
```

## Updating Existing Entries

### Adding Research Notes

Add timestamped RSR comments below the paragraph ID:

```markdown
%% GLO_DINA.0004 %%
%% 2025-12-07T14:47:00 RSR: Updated based on 1884-05-02 preface %%
%% 2026-02-03T10:00:00 RSR: February 9, 1873 - Baron Bach mentioned as match for Dina %%
Content here...
```

### Adding Cross-References

Add tags line below paragraph ID:

```markdown
%% GLO_DINA.0004 %%
%% [#Georges_Babanine](../people/core/GEORGES_BABANINE.md) [#Marie_Bashkirtseff](../people/core/MARIE_BASHKIRTSEFF.md) %%
%% 2025-12-07T14:47:00 RSR: Family connection note %%
Content here...
```

### Updating Metadata

Edit frontmatter fields:

```yaml
---
id: DINA
name: Dina Babanina
type: Person
category: people/core
research_status: Moderate  # Updated from Stub
last_updated: 2026-02-03   # Update when making changes
---
```

### Illustrations (`images:`)

An entry can carry illustrations (paintings, portraits, photographs). They render
in the entry header on the site — the first one large, the rest in a row beneath:

```yaml
images:
  - src: /images/marie/works/un-meeting.jpg   # path under src/frontend/public/
    caption: "Un meeting (1884), oil on canvas, Musée d'Orsay"
    credit: "Photo: Google Art Project, public domain"
    link: https://www.musee-orsay.fr/en/artworks/un-meeting-54   # optional
    alt: "Six boys in a Paris street, huddled around one holding something"  # optional
```

Only `src` is required; entries without it are dropped. The caption doubles as
alt text unless `alt` overrides it — write a real `alt` when the caption is a
title rather than a description. `credit` carries the rights/source line and
should name the holding institution or public-domain source.

Images live in the original entry file; translated glossary entries inherit them
automatically, so only duplicate the block in a translation when the captions
need translating.

## Quality Standards

- Every entry MUST have complete frontmatter
- Every section MUST have a paragraph ID (when the entry uses paragraph clusters)
- Research notes MUST include timestamps
- Cross-references MUST use relative paths
- IDs MUST be CAPITAL_ASCII (no accents)
- `last_updated` MUST be current when modifying
- **Secondary sources MUST be cited** — facts drawn from Kernberger (2013), Blind (1890), Wikipedia, BNF, etc. carry attribution in the entry text or RSR note (e.g., `Per Kernberger (2013), ...`). Scholarly attribution is non-negotiable.

## Migration Status

**Frontmatter migration is COMPLETE** — all ~3,260 entries have YAML frontmatter (verified 2026-06-12). Body-level paragraph clustering (`GLO_` IDs) is still mixed: research-enriched entries use it, many stubs remain plain markdown. Add paragraph clusters when substantively expanding an entry; don't run bulk conversions.

## Backward Compatibility

The frontend gracefully handles both formats:
- **New format**: Renders paragraph clusters with menus, deep linking
- **Old format**: Falls back to simple markdown rendering

Check `entry.hasParagraphClusters` to determine which rendering path to use.

---
name: glossary
description: Manage Marie Bashkirtseff diary glossary entries. Create, restructure, and maintain glossary entries with paragraph clusters. Use when working with glossary entries, cross-references, or the glossary system.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Glossary Manager

You manage the glossary system for the Marie Bashkirtseff diary translation project. The glossary contains encyclopedic entries about people, places, cultural references, and concepts mentioned in Marie's diary.

## Glossary Entry Format

### New Paragraph Cluster Format

Glossary entries now use the same paragraph cluster format as diary entries, enabling:
- Fine-grained linking between glossary entries
- Timestamped research notes per paragraph
- Language-specific glossary versions
- Deep linking to specific paragraphs

### Example Entry: `src/_original/_glossary/people/core/DINA.md`

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

The shared package provides utilities for ID validation (`shared/src/models/glossary.ts`):

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

```
src/
├── _original/
│   └── _glossary/           # Original glossary (French annotations)
│       ├── people/
│       │   ├── core/        # Main recurring figures
│       │   ├── recurring/   # Frequently mentioned
│       │   └── mentioned/   # Single mentions
│       ├── places/
│       │   ├── cities/
│       │   ├── venues/
│       │   └── countries/
│       ├── culture/
│       │   ├── arts/
│       │   ├── literature/
│       │   ├── music/
│       │   └── languages/
│       └── society/
│           ├── events/
│           └── institutions/
├── cz/
│   └── _glossary/           # Czech glossary (future)
└── en/
    └── _glossary/           # English glossary (future)
```

## Scripts

### Restructure Glossary

Convert old-format entries to paragraph cluster format:

```bash
# Restructure all entries in a category
npx ts-node --esm scripts/restructure-glossary.ts --category people/core

# Restructure single entry
npx ts-node --esm scripts/restructure-glossary.ts --entry DINA --category people/core

# Preview changes without writing
npx ts-node --esm scripts/restructure-glossary.ts --category people/core --dry-run --verbose
```

**File**: `scripts/restructure-glossary.ts`

### What the script does:
1. Parses existing content into sections (by ## headers)
2. Generates paragraph IDs based on entry name (`GLO_ENTRYID.NNNN`)
3. Preserves existing metadata (Research Status, Last Updated)
4. Extracts and preserves RSR notes with timestamps
5. Adds YAML frontmatter with structured data
6. Skips already-restructured entries (detects frontmatter)

## Frontend Integration

### Content Loading

The frontend parses glossary entries in `frontend/src/lib/content.ts`:

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

### Patterns (`shared/src/parser/patterns.ts`)

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
- `culture/arts/` - Paintings, sculptures
- `culture/music/` - Operas, concerts
- `society/events/` - Balls, races, exhibitions

### 2. Create file with CAPITAL_ASCII name:

```bash
touch src/_original/_glossary/people/mentioned/BARON_BACH.md
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

## Quality Standards

- Every entry MUST have complete frontmatter
- Every section MUST have a paragraph ID
- Research notes MUST include timestamps
- Cross-references MUST use relative paths
- IDs MUST be CAPITAL_ASCII (no accents)
- `last_updated` MUST be current when modifying

## Migration Status

The glossary system is being migrated from old format (no paragraph IDs, no frontmatter) to new format (paragraph clusters, YAML frontmatter).

### Completed:
- `people/core/` - 4 entries restructured (ALEXANDRE, BASHKIRTSEFF, DINA, DUKE_OF_HAMILTON)

### Remaining:
- ~3,700 entries in other categories

### How to migrate a category:

```bash
# 1. Preview changes
npx ts-node --esm scripts/restructure-glossary.ts --category places/cities --dry-run --verbose

# 2. Run migration
npx ts-node --esm scripts/restructure-glossary.ts --category places/cities

# 3. Verify in frontend
# Visit /glossary/{entry_id} and check paragraph menu appears
```

## Backward Compatibility

The frontend gracefully handles both formats:
- **New format**: Renders paragraph clusters with menus, deep linking
- **Old format**: Falls back to simple markdown rendering

Check `entry.hasParagraphClusters` to determine which rendering path to use.

# @bashkirtseff/shared

Shared TypeScript models, parsers, renderers, and utilities for the Marie Bashkirtseff Diary translation project.

## Installation

This package is part of the monorepo workspace. From the project root:

```bash
# Install all dependencies
npm install

# Build the shared package
npm run build:shared
```

## Usage

### Importing

```typescript
// Import everything
import * from '@bashkirtseff/shared';

// Import specific modules
import { DiaryEntry, Paragraph } from '@bashkirtseff/shared/models';
import { DiaryParser } from '@bashkirtseff/shared/parser';
import { DiaryRenderer } from '@bashkirtseff/shared/renderer';
import { GlossaryManager } from '@bashkirtseff/shared/utils';
import { LANGUAGE_TAGS } from '@bashkirtseff/shared/constants';
```

## Module Overview

### Models (`/models`)

TypeScript interfaces and factory functions for diary data structures:

| Type | Description |
|------|-------------|
| `DiaryEntry` | A single diary entry with paragraphs, metadata |
| `Paragraph` | Individual paragraph with ID, text, translations, notes |
| `DiaryCarnet` | Collection of entries (Marie's notebooks 000-106) |
| `GlossaryEntryParsed` | Glossary entry with paragraph clusters |
| `CarnetSummaryDocument` | Carnet summary with paragraph clusters |
| `GlossaryLink`, `GlossaryTag` | References to glossary entries |
| `Note` | Timestamped annotation (RSR, LAN, TR, etc.) |

#### Glossary ID Validation

All glossary IDs must use CAPITAL_ASCII format (A-Z, 0-9, underscores only):

```typescript
import {
  isValidGlossaryId,
  toCapitalAscii,
  normalizeGlossaryId,
  GLOSSARY_ID_PATTERN
} from '@bashkirtseff/shared';

// Validate
isValidGlossaryId('THEATRE_FRANCAIS')  // true
isValidGlossaryId('Théâtre_Français')  // false

// Normalize (removes accents, converts to uppercase)
toCapitalAscii('Théâtre Français')     // "THEATRE_FRANCAIS"
toCapitalAscii("Marie Bashkirtseff")   // "MARIE_BASHKIRTSEFF"
toCapitalAscii("Café")                 // "CAFE"
```

### Parser (`/parser`)

Parse diary entries and glossary files from markdown:

```typescript
import { DiaryParser, GlossaryParser } from '@bashkirtseff/shared/parser';

// Parse a diary entry
const parser = new DiaryParser();
const entry = parser.parseFile('src/_original/001/1873-01-11.md');

// Parse a glossary entry
const glossaryParser = new GlossaryParser();
const glossaryEntry = glossaryParser.parseFile('src/_original/_glossary/people/core/DINA.md');

// Parse a carnet summary
import { SummaryParser } from '@bashkirtseff/shared/parser';

const summaryParser = new SummaryParser();
const summary = summaryParser.parseFile('src/_original/001/_summary.md');
```

#### Paragraph ID Patterns

- Diary entries: `%%001.0001%%` (3-digit carnet, 4-digit paragraph)
- Glossary entries: `%%GLO_ENTRY_ID.0001%%` (CAPITAL_ASCII ID, 4-digit paragraph)
- Carnet summaries: `%%SUM.001.0001%%` (SUM prefix, 3-digit carnet, 4-digit paragraph)

### Renderer (`/renderer`)

Convert parsed entries back to markdown:

```typescript
import { DiaryRenderer, GlossaryRenderer } from '@bashkirtseff/shared/renderer';

// Render original entry
const renderer = new DiaryRenderer();
const markdown = renderer.renderOriginalEntry(entry);

// Render translation
const translationMd = renderer.renderTranslationEntry(entry);

// Render glossary entry
const glossaryRenderer = new GlossaryRenderer();
const glossaryMd = glossaryRenderer.renderOriginalEntry(glossaryEntry);

// Render carnet summary
import { SummaryRenderer } from '@bashkirtseff/shared/renderer';

const summaryRenderer = new SummaryRenderer();
const summaryMd = summaryRenderer.renderOriginalSummary(summary);
const summaryTranslationMd = summaryRenderer.renderTranslationSummary(summary);
```

### Utils (`/utils`)

Utility classes for validation, sync, and statistics:

| Class | Description |
|-------|-------------|
| `GlossaryManager` | Validate links, create stubs, check naming |
| `GlossaryReferences` | Find references, orphaned entries |
| `EntrySync` | Sync original → translation paragraphs |
| `TranslationScaffold` | Create translation scaffolds |

```typescript
import { GlossaryManager, GlossaryReferences } from '@bashkirtseff/shared/utils';

// Validate glossary links
const manager = new GlossaryManager('/path/to/project');
const stats = manager.validateLinks();
console.log(`Valid: ${stats.validLinks}, Broken: ${stats.brokenLinks}`);

// Find references to a glossary entry
const refs = new GlossaryReferences('/path/to/project');
refs.buildReverseIndex();
const entries = refs.findReferences('DUKE_OF_HAMILTON');
```

### Constants (`/constants`)

Language tags and mappings:

```typescript
import { LANGUAGE_TAGS, extractLanguagesFromTags } from '@bashkirtseff/shared/constants';

// LANGUAGE_TAGS: { FRENCH: 'French', ENGLISH: 'English', ... }

// Extract languages from glossary tag names
const tags = ['FRENCH', 'RUSSIAN', 'GERMAN'];
const isoLangs = extractLanguagesFromTags(tags); // ['fr', 'ru', 'de']
```

## Standalone Scripts

Scripts in `/scripts` use this package:

| Script | Description |
|--------|-------------|
| `glossary-merge.ts` | Merge duplicate glossary entries |
| `glossary-refs.ts` | Find references, orphans, stats |
| `restructure-glossary.ts` | Convert to paragraph cluster format |
| `scaffold-translation.ts` | Create translation scaffolds |
| `sync-translation.ts` | Sync paragraphs original → translation |

Run via `npx tsx`:

```bash
# Merge glossary entries
npx tsx scripts/glossary-merge.ts merge OLD_TAG NEW_TAG

# Find duplicates
npx tsx scripts/glossary-merge.ts find-duplicates

# Find references to an entry
npx tsx scripts/glossary-refs.ts find DUKE_OF_HAMILTON

# Restructure glossary entries
npx tsx scripts/restructure-glossary.ts --category people/core
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Clean build artifacts
npm run clean
```

## Architecture

```
shared/
├── src/
│   ├── index.ts           # Main exports
│   ├── models/            # TypeScript interfaces
│   │   ├── entry.ts       # DiaryEntry
│   │   ├── paragraph.ts   # Paragraph
│   │   ├── note.ts        # Note
│   │   ├── glossary.ts    # GlossaryLink, GlossaryTag, validation
│   │   ├── glossary-entry.ts # GlossaryEntryParsed
│   │   └── book.ts        # DiaryCarnet
│   ├── parser/            # Markdown → TypeScript
│   │   ├── diary-parser.ts
│   │   ├── glossary-parser.ts
│   │   ├── frontmatter.ts
│   │   └── patterns.ts    # Regex patterns
│   ├── renderer/          # TypeScript → Markdown
│   │   ├── diary-renderer.ts
│   │   └── glossary-renderer.ts
│   ├── utils/             # Utilities
│   │   ├── validation.ts
│   │   ├── statistics.ts
│   │   ├── glossary-manager.ts
│   │   ├── glossary-references.ts
│   │   ├── glossary-merge.ts
│   │   ├── sync.ts
│   │   └── scaffold.ts
│   └── constants/         # Constants and mappings
│       ├── languages.ts
│       └── index.ts
└── dist/                  # Compiled output
```

## Related Documentation

- [Project CLAUDE.md](../CLAUDE.md) - Main project instructions
- [Justfile commands](../justfile) - Preferred CLI interface
- [Glossary SKILL.md](../.claude/skills/glossary/SKILL.md) - Glossary management

# Python to TypeScript Migration

**Date:** 2026-01-30

## Overview

Migrated essential Python scripts to TypeScript to create **unified data models** usable by both CLI tools and the Astro frontend. This eliminates the duplication between `scripts/*.py` and `frontend/src/lib/content.ts`.

## Motivation

- Same `LANGUAGE_TAGS` constant was defined in both Python and TypeScript
- Same regex patterns for parsing paragraphs were duplicated
- Data models (Note, Paragraph, DiaryEntry, etc.) were implemented twice
- Frontend couldn't easily share code with CLI tools

## New Package Structure

```
coslate_bashkirtseff/
├── package.json                     # Root workspace config
├── shared/                          # NEW: Shared TypeScript package
│   ├── package.json                 # @bashkirtseff/shared
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # Main exports
│       ├── models/                  # Data models
│       │   ├── note.ts              # Note interface
│       │   ├── glossary.ts          # GlossaryLink, GlossaryTag
│       │   ├── paragraph.ts         # Paragraph interface
│       │   ├── entry.ts             # DiaryEntry interface
│       │   └── book.ts              # DiaryBook interface
│       ├── parser/                  # Parsing logic
│       │   ├── patterns.ts          # All regex patterns
│       │   ├── frontmatter.ts       # YAML frontmatter handling
│       │   └── paragraph-parser.ts  # Main parser class
│       ├── renderer/                # Output rendering
│       │   └── paragraph-renderer.ts
│       ├── utils/                   # Utilities
│       │   ├── validation.ts        # Paragraph sequence validation
│       │   ├── statistics.ts        # Entry/book statistics
│       │   └── glossary-manager.ts  # Glossary link validation
│       └── constants/               # Shared constants
│           ├── languages.ts         # LANGUAGE_TAGS
│           └── roles.ts             # Note roles (RSR, LAN, TR, etc.)
│
├── scripts/
│   ├── ts/                          # NEW: TypeScript CLI
│   │   ├── package.json             # @bashkirtseff/cli
│   │   ├── tsconfig.json
│   │   ├── cli.ts                   # Commander.js entry point
│   │   └── commands/
│   │       ├── parse.ts             # diary parse <file>
│   │       ├── validate.ts          # diary validate <path>
│   │       ├── stats.ts             # diary stats <path>
│   │       ├── compile.ts           # diary compile <book>
│   │       └── glossary.ts          # diary glossary <cmd>
│   └── *.py                         # Python scripts (kept during transition)
│
└── frontend/
    └── src/lib/
        └── content.ts               # Refactored to import from @bashkirtseff/shared
```

## Migrated Python Scripts

| Python Script | TypeScript Location | Status |
|--------------|---------------------|--------|
| `paragraph_models.py` | `shared/src/models/` | ✅ Migrated |
| `paragraph_parser.py` | `shared/src/parser/paragraph-parser.ts` | ✅ Migrated |
| `frontmatter_utils.py` | `shared/src/parser/frontmatter.ts` | ✅ Migrated |
| `paragraph_utils.py` | `shared/src/utils/validation.ts`, `statistics.ts` | ✅ Migrated |
| `paragraph_renderer.py` | `shared/src/renderer/paragraph-renderer.ts` | ✅ Migrated |
| `glossary_manager.py` | `shared/src/utils/glossary-manager.ts` | ✅ Migrated |
| `compile_book.py` | `scripts/ts/commands/compile.ts` | ✅ Migrated (Markdown only) |
| `compile_all_books.py` | `scripts/ts/commands/compile.ts` | ✅ Migrated |

### Not Migrated (One-off/Deprecated)

- `restructure_book02.py`, `restructure_book04.py` - Book-specific, completed
- `fix_book1_format.py`, `fix_empty_entries.py`, `fix_page_numbers.py` - One-time fixes
- `rename_files.py`, `renumber_book.py` - One-time migrations
- `paragraph_sync.py`, `paragraph_viewer.py` - Interactive curses tools
- `test_*.py` - Can be migrated later with proper test framework
- `update_frontmatter.py` - Still uses Python (complex YAML manipulation)

## CLI Commands

```bash
# Parse entry to JSON
npm run diary -- parse src/_original/01/1873-01-11.md --pretty

# Validate book or entry
npm run diary -- validate src/_original/01/

# Show statistics
npm run diary -- stats src/_original/01/1873-01-11.md

# Compile a book
npm run diary -- compile 01 --language cz

# Compile all books
npm run diary -- compile-all --languages _original cz

# Glossary management
npm run diary -- glossary validate
npm run diary -- glossary create-stubs
npm run diary -- glossary check-naming
npm run diary -- glossary report
```

## Justfile Commands

All Python `uv run` commands have been replaced with `npm run diary`:

```bash
just setup           # npm install && build shared package
just compile 01 cz   # Compile book 01 for Czech
just build           # Compile all Czech books
just build-all       # Compile all books for all languages

just parse FILE      # Parse entry to JSON
just validate PATH   # Validate book/entry
just stats PATH      # Show statistics

just glossary-validate    # Validate glossary links
just glossary-stubs       # Create missing stubs
just glossary-check       # Check naming standards
just glossary-report      # Full report

just build-ts        # Build TypeScript packages
just clean-ts        # Clean TypeScript build artifacts
```

## Frontend Integration

The frontend now imports shared types and utilities:

```typescript
import {
  type GlossaryTag,
  LANGUAGE_TAGS,
  extractLanguagesFromTags,
  parseFrontmatter,
} from '@bashkirtseff/shared';
```

This eliminates ~100 lines of duplicated constants and type definitions.

## Verification

```bash
# Build all packages
npm run build

# Test CLI
npm run diary -- parse src/_original/01/1873-01-11.md --pretty
npm run diary -- stats src/_original/01/1873-01-11.md
npm run diary -- validate src/_original/01/1873-01-11.md

# Build frontend
npm run build:frontend
```

## Rollback Strategy

Python scripts remain unchanged during migration. If issues arise:
1. Edit `justfile` to restore `uv run python scripts/...` commands
2. Python scripts are fully functional as fallback

## Future Work

1. Add HTML conversion to TypeScript compile command (currently Markdown only)
2. Migrate `update_frontmatter.py` when complex YAML handling is needed
3. Add proper test suite with Vitest
4. Consider migrating interactive tools (`paragraph_sync.py`, `paragraph_viewer.py`)

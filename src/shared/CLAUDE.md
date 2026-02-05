# CLAUDE.md - Shared Package

Instructions for Claude Code when working on the @bashkirtseff/shared TypeScript package.

---

## Package Overview

This is the shared TypeScript library providing models, parsers, renderers, and utilities for the Marie Bashkirtseff Diary project. It's consumed by:
- Frontend (Astro PWA)
- Standalone scripts in `/scripts`
- AI translation workflow agents

## CRITICAL: Use Justfile Commands

**Always prefer `just` commands over direct npm/npx commands.**

The project root contains a `justfile` with well-tested, documented commands. This ensures:
- Consistent behavior across development environments
- Proper sequencing of dependent operations
- Documented, discoverable operations

### Quick Reference

```bash
# Show all available commands
just

# Build this package
just build-ts

# Clean build artifacts
just clean-ts

# Full setup
just setup
```

### Justfile Location

The justfile is at the **project root**, not in this package.

---

## Development Workflow

### Building

```bash
# Preferred: Use justfile
just build-ts

# Alternative: Direct npm (if justfile unavailable)
npm run build -w @bashkirtseff/shared
```

### Testing Changes

After modifying this package:

1. Rebuild: `just build-ts`
2. Check frontend still compiles: `just fe-build` (may fail for unrelated reasons)
3. Run relevant scripts to verify functionality

### Watch Mode

For active development:

```bash
cd shared && npm run dev
```

---

## Code Standards

### TypeScript

- Use ES modules (`import`/`export`, not `require`)
- Export types separately from implementations
- Use `type` imports where possible: `import type { ... }`
- All public APIs must have JSDoc comments

### File Organization

```typescript
// 1. Type imports
import type { Paragraph } from './paragraph.js';

// 2. Value imports
import { createParagraph } from './paragraph.js';

// 3. Type exports
export type { MyInterface };

// 4. Value exports
export function myFunction() { ... }
```

### Glossary ID Convention

All glossary IDs MUST be CAPITAL_ASCII format:

```typescript
// Good
'MARIE_BASHKIRTSEFF'
'THEATRE_FRANCAIS'
'DUKE_OF_HAMILTON'

// Bad - accents not allowed
'THÉÂTRE_FRANÇAIS'
'CAFÉ'
```

Use validation utilities:

```typescript
import { isValidGlossaryId, toCapitalAscii } from './models/glossary.js';

// Validate
if (!isValidGlossaryId(id)) {
  const normalized = toCapitalAscii(id);
}
```

---

## Module Structure

### Models (`src/models/`)

Pure TypeScript interfaces and factory functions. No I/O operations.

```typescript
// Interface definition
export interface MyModel {
  id: string;
  // ...
}

// Factory function
export function createMyModel(id: string): MyModel {
  return { id };
}
```

### Parser (`src/parser/`)

Read markdown files and convert to TypeScript models.

- `DiaryParser` - Parse diary entries
- `GlossaryParser` - Parse glossary entries
- `patterns.ts` - Regex patterns (shared)
- `frontmatter.ts` - YAML frontmatter parsing

### Renderer (`src/renderer/`)

Convert TypeScript models back to markdown.

- `DiaryRenderer` - Render diary entries
- `GlossaryRenderer` - Render glossary entries

### Utils (`src/utils/`)

Stateful utilities that may perform I/O.

- `GlossaryManager` - Link validation, stub creation
- `GlossaryReferences` - Reverse index, find references
- `EntrySync` - Sync original → translation
- `TranslationScaffold` - Create translation templates

### Constants (`src/constants/`)

Static data and mappings.

- `languages.ts` - Language tags, ISO codes

---

## Adding New Features

### New Model

1. Create `src/models/my-model.ts`
2. Export from `src/models/index.ts`
3. Add JSDoc comments
4. Rebuild: `just build-ts`

### New Parser

1. Create `src/parser/my-parser.ts`
2. Use patterns from `patterns.ts` or add new ones
3. Export from `src/parser/index.ts`
4. Rebuild: `just build-ts`

### New Utility

1. Create `src/utils/my-utility.ts`
2. Export from `src/utils/index.ts`
3. Consider adding justfile command if user-facing
4. Rebuild: `just build-ts`

---

## Regex Patterns

All parsing patterns are centralized in `src/parser/patterns.ts`.

Key patterns:

| Pattern | Description |
|---------|-------------|
| `PARAGRAPH_ID_PATTERN` | `%%001.0001%%` or `%%GLO_ID.0001%%` |
| `NOTE_PATTERN` | `%%2025-12-07T16:00:00 RSR: ...%%` |
| `GLOSSARY_PATTERN` | `[#Name](../_glossary/path.md)` |
| `GLOSSARY_ID_PATTERN` | `[A-Z][A-Z0-9_]*` (CAPITAL_ASCII) |

When adding new patterns:
1. Add to `patterns.ts`
2. Export from `src/parser/index.ts`
3. Document in comments

---

## Exports

This package uses multiple export paths:

```typescript
// Main entry
import { ... } from '@bashkirtseff/shared';

// Submodules
import { ... } from '@bashkirtseff/shared/models';
import { ... } from '@bashkirtseff/shared/parser';
import { ... } from '@bashkirtseff/shared/renderer';
import { ... } from '@bashkirtseff/shared/utils';
import { ... } from '@bashkirtseff/shared/constants';
```

When adding exports:
1. Add to the relevant `index.ts`
2. Main `src/index.ts` re-exports all submodules

---

## Testing

Currently no formal test suite. Testing is done via:

1. Building successfully
2. Running scripts that use the package
3. Frontend compilation check

---

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
just clean-ts
just build-ts
```

### Import Errors

Check that:
1. File has `.js` extension in imports (ES modules)
2. Type is exported from relevant `index.ts`
3. Package was rebuilt after changes

### Frontend Integration Issues

The frontend depends on this package. After changes:

```bash
just build-ts
# Then check frontend (may fail for unrelated pinia issues)
```

---

## Related Files

- `/justfile` - Project-wide commands (ALWAYS prefer these)
- `/package.json` - Workspace configuration
- `/scripts/` - Standalone scripts using this package
- `/.claude/skills/glossary/SKILL.md` - Glossary management docs

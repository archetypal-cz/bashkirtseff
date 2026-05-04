# scripts/ — CLI & Utility Scripts

This directory contains TypeScript and Python scripts for project automation.

## Structure

```
scripts/
├── CLAUDE.md                        # This file
│
├── hooks/                           # Claude Code hooks
│   ├── pre-session.ts               # Session start
│   ├── post-edit.ts                 # After file edits
│   ├── session-end.ts               # Session end
│   ├── validate-write.ts            # Write validation
│   ├── bootstrap-readmes.ts         # Bootstrap README files
│   ├── init-source-hashes.ts        # Initialize source hashes
│   └── lib/                         # Shared hook utilities
│       ├── config.ts
│       ├── progress.ts
│       ├── readme-parser.ts
│       ├── report.ts
│       ├── source-sync.ts
│       ├── todo-sync.ts
│       └── types.ts
│
├── scaffold-translation.ts          # Generate translation file templates
├── sync-translation.ts              # Sync translations with originals
├── glossary-merge.ts                # Merge duplicate glossary entries
├── glossary-refs.ts                 # Manage glossary references
├── glossary-move.ts                 # Move glossary entries between categories
├── glossary-migrate-flat.ts         # Migrate flat-path glossary refs
├── glossary-dedup.ts                # Analyze/execute glossary dedup plans
├── glossary-frontmatter.ts          # Manage glossary YAML frontmatter
├── glossary-tagger.ts               # Auto-tag entries with glossary refs
├── theme-tagger.ts                  # Add theme tags to entries
├── project-status.ts                # Project progress tracking
├── update-frontmatter.ts            # Update calculated frontmatter fields
├── build-filter-index.ts            # Build filter index for frontend
├── generate-pwa-icons.ts            # Generate PWA icons
├── i18n-diff.ts                     # Compare i18n locale files
├── round-trip-test.ts               # Parse-render round-trip testing
├── debug-roundtrip.ts               # Debug round-trip issues
│
├── epub_kernberger.py               # Kernberger EPUB analysis
├── censored_matching.py             # 1887 censored edition matching
├── docx_verify.py                   # DOCX verification
│
├── extract_czech_text.sh            # Extract Czech text
│
└── _archive/                        # Completed one-time migration scripts
    ├── add-date-headings.ts         # Added date headings (commit 4e2a3e55)
    ├── normalize-entries.ts         # Normalized 3,718 entries (commit d48f5db0)
    ├── split-paragraphs.ts          # Split single-paragraph entries
    ├── split-translation-paragraphs.ts
    ├── debug-timestamps.ts          # Timestamp diagnostic (hardcoded files)
    ├── fr_bulk_copy.py              # French edition bulk copy
    ├── fr_translate_nonfrench.py    # Non-French passage manifest
    └── reformat_old_translations.py # Legacy translation reformatter
```

## Running Scripts

### Via Just (Preferred)
```bash
just help                       # Show all commands
just glossary-stats             # Glossary usage statistics
just glossary-find ID           # Find references to entry
just scaffold 001               # Scaffold translation files
just round-trip-test            # Parser/renderer fidelity test
```

### Via npx
```bash
npx tsx src/scripts/<script>.ts   # Direct execution
```

### Python (via uv)
```bash
uv run --with <deps> python3 src/scripts/<script>.py <args>
```

## Dependencies

Scripts use the `shared` package for:
- `shared/src/parser/` - Markdown/YAML parsing
- `shared/src/models/` - Type definitions
- `shared/src/utils/` - Helper functions

## Related Documentation

- `/justfile` - Task runner commands
- `/src/shared/CLAUDE.md` - Shared library
- `/docs/INFRASTRUCTURE.md` - Hooks system

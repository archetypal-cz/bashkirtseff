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
├── rebuild-carnet.ts                # Rebuild + renumber a carnet from a plan (docs/REBUILD_CARNET.md)
├── lib/rebuild-carnet-core.ts       # …its logic; lib/rebuild-carnet.test.ts = fixture tests
├── rebuild-plan/                    # Draft rebuild plans + REVIEW.md from the tome docx/scans (just rebuild-draft-plan)
├── completeness/                    # Tome docx vs _original completeness report (just source-completeness)
├── scans/                           # Tome scan helpers: page map, figure candidates (just scan-*)
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

## More scripts (not in the tree above)

Gates and checks (run via `just`, see the justfile):

- `verify-carnet.ts` — mechanical gate for a translation carnet (`just verify-carnet cz 015`, must PASS); fr uses `edition_complete`
- `splicescan.awk` — stranded-text scan (`just splicescan cz 015`, must print nothing)
- `check_comment_structure.py` — `%%`-comment structure violations that break rendering
- `check_footnote_glue.py`, `check_footnote_swallow.py` — prose glued onto / swallowed by footnote definitions
- `check_links_repo.py` — repo-wide broken glossary-link scan over all content trees
- `rebuild_audit.py` + `rebuild_audit_exceptions.yaml` — `_original` vs the tome docx/scans (`just rebuild-audit`)
- `renumber-audit.ts` (+ `lib/renumber-audit-core.ts`) — stale pre-renumber IDs in exported reader reports (owner-run)

Fixers and sync helpers:

- `fix_marker_shapes.py`, `fix-inline-comments.py`, `fix-midline-paragraph-ids.ts` — repair `%%` marker shapes / mid-line comments and IDs
- `resync-embedded-french.ts` — restore the embedded French copy in translations from `_original`
- `normalize_uk_frontmatter.py`, `backfill_fr_frontmatter.py` — frontmatter normalisation
- `harvest_footnotes.py` — harvest reader footnotes from a translation into `_original` (`just harvest-footnotes`)
- `_fileio.py` (newline-preserving read, atomic write), `lib/atomic-write.ts`, `lib/carnet.ts` — shared I/O helpers

Glossary tags:

- `dump_tag_audit.py` / `apply_tag_audit.py` — per-paragraph tag audit (`just tag-audit-dump` / `tag-audit-apply`)
- `tag_lib.py`, `tag_reconcile.py`, `tag_sync.py`, `propagate_glossary_tag.py` — make translation tag sets match `_original`
- `glossary_resolve.py`, `remap_broken_glossary_links.py` — repair broken glossary links
- `merges.txt` — batch file for `glossary-merge.ts batch-merge`

Site and misc:

- `build-offline-manifest.ts` — PWA offline manifest; `indexnow.py` — IndexNow submission after deploy
- `open_items_to_json.py` — `.claude/reports/OPEN-ITEMS.md` to JSON for the Open Items page
- `a11y-audit.mjs`, `a11y-contrast-matrix.mjs` — accessibility audit (`a11y-axe-run.mjs`, `a11y-axe-detail.mjs` are obsolete)
- `experiments/` — translation-prompt experiments (see its README)

## Running Scripts

### Via Just (Preferred)
```bash
just help                       # Show all commands
just glossary-stats             # Glossary usage statistics
just glossary-find ID           # Find references to entry
just scaffold 001               # Scaffold translation files
just round-trip-test            # Parser/renderer fidelity test (exit 1 on parse errors; --strict also on DIFF — 324/376 sampled files currently DIFF, known baseline)
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

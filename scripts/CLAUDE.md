# scripts/ — CLI & Utility Scripts

This directory contains TypeScript and Python scripts for project automation.

## Structure

```
scripts/
├── CLAUDE.md                   # This file
│
├── ts/                         # TypeScript scripts (built as npm workspace)
│   ├── cli.ts                  # Main CLI entry point
│   ├── package.json            # TypeScript package config
│   └── dist/                   # Compiled output
│
├── hooks/                      # Claude Code hooks (planned)
│   ├── index.ts                # Hook runner
│   ├── pre-session.ts          # Session start
│   ├── post-edit.ts            # After file edits
│   └── pre-commit.ts           # Before commits
│
├── scaffold-translation.ts     # Generate translation file templates
├── sync-translation.ts         # Sync translations with originals
├── glossary-merge.ts           # Merge duplicate glossary entries
├── glossary-refs.ts            # Manage glossary references
├── restructure-glossary.ts     # Reorganize glossary structure
│
├── migrate-to-carnets.py       # Python migration script
└── deploy-frontend.sh          # Frontend deployment
```

## Running Scripts

### Via Just (Preferred)
```bash
just help                       # Show all commands
just glossary-validate          # Validate glossary links
just compile 001 cz             # Compile carnet for language
```

### Via NPM
```bash
npm run diary -- <command>      # Run CLI commands
npx tsx scripts/ts/cli.ts       # Direct execution
```

### Via Node
```bash
node scripts/ts/dist/cli.js     # After TypeScript build
```

## CLI Commands

The main CLI (`scripts/ts/cli.ts`) provides:

```bash
npm run diary sync <carnet> <lang>    # Sync translation with original
npm run diary compile <carnet> <lang> # Compile carnet for publishing
npm run diary validate                # Validate all files
npm run diary stats                   # Show project statistics
```

## Hooks System (Planned)

TypeScript hooks will automate progress tracking:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `pre-session` | Claude Code start | Show work status, check conflicts |
| `post-edit` | After Write to src/ | Update README progress |
| `pre-commit` | Before git commit | Sync TODOs, validate files |

See `/docs/INFRASTRUCTURE.md` for hook lifecycle details.

## Adding New Scripts

1. Create script in `scripts/` (TypeScript preferred)
2. Add to `justfile` if commonly used
3. Document in this file

## Dependencies

Scripts use the `shared` package for:
- `shared/src/parser/` - Markdown/YAML parsing
- `shared/src/models/` - Type definitions
- `shared/src/utils/` - Helper functions

## Related Documentation

- `/justfile` - Task runner commands
- `/shared/CLAUDE.md` - Shared library
- `/docs/INFRASTRUCTURE.md` - Hooks system

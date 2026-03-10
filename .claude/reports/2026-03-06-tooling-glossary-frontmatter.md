---
date: 2026-03-06
type: tooling
operator: krr
scope: glossary-frontmatter, justfile-cleanup, auto-tagger-prep
---

# Glossary Frontmatter & Alias System

## What was done

### 1. New script: `src/scripts/glossary-frontmatter.ts`

Built a comprehensive CLI for managing glossary entry frontmatter and aliases:

| Command | Purpose |
|---------|---------|
| `ensure` | Add YAML frontmatter to entries missing it |
| `aliases` | Auto-derive aliases from headings/IDs |
| `set` | Set any frontmatter field on any entry |
| `get` | Show entry's frontmatter |
| `query` | JSON-queryable bulk read with filters (`--field`, `--category`, `--has-field`, `--no-field`, `--json`, `--limit`) |
| `add-alias` | Add a single alias to an entry |
| `remove-alias` | Remove a single alias from an entry |
| `stats` | Alias coverage statistics |

All commands have `just` wrappers (e.g., `just glossary-fm-ensure`, `just glossary-add-alias`).

### 2. Alias derivation logic

Auto-derives text aliases from glossary entry headings and IDs:
- Full name from heading ("Maria Stepanovna Babanina")
- Surname extraction ("Babanina")
- ID-to-text with apostrophe reconstruction (`D_ALT` -> `d'Alt`)
- Parenthetical extraction ("Maman (Maria Stepanovna Babanina)" -> both forms)
- Filters generic titles (Baron, Comtesse, Duke, etc.), family words (pere, fils, etc.), short words (<=3 chars)

### 3. Bootstrap run

- **3229/3229** glossary entries now have YAML frontmatter (was 140)
- **3205/3229** have auto-derived aliases (5359 total, avg 1.7/entry)
- 24 entries had no derivable aliases (single-word generics)

### 4. Justfile cleanup

Based on audit by Opus subagent:
- Eliminated ~10 dry-run duplicate command pairs (use `--dry-run` flag instead)
- Merged "Glossary Management" + "Glossary Frontmatter" into single "Glossary" section
- Fixed `help` command (removed references to nonexistent commands)
- Standardized `ts-node --esm` to `npx tsx` in sync commands
- Removed dead-weight commands (`install`, `new-entry`, `list-entries`, `recent`)
- Renamed `filter-index` -> `fe-filter-index`, `generate-pwa-icons` -> `fe-generate-icons`

### 5. Frontend fix

Fixed bug in `src/frontend/src/lib/content.ts` where `GlossaryEntry.content` was set to raw content (with frontmatter) instead of `bodyContent` (stripped). Would have caused raw YAML to render as text on glossary pages for the newly-frontmatted entries.

Frontend already displays aliases as "Also known as: ..." with i18n support.

### 6. Documentation updates

- `.claude/skills/glossary/SKILL.md` — new "Frontmatter & Aliases" section
- `.claude/skills/researcher/SKILL.md` — new "Alias Management" section with guidance on when to add aliases during research

## Next steps

1. **Build glossary auto-tagger** — scan diary text for alias matches, apply `[#tags]` to paragraphs
2. **Researcher alias refinement** — researchers add diary-specific aliases (e.g., "la Howard", "cette drôlesse") as they encounter them
3. **Propagate tags to translations** — extend sync tools for tag propagation

## Files changed

- `src/scripts/glossary-frontmatter.ts` (new)
- `justfile` (cleanup + new commands)
- `src/frontend/src/lib/content.ts` (bugfix)
- `.claude/skills/glossary/SKILL.md` (docs)
- `.claude/skills/researcher/SKILL.md` (docs)
- `content/_original/_glossary/**/*.md` (3229 files — frontmatter + aliases)

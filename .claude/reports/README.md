# Session Reports

Structured records of work sessions — translation runs, tooling work, infrastructure changes, or any significant effort. Committed to the repo so learnings persist across sessions and operators.

## Purpose

Every work session should generate a report capturing:
- **Who** ran it (operator)
- **What** was done (translation, tooling, research, frontend, etc.)
- **What happened** (results, issues, decisions)
- **What we learned** (observations, patterns, proposed improvements)

Reports serve two audiences:
1. **Humans** — review what happened, spot trends, decide priorities
2. **Teamcouch** — `/teamcouch` skill reads reports to facilitate skill evolution

## Report Format

Each report is a markdown file with YAML frontmatter:

```
.claude/reports/YYYY-MM-DD-{type}-{scope}.md
```

### Translation runs

```
.claude/reports/YYYY-MM-DD-{lang}-{carnets}.md
```

Example: `2026-02-16-en-006-007.md`

```yaml
---
date: 2026-02-16
operator: "@kerray"
duration_minutes: 35
target_language: en
carnets: [006, 007]
pipeline: [translator, gemini-editor]
skills:
  translator: {git short hash}
  gemini-editor: {git short hash}
status: final  # draft | final | reviewed
---
```

#### Required Sections

1. **Configuration** — skills, models, team structure
2. **Results** — per-carnet table (entries, duration, fixes, issues)
3. **Agent Lifecycle** — how each agent behaved (normal, stuck, crashed, interrupted)
4. **Issues Encountered** — categorized by WATCHLIST.md categories
5. **Observations** — freeform notes on quality, patterns, surprises

### Tooling / infrastructure / other sessions

```
.claude/reports/YYYY-MM-DD-tooling-{scope}.md
```

Example: `2026-03-06-tooling-glossary-frontmatter.md`

```yaml
---
date: 2026-03-06
type: tooling
operator: krr
scope: glossary-frontmatter, justfile-cleanup
---
```

Use whatever sections make sense — typically: what was done, files changed, next steps.

### Optional Sections (any report type)

- **Skill Version Hashes** — git hashes of skill files used
- **Quality Scores** — if RED/CON ran, include their scores
- **Proposed Changes** — specific skill improvements suggested

## How Reports Are Created

### Automatic (hooks)

The session-end hook generates a **draft report** when it detects team-related commits. The draft includes:
- Frontmatter from WORKER_CONFIG.yaml and git history
- Results table from file counts and commit messages
- Skill version hashes

### Manual

The operator fills in:
- Agent lifecycle observations
- Issues encountered (from memory and teammate messages)
- Observations and proposed changes
- Changes status from `draft` to `final`

### Teamcouch

`/teamcouch` reviews reports and may add:
- Pattern analysis across multiple reports
- Trend data
- Skill update recommendations
- Changes status from `final` to `reviewed`

## Integration with WATCHLIST.md

`WATCHLIST.md` defines what to watch for. Reports should reference watchlist items when relevant:
- "GEM corruption (recurring)" maps to WATCHLIST "Inline GEM comments"
- "Agent stuck" maps to WATCHLIST "Context exhaustion mid-carnet"

## Naming Convention

```
YYYY-MM-DD-{type/lang}-{scope}.md
```

Examples:
- `2026-02-16-en-006-007.md` — English translation, carnets 006-007
- `2026-02-13-cz-005-008.md` — Czech translation, carnets 005-008
- `2026-03-06-tooling-glossary-frontmatter.md` — Tooling session
- `2026-03-06-frontend-glossary-pages.md` — Frontend work

If multiple runs happen on the same day for the same scope, append a sequence number:
- `2026-02-16-en-006-007-2.md`

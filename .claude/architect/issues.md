# Known Issues & Bugs

Track issues discovered during development and testing.

---

## Open Issues

### ISSUE-001: Pipeline not yet tested end-to-end
**Severity**: High
**Status**: RESOLVED
**Discovered**: 2025-12-06
**Resolved**: 2025-12-06

**Description**: Full pipeline (research → annotate → translate → review → conduct) has not been tested on a real entry.

**Resolution**: Successfully tested on entry `1882-05-01` (Book 15).
- All 5 phases completed successfully
- Final verdict: APPROVED (quality score 0.925)
- Total cost: ~$2.90, Time: ~8 min
- Output files verified

---

### ISSUE-002: Headless JSON output format unvalidated
**Severity**: Medium
**Status**: RESOLVED
**Discovered**: 2025-12-06
**Resolved**: 2025-12-06

**Description**: Skills specify JSON output format but we haven't verified claude CLI actually produces parseable JSON.

**Resolution**: Changed from `stream-json` to `json` output format. Validated in pipeline test - all 5 JSON output files are valid and parseable.

---

### ISSUE-003: No hooks configured
**Severity**: Low
**Status**: RESOLVED
**Discovered**: 2025-12-06
**Resolved**: 2025-12-06

**Description**: Hooks could auto-format output, log decisions, or validate results but none are configured yet.

**Resolution**: Created 3 hooks in `.claude/hooks/`:
1. `subagent-complete.sh` (SubagentStop) - Logs agent completion to decision_log.md
2. `validate-write.sh` (PostToolUse on Write) - Validates markdown file format
3. `session-end.sh` (Stop) - Logs session end to session_log.md

Configuration added to `.claude/settings.local.json`.
Documentation in `.claude/hooks/README.md`.

---

---

### ISSUE-004: CRITICAL - Inconsistent file formats between books
**Severity**: Critical
**Status**: Open
**Discovered**: 2025-12-06

**Description**: Book 01 `_original` files have French text IN COMMENTS (translation format), while Book 15 has French text VISIBLE (correct ORIGINAL format). This contradicts CLAUDE.md file format standards.

**Evidence**:
- `src/_original/01/1873-01-11.md`: French text wrapped in `%% ... %%`
- `src/_original/15/1882-05-01.md`: French text visible, only IDs in comments

**Impact**: The system will produce incorrect output when processing Book 01 entries.

**Resolution Needed**: Either fix Book 01 files OR document that different books use different formats.

---

### ISSUE-005: Editor and Conductor can't write comments
**Severity**: High
**Status**: RESOLVED
**Discovered**: 2025-12-06
**Resolved**: 2025-12-06

**Description**: Editor skill says it adds RED comments. Conductor skill says it adds CON comments. But both have ONLY read tools: `Read, Grep, Glob` - no Edit/Write access.

**Impact**: RED and CON comments cannot be written by these agents.

**Resolution**: Option 2 implemented - ED writes comments based on agent JSON output.
- Editor returns `comments` array in JSON
- Conductor returns `verdict_comment` and `paragraph_comments` in JSON
- ED reads JSON and writes formatted comments to files
- Change IDs: EDITOR-2025-12-06-001, CONDUCTOR-2025-12-06-001, ED-2025-12-06-001

---

### ISSUE-006: Subagents can't load skill files
**Severity**: High
**Status**: RESOLVED
**Discovered**: 2025-12-06
**Resolved**: 2025-12-06

**Description**: Agent definitions say "Load the full skill from `.claude/skills/X/SKILL.md`" but subagents launched via Task tool don't automatically receive this file.

**Resolution**: Two-part approach:
1. Agent definitions updated with "Startup" section - subagents read their own skill file first
2. ED provides task-specific context (entry path, book number, revision feedback)
3. Subagents have Read tool access, so they CAN load skill files themselves

Subagents now: (1) Load skill file, (2) Follow ED's task-specific instructions

---

### ISSUE-007: No per-entry workflow directories exist
**Severity**: Medium
**Status**: Open
**Discovered**: 2025-12-06

**Description**: MULTI_AGENT_PLAN specifies per-book workflow directories: `src/_original/{book}/_workflow/entry_{date}.md`. These don't exist for any book.

**Impact**: Entry-level state tracking won't work.

**Resolution**: Create directories as part of first run, or simplify state to global workflow only.

---

### ISSUE-008: Missing reference files
**Severity**: Medium
**Status**: Open
**Discovered**: 2025-12-06

**Description**: Several files mentioned in skills don't exist:
- `.claude/skills/linguistic-annotator/period_vocabulary.md`
- `.claude/skills/linguistic-annotator/annotation_examples.md`
- `.claude/skills/translator/czech_style_guide.md`
- `.claude/skills/researcher/research_patterns.md`
- `.claude/skills/executive-director/workflow_templates.md`
- `.claude/output-styles/` directory

**Impact**: Agents can't reference these materials.

**Resolution**: Create files as needed, or remove references from skills.

---

### ISSUE-009: Justfile headless commands may produce bad JSON
**Severity**: Medium
**Status**: RESOLVED
**Discovered**: 2025-12-06
**Resolved**: 2025-12-06

**Description**: `--output-format stream-json` produces streaming JSON events (multiple JSON objects per line), not a single clean JSON.

**Resolution**: Changed all workflow commands from `--output-format stream-json` to `--output-format json` which produces a single result object.

Commands fixed: research, annotate, translate, review, conduct

---

### ISSUE-010: Glossary path format inconsistency
**Severity**: Medium
**Status**: Open
**Discovered**: 2025-12-06

**Description**: Existing entries use absolute paths: `[#Howard_family](/src/_original/_glossary/Howard_family.md)`. CLAUDE.md specifies relative paths: `[#Name](../_glossary/Name.md)`.

**Impact**: Links may not resolve correctly in different contexts.

**Resolution**: Standardize on one format and update documentation/existing files.

---

### ISSUE-011: TranslationMemory location
**Severity**: Low
**Status**: Open
**Discovered**: 2025-12-06

**Description**: TranslationMemory.md is at `src/cz/TranslationMemory.md` (language-specific), but skills reference it as generic. For multi-language support, need to clarify if TM is per-language or shared.

**Resolution**: Document the TM strategy for multi-language support.

---

### ISSUE-012: No mechanism for revision feedback to translator
**Severity**: Medium
**Status**: Open
**Discovered**: 2025-12-06

**Description**: When Editor says "needs_revision", how does Translator receive the specific feedback? The flow shows ED should pass feedback, but the exact mechanism isn't implemented.

**Resolution**: Define how ED formats and passes revision instructions to Translator subagent.

---

## Resolved Issues

(none yet)

---

## Issue Template

```markdown
### ISSUE-NNN: Brief title
**Severity**: Critical | High | Medium | Low
**Status**: Open | In Progress | Resolved | Won't Fix
**Discovered**: YYYY-MM-DD

**Description**: What's wrong?

**Steps to Reproduce**: How to see the issue

**Expected**: What should happen

**Actual**: What actually happens

**Notes**: Additional context

**Resolution**: (when resolved) How it was fixed
```

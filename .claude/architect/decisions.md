# Architecture Decision Records

Log of significant decisions about the multi-agent translation system.

---

## ADR-001: Layered Agent Hierarchy

**Date**: 2025-12-06
**Status**: Accepted

### Context
Needed to decide how multiple agents should coordinate. Options were:
- Flat structure (all agents equal, human coordinates)
- Two-level (orchestrator + workers)
- Three-level (human → orchestrator → quality gate → workers)

### Decision
Adopted three-level hierarchy: Human → Executive Director → Conductor → Workers

### Rationale
- ED handles orchestration (task allocation, state management)
- Conductor handles quality (separate concern from orchestration)
- Workers focus on specific tasks without coordination burden
- Human only involved at book-level decisions

### Consequences
- More complex but clearer responsibilities
- ED needs sophisticated decision logic
- Conductor can focus purely on quality judgment

---

## ADR-002: Linguistic Annotator as Separate Role

**Date**: 2025-12-06
**Status**: Accepted

### Context
Initially had Researcher doing both entity extraction AND linguistic notes. These require different expertise.

### Decision
Split into two roles:
- Researcher: External context (history, people, places)
- Linguistic Annotator: Internal text analysis (language, meaning, nuance)

### Rationale
- Different cognitive skills required
- LAN needs Opus for subtle linguistic judgment
- Research can use Sonnet (faster, cheaper)
- Cleaner separation of concerns

### Consequences
- Extra pipeline step
- But higher quality annotations
- Work done once benefits all target languages

---

## ADR-003: File-Based State Management

**Date**: 2025-12-06
**Status**: Accepted

### Context
Options for state management:
- MCP server (powerful but complex)
- Database (overkill for this project)
- Files with YAML frontmatter (simple, visible)

### Decision
Use markdown files with YAML frontmatter for all state.

### Rationale
- Version controlled (git)
- Human readable
- Easy to debug
- No additional infrastructure
- Matches project's existing patterns

### Consequences
- Less powerful queries than database
- But simpler and more transparent
- Easy to inspect and fix manually

---

## ADR-004: Justfile as Orchestration Interface

**Date**: 2025-12-06
**Status**: Accepted

### Context
How should humans/scripts invoke the workflow? Options:
- Pure Claude Code (interactive only)
- Agent SDK (TypeScript, requires setup)
- CLI scripts with headless mode
- Justfile wrapping CLI

### Decision
Use justfile with `claude -p` (headless) for individual steps, interactive mode for ED.

### Rationale
- Just already in use for build system
- Headless mode allows scripting
- Interactive mode for complex orchestration
- No additional dependencies

### Consequences
- Limited to what CLI can express
- But simple and consistent interface
- Easy to extend with new recipes

---

## Template for New Decisions

```markdown
## ADR-NNN: Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

### Context
[Why is this decision needed?]

### Decision
[What was decided?]

### Rationale
[Why this option over alternatives?]

### Consequences
[What are the implications?]
```

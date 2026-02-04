# Workflow Architect Workspace

This directory contains the Workflow Architect's logs, decisions, and session state.

## Contents

- `sessions/` - Session logs (what happened each time)
- `decisions.md` - Architecture decisions log
- `issues.md` - Known issues and bugs
- `ideas.md` - Improvement ideas backlog
- `testing.md` - Test results and validation notes

## Session Logging

Each architect session should be logged in `sessions/YYYY-MM-DD-NNN.md` with:
- What was worked on
- Decisions made
- Changes applied
- Issues discovered
- Next steps

## Decision Records

Major architecture decisions are logged in `decisions.md` using ADR format:
- Context: Why was this decision needed?
- Decision: What was decided?
- Consequences: What are the implications?

## Relationship to Other Files

| File | Purpose |
|------|---------|
| `.claude/prompt_history.md` | Tracks prompt/skill file changes |
| `.claude/pending_changes/` | Drafts awaiting human approval |
| `.claude/architect/` | Architect's own workspace (this dir) |
| `src/_original/_workflow/` | Translation workflow state |

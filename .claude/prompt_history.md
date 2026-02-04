# Prompt History

Log of all changes to agent prompts/skills.

---

## Change Log

| Date | Agent | Change ID | Description | Approved By |
|------|-------|-----------|-------------|-------------|
| 2025-12-06 | ALL | INIT-001 | Initial skill file creation | System |
| 2025-12-06 | Editor | EDITOR-2025-12-06-001 | Comments in JSON output, ED writes to files | Human |
| 2025-12-06 | Conductor | CONDUCTOR-2025-12-06-001 | Comments in JSON output, ED writes to files | Human |
| 2025-12-06 | ED | ED-2025-12-06-001 | Added responsibility to write subagent comments | Human |
| 2025-12-06 | ALL-AGENTS | AGENTS-2025-12-06-001 | Added Startup section - load skill then follow ED context | Human |
| 2025-12-06 | ED | ED-2025-12-06-002 | Clarified subagent launch pattern - agents load own skills | Human |

---

## Change Process

1. ED detects pattern requiring prompt change
2. ED drafts change in `.claude/pending_changes/`
3. Human reviews draft
4. Human approves or modifies
5. ED applies change to skill file
6. Change logged here with approval

## Pending Changes

See `.claude/pending_changes/` for changes awaiting review.

## Rollback

If a change causes issues:
1. Revert the skill file
2. Note rollback in this log
3. Investigate root cause
4. Draft improved change

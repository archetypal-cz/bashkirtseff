# Pending Change: Conductor Skill v2

---
change_id: CONDUCTOR-2025-12-06-001
proposed_by: workflow-architect
reason: "Conductor has read-only tools but skill says it writes comments"
evidence: "ISSUE-005 - Conductor allowed-tools: Read, Grep, Glob (no Edit)"
---

## Summary

Change Conductor to return comments in JSON output instead of writing them directly. ED will write comments to files.

## Current (lines 119-138 of SKILL.md)

```markdown
## Comment Format

```markdown
%% YYYY-MM-DDThh:mm:ss CON: VERDICT - [rationale] %%
%% YYYY-MM-DDThh:mm:ss CON: Para XX.YYY - [specific observation] %%
```

**Examples:**

```markdown
%% 2025-01-20T14:00:00 CON: APPROVED - Translation captures Marie's wistful tone beautifully. Minor suggestions noted but not required. %%
```
```

## Proposed

```markdown
## Comment Format

Your comments will be written to files by the Executive Director based on your JSON output.

Include comments in your JSON output:

```json
{
  "verdict_comment": "APPROVED - Translation captures Marie's wistful tone beautifully.",
  "paragraph_comments": [
    {
      "paragraph": "15.236",
      "text": "The Czech flows naturally while preserving the French cadence. Excellent."
    }
  ]
}
```

ED will format these as:
```markdown
%% YYYY-MM-DDThh:mm:ss CON: APPROVED - Translation captures Marie's wistful tone beautifully. %%
%% YYYY-MM-DDThh:mm:ss CON: Para 15.236 - The Czech flows naturally while preserving the French cadence. Excellent. %%
```
```

## Validation

1. Run Conductor on test entry
2. Verify JSON output includes verdict_comment and paragraph_comments
3. Verify ED can parse and write comments correctly

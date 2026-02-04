# Pending Change: Editor Skill v2

---
change_id: EDITOR-2025-12-06-001
proposed_by: workflow-architect
reason: "Editor has read-only tools but skill says it writes comments"
evidence: "ISSUE-005 - Editor allowed-tools: Read, Grep, Glob (no Edit)"
---

## Summary

Change Editor to return comments in JSON output instead of writing them directly. ED will write comments to files.

## Current (lines 79-95 of SKILL.md)

```markdown
## Comment Format

```markdown
%% YYYY-MM-DDThh:mm:ss RED: [SEVERITY] Para XX.YYY - [specific issue] → [suggestion if any] %%
```

**Examples:**

```markdown
%% 2025-01-20T10:30:00 RED: HIGH Para 15.234 - "šla jsem k hudbě" is literal French calque → "šla jsem na koncert" %%
```
```

## Proposed

```markdown
## Comment Format

Your comments will be written to files by the Executive Director based on your JSON output.

Format each comment in the `comments` array of your output:

```json
{
  "comments": [
    {
      "paragraph": "15.234",
      "severity": "HIGH",
      "text": "\"šla jsem k hudbě\" is literal French calque → \"šla jsem na koncert\""
    }
  ]
}
```

ED will format these as:
```markdown
%% YYYY-MM-DDThh:mm:ss RED: HIGH Para 15.234 - "šla jsem k hudbě" is literal French calque → "šla jsem na koncert" %%
```
```

## Additional Change: Output Requirements

Update the JSON output schema to include `comments` array explicitly.

## Validation

1. Run Editor on test entry
2. Verify JSON output includes `comments` array
3. Verify ED can parse and write comments correctly

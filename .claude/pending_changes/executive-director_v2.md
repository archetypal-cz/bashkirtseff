# Pending Change: Executive Director Skill v2

---
change_id: ED-2025-12-06-001
proposed_by: workflow-architect
reason: "ED needs to write comments from Editor/Conductor JSON output"
evidence: "ISSUE-005 fix - centralizing file writes through ED"
---

## Summary

Add responsibility to ED for writing RED and CON comments to files based on subagent JSON output.

## New Section to Add (after "Subagent Launch Pattern")

```markdown
## Writing Subagent Comments to Files

After receiving output from Editor or Conductor, write their comments to the appropriate file.

### Editor Comments (RED)

Parse the `comments` array from Editor output and write to translation file:

```python
# Pseudo-code for ED
for comment in editor_output["comments"]:
    line = f'%% {timestamp} RED: {comment["severity"]} Para {comment["paragraph"]} - {comment["text"]} %%'
    # Append to translation file after relevant paragraph
```

### Conductor Comments (CON)

Parse `verdict_comment` and `paragraph_comments` from Conductor output:

```python
# Write verdict comment at end of file
verdict_line = f'%% {timestamp} CON: {conductor_output["verdict_comment"]} %%'

# Write paragraph comments near relevant paragraphs
for comment in conductor_output["paragraph_comments"]:
    line = f'%% {timestamp} CON: Para {comment["paragraph"]} - {comment["text"]} %%'
```

### Comment Placement

- **RED comments**: After the translation paragraph they reference
- **CON comments**: At the end of the file (verdict) and after relevant paragraphs (observations)

### Logging

After writing comments, log to decision_log.md:

```markdown
| {timestamp} | {entry_date} | RED | comment_written | 1.0 | {count} comments for {paragraph_ids} |
| {timestamp} | {entry_date} | CON | verdict | {confidence} | {verdict} |
```
```

## Validation

1. ED receives Editor output with comments array
2. ED successfully parses and writes RED comments
3. ED receives Conductor output with verdict_comment
4. ED successfully parses and writes CON comments
5. Comments appear in correct files with correct format

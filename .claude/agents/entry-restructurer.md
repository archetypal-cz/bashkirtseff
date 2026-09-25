---
name: entry-restructurer
description: Restructure Marie Bashkirtseff diary entries with proper frontmatter and paragraph clustering, without ever renumbering paragraph IDs. Use when entries need format standardization or an entry split.
tools: Read, Edit, Write, Grep, Glob, Bash
model: inherit
---

# Entry Restructurer

## Startup

1. Read `.claude/skills/entry-restructurer/SKILL.md` in full and follow it. It is the only source of this role's instructions; this file only sets tools and model. Fix the skill, not this file, when something is wrong.
2. Read `.claude/skills/_shared/editing_rules.md`.
3. Work only on the files your spawn prompt assigns. No git mutations (read-only git is fine); the lead commits.

## Output

Restructure the assigned files in place. **Never renumber paragraph IDs**: they are shared by every language tree, reader reports and footnote IDs. If a fix seems to need a new or shifted ID, stop and report it. Validate with the `just` commands listed in the skill (the old `paragraph_parser.py` no longer exists) and report per file: what changed, paragraph-ID count before/after (must be equal), validation result.

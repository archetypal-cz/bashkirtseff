---
name: linguistic-annotator
description: Annotate French source text with language-agnostic translation guidance (LAN notes) — period vocabulary, idioms, Marie's linguistic quirks. Use AFTER research, BEFORE translation.
tools: Read, Edit, Write, Grep, Glob, Bash
model: inherit
---

# Linguistic Annotator (LAN)

## Startup

1. Read `.claude/skills/linguistic-annotator/SKILL.md` in full and follow it. It is the only source of this role's instructions; this file only sets tools and model. Fix the skill, not this file, when something is wrong.
2. Read `.claude/skills/_shared/editing_rules.md`.
3. Work only on the files your spawn prompt assigns. No git mutations (read-only git is fine); the lead commits.

## Output

Add LAN comments directly in `content/_original/` (never change the French text). End with a short summary: entries annotated, annotation counts, ambiguities flagged, `just splicescan _original {carnet}` result.

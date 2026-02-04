---
name: entry-restructurer
description: Restructure Marie Bashkirtseff diary entries with proper frontmatter and paragraph clustering. Use when original entries need format standardization.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
---

# Entry Restructurer Subagent

Restructure diary entries to canonical format with proper paragraph clustering.

## Task Input

You will receive:
- Path to the entry file to restructure
- Context about previous entry's last paragraph ID (for numbering continuity)

## Required Output

Return structured JSON:
```json
{
  "file": "1873-01-13.md",
  "changes": {
    "frontmatter_updated": true,
    "date_heading_paragraph_added": true,
    "paragraphs_renumbered": "01.12-01.14 → 01.13-01.15",
    "annotations_moved": 5,
    "empty_lines_fixed": 3
  },
  "paragraph_ids": ["01.12", "01.13", "01.14", "01.15"],
  "first_paragraph": "# Lundi 13 janvier 1873",
  "validation": "OK"
}
```

## Canonical Format Rules

1. **Date heading is its own paragraph cluster** (first after frontmatter)
2. **Paragraph cluster order**: ID → Tags → Annotations → Text → Footnotes
3. **NO empty lines within clusters**
4. **ONE empty line between clusters**
5. **Frontmatter must include `para_start`** for validation

## Process

1. Read the file
2. Identify the date heading and give it a paragraph ID
3. Renumber subsequent paragraphs
4. Reorder each cluster to canonical order (ID → Tags → Annotations → Text)
5. Fix empty lines (remove within clusters, ensure single between)
6. Add/update `para_start` in frontmatter
7. Write the restructured file
8. Validate with: `cd scripts && uv run paragraph_parser.py validate <filepath>`

## Startup

1. **First**: Read `.claude/skills/entry-restructurer/SKILL.md` for full format specification
2. **Then**: Read the target file and restructure it

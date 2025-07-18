# Coslate Bashkirtseff Project Operations Guide

This guide provides essential operational information for AI assistants working on the Marie Bashkirtseff diary translation project.

## Project Overview

**Coslate** (Collaborative Translation) is a framework for human-AI collaborative translation of Marie Bashkirtseff's diary from French to Czech (and potentially other languages). The project involves:

1. Processing raw diary entries (carnets) into individual day files
2. Translating entries while maintaining literary quality
3. Adding historical context and research
4. Publishing compiled translations

## Key Configuration Files

### .clinerules
- Main project configuration and AI installation guide
- Defines file naming conventions: `*.done.md` (finished), `*.red.md` (needs editing), `*.proof.md` (needs proofreading)
- Specifies markdown comment notation system for tracking work
- Important: All Python scripts must run within Poetry environment (`poetry run` or `poetry shell`)

### .roomodes (Custom AI Modes)
Defines four specialized AI roles:

1. **Translator**: Literary translation with timestamped comments `[//]: # ( YYYY-MM-DDThh:mm:ss TR: comment )`
2. **Editor**: Review and improvement with comments `[//]: # ( YYYY-MM-DDThh:mm:ss RED: comment )`
3. **Researcher**: Historical research and document preparation with comments `[//]: # ( YYYY-MM-DDThh:mm:ss RSR: comment )`
4. **Project Assistant**: Project management with comments `[//]: # ( YYYY-MM-DDThh:mm:ss PA: comment )`

### .cursorrules
- Integrates cursor-tools for web searches and browser automation
- Key commands:
  - `cursor-tools web "<query>"` - Web search via Perplexity AI
  - `cursor-tools repo "<query>"` - Repository context via Google Gemini
  - `cursor-tools browser` - Browser automation tools

## File Structure

```
/src
├── _original/          # Source materials
│   ├── 00/, 01/, etc. # Books with daily entries (YYYY-MM-DD.md)
│   ├── _glossary/     # Topic files matching hashtags
│   └── _summary/      # Monthly summaries (YYYY-MM.md)
├── cz/                # Czech translations
│   ├── 00/, 01/, etc. # Books with daily entries (YYYY-MM-DD.md)
│   ├── TranslationMemory.md
│   └── Style.md
├── media/             # Media files by language
└── HASHTAGS.md        # Alphabetical hashtag index

/prompts               # Style guides and work info
/memlog               # Progress logs and plans
/pub                  # Compiled output
/scripts              # Python compilation scripts
```

## Translation Workflow

### 1. Document Format
Each translation file contains:
```markdown
[//]: # ( original French text )
[//]: # ( 01.01 )  # paragraph ID
[//]: # ( YYYY-MM-DDThh:mm:ss TR: translator comment )
[//]: # ( #hashtag1 #hashtag2 )  # Topics in French

Czech translation text with footnotes[^01.01.1]

[^01.01.1]: Footnote content
```

### 2. Processing Raw Carnets
When processing raw diary files:
- Never open entire raw files (too large)
- Look for French date patterns: "Lundi, 13", "13 mars", etc.
- Extract entries between dates
- Create files: `/src/_original/{book}/YYYY-MM-DD.md`
- Process in batches of 10-15 entries
- Update memlog with progress

### 3. Translation Guidelines
- Review `Style.md` and `Style.cz.md` before starting
- Maintain literary quality while adapting to Czech
- Use TranslationMemory.md for consistency
- Create markdown links for dates: `[25. prosince](./1873-12-25.md)`
- Add footnotes for cultural context

### 4. Quality Control
- Editors preserve original with V0 tag: `[//]: # ( V0 original_translation )`
- All roles use timestamped comments
- Monthly summaries track themes and context
- Hashtags link to glossary entries

## Build and Compilation

### Setup
```bash
poetry install          # Install dependencies
poetry shell           # Activate environment
```

### Compile Commands
```bash
poetry run ./scripts/compile_book.py 01 --language cz --template scripts/templates/book_template.html
poetry run ./scripts/compile_all_books.py
```

### VSCode Tasks
- Press Ctrl+Shift+P → "Tasks: Run Task"
- Available: Compile Book, Compile All Books, Open Compiled Book

## Key Principles

1. **Maintain Spirit**: Preserve the original's literary quality
2. **Document Everything**: Use timestamped comments and memlog
3. **Cross-Reference**: Create markdown links and hashtags
4. **Collaborate**: Respond to existing comments
5. **Quality First**: Follow style guides and review processes

## Quick Start for New Sessions

1. Check `TodoRead` for current tasks
2. Review recent memlog entries
3. Load relevant style guides and TranslationMemory.md
4. Continue from last processed position
5. Update todo list and create memlog entry when finishing

## Important Notes

- Files use ISO date format: `YYYY-MM-DD.md`
- All hashtags in French, linked to glossary
- Monthly summaries in English for universal reference
- Poetry environment required for all Python scripts
- Never create files unless absolutely necessary
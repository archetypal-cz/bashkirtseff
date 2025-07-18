# Cline.md

This file provides guidance to Cline when working with the Coslate Bashkirtseff translation project.

## Project Overview

You are working on the Coslate Bashkirtseff Project - a collaborative translation framework for Marie Bashkirtseff's diary from French to Czech. This project uses a sophisticated human-AI collaborative workflow with multiple specialized roles.

## Working Modes

### 1. Raw Carnet Processing (Researcher Role)
When working on raw carnets:
- Extract daily entries from large raw carnet files (`/src/_original/XX_carnet_raw.md`)
- Create individual day files (`/src/_original/{book}/YYYY-MM-DD.md`)
- Research historical context and create glossary entries
- Document findings with RSR (Researcher) comments

### 2. Translation Pipeline (Multi-Agent Workflow)
When working on translations, different agents should take turns:
1. **Researcher Agent**: Prepares source material and context
2. **Translator Agent**: Creates initial translation with TR comments
3. **Editor Agent**: Reviews and improves with RED comments
4. **Conductor Agent**: Final approval with CON comments

## Using Existing Czech Translations as Reference

The existing Czech translations in `/src/cz/` serve as important reference points:
- Compare original translations with reviewed versions to understand editorial standards
- Observe the distance between first draft and final version
- Learn what improvements were achieved through the editing process
- Use these examples to calibrate your own translation/editing work
- Study the progression from literal to literary translation

## Role Definitions

### Conductor (CON)
- Final critical review with exacting standards
- Questions if translation captures Marie's true voice
- Rejects technically correct but spiritless translations
- Ensures zero nuance loss
- Comments: `[//]: # ( YYYY-MM-DDThh:mm:ss CON: "řádný muž" captures social status better than "slušný" )`
- Sends work back if it doesn't meet standards

### Researcher (RSR)
- Processes raw carnets into daily entries
- Creates glossary entries in `/src/_original/_glossary/` with research status
- Maintains HASHTAGS.md
- Provides historical context using:
  - `vibe-tools web "query"` for deep research (Perplexity)
  - Research goes directly into glossary entries
- Adds hashtag links in ORIGINAL files: `[//]: # ( [#Topic](/src/_original/_glossary/Topic.md) )`
- Comments with links in ORIGINAL files: `[//]: # ( YYYY-MM-DDThh:mm:ss RSR: See [Topic](/src/_original/_glossary/Topic.md) - description )`
- Research goes in source files for ALL languages to use

### Translator (TR)
- Translates following Style.md guidelines
- Preserves meaning while adapting to target language
- Handles multilingual content:
  - Translate foreign phrases Marie uses
  - Mark with ==highlight==
  - Add footnote: `[^1]: *V originále anglicky:* "original phrase"`
- Preserves formatting:
  - *Italics* for emphasis
  - **Bold** for strong emphasis
  - ~~Strikethrough~~ for crossed-out text
  - ==Highlight== ONLY for foreign language translations
- Updates TranslationMemory.md
- Works paragraph by paragraph with notation:
  ```markdown
  [//]: # ( original French text )
  [//]: # ( 01.01 )
  [//]: # ( YYYY-MM-DDThh:mm:ss TR: translation note )
  Czech translation here
  ```

### Editor (RED)
- Critical review for accuracy, nuance, and natural flow
- Questions every word choice and implication
- Catches overly literal translations
- Identifies lost undertones or changed meanings
- Preserves original with V0 tag:
  ```markdown
  [//]: # ( V0 original translation )
  [//]: # ( YYYY-MM-DDThh:mm:ss RED: Too literal - Czech readers need cultural context )
  Improved translation here
  ```
- Common catches:
  - False friends between languages
  - Unnatural word-for-word translations
  - Lost implications or tone
  - Cultural references needing adaptation

### Project Assistant (PA)
- Manages workflow coordination
- Creates memlog entries
- Updates todo lists
- Tracks progress
- Comments: `[//]: # ( YYYY-MM-DDThh:mm:ss PA: note )`

## Multi-Agent Best Practices

1. **Clear Role Separation**: Each agent should focus only on their role
2. **Sequential Processing**: Process entries one at a time, passing between agents
3. **Complete Handoffs**: Document all work with timestamped comments
4. **No Role Mixing**: Agents should not perform tasks outside their role
5. **Batch Processing**: Process 10-15 entries per session for efficiency

## File Conventions

- Daily entries: `/src/_original/{book}/YYYY-MM-DD.md`
- Translations: `/src/cz/{book}/YYYY-MM-DD.md`
- Status suffixes: `.done.md`, `.red.md`, `.proof.md`
- Glossary: `/src/_original/_glossary/{topic}.md`
- Memlog: `/memlog/YYYY-MM-DD-description.md`

## Current Project State

- Books 00-04: Source entries extracted through August 19, 1874
- Book 04: Stopped at August 19, 1874 (anomaly found in August 18 entry)
- Book 05: Raw carnet exists, not yet processed
- Czech translations: Partial (Books 00-01 only)

## Build Commands

```bash
poetry install              # Setup environment
poetry shell               # Activate environment
python scripts/compile_book.py 00    # Compile specific book
python scripts/compile_all_books.py  # Compile all books
```

## Working Instructions

1. **Starting a Session**: Identify which mode you're in (raw processing or translation)
2. **Role Selection**: Declare your role explicitly
3. **Task Focus**: Work on one specific task type per session
4. **Documentation**: Update memlog and todo lists regularly
5. **Handoffs**: Leave clear notes for the next agent/session

Remember: Each agent represents a different perspective and expertise. Maintain role integrity for best results.
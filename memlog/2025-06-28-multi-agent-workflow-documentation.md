# Multi-Agent Translation Workflow Documentation - 2025-06-28

## Overview

This document captures the exact multi-agent translation workflow used for translating Marie Bashkirtseff's diary entries from French to Czech. The workflow involves four distinct roles working in sequence, with each role adding unique value to the translation process.

## Workflow Architecture

### Role Sequence
1. **Researcher (RSR)** → 2. **Translator (TR)** → 3. **Editor (RED)** → 4. **Conductor (CON)**

### File Flow
```
src/_original/01/YYYY-MM-DD.md (source French text)
                ↓
src/cz/01/YYYY-MM-DD.md (Czech translation with all agent comments)
```

## Detailed Role Responsibilities

### 1. Researcher (RSR)
**Primary Tasks:**
- Add opening chat between agents about the entry context
- Insert hashtag links above relevant paragraphs
- Add researcher notes for cultural/historical context
- Link to glossary entries for people, places, and concepts
- Add explanatory notes for retrospective insertions

**Comment Format:**
```markdown
[//]: # (2025-06-28T10:30:00 RSR: Opening chat between agents about this entry)
[//]: # (2025-06-28T10:30:15 RSR: This entry contains important romantic dynamics. See [Boreel](/src/_original/_glossary/Boreel.md))
[//]: # ( [#Rumpelmayer](/src/_original/_glossary/Rumpelmayer.md) )
```

**Key Actions:**
- Review source text for people, places, events
- Check existing glossary entries
- Create new glossary entries if needed
- Add contextual information that will help translator

### 2. Translator (TR)
**Primary Tasks:**
- Read the prepared source with researcher notes
- Create initial Czech translation
- Preserve Marie's voice and style
- Maintain paragraph structure with IDs
- Add translator comments explaining choices

**Comment Format:**
```markdown
[//]: # (2025-06-28T10:35:00 TR: Ready for translation. This entry shows Marie's complex romantic strategizing.)
[//]: # (2025-06-28T10:40:00 TR: "nous prîmes du chocolat" - using "dali jsme si" for more natural Czech)
[//]: # ( V0 Krásné, větrné počasí. Dali jsme si horkou čokoládu u Rumpelmayera. )
```

**Translation Principles:**
- Natural Czech flow over literal translation
- Preserve emotional tone and register
- Keep Marie's youthful voice
- Note any challenging translations

### 3. Editor (RED)
**Primary Tasks:**
- Review and refine the translation
- Improve naturalness and cultural adaptation
- Add footnotes for Czech readers
- Preserve V0 (original translation) before major edits
- Create V1, V2 versions for significant changes
- Add critical review comments for nuanced issues

**Comment Format:**
```markdown
[//]: # ( V0 Krásné, větrné počasí. Dali jsme si horkou čokoládu u Rumpelmayera. )
[//]: # ( V1 Hezky, ale větrno. Daly jsme si čokoládu u Rumpelmayera. )
[//]: # (2025-06-28T10:55:00 RED: More concise, matches Marie's diary style better.)
[//]: # (2025-06-28T12:15:00 RED: FURTHER REVIEW - Actually, "Hezky, ale větrno" might be TOO concise...)
```

**Editorial Focus:**
- Period-appropriate language
- Cultural equivalents
- Gender agreement (Marie + female companions)
- Social register and class markers
- Addition of helpful footnotes

### 4. Conductor (CON)
**Primary Tasks:**
- Review entire translation process
- Provide synthesis and final approval
- Identify areas needing revision
- Ensure consistency with project goals
- Add meta-commentary on translation quality

**Comment Format:**
```markdown
[//]: # (2025-06-28T11:10:00 CON: Translation approved. The team successfully captured Marie's voice...)
[//]: # (2025-06-28T12:02:00 CON: REVISION NEEDED - Editor correctly identifies critical nuances...)
```

## Standard Comment Notation System

### Preserved Original Text
```markdown
[//]: # ( original French text )
[//]: # ( 01.01 )  // paragraph ID
```

### Translation Versions
```markdown
[//]: # ( V0 original translation text )
[//]: # ( V1 revised translation text )
Final translation text (no comment wrapper)
```

### Agent Comments
```markdown
[//]: # ( YYYY-MM-DDThh:mm:ss ROLE: comment text )
```
Where ROLE is:
- RSR: Researcher
- TR: Translator
- RED: Editor (Redactor)
- CON: Conductor
- PA: Project Assistant

### Hashtag Links
```markdown
[//]: # ( [#PersonName](/src/_original/_glossary/PersonName.md) )
```

### Footnotes
```markdown
Text with footnote marker[^1]

[^1]: *Pozn. překl.:* Footnote explanation for Czech readers
```

## Critical Review Pattern

The workflow includes a critical review phase where agents identify subtle issues:

1. **Linguistic Nuances**
   - "představuji si" vs "vychutnávám si" (imagining vs savoring)
   - "rychle se vrátila" vs "brzy se vrátila" (hurried back vs returned early)

2. **Cultural Context**
   - "prîmes du chocolat" = formal hot chocolate service, not just "having chocolate"
   - "homme bien" = proper gentleman of standing, not just "nice man"

3. **Social Register**
   - "bylo tam plno lidí" → "sešla se tam početná společnost" (colloquial vs elegant)
   - Word choices must reflect Marie's aristocratic milieu

4. **Intentionality**
   - "ne passa pas trop vite" = deliberately controlling speed to be noticed
   - "Je crois" = "I deduce" not just "I think"

## File Management

### Source Files
- Location: `/src/_original/{book}/YYYY-MM-DD.md`
- Contains: French text + researcher notes from initial processing
- Never modify these files during translation

### Translation Files
- Location: `/src/cz/{book}/YYYY-MM-DD.md`
- Contains: All agent comments + final Czech translation
- Preserve complete comment history

### Glossary Files
- Location: `/src/_original/_glossary/{Topic}.md`
- Format: Include Research Status, Last Updated, Diary Coverage
- Update when new information discovered

## Quality Control Checklist

### Before Starting
- [ ] Check TodoRead for current tasks
- [ ] Review recent translations for consistency
- [ ] Load TranslationMemory.md
- [ ] Check relevant glossary entries

### During Translation
- [ ] Researcher: Add all relevant context and links
- [ ] Translator: Preserve Marie's voice and style
- [ ] Editor: Improve without over-polishing
- [ ] Conductor: Ensure all roles fulfilled their purpose

### After Completion
- [ ] Update todo list
- [ ] Create memlog entry
- [ ] Update TranslationMemory.md with new terms
- [ ] Note any patterns for future entries

## Batch Processing Guidelines

When processing multiple entries:

1. **Batch Size**: 5-10 entries per session
2. **Consistency**: Review previous entries for voice/style
3. **Glossary Updates**: Batch create/update related entries
4. **Progress Tracking**: Update todo list after each entry
5. **Quality Checks**: Full review after each batch

## Common Patterns to Maintain

1. **Marie's Voice**
   - Breathless, enthusiastic style
   - Strategic romantic calculations
   - Social observations with judgment
   - Self-awareness and self-criticism

2. **Period Elements**
   - 1870s Nice social customs
   - Aristocratic behavioral codes
   - Fashion and material culture
   - Romantic propriety and strategy

3. **Translation Principles**
   - Natural Czech over literal translation
   - Cultural adaptation where needed
   - Preserve emotional register
   - Maintain period atmosphere

## Automation Possibilities

This workflow could be enhanced with:
1. Template generation for each role
2. Automated glossary linking
3. Comment timestamp generation
4. Version tracking for translations
5. Batch file creation with proper structure

[//]: # ( 2025-06-28T16:45:00 PA: Comprehensive workflow documentation created based on observed patterns )
# Diary Translation Workflow Command


**Note**: Entity names in frontmatter use CAPITAL_ASCII format (uppercase letters, numbers, underscores only - no accents or special characters). The frontmatter `entities` section is the authoritative source for all tagged entities.

## Quick Command to Start Translation Session

```
Please continue the Czech translation workflow for the next diary entry. Follow the multi-agent process:
1. Researcher: Add frontmatter entities and context to original
2. Translator: Create Czech translation with notation
3. Editor: Critical review and improvements
4. Conductor: Final approval
Update todo list throughout.
```

## Detailed Workflow Steps

### 1. Researcher Phase
```
As Researcher for [DATE]:
- Read /src/_original/01/YYYY-MM-DD.md
- Add/update YAML frontmatter with entities section:
  - entities.people: [PERSON_NAME, ...]
  - entities.places: [PLACE_NAME, ...]
  - entities.cultural: [REFERENCE_NAME, ...]
- Set location and locations fields in frontmatter
- Add RSR comments for context
- Create any missing glossary entries
- Set workflow.research_complete: true when done
- Note: Research goes in ORIGINAL files only
```

### 2. Translator Phase
```
As Translator for [DATE]:
- Create /src/cz/01/YYYY-MM-DD.md
- Add opening translator comments
- For each paragraph:
  - Original French in comment
  - Paragraph ID (01.01, 01.02, etc.)
  - Translator notes if needed
  - Czech translation
- Handle foreign languages with ==highlight== and footnotes
- Preserve *italics* for emphasis
```

### 3. Editor Phase
```
As Editor for [DATE]:
- Review translation critically
- Preserve original with V0 tag
- Make improvements
- Add detailed RED comments explaining changes
- Focus on:
  - Natural Czech flow
  - Cultural adaptations
  - Preserved implications
  - Correct tone/register
```

### 4. Conductor Phase
```
As Conductor for [DATE]:
- Final critical review
- Verify Marie's voice preserved
- Check all nuances captured
- Add CON approval or revision requests
- Send back if standards not met
```

## Batch Processing Command

```
Please process the next 5 diary entries (Feb 21-25) using the multi-agent workflow.
For each entry:
1. Researcher adds frontmatter static values, footnotes and RSR comments, creates glossary entries
2. Translator creates Czech version
3. Editor reviews critically
4. Conductor approves
Update todo list after each entry completion.
```

## Todo List Management

```
After each phase completion:
- Mark current task as completed
- Add next phase as pending
- Update glossary creation tasks as needed
```

## File Locations

- Source: `/src/_original/01/YYYY-MM-DD.md`
- Translation: `/src/cz/01/YYYY-MM-DD.md`
- Glossary: `/src/_original/_glossary/[Topic].md`
- Memlog: `/memlog/YYYY-MM-DD-description.md`

## Quality Checkpoints

1. **Researcher**: Location determined, glossary entries created, context added and explained, frontmatter complete and calculated
2. **Translator**: All foreign phrases highlighted with footnotes
3. **Editor**: No literal translations remain
4. **Conductor**: Marie's voice fully preserved

## Common Issues to Catch

- "à la musique" → "na koncertě" (not "k hudbě")
- "homme bien" → "slušný pán" (preserving class implications)
- Emphasis: *italics* not ==highlight==
- Foreign words: ==highlight== with footnote
- Social nuances must be preserved
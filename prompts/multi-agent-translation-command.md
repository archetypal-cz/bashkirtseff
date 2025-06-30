# Multi-Agent Translation Command Template

## Quick Start Command

To translate a diary entry using the multi-agent workflow:

```
Translate entry 1873-02-21 using the multi-agent workflow with roles: Researcher, Translator, Editor, Conductor
```

## Detailed Step-by-Step Commands

### Step 1: Researcher Phase
```
As Researcher, prepare entry 1873-02-21 for translation:
1. Read source file /src/_original/01/1873-02-21.md
2. Add opening chat about entry context
3. Insert hashtag links above relevant paragraphs
4. Add researcher notes for people/places/events
5. Link to existing glossary entries
6. Create any missing glossary entries
7. Save prepared file to /src/cz/01/1873-02-21.md
```

### Step 2: Translator Phase
```
As Translator, translate the prepared entry 1873-02-21:
1. Read the researcher-prepared file
2. Create initial Czech translation paragraph by paragraph
3. Add V0 versions in comments before each paragraph
4. Add translator notes explaining key choices
5. Preserve Marie's voice and emotional tone
6. Update the same file with translations
```

### Step 3: Editor Phase
```
As Editor, refine the translation of 1873-02-21:
1. Review the initial translation
2. Improve naturalness and flow
3. Add V1 versions for significant changes
4. Insert footnotes for Czech readers where needed
5. Check gender agreement and period language
6. Add critical review comments for nuanced issues
7. Create final polished version
```

### Step 4: Conductor Phase
```
As Conductor, review and approve translation of 1873-02-21:
1. Review the complete translation process
2. Check that each role added appropriate value
3. Identify any areas needing revision
4. Add synthesis comment on overall quality
5. Mark translation as complete or flag for revision
```

## Batch Processing Command

For multiple entries:
```
Process entries 1873-02-21 through 1873-02-25 using multi-agent workflow:
1. Complete all four phases for each entry
2. Update todo list after each entry
3. Create glossary entries as needed
4. Maintain consistency across batch
5. Create memlog summary after batch completion
```

## Todo List Integration

### Before Starting
```
1. Check TodoRead for current tasks
2. Mark current entry as "in_progress"
3. Note which entries need translation
```

### After Each Entry
```
1. Mark completed entry as "completed" 
2. Add next entry to todo list
3. Update any discovered tasks (missing glossary entries, etc.)
```

### After Batch
```
1. Create memlog entry summarizing work
2. Update todo list with next batch
3. Note any patterns or issues discovered
```

## File Preparation Commands

### Create Entry File Structure
```
For entry YYYY-MM-DD:
1. Copy source from /src/_original/{book}/YYYY-MM-DD.md
2. Create /src/cz/{book}/YYYY-MM-DD.md with header
3. Preserve all French text in comment blocks
4. Add paragraph IDs (01.01, 01.02, etc.)
```

### Create Glossary Entry
```
For new person/place/concept:
1. Create /src/_original/_glossary/{Name}.md
2. Add standard headers:
   - Research Status: Initial/Partial/Complete
   - Last Updated: YYYY-MM-DD
   - Diary Coverage: List of dates mentioned
3. Add historical/biographical information
4. Include relevant French quotes from diary
```

## Quality Control Commands

### Consistency Check
```
Review last 5 translations for:
1. Consistent voice and tone
2. Similar translation choices for repeated phrases
3. Proper use of formal/informal language
4. Consistent formatting and structure
```

### Final Review
```
Before marking complete:
1. Verify all hashtag links work
2. Check all glossary references
3. Ensure proper Czech grammar/spelling
4. Confirm preservation of Marie's voice
5. Validate historical accuracy
```

## Example Full Command

```
Please execute the multi-agent translation workflow for diary entry 1873-02-21:

1. RESEARCHER: Prepare the entry with full context, hashtag links, and glossary references
2. TRANSLATOR: Create natural Czech translation preserving Marie's voice
3. EDITOR: Refine for Czech readers with appropriate cultural adaptations
4. CONDUCTOR: Review and approve the final translation

Update the todo list and create appropriate memlog entry when complete.
```

## Automation Notes

This workflow could be enhanced with:
- Automatic timestamp generation
- Template file creation
- Glossary link validation
- Version control integration
- Progress tracking dashboard

[//]: # ( 2025-06-28T16:50:00 PA: Command template created for multi-agent translation workflow )
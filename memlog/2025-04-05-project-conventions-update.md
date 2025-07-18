# Project Conventions Update - 2025-04-05

## Completed Updates (Updated 15:14)

We have updated the project documentation and structure to reflect the current conventions:

### File Structure Updates

1. **Language-specific files moved to appropriate directories**:
   - Moved Style.md to src/Style.md (general style guide)
   - Moved Style.cz.md to src/cz/Style.md (Czech-specific style guide)
   - Incorporated grammar guidelines from docs/grammar/czech.md into src/cz/Style.md
   - Removed references to the grammar folder as it's no longer needed
   - Confirmed TranslationMemory.md is already in src/cz/

2. **Glossary System Implementation**:
   - Updated HASHTAGS.md to use markdown links to glossary files
   - Created the first glossary entry (Emile_Zola.md) as an example
   - Set up the structure for future glossary entries

3. **Documentation Updates**:
   - Updated .clinerules with detailed file structure information
   - Added information about the hashtag system and glossary
   - Added the Researcher mode description
   - Renamed preparation.md to original_text_preparation.md with improved content

4. **Mode Configuration Updates**:
   - Updated .roomodes to reflect the new file locations
   - Enhanced the Researcher mode description to include glossary responsibilities
   - Updated customInstructions for all modes to reference the correct file paths

## New Conventions

### Glossary and Hashtag System

The new system for research notes and glossary entries works as follows:

1. When a paragraph mentions a topic of interest, we create a hashtag in HASHTAGS.md
2. The Researcher mode creates corresponding files in /src/_original/_glossary/ with filenames matching the hashtags
3. When hashtags are used in paragraph comments, they are formatted as markdown links to their topic files in _glossary
4. This allows translations to maintain the same filenames while translating the contents

### File Structure

The project now has a clearly defined file structure:

- `/src`: Contains the translation files
  - `/{lang}`: Language-specific directories (e.g., `/src/cz/` for Czech)
    - `/00`, `/01`, etc.: Book/chapter directories
    - `TranslationMemory.md`: Language-specific translation memory
    - `Style.md`: Language-specific style guide
  - `/_original`: Original source materials
    - `/00`, `/01`, etc.: Book/chapter directories
    - `/_glossary`: Research notes on specific topics, with filenames matching hashtags
    - `/_summary`: Monthly summaries of diary content
  - `/media`: Media files
    - `/{lang}`: Language-specific media files
  - `HASHTAGS.md`: Alphabetical list of hashtags, each linked to its glossary file
  - `Style.md`: General style guide for all languages

## Next Steps

1. **Create additional glossary entries**: Convert the existing hashtag descriptions in HASHTAGS.md to individual glossary files
2. **Update README.md**: Ensure it reflects the current project structure and conventions
3. **Create additional glossary entries**: Created glossary entries for:
   - Vienna World Exhibition
   - Duke of Hamilton
   - House of Worth
   - Walery Studio
   - Gioia
   - Paris in the 1870s
   - Updated Gioia entry with extensive information from diary entries
   - Le Bon Marché
   - Updated HASHTAGS.md with links to these entries

4. **Review existing translations**: Check for consistency with the new conventions
4. **Create monthly summaries**: Ensure all completed months have summary files

[//]: # ( 2025-04-05T15:03:18 PA: Documented project convention updates )
# Original Text Preparation

This document provides instructions for the Researcher mode on how to prepare original text from raw OCR'd content for the Marie Bashkirtseff diary translation project.

## Process Overview

1. Work with already prepared files in `/src/_original/XX/` directories
2. When processing new entries, only read specific sections of the raw file (`src/_original/XX_carnet_raw.md`) as needed
3. Use the end line reference in existing files to locate the next section in the raw file
4. Create properly formatted daily entry files in the appropriate directory (e.g., `/src/_original/02/1873-08-19.md`)
5. Add paragraph IDs and maintain proper formatting
6. Create glossary entries for topics of interest
7. Create monthly summaries when a month is completed

## File Format Example

Below is an example of a properly formatted daily entry file:

```markdown
[//]: # ( Carnet N° 1 )
[//]: # ( 01.01 )

[//]: # ( [Passages reproduits par Pierre Borel dans son article Le visage inconnu de Marie Bashkirtseff d'après ses mémoires, paru dans le N° XLIII de janvier 1925 de la revue Les Œuvres libres]. )
[//]: # ( 01.02 )

[//]: # ( Connaissant la façon dont Pierre Borel concevait les devoirs d'un éditeur de textes nous avions d'abord hésité à publier ce document. Nous nous sommes résolus à les donner après avoir constaté que les événements auxquels Marie dit avoir assisté ont eu lieu aux dates indiquées. )
[//]: # ( 01.03 )

[//]: # ( Du 11 janvier 1873 au 12 février 1873 )
[//]: # ( 01.04 )

[//]: # ( Samedi 11 janvier 1873 )
[//]: # ( 01.05 )

[//]: # ( Les Howard étaient venus me chercher, mais la canaille Mouton ne m'a pas envoyé le cheval.. J'ai fait plusieurs fois le tour en voiture en suivant les chevaux; j'étais en amazone, puis j'ai changé de toilette à la promenade; une délicieuse robe bleue. )
[//]: # ( 01.06 )

[//]: # ( Ce soir, à l'Opéra, "Un ballo in maschera". Beaucoup de monde, mais moi, je suis triste. )
[//]: # ( 01.07 )

[//]: # ( 2025-04-05T15:45:00 RSR: End line in original file: 127 )
```

## Detailed Instructions

### Efficient Raw File Handling

1. **IMPORTANT**: Do NOT open the entire raw file (`src/_original/XX_carnet_raw.md`) at once - it's too large for the context window
2. Instead, look at the most recently processed file to find the end line reference (e.g., `End line in original file: 127`)
3. When you need to process the next section, only read the specific portion of the raw file using the line numbers:
   ```
   <read_file>
   <path>src/_original/XX_carnet_raw.md</path>
   <start_line>[previous_end_line]</start_line>
   <end_line>[previous_end_line + 20]</end_line>
   </read_file>
   ```
4. Process this small chunk before reading the next section

### Text Processing

1. Read the raw OCR'd text in small chunks (20 lines at a time)
2. Correct OCR errors and typos only - do not modify the content otherwise
3. If you're unsure about a correction, add a researcher note: `[//]: # ( YYYY-MM-DDThh:mm:ss RSR: note )`
4. Remove OCR artifacts (e.g., empty lines containing just "|" characters)
5. When working with files that already contain notes by others, preserve those notes exactly as they are

### Paragraph Formatting

1. Place each paragraph of the original text in a Markdown comment: `[//]: # ( original text )`
2. Add a paragraph ID comment after each paragraph: `[//]: # ( XX.YY )` where XX is the book number and YY is the paragraph number
3. Add an empty line between paragraphs
4. For empty paragraphs, just add an empty line
5. For three consecutive empty paragraphs, add a horizontal rule using dashes
6. At the end of each daily file, add a note indicating the end line number in the original raw file: `[//]: # ( YYYY-MM-DDThh:mm:ss RSR: End line in original file: NNNN )`

### Hashtags and Glossary Entries

1. When a paragraph mentions a topic of interest (person, event, place, etc.):
   - Add the hashtag to `src/HASHTAGS.md` if it doesn't exist
   - Create a corresponding file in `/src/_original/_glossary/` with the filename matching the hashtag
   - Format hashtags in paragraph comments as markdown links to their topic files in _glossary

2. Glossary entry format:
   ```markdown
   # [Topic Name]
   
   ## Basic Information
   
   [Brief description of the person, place, event, or concept]
   
   ## Significance in Marie Bashkirtseff's Life
   
   [How this topic relates to Marie and her diary]
   
   ## Historical Context
   
   [Broader historical context relevant to understanding this topic]
   
   ## Mentions in the Diary
   
   - [Date]: [Brief description of mention]
   ```

### Monthly Summaries

When you complete a month's worth of entries, create a monthly summary in `src/_original/_summary/YYYY-MM.md` that includes:

- Main topics and themes
- Key events
- People mentioned
- Social and cultural context
- Marie's personal development
- Setting details

### Workflow

1. Focus on one book at a time
2. Process entries chronologically
3. After completing 3 days of entries, create a prompt for the next task
4. Do not move on to other tasks until the entire book is processed

## Research Notes

For significant research findings that require more space than a comment, create separate note files (e.g., `note-1873-08-11_19.md`) that can be linked from the day files.

## Remember

- Accuracy is paramount - we are creating the foundation for all translations
- Maintain consistent formatting across all files
- Document your research thoroughly to provide context for translators
- Create glossary entries that will be valuable resources for both translators and readers
- Always work with small chunks of the raw file to prevent context overflow
- When mentioning dates or paragraphs in the text, create markdown links to their relative files
- Use the new file naming convention: book folder + ISO date (e.g., `/src/_original/01/1873-01-11.md`)
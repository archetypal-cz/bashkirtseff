# General Translation Style Guide

This document provides general guidelines for translating Marie Bashkirtseff's diary across all target languages.


**Note**: All hashtags use CAPITAL_ASCII format (uppercase letters, numbers, underscores only - no accents or special characters).

## Translation Philosophy

- Keep true to the meaning and spirit of the original but express them in a way that feels natural in the target language
- Aim for a translation that captures Marie's voice and personality while being accessible to modern readers
- Maintain the emotional tone and intensity of the original text
- Preserve cultural and historical context through appropriate footnotes and references

## Content Structure

- Every diary entry (usually a day) should be a separate file in the ./src/{lang} folder
- File names should start with the ISO date code (e.g., 1873-01-11.md)
- Maintain the paragraph structure of the original text

## Formatting Guidelines

### Original Text and Translation

1. Keep the paragraph ID comment before the original paragraph: `%% XX.YY %%` where XX is the book number and YY is the paragraph number
2. Place the original text in a Markdown comment: `%% original text %%`
3. For complex translations, add additional comments explaining your choices
4. Provide the polished translation after the comments

### HASHTAGS and Cross-References

When a paragraph mentions a topic of interest (person, event, place, etc.):

- Use the established hashtags from `./src/HASHTAGS.md` in your comments
- Format hashtags as markdown links to their topic files in \_glossary
- Example: `%% [#EMILE_ZOLA](/_original/_glossary/EMILE_ZOLA.md) mentioned in this paragraph %%`

### Footnotes

Use Markdown footnotes for explanations that readers might need:

```markdown
This is text with a footnote[^01.01.1].

[^01.01.1]: This is the footnote content, where 01.01.1 represents book.paragraph.note_number.
```

Footnotes should be labeled with the format: `[^XX.YY.Z]` where:

- XX is the book number
- YY is the paragraph number
- Z is the sequential number of the footnote for that paragraph

### Comments

Add timestamped comments to document your translation process or questions:

- Translator comments: `%% YYYY-MM-DDThh:mm:ss TR: comment %%`
- Editor comments: `%% YYYY-MM-DDThh:mm:ss RED: comment %%`

## Translation Memory

- Always refer to `./src/{lang}/TranslationMemory.md` for consistent terminology
- Add new terms to the Translation Memory as you encounter them
- Follow the established format for new entries

## Language-Specific Guidelines

Each target language has its own specific style guide that should be consulted:

- Czech: `./src/cz/Style.cz.md`
- [Other languages as they are added]

These language-specific guides contain information about:

- Handling of cultural references
- Treatment of idioms and metaphors
- Voice and tone preferences
- Specific terminology requirements
- Formatting conventions specific to the language

## About Marie Bashkirtseff

The author is a young noble girl from Poltava in Ukraine, living in France and traveling in Europe in the 1860s-1870s with her mother, aunt, cousin Dina, brother Paul, grandfather, and their entourage. Understanding her background and personality is essential for capturing her voice accurately.

%% 2025-04-05T15:02:27 PA: Updated general style guide and moved to src directory %%

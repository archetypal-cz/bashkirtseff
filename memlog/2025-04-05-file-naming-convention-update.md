# File Naming Convention Update

Date: 2025-04-05

## Changes Implemented

1. **File Naming Convention**:
   - Removed box prefix from filenames (e.g., changed from `01.1873-01-11.md` to `1873-01-11.md`)
   - New format: book number as folder, then ISO date (e.g., `/src/_original/01/1873-01-11.md`)

2. **Date and Paragraph Linking**:
   - Added rule to link dates and paragraphs to their relative files in the current translation
   - This includes when Marie writes back notes from the future, linking to the future day's file

3. **Documentation Updates**:
   - Updated .roomodes file
   - Updated .clinerules file
   - Updated README.md
   - Updated prompts/original_text_preparation.md

## Rationale

The new file naming convention is cleaner and more intuitive, focusing on the ISO date format which is more standard and easier to work with. The linking convention ensures better navigation between related entries and improves the overall user experience when working with the translation.

[//]: # ( 2025-04-05T17:36:00 PA: This update simplifies the file structure while improving cross-referencing capabilities throughout the project. )
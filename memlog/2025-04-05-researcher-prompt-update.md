# Researcher Prompt Update - 2025-04-05

## Update Summary

Updated the Researcher prompt (`prompts/original_text_preparation.md`) to include a new requirement: each daily file must end with a note indicating the end line number in the original raw file.

## Changes Made

1. **Added a new formatting requirement**:
   - Added point #6 to the "Paragraph Formatting" section: "At the end of each daily file, add a note indicating the end line number in the original raw file: `[//]: # ( YYYY-MM-DDThh:mm:ss RSR: End line in original file: NNNN )`"

2. **Updated the file format example**:
   - Added an example end line note to the file format example: `[//]: # ( 2025-04-05T15:45:00 RSR: End line in original file: 127 )`

## Purpose

This update serves several important purposes:

1. **Progress Tracking**: Makes it easier to track progress through the original raw files
2. **Verification**: Helps ensure no content is missed during the processing of raw files
3. **Continuity**: Provides clear markers for where one day's entry ends in the original file
4. **Debugging**: Simplifies troubleshooting if discrepancies are found between raw files and processed files

## Next Steps

1. **Apply to existing files**: Existing daily files should be updated to include this end line information
2. **Verify implementation**: Ensure the Researcher mode follows this new requirement for all future file processing

[//]: # ( 2025-04-05T15:45:00 PA: Updated Researcher prompt to require end line notes in daily files )
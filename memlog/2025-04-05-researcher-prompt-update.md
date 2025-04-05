# Researcher Prompt Update

Date: 2025-04-05

## Changes Made

Updated the instructions in `prompts/original_text_preparation.md` to prevent the Researcher from opening the entire raw file at once, as it's too large for the context window. Instead, the Researcher is now instructed to:

1. Work with already prepared files
2. Look at the comment at the end of these files that refers to a line in the raw file
3. Only read specific sections of the raw file when needed, rather than the entire file

This change will improve performance and prevent context overflow when working with the large raw diary files.

## Updated File

The `prompts/original_text_preparation.md` file has been updated with more efficient instructions for handling large raw files.

[//]: # ( 2025-04-05T16:55:00 PA: Updated Researcher instructions to improve handling of large raw files )
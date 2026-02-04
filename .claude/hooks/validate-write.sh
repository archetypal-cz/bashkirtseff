#!/bin/bash
# PostToolUse hook for Write: Validate markdown file format
# Receives JSON via stdin with: tool_name, tool_input, tool_response

set -e

# Read input JSON from stdin
INPUT=$(cat)

# Extract the file path from tool_input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Only validate markdown files in our source directories
if [[ ! "$FILE_PATH" =~ \.md$ ]]; then
    exit 0
fi

# Skip non-source files
if [[ ! "$FILE_PATH" =~ src/(cz|_original)/ ]]; then
    exit 0
fi

# Skip workflow and glossary files
if [[ "$FILE_PATH" =~ _workflow/ ]] || [[ "$FILE_PATH" =~ _glossary/ ]]; then
    exit 0
fi

WARNINGS=""

# Check for paragraph ID format in entry files
if [[ "$FILE_PATH" =~ [0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
    # Check if file has paragraph IDs
    if [ -f "$FILE_PATH" ]; then
        if ! grep -q '\[//\]: # ( [0-9]*\.[0-9]* )' "$FILE_PATH" 2>/dev/null; then
            WARNINGS="$WARNINGS Missing paragraph IDs;"
        fi

        # Check for date header
        if ! head -1 "$FILE_PATH" | grep -q '^#' 2>/dev/null; then
            WARNINGS="$WARNINGS Missing date header;"
        fi
    fi
fi

# If translation file in /cz/, check for original French in comments
if [[ "$FILE_PATH" =~ src/cz/ ]] && [[ "$FILE_PATH" =~ [0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
    if [ -f "$FILE_PATH" ]; then
        # Should have French text in comments
        if ! grep -q '\[//\]: # ( [A-Za-z]' "$FILE_PATH" 2>/dev/null; then
            WARNINGS="$WARNINGS Translation may be missing French original in comments;"
        fi
    fi
fi

# Output warnings if any (shown in verbose mode)
if [ -n "$WARNINGS" ]; then
    echo "{\"validated\": true, \"warnings\": \"$WARNINGS\", \"file\": \"$FILE_PATH\"}"
else
    echo "{\"validated\": true, \"file\": \"$FILE_PATH\"}"
fi

exit 0

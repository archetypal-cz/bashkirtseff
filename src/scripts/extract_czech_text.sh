#!/bin/bash
# Extract visible Czech text from a translation file
# Usage: ./extract_czech_text.sh <file.md>
# Strips: YAML frontmatter, %% comments %%, footnote definitions, blank lines

FILE="$1"
if [ -z "$FILE" ]; then
    echo "Usage: $0 <file.md>" >&2
    exit 1
fi

# Remove frontmatter (between ---), then remove %% ... %% lines, then remove empty lines
sed -n '/^---$/,/^---$/!p' "$FILE" | \
    grep -v '^%%' | \
    grep -v '^\[^' | \
    sed '/^$/d' | \
    sed 's/^[0-9]*\\. //'

#!/bin/bash
# Post-edit hook: Update progress after editing diary entries
# Calls TypeScript implementation via npx tsx

set -e

cd "$CLAUDE_PROJECT_DIR"

# Run TypeScript hook, passing stdin through
npx tsx scripts/hooks/post-edit.ts

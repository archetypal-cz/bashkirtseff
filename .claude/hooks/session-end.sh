#!/bin/bash
# Session-end hook: Summarize work and sync TODOs
# Calls TypeScript implementation via npx tsx

set -e

cd "$CLAUDE_PROJECT_DIR"

# Run TypeScript hook, passing stdin through
npx tsx scripts/hooks/session-end.ts

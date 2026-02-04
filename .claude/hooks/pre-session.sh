#!/bin/bash
# Pre-session hook: Show work status when Claude Code starts
# Calls TypeScript implementation via npx tsx

set -e

cd "$CLAUDE_PROJECT_DIR"

# Run TypeScript hook, passing stdin through
npx tsx scripts/hooks/pre-session.ts

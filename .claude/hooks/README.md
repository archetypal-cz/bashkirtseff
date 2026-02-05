# Workflow Hooks

Custom hooks for the Marie Bashkirtseff translation workflow.

All hooks are implemented in TypeScript and called directly via `npx tsx`.

## Configured Hooks

### 1. PostToolUse (Write): `validate-write.ts`

**Trigger**: After any Write tool completes on `.md` files

**Purpose**:
- Validate that entry files have paragraph IDs
- Check for date headers
- Verify translation files have French original in comments

**Checks**:
- Files in `content/cz/` or `content/_original/`
- Date-based entry files (`YYYY-MM-DD.md`)
- Skips workflow and glossary files

### 2. PostToolUse (Write): `post-edit.ts`

**Trigger**: After any Write tool completes on diary entry files

**Purpose**:
- Track progress by scanning frontmatter flags
- Report changes to stderr for visibility
- Calculate completion percentages

### 3. Stop: `session-end.ts`

**Trigger**: When a Claude session ends

**Purpose**:
- Sync TODOs between original and translations
- Report uncommitted changes
- Suggest commit command if auto-commit enabled

## Configuration

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR && npx tsx src/scripts/hooks/validate-write.ts",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR && npx tsx src/scripts/hooks/post-edit.ts",
            "timeout": 15
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR && npx tsx src/scripts/hooks/session-end.ts",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Testing Hooks

Test hooks manually:

```bash
# Test write validation
echo '{"tool_input":{"file_path":"content/cz/015/1882-05-01.md"}}' | npx tsx src/scripts/hooks/validate-write.ts

# Test post-edit hook
echo '{"tool_input":{"file_path":"content/cz/015/1882-05-01.md"}}' | npx tsx src/scripts/hooks/post-edit.ts

# Test session-end hook
echo '{}' | npx tsx src/scripts/hooks/session-end.ts
```

## Hook Input/Output

All hooks receive JSON via stdin and should output JSON to stdout.

**Exit codes**:
- 0: Success
- 2: Block the operation (PreToolUse only)
- Other: Non-blocking error

## TypeScript Hooks Structure

All hooks are pure TypeScript in `src/scripts/hooks/`:

```
src/scripts/hooks/
├── validate-write.ts      # File validation
├── post-edit.ts           # Progress tracking after edits
├── session-end.ts         # Session cleanup
├── pre-session.ts         # Session start (optional)
└── lib/
    ├── types.ts           # Type definitions
    ├── config.ts          # Configuration utilities
    ├── readme-parser.ts   # README.md parsing/updating
    ├── progress.ts        # Progress calculation
    ├── source-sync.ts     # Source file synchronization
    └── todo-sync.ts       # TODO synchronization
```

## Worker Configuration

Copy `.claude/WORKER_CONFIG.yaml.template` to `.claude/WORKER_CONFIG.yaml`:

```yaml
github_user: your_username
working_language: cz
assigned_carnets:
  - "001"
  - "002"
roles:
  - translator
  - editor
auto_commit:
  enabled: true
  frequency: after_session
```

## Extending Hooks

To add new functionality:

1. Create TypeScript module in `src/scripts/hooks/`
2. Add to `settings.local.json` hooks section
3. Test manually before using in workflow

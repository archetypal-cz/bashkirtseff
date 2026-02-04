# Workflow Hooks

Custom hooks for the Marie Bashkirtseff translation workflow.

## Configured Hooks

### 1. PostToolUse (Write): `validate-write.sh`

**Trigger**: After any Write tool completes on `.md` files

**Purpose**:
- Validate that entry files have paragraph IDs
- Check for date headers
- Verify translation files have French original in comments

**Checks**:
- Files in `src/cz/` or `src/_original/`
- Date-based entry files (`YYYY-MM-DD.md`)
- Skips workflow and glossary files

### 2. PostToolUse (Write): `post-edit.sh`

**Trigger**: After any Write tool completes on diary entry files

**Purpose**:
- Track progress by scanning frontmatter flags
- Report changes to stderr for visibility
- Calculate completion percentages

**Implementation**: TypeScript (`scripts/hooks/post-edit.ts`)

### 3. Stop: `session-end.sh`

**Trigger**: When a Claude session ends

**Purpose**:
- Sync TODOs between original and translations
- Report uncommitted changes
- Suggest commit command if auto-commit enabled

**Implementation**: TypeScript (`scripts/hooks/session-end.ts`)

## Configuration

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SubagentStop": [...],
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

## Testing Hooks

Test hooks manually:

```bash
# Test subagent hook
echo '{"session_id":"test123","cwd":"/path/to/project"}' | .claude/hooks/subagent-complete.sh

# Test write validation
echo '{"tool_input":{"file_path":"src/cz/15/1882-05-01.md"}}' | .claude/hooks/validate-write.sh
```

## Hook Input/Output

All hooks receive JSON via stdin and should output JSON to stdout.

**Exit codes**:
- 0: Success
- 2: Block the operation (PreToolUse only)
- Other: Non-blocking error

## TypeScript Hooks

The hooks system uses TypeScript for complex logic. Shell wrappers in `.claude/hooks/`
call TypeScript modules in `scripts/hooks/`:

```
.claude/hooks/
├── validate-write.sh      # Shell script (simple validation)
├── post-edit.sh           # Wrapper → scripts/hooks/post-edit.ts
├── session-end.sh         # Wrapper → scripts/hooks/session-end.ts
└── README.md

scripts/hooks/
├── post-edit.ts           # TypeScript implementation
├── session-end.ts         # TypeScript implementation
├── pre-session.ts         # TypeScript implementation (optional)
└── lib/
    ├── types.ts           # Type definitions
    ├── config.ts          # Configuration utilities
    ├── readme-parser.ts   # README.md parsing/updating
    ├── progress.ts        # Progress calculation
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

1. Create TypeScript module in `scripts/hooks/`
2. Create shell wrapper in `.claude/hooks/`
3. Make wrapper executable: `chmod +x script.sh`
4. Add to `settings.local.json` hooks section
5. Test manually before using in workflow

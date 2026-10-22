# Claude Code Statusline

Minimal two-line statusline for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) showing model, project, git branch, API usage, and context window.

```
Claude Opus 4.6 | my-project • main
5h 16% (2h 43m) • 7d 20% (6d 9h) | ctx 12% (11k/200k)
```

Based on [this Reddit post](https://www.reddit.com/r/ClaudeCode/comments/1rg3nmt/my_minimal_claude_code_statusline_config/) by u/xleddyl — adapted to work cross-platform (macOS + Linux/WSL).

## What it shows

| Element | Description |
|---------|-------------|
| **Model** | Current Claude model (orange) |
| **Folder** | Project directory name (cyan) |
| **Branch** | Git branch or short SHA (purple) |
| **5h / 7d** | API usage percentage with time until reset |
| **ctx** | Context window usage % and token count |

## In this project

Installed project-wide: `.claude/settings.json` sets `statusLine` to `.claude/statusline/statusline-command.sh` and
runs `fetch-usage.sh` in the background from the PreToolUse and Stop hooks (it refreshes the cache at most once a
minute). Nothing to copy; it works on the next session in this checkout.

## Install (personal, any project)

### 1. Copy scripts

```bash
curl -sL https://gist.githubusercontent.com/RAW_URL/fetch-usage.sh -o ~/.claude/fetch-usage.sh
curl -sL https://gist.githubusercontent.com/RAW_URL/statusline-command.sh -o ~/.claude/statusline-command.sh
chmod +x ~/.claude/fetch-usage.sh ~/.claude/statusline-command.sh
```

Or just copy the two `.sh` files into `~/.claude/`.

### 2. Update settings

Add this to `~/.claude/settings.json` (merge with existing config if you have one):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/fetch-usage.sh > /dev/null 2>&1 &"
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
            "command": "bash ~/.claude/fetch-usage.sh > /dev/null 2>&1 &"
          }
        ]
      }
    ]
  }
}
```

### 3. Restart Claude Code

The statusline appears on the next session. Usage stats populate after the first tool use.

## Requirements

- `curl` and `jq` (both widely available)
- `git` (for branch display)

## How it works

1. **Hooks** run `fetch-usage.sh` in the background on every tool use and when Claude stops
2. `fetch-usage.sh` reads your OAuth token and calls the Anthropic usage API, caching results to `/tmp/.claude_usage_cache`
3. The **statusline command** reads the cache (instant) plus stdin JSON from Claude Code to render the display

Token retrieval is platform-aware:
- **macOS** — reads from Keychain via `security find-generic-password`
- **Linux/WSL** — reads from `~/.claude/.credentials.json`

## Troubleshooting

- **No usage stats** — run `bash ~/.claude/fetch-usage.sh` manually, then check `cat /tmp/.claude_usage_cache`
- **Token not found** — on Linux, verify `~/.claude/.credentials.json` exists; on macOS, check Keychain access
- **Stale data** — delete `/tmp/.claude_usage_cache`; it refreshes on next tool use

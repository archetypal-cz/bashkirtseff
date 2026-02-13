# CLAUDE.md - Docker Workspace Environment

You are running inside the Bashkirtseff Docker workspace container.

## Environment

- **OS**: Ubuntu 24.04 in Docker, running as root
- **Working directory**: /workspace (project root mounted from host)
- **Node.js**: 24.x with npm 11.x
- **Python**: Available via `uv` (no system Python — use `uv run`)
- **Task runner**: `just` — always prefer justfile commands

## Available Tools

| Tool | Command | Purpose |
|------|---------|---------|
| Claude Code | `claude` | AI coding assistant (unrestricted mode) |
| Gemini CLI | `gemini` | Google AI for review |
| GitHub CLI | `gh` | GitHub operations |
| just | `just` | Project task runner |
| code-server | http://localhost:8080 | VS Code in browser |
| byobu/tmux | `byobu` | Terminal multiplexer |
| uv | `uv run python3 ...` | Python scripts |
| vim | `vim` | Text editor |

## Key Differences from Host

1. **node_modules are container-local** — they live in Docker named volumes, not on the host filesystem. Run `npm install` inside the container if needed.
2. **No X11/GUI** — use code-server for visual editing, byobu for terminals.
3. **Ports**: 8080 (code-server), 4321 (Astro dev), 3000 (preview).
4. **Claude Code runs with `--dangerously-skip-permissions`** by default (bash alias).

## Working with the Project

The full project is mounted at `/workspace`. All justfile commands work:

```bash
just              # List all commands
just setup        # Install deps + build shared package
just fe-dev       # Start Astro dev server (accessible at host:4321)
```

## Multiple Terminal Sessions

Byobu is the default shell. Use it for multiple terminal windows:
- `F2` = New window
- `F3/F4` = Switch windows
- `F6` = Detach (container keeps running)

## Secrets

API keys are injected via environment variables from the `.env` file at project root. Never commit secrets.

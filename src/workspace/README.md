# Bashkirtseff Workspace Container

A complete development environment for the Bashkirtseff diary translation project, packaged as a Docker container. Provides Claude Code, Gemini CLI, code-server (VS Code in browser), and all project tooling.

## Prerequisites

- Docker Engine 24+ with Docker Compose v2
- An Anthropic API key (for Claude Code)

## Quick Start

1. **Create your `.env` file** in the project root:

   ```bash
   cp src/workspace/.env.example .env
   # Edit .env and add your API keys
   ```

2. **Build and start** the workspace:

   ```bash
   just workspace-up
   # or: cd src/workspace && docker compose up -d --build
   ```

3. **Access the workspace**:

   | Interface | URL / Command |
   |-----------|---------------|
   | VS Code (browser) | http://localhost:8080 |
   | Terminal | `just workspace-shell` |
   | Byobu (attached) | `just workspace-attach` |

4. **Stop** the workspace:

   ```bash
   just workspace-down
   # To also remove volumes (node_modules, code-server data):
   cd src/workspace && docker compose down -v
   ```

## Ports

| Port | Service | Description |
|------|---------|-------------|
| 8080 | code-server | VS Code in browser |
| 4321 | Astro dev | Frontend dev server (`just fe-dev`) |
| 3000 | Preview | Production preview (`just fe-preview`) |

## Inside the Container

The container drops you into byobu with the project mounted at `/workspace`.

### Common commands

```bash
just              # Show all available commands
just setup        # Install dependencies (first time)
just fe-dev       # Start frontend dev server
claude            # Start Claude Code
gemini            # Start Gemini CLI
```

### Claude Code permissions

The `claude` alias in the container runs with `--dangerously-skip-permissions`, which means Claude can execute any tool (bash commands, file edits, etc.) without asking for confirmation. This is intentional for the workspace container — it's an isolated, disposable environment where the friction of permission prompts would slow down multi-agent workflows and batch processing.

**Do not use this flag on your host machine** unless you understand the implications. Outside the container, Claude Code's default permission model protects you from unintended destructive actions.

### Multiple terminals (byobu)

| Key | Action |
|-----|--------|
| F2 | New window |
| F3 | Previous window |
| F4 | Next window |
| F6 | Detach (container keeps running) |

## Rebuilding

After updating the Dockerfile:

```bash
just workspace-up  # rebuilds automatically
```

Force a clean rebuild:

```bash
cd src/workspace
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Architecture

```
Host                              Container
──────────────────                ──────────────────
project root/             ──►     /workspace/          (bind mount)
.env                      ──►     env vars             (env_file)
                                  node_modules/        (named volume)
                                  code-server data/    (named volume)
```

- Project files are shared via bind mount (changes sync both ways)
- `node_modules` are isolated in named volumes (container has its own)
- code-server state persists across container restarts
- Container runs as root for simplicity

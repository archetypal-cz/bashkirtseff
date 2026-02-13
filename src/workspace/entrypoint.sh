#!/bin/bash
set -e

WORKSPACE="/workspace"
EXTENSION_SRC="$WORKSPACE/.vscode/bashkirtseff-highlighting"
CS_EXTENSIONS_DIR="/root/.local/share/code-server/extensions"
CS_USER_DIR="/root/.local/share/code-server/User"
FIRST_RUN_MARKER="/root/.workspace-initialized"

echo "=== Bashkirtseff Workspace Starting ==="

# --------------------------------------------------------
# 1. Install bashkirtseff-highlighting extension
# --------------------------------------------------------
if [ -d "$EXTENSION_SRC" ]; then
    DEST="$CS_EXTENSIONS_DIR/bashkirtseff-markdown-highlighting"
    if [ ! -L "$DEST" ] && [ ! -d "$DEST" ]; then
        echo "Installing bashkirtseff-highlighting extension..."
        mkdir -p "$CS_EXTENSIONS_DIR"
        ln -s "$EXTENSION_SRC" "$DEST"
    fi
fi

# --------------------------------------------------------
# 2. Configure code-server User settings
# --------------------------------------------------------
mkdir -p "$CS_USER_DIR"

if [ ! -f "$CS_USER_DIR/settings.json" ] && [ -f "$WORKSPACE/.vscode/settings.json" ]; then
    echo "Copying workspace settings to code-server..."
    cp "$WORKSPACE/.vscode/settings.json" "$CS_USER_DIR/settings.json"
fi

# --------------------------------------------------------
# 3. SSH server
# --------------------------------------------------------
if [ -n "$SSH_PUBLIC_KEY" ]; then
    echo "$SSH_PUBLIC_KEY" > /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    echo "SSH key installed from SSH_PUBLIC_KEY env var."
fi

if [ -f /root/.ssh/authorized_keys ]; then
    echo "Starting SSH server on :2222..."
    /usr/sbin/sshd -p 2222
fi

# --------------------------------------------------------
# 4. Start code-server in background
# --------------------------------------------------------
echo "Starting code-server on :8080..."
code-server "$WORKSPACE" &

# --------------------------------------------------------
# 5. First-run project setup
# --------------------------------------------------------
if [ ! -f "$FIRST_RUN_MARKER" ]; then
    echo "First run detected. Installing project dependencies..."
    cd "$WORKSPACE"

    if [ -f "package.json" ] && [ ! -d "node_modules/@bashkirtseff" ]; then
        npm install 2>&1 | tail -5
    fi

    if [ -d "src/shared" ] && [ ! -d "src/shared/dist" ]; then
        npm run build -w @bashkirtseff/shared 2>&1 | tail -5
    fi

    touch "$FIRST_RUN_MARKER"
    echo "Project setup complete."
fi

# --------------------------------------------------------
# 6. Claude Code alias (unrestricted mode)
# --------------------------------------------------------
if ! grep -q "dangerously-skip-permissions" /root/.bashrc 2>/dev/null; then
    echo 'alias claude="claude --dangerously-skip-permissions"' >> /root/.bashrc
fi

# --------------------------------------------------------
# 7. Welcome banner
# --------------------------------------------------------
echo ""
echo "============================================"
echo "  Bashkirtseff Workspace Ready"
echo "============================================"
echo "  SSH:          ssh root@localhost -p 2222"
echo "  code-server:  http://localhost:8080"
echo "  Astro dev:    just fe-dev  (port 4321)"
echo "  Claude Code:  claude"
echo "  Gemini CLI:   gemini"
echo "  Task runner:  just"
echo "============================================"
echo ""

# --------------------------------------------------------
# 8. Execute CMD (default: byobu)
# --------------------------------------------------------
exec "$@"

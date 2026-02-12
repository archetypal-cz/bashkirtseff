#!/bin/bash

# Install Bashkirtseff Markdown Highlighting Extension
# This script creates a symlink from the project extension to VSCode's extension directory

EXTENSION_NAME="bashkirtseff-markdown-highlighting"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VSCODE_EXT_DIR="$HOME/.vscode/extensions"
VSCODE_SERVER_EXT_DIR="$HOME/.vscode-server/extensions"

echo "Installing Bashkirtseff Markdown Highlighting Extension..."

# Install for regular VSCode
echo "Installing for VSCode..."
mkdir -p "$VSCODE_EXT_DIR"
if [ -e "$VSCODE_EXT_DIR/$EXTENSION_NAME" ] || [ -L "$VSCODE_EXT_DIR/$EXTENSION_NAME" ]; then
    rm -rf "$VSCODE_EXT_DIR/$EXTENSION_NAME"
fi
ln -s "$PROJECT_DIR" "$VSCODE_EXT_DIR/$EXTENSION_NAME"

# Install for VSCode Server (WSL/Remote)
if [ -d "$HOME/.vscode-server" ]; then
    echo "Installing for VSCode Server (WSL)..."
    mkdir -p "$VSCODE_SERVER_EXT_DIR"
    if [ -e "$VSCODE_SERVER_EXT_DIR/$EXTENSION_NAME" ] || [ -L "$VSCODE_SERVER_EXT_DIR/$EXTENSION_NAME" ]; then
        rm -rf "$VSCODE_SERVER_EXT_DIR/$EXTENSION_NAME"
    fi
    ln -s "$PROJECT_DIR" "$VSCODE_SERVER_EXT_DIR/$EXTENSION_NAME"
fi

echo "Extension installed! Please reload VSCode window (Ctrl+Shift+P -> 'Developer: Reload Window')"
# Bashkirtseff Markdown Comment Highlighting

This local VSCode extension provides custom syntax highlighting for various comment patterns in the Bashkirtseff diary markdown files.

## Comment Types Supported

The extension recognizes and styles six types of comments:

### 1. Paragraph IDs
- **Pattern:** `%% 01.123 %%` (book.paragraph numbers)
- **Style:** Bold blue (#569CD6)
- **Use:** Mark paragraph numbers for reference

### 2. Glossary Links
- **Pattern:** `%% [#Nice](../_glossary/...) %%`
- **Style:** Italic teal (#4EC9B0)
- **Use:** References to glossary entries

### 3. Timestamped Notes
- **Pattern:** `%% 2025-12-07T10:20:00 LAN: note content %%`
- **Roles:** RSR (Researcher), LAN (Linguistic Annotator), TR (Translator), RED (Editor), CON (Conductor), PA (Project Assistant), GEM (Gemini Editor)
- **Style:** Green timestamp (#B5CEA8), yellow role (#DCDCAA), orange content (#CE9178)
- **Use:** Annotated notes with timestamps and roles

### 4. Tag Annotations
- **Pattern:** `%%[end-note 1]%%`, `%%[tag-name value]%%`
- **Style:** Italic orange (#CE9178)
- **Use:** Mark special annotations, notes, or tags

### 5. French Original Text
- **Pattern:** `%% A la promenade, j'ai une jolie robe... %%`
- **Style:** Light blue (#9CDCFE) - slightly highlighted
- **Use:** Original French text in translation files (starts with letter, 20+ chars)

### 6. General Comments
- **Pattern:** `%%any short text%%`
- **Style:** Italic gray (#808080)
- **Use:** General comments that should be less prominent

## Installation

### Method 1: Symlink (Development)
```bash
# From VSCode, open the extension folder
cd scripts/vscode-markdown-highlighting

# Press F5 to open a new VSCode window with the extension loaded
# The extension will be active in the new window
```

### Method 2: Package and Install
```bash
# Install vsce if you haven't already
npm install -g @vscode/vsce

# Navigate to the extension directory
cd scripts/vscode-markdown-highlighting

# Package the extension
vsce package

# Install in VSCode
code --install-extension bashkirtseff-markdown-highlighting-0.0.1.vsix
```

### Method 3: Copy to VSCode Extensions Folder
```bash
# Copy the extension folder to VSCode's extensions directory
cp -r scripts/vscode-markdown-highlighting ~/.vscode/extensions/bashkirtseff-markdown-highlighting
```

## Customization

The colors are defined in `.vscode/settings.json`. You can modify them:

```json
"editor.tokenColorCustomizations": {
    "textMateRules": [
        {
            "scope": "constant.numeric.paragraph-id.bashkirtseff",
            "settings": {
                "foreground": "#569CD6",  // Change this color
                "fontStyle": "bold"       // Or change style
            }
        }
        // ... other rules
    ]
}
```

### Available Font Styles:
- `""` - Normal
- `"italic"`
- `"bold"`
- `"bold italic"`
- `"underline"`

## Adding New Comment Patterns

To add new comment types, edit `syntaxes/markdown-comment-injection.tmLanguage.json`:

1. Add a new pattern object to the `patterns` array
2. Define the regex match pattern
3. Assign unique scope names
4. Add corresponding color rules in `.vscode/settings.json`

Example for adding a TODO comment pattern `%%TODO: text%%`:

```json
{
    "name": "meta.todo.bashkirtseff",
    "match": "(%%)TODO:\\s*([^%]+)(%%)",
    "captures": {
        "1": { "name": "punctuation.definition.todo.begin.bashkirtseff" },
        "2": { "name": "keyword.todo.text.bashkirtseff" },
        "3": { "name": "punctuation.definition.todo.end.bashkirtseff" }
    }
}
```

## Theme Compatibility

The extension uses semantic color values that adapt to your current theme:
- In dark themes: Colors appear as specified
- In light themes: VSCode may automatically adjust colors for readability

To force specific colors per theme, use:

```json
"editor.tokenColorCustomizations": {
    "[Dark+ (default dark)]": {
        "textMateRules": [ /* dark theme rules */ ]
    },
    "[Light+ (default light)]": {
        "textMateRules": [ /* light theme rules */ ]
    }
}
```

## Troubleshooting

1. **Extension not loading:**
   - Reload VSCode window (`Ctrl+Shift+P` → "Developer: Reload Window")
   - Check the Output panel for extension errors

2. **Colors not appearing:**
   - Use "Developer: Inspect Editor Tokens and Scopes" to verify pattern matching
   - Ensure no other extensions override the scopes

3. **Pattern not matching:**
   - Test regex at regex101.com
   - Check for conflicting patterns in the grammar file

## Development

To modify and test the extension:

1. Make changes to the grammar or settings
2. Press `F5` to launch a test window
3. Open a markdown file with your comment patterns
4. Use the scope inspector to verify correct matching
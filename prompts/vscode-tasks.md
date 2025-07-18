# VSCode Tasks Configuration

This document provides recommendations for VSCode tasks configuration to support the Coslate Bashkirtseff translation project. These tasks should be implemented in a `.vscode/tasks.json` file in the project root.

## Recommended Tasks

The following tasks should be implemented to facilitate the translation workflow:

### 1. Compile Markdown to Single File

```json
{
  "label": "Compile Markdown to Single File",
  "type": "shell",
  "command": "python",
  "args": ["./bin/compile_markdown.py", "--output", "${workspaceFolder}/pub/bashkirtseff_diary.md"],
  "group": {
    "kind": "build",
    "isDefault": true
  },
  "presentation": {
    "reveal": "always",
    "panel": "new"
  }
}
```

### 2. Generate HTML from Markdown

```json
{
  "label": "Generate HTML",
  "type": "shell",
  "command": "python",
  "args": ["./bin/markdown_to_html.py", "--input", "${workspaceFolder}/pub/bashkirtseff_diary.md", "--output", "${workspaceFolder}/pub/bashkirtseff_diary.html", "--template", "${workspaceFolder}/templates/html_template.html"],
  "group": "build",
  "presentation": {
    "reveal": "always",
    "panel": "new"
  },
  "dependsOn": ["Compile Markdown to Single File"]
}
```

### 3. Generate EPUB from Markdown

```json
{
  "label": "Generate EPUB",
  "type": "shell",
  "command": "python",
  "args": ["./bin/markdown_to_epub.py", "--input", "${workspaceFolder}/pub/bashkirtseff_diary.md", "--output", "${workspaceFolder}/pub/bashkirtseff_diary.epub", "--metadata", "${workspaceFolder}/templates/epub_metadata.json"],
  "group": "build",
  "presentation": {
    "reveal": "always",
    "panel": "new"
  },
  "dependsOn": ["Compile Markdown to Single File"]
}
```

### 4. Preview HTML

```json
{
  "label": "Preview HTML",
  "type": "shell",
  "command": "open",
  "args": ["${workspaceFolder}/pub/bashkirtseff_diary.html"],
  "windows": {
    "command": "explorer"
  },
  "linux": {
    "command": "xdg-open"
  },
  "presentation": {
    "reveal": "always",
    "panel": "new"
  },
  "dependsOn": ["Generate HTML"]
}
```

### 5. Check Translation Status

```json
{
  "label": "Check Translation Status",
  "type": "shell",
  "command": "python",
  "args": ["./bin/check_translation_status.py"],
  "presentation": {
    "reveal": "always",
    "panel": "new"
  }
}
```

### 6. Update Translation Memory

```json
{
  "label": "Update Translation Memory",
  "type": "shell",
  "command": "python",
  "args": ["./bin/update_translation_memory.py", "--memory", "${workspaceFolder}/docs/Memory.md"],
  "presentation": {
    "reveal": "always",
    "panel": "new"
  }
}
```

## Required Python Scripts

To support these tasks, the following Python scripts should be created in the `./bin` directory:

1. `compile_markdown.py` - Combines all translated markdown files into a single file
2. `markdown_to_html.py` - Converts the compiled markdown to HTML using a template
3. `markdown_to_epub.py` - Converts the compiled markdown to EPUB format
4. `check_translation_status.py` - Analyzes the project to report on translation progress
5. `update_translation_memory.py` - Scans translations to update the translation memory

## Templates

The following templates should be created in a `./templates` directory:

1. `html_template.html` - HTML template with CSS styling for web viewing
2. `epub_metadata.json` - Metadata for EPUB generation including title, author, etc.

## Implementation Notes

These tasks should be implemented by someone with appropriate permissions to create files in the root directory and bin directory. The Project Assistant role is restricted to editing files in the docs, memlog, and prompts directories.

The Python scripts should be developed with Poetry for dependency management, ensuring all required packages are properly installed in the project's virtual environment.

[//]: # ( 2025-03-23T02:20:45 PA: VSCode tasks configuration recommendations created )
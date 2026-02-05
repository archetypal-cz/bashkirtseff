# Poetry Configuration for Coslate Bashkirtseff Project

This document provides recommendations for Poetry configuration to support the Python scripts needed for the Coslate Bashkirtseff translation project. These recommendations should be implemented in a `pyproject.toml` file in the project root.

## Recommended Configuration

```toml
[tool.poetry]
name = "coslate-bashkirtseff"
version = "0.1.0"
description = "Translation project for Marie Bashkirtseff's diary"
authors = ["Your Name <your.email@example.com>"]
readme = "README.md"

[tool.poetry.dependencies]
python = "^3.12"
markdown = "^3.5"
jinja2 = "^3.1.2"
pyyaml = "^6.0"
ebooklib = "^0.18"
beautifulsoup4 = "^4.12.2"
typer = "^0.9.0"
rich = "^13.6.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
black = "^23.9.1"
isort = "^5.12.0"
mypy = "^1.5.1"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

## Package Explanations

### Core Dependencies

- **markdown**: For parsing and processing Markdown files
- **jinja2**: Template engine for generating HTML output
- **pyyaml**: YAML parser for configuration files
- **ebooklib**: Library for EPUB file creation
- **beautifulsoup4**: HTML parsing and manipulation
- **typer**: CLI application framework with type hints
- **rich**: Rich text and formatting in the terminal

### Development Dependencies

- **pytest**: Testing framework
- **black**: Code formatter
- **isort**: Import sorter
- **mypy**: Static type checker

## Installation Instructions

Once the `pyproject.toml` file is created in the project root, run the following commands to set up the Poetry environment:

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Navigate to project directory
cd /path/to/coslate_bashkirtseff

# Install dependencies
poetry install

# Activate the virtual environment
poetry shell
```

## Script Development Guidelines

When developing the Python scripts for the project, follow these guidelines:

1. Use type hints throughout the code
2. Include docstrings for all functions and classes
3. Follow PEP 8 style guidelines (enforced by Black)
4. Create modular code that separates concerns
5. Add appropriate error handling
6. Include logging for important operations
7. Write tests for critical functionality

## Example Script Structure

Here's a recommended structure for the compilation script:

```python
#!/usr/bin/env python3
"""
Compile Markdown files into a single document.

This script combines all translated Markdown files from the src directory
into a single Markdown file in the pub directory.
"""

import logging
import os
from pathlib import Path
from typing import List, Optional

import typer
from rich.console import Console
from rich.logging import RichHandler

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
log = logging.getLogger("compile_markdown")
console = Console()

def find_markdown_files(directory: Path) -> List[Path]:
    """Find all Markdown files in the given directory and its subdirectories."""
    return sorted(directory.glob("**/*.md"))

def compile_files(files: List[Path], output_path: Path) -> None:
    """Combine multiple Markdown files into a single file."""
    with output_path.open("w", encoding="utf-8") as outfile:
        # Write header
        outfile.write("# Marie Bashkirtseff's Diary\n\n")
        
        for file_path in files:
            # Skip certain files
            if "_summary" in str(file_path):
                continue
                
            log.info(f"Processing {file_path}")
            
            # Add file header
            rel_path = file_path.relative_to(Path.cwd())
            outfile.write(f"## {file_path.stem}\n\n")
            
            # Copy content
            with file_path.open("r", encoding="utf-8") as infile:
                content = infile.read()
                outfile.write(content)
                outfile.write("\n\n")
    
    log.info(f"Compilation complete. Output saved to {output_path}")

def main(
    output: Path = typer.Option(
        Path("pub/bashkirtseff_diary.md"),
        help="Path to the output file"
    ),
    source_dir: Path = typer.Option(
        Path("src"),
        help="Directory containing source Markdown files"
    )
) -> None:
    """Compile all Markdown files into a single document."""
    # Ensure output directory exists
    output.parent.mkdir(parents=True, exist_ok=True)
    
    # Find all Markdown files
    files = find_markdown_files(source_dir)
    log.info(f"Found {len(files)} Markdown files")
    
    # Compile files
    compile_files(files, output)

if __name__ == "__main__":
    typer.run(main)
```

%% 2025-03-23T02:21:10 PA: Poetry configuration recommendations created %%
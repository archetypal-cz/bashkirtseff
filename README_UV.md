# Using uv for Coslate Bashkirtseff Project

This project has been migrated from Poetry to uv for faster dependency management.

## Installation

1. Install uv if you haven't already:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Create and activate virtual environment:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
uv pip install -r requirements.txt
```

4. For development dependencies:
```bash
uv pip install -r requirements-dev.txt
```

## Building the Books

To compile a book (e.g., Czech Book 01):
```bash
python scripts/compile_book.py 01 --language cz --template scripts/templates/book_template.html
```

To compile the original French:
```bash
python scripts/compile_book.py 01 --language _original --template scripts/templates/book_template.html
```

## Available Scripts

- `compile_book.py`: Compile individual books
- `compile_all_books.py`: Compile all available books
- `rename_files.py`: Rename files to match conventions

## Output Files

Compiled files are saved in:
- `/pub/cz/` - Czech translations
- `/pub/_original/` - Original French text

Both Markdown (.md) and HTML (.html) versions are generated.

## Migration from Poetry

If you were using Poetry before:
1. The `pyproject.toml` file is still present but not used by uv
2. Dependencies are now in `requirements.txt` and `requirements-dev.txt`
3. Use `uv pip` instead of `poetry add/remove`
4. Use `source .venv/bin/activate` instead of `poetry shell`

## Benefits of uv

- **Much faster** installation and dependency resolution
- **Simpler** command structure
- **Compatible** with standard pip requirements files
- **Lightweight** - no heavy runtime dependencies
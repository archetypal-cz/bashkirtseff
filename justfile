# Justfile for Marie Bashkirtseff Diary Translation Project
# Common operations for book compilation and project management

# Set shell for Windows/WSL compatibility
set shell := ["bash", "-c"]

# Default variables
default_lang := "cz"
default_book := "01"

# Show available commands
default:
    @just --list

# === ENVIRONMENT SETUP ===

# Set up Poetry environment and install dependencies
setup:
    poetry install
    @echo "Environment ready. Run 'just shell' to activate."

# Activate Poetry shell
shell:
    poetry shell

# Install/update dependencies
install:
    poetry install

# Update dependencies
update:
    poetry update

# === COMPILATION ===

# Compile a specific book for a language (e.g., just compile 01 cz)
compile book=default_book lang=default_lang:
    poetry run python scripts/compile_book.py {{book}} --language {{lang}}

# Compile all books for a language (alias: build)
build lang=default_lang:
    poetry run python scripts/compile_all_books.py --languages {{lang}}

# Compile all books for all languages
build-all:
    poetry run python scripts/compile_all_books.py --languages _original --languages cz

# Quick build for development (Czech only)
dev:
    just build cz

# === VIEWING ===

# Open a compiled book in browser
open book=default_book lang=default_lang:
    @echo "Opening Book {{book}} ({{lang}}) in browser..."
    @if [ "{{lang}}" = "_original" ]; then \
        python -c "import webbrowser; webbrowser.open('file://{{justfile_directory()}}/pub/_original/{{book}}.html')"; \
    else \
        python -c "import webbrowser; webbrowser.open('file://{{justfile_directory()}}/pub/{{lang}}/{{lang}}_{{book}}.html')"; \
    fi

# Open original French version
open-original book=default_book:
    just open {{book}} _original

# Open glossary
open-glossary lang=default_lang:
    @if [ "{{lang}}" = "_original" ]; then \
        python -c "import webbrowser; webbrowser.open('file://{{justfile_directory()}}/pub/_original/_glossary.html')"; \
    else \
        python -c "import webbrowser; webbrowser.open('file://{{justfile_directory()}}/pub/{{lang}}/{{lang}}_glossary.html')"; \
    fi

# === DEVELOPMENT ===

# Format Python code
format:
    poetry run black scripts/
    poetry run isort scripts/

# Lint Python code
lint:
    poetry run black --check scripts/
    poetry run isort --check scripts/
    poetry run mypy scripts/

# Run tests
test:
    poetry run pytest

# === UTILITIES ===

# Verify all entries are properly formatted
verify:
    @echo "Verifying entry consistency..."
    @find src/_original -name "*.md" -type f | wc -l | xargs echo "Total source files:"
    @find src/cz -name "*.md" -type f | wc -l | xargs echo "Total Czech files:"

# Check project status
status:
    @echo "=== Project Status ==="
    @echo "Books in source (_original):"
    @ls -la src/_original/ | grep "^d" | grep -E "[0-9]+" | wc -l | xargs echo "  Count:"
    @echo "Books with Czech translations:"
    @ls -la src/cz/ 2>/dev/null | grep "^d" | grep -E "[0-9]+" | wc -l | xargs echo "  Count:"
    @echo "Compiled books:"
    @ls -la pub/_original/*.html 2>/dev/null | wc -l | xargs echo "  Original HTML:"
    @ls -la pub/cz/*.html 2>/dev/null | wc -l | xargs echo "  Czech HTML:"

# Show statistics about the project
stats:
    @echo "=== Project Statistics ==="
    @echo "Source files by book:"
    @for book in $(ls -d src/_original/[0-9]* | sort); do \
        book_num=$$(basename $$book); \
        count=$$(find $$book -name "*.md" | wc -l); \
        echo "  Book $$book_num: $$count entries"; \
    done
    @echo "Czech translation progress:"
    @for book in $(ls -d src/cz/[0-9]* 2>/dev/null | sort); do \
        book_num=$$(basename $$book); \
        count=$$(find $$book -name "*.md" | wc -l); \
        echo "  Book $$book_num: $$count entries"; \
    done
    @echo "Glossary entries:"
    @find src/_original/_glossary -name "*.md" | wc -l | xargs echo "  Count:"

# Search for text in source files
search query:
    @echo "Searching for '{{query}}' in source files..."
    @grep -r "{{query}}" src/_original/ --include="*.md" -n | head -20

# Search for text in Czech translations
search-cz query:
    @echo "Searching for '{{query}}' in Czech translations..."
    @grep -r "{{query}}" src/cz/ --include="*.md" -n | head -20

# Clean compiled files
clean:
    rm -rf pub/_original/*.html
    rm -rf pub/_original/*.md
    rm -rf pub/cz/*.html
    rm -rf pub/cz/*.md
    @echo "Cleaned compiled files"

# === FILE OPERATIONS ===

# Rename files to follow naming conventions
rename:
    poetry run python scripts/rename_files.py

# Create a new daily entry file
new-entry date book="01":
    @echo "Creating new entry for {{date}} in book {{book}}"
    @mkdir -p src/_original/{{book}}
    @touch src/_original/{{book}}/{{date}}.md
    @echo "# Entry for {{date}}" > src/_original/{{book}}/{{date}}.md
    @echo "Created: src/_original/{{book}}/{{date}}.md"

# List entries for a specific book
list-entries book=default_book:
    @echo "Entries in Book {{book}}:"
    @ls -la src/_original/{{book}}/*.md 2>/dev/null | awk '{print $9}' | sort

# Show last few entries in a book
recent book=default_book count="5":
    @echo "Last {{count}} entries in Book {{book}}:"
    @ls -la src/_original/{{book}}/*.md 2>/dev/null | tail -{{count}} | awk '{print $9}'

# === DEPLOYMENT ===

# Build for production and create robots.txt
build-prod:
    just build-all
    @echo "User-agent: *" > pub/robots.txt
    @echo "Disallow: /" >> pub/robots.txt
    @echo "Production build complete with robots.txt"

# === HELP ===

# Show detailed help
help:
    @echo "Marie Bashkirtseff Diary Translation Project"
    @echo "==========================================="
    @echo ""
    @echo "QUICK START:"
    @echo "  just setup           # Set up environment"
    @echo "  just build           # Compile all Czech books"
    @echo "  just open 01 cz      # Open book 01 (Czech) in browser"
    @echo ""
    @echo "COMPILATION:"
    @echo "  just compile 01 cz   # Compile book 01 for Czech"
    @echo "  just build _original # Compile all original French books"
    @echo "  just build-all       # Compile all books for all languages"
    @echo ""
    @echo "VIEWING:"
    @echo "  just open 01 cz      # Open Czech book 01"
    @echo "  just open-original 01 # Open original French book 01"
    @echo "  just open-glossary   # Open glossary"
    @echo ""
    @echo "PROJECT MANAGEMENT:"
    @echo "  just status          # Show project status"
    @echo "  just stats           # Show detailed statistics"
    @echo "  just verify          # Verify file consistency"
    @echo "  just search 'term'   # Search in source files"
    @echo ""
    @echo "DEVELOPMENT:"
    @echo "  just format          # Format Python code"
    @echo "  just lint            # Lint Python code"
    @echo "  just test            # Run tests"
    @echo "  just clean           # Clean compiled files"
    @echo ""
    @echo "Available books: 00, 01, 02, 03, 04, 05"
    @echo "Available languages: _original, cz"
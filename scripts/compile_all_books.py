#!/usr/bin/env python3
"""
Compile all books in the project.

This script is a wrapper around compile_book.py that compiles all books
for all languages in the project.
"""

import logging
import subprocess
from pathlib import Path

import typer
from rich.console import Console
from rich.logging import RichHandler

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)],
)
log = logging.getLogger("compile_all_books")
console = Console()


def find_book_dirs(src_dir: Path, language: str) -> list[Path]:
    """Find all book directories for a specific language."""
    language_dir = src_dir / language
    if not language_dir.exists():
        log.warning(f"Language directory {language_dir} does not exist")
        return []

    return sorted([d for d in language_dir.iterdir() if d.is_dir()])


def compile_book(
    book_id: str, language: str, template_path: Path, output_dir: Path
) -> bool:
    """Compile a single book."""
    log.info(f"Compiling book {book_id} for language {language}")

    cmd = [
        "./scripts/compile_book.py",
        book_id,
        "--language",
        language,
        "--template",
        str(template_path),
        "--output-dir",
        str(output_dir),
    ]

    try:
        subprocess.run(cmd, check=True)
        log.info(f"Successfully compiled book {book_id} for language {language}")
        return True
    except subprocess.CalledProcessError as e:
        log.error(f"Failed to compile book {book_id} for language {language}: {e}")
        return False


def main(
    languages: list[str] = typer.Option(["cz"], help="Languages to compile"),
    template: Path = typer.Option(
        Path("scripts/templates/book_template.html"), help="Path to HTML template file"
    ),
    output_dir: Path = typer.Option(Path("pub"), help="Directory for output files"),
    src_dir: Path = typer.Option(Path("src"), help="Source directory"),
) -> None:
    """Compile all books for all specified languages."""
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    # Compile books for each language
    success_count = 0
    failure_count = 0

    for language in languages:
        book_dirs = find_book_dirs(src_dir, language)
        log.info(f"Found {len(book_dirs)} book directories for language {language}")

        for book_dir in book_dirs:
            book_id = book_dir.name
            if compile_book(book_id, language, template, output_dir):
                success_count += 1
            else:
                failure_count += 1

    # Print summary
    log.info(f"Compilation complete: {success_count} succeeded, {failure_count} failed")


if __name__ == "__main__":
    typer.run(main)

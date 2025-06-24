#!/usr/bin/env python3
"""
Rename files to follow the new naming convention.

This script renames files from the old format (e.g., 01.1873-01-11.md)
to the new format (e.g., 1873-01-11.md) in all language directories.
"""

import logging
import re
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
log = logging.getLogger("rename_files")
console = Console()


def find_files_to_rename(directory: Path) -> list[Path]:
    """Find all files with the old naming pattern in the given directory."""
    # Pattern: XX.YYYY-MM-DD.md (e.g., 01.1873-01-11.md)
    pattern = r"^\d{2}\.\d{4}-\d{2}-\d{2}\.md$"
    return [f for f in directory.glob("*.md") if re.match(pattern, f.name)]


def rename_file(file_path: Path, dry_run: bool = False) -> bool:
    """Rename a file from the old format to the new format."""
    # Extract the date part (e.g., 1873-01-11.md)
    date_match = re.search(r"(\d{4}-\d{2}-\d{2}\.md)", file_path.name)
    if not date_match:
        log.warning(f"Could not extract date from {file_path}")
        return False

    new_name = date_match.group(1)
    new_path = file_path.parent / new_name

    if new_path.exists():
        log.warning(f"Target file already exists: {new_path}")
        return False

    log.info(f"Renaming {file_path} to {new_path}")
    if not dry_run:
        file_path.rename(new_path)
    return True


def process_directory(directory: Path, dry_run: bool = False) -> tuple[int, int]:
    """Process all files in a directory."""
    files = find_files_to_rename(directory)
    success_count = 0
    failure_count = 0

    for file_path in files:
        if rename_file(file_path, dry_run):
            success_count += 1
        else:
            failure_count += 1

    return success_count, failure_count


def main(
    src_dir: Path = typer.Option(Path("src"), help="Source directory"),
    dry_run: bool = typer.Option(
        False, help="Perform a dry run without making changes"
    ),
) -> None:
    """Rename files to follow the new naming convention."""
    total_success = 0
    total_failure = 0

    # Process original files
    original_dirs = [d for d in (src_dir / "_original").glob("*") if d.is_dir()]
    for directory in original_dirs:
        log.info(f"Processing directory: {directory}")
        success, failure = process_directory(directory, dry_run)
        total_success += success
        total_failure += failure

    # Process language-specific directories
    lang_dirs = [d for d in src_dir.glob("*") if d.is_dir() and d.name != "_original"]
    for lang_dir in lang_dirs:
        book_dirs = [d for d in lang_dir.glob("*") if d.is_dir()]
        for directory in book_dirs:
            log.info(f"Processing directory: {directory}")
            success, failure = process_directory(directory, dry_run)
            total_success += success
            total_failure += failure

    # Print summary
    log.info(
        f"Renaming {'(dry run) ' if dry_run else ''}complete: "
        f"{total_success} succeeded, {total_failure} failed"
    )


if __name__ == "__main__":
    typer.run(main)

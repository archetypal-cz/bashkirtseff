#!/usr/bin/env python3
"""
Migration script to reorganize diary entries from book-based to carnet-based structure.

Phase 3 of the carnets reorganization plan.

This script:
1. Creates new carnet directories (000-106)
2. Copies entries to their corresponding carnet based on date
3. Updates frontmatter: book -> carnet
4. Updates paragraph IDs: %%01.XXXX%% -> %%001.XXXX%%
5. Handles both _original and cz translations
6. Generates a detailed migration report

Usage:
    python scripts/migrate-to-carnets.py [--dry-run] [--verbose]
"""

import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class MigrationStats:
    """Track migration statistics."""
    files_processed: int = 0
    files_migrated: int = 0
    files_skipped: int = 0
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    unmapped_dates: list = field(default_factory=list)
    carnet_file_counts: dict = field(default_factory=dict)


def load_carnet_mapping(mapping_path: Path) -> dict:
    """Load the carnet mapping JSON file."""
    with open(mapping_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def parse_date_from_filename(filename: str) -> Optional[datetime]:
    """
    Extract date from filename. Handles various formats:
    - '1873-01-14.md' - standard single date
    - '1876-10-09-11.md' - date range (uses start date)
    - '1878-10-04-evening.md' - date with suffix
    - '1876-11-29-30-12-01.md' - complex date range
    """
    # Try standard single date first: YYYY-MM-DD.md
    date_match = re.match(r'^(\d{4}-\d{2}-\d{2})\.md$', filename)
    if date_match:
        try:
            return datetime.strptime(date_match.group(1), '%Y-%m-%d')
        except ValueError:
            return None

    # Try date with suffix: YYYY-MM-DD-something.md (e.g., evening, continued, late)
    suffix_match = re.match(r'^(\d{4}-\d{2}-\d{2})-(?:evening|late|continued|morning|night)\.md$', filename)
    if suffix_match:
        try:
            return datetime.strptime(suffix_match.group(1), '%Y-%m-%d')
        except ValueError:
            return None

    # Try date range: YYYY-MM-DD-DD.md (same month, day range)
    range_match = re.match(r'^(\d{4}-\d{2}-\d{2})-(\d{2})\.md$', filename)
    if range_match:
        try:
            return datetime.strptime(range_match.group(1), '%Y-%m-%d')
        except ValueError:
            return None

    # Try complex date range: YYYY-MM-DD-DD-MM-DD.md (spanning months)
    complex_match = re.match(r'^(\d{4}-\d{2}-\d{2})-\d{2}-\d{2}-\d{2}\.md$', filename)
    if complex_match:
        try:
            return datetime.strptime(complex_match.group(1), '%Y-%m-%d')
        except ValueError:
            return None

    # Try partial date format: D-MM-DD.md (missing year, rare)
    partial_match = re.match(r'^(\d)-(\d{2})-(\d{2})\.md$', filename)
    if partial_match:
        # This is a malformed date - skip it
        return None

    return None


def parse_section_from_filename(filename: str) -> Optional[str]:
    """Extract section from book 00 files like '00-01.md'."""
    section_match = re.match(r'^00-(\d+)\.md$', filename)
    if section_match:
        return section_match.group(1)
    return None


def find_carnet_for_date(date: datetime, carnets: dict) -> Optional[str]:
    """Find which carnet a date belongs to based on start/end dates."""
    for carnet_id, carnet_info in carnets.items():
        # Skip carnet 000 (preface) - it's handled separately
        if carnet_id == '000':
            continue

        try:
            start_date = datetime.strptime(carnet_info['start_date'], '%Y-%m-%d')
            end_date = datetime.strptime(carnet_info['end_date'], '%Y-%m-%d')

            if start_date <= date <= end_date:
                return carnet_id
        except (KeyError, ValueError):
            continue

    return None


def find_carnet_for_date_with_tolerance(date: datetime, carnets: dict, tolerance_days: int = 3) -> Optional[tuple]:
    """
    Find carnet with some tolerance for edge cases.
    Returns (carnet_id, exact_match) where exact_match is False if tolerance was needed.
    """
    # First try exact match
    exact = find_carnet_for_date(date, carnets)
    if exact:
        return (exact, True)

    # If no exact match, try finding by old_book and nearest carnet
    # This handles dates that fall in gaps between carnets
    from datetime import timedelta

    for delta in range(1, tolerance_days + 1):
        # Try date - delta days
        earlier = find_carnet_for_date(date - timedelta(days=delta), carnets)
        if earlier:
            return (earlier, False)

        # Try date + delta days
        later = find_carnet_for_date(date + timedelta(days=delta), carnets)
        if later:
            return (later, False)

    return None


def old_book_to_new_carnet_id(old_book: str, carnets: dict) -> Optional[str]:
    """
    For book 00, map to carnet 000.
    For other books, this is fallback only.
    """
    if old_book == '00':
        return '000'

    # Find first carnet that belongs to this book
    for carnet_id, carnet_info in carnets.items():
        if carnet_info.get('old_book') == old_book:
            return carnet_id

    return None


def update_frontmatter(content: str, old_book: str, new_carnet: str) -> str:
    """Update frontmatter from book to carnet."""
    # Replace book: XX with carnet: XXX
    # Handle various formats: book: 01, book: "01", book: '01'
    patterns = [
        (rf'^(book:\s*)["\']?{old_book}["\']?\s*$', rf'\1{new_carnet}'),
        (rf'^book:\s*{old_book}\s*$', f'carnet: {new_carnet}'),
    ]

    lines = content.split('\n')
    new_lines = []
    in_frontmatter = False
    frontmatter_count = 0

    for line in lines:
        if line.strip() == '---':
            frontmatter_count += 1
            in_frontmatter = frontmatter_count == 1
            new_lines.append(line)
            continue

        if in_frontmatter and line.startswith('book:'):
            # Replace 'book:' with 'carnet:'
            new_line = re.sub(r'^book:\s*["\']?(\d+)["\']?', f'carnet: {new_carnet}', line)
            new_lines.append(new_line)
        else:
            new_lines.append(line)

    return '\n'.join(new_lines)


def update_paragraph_ids(content: str, old_book: str, new_carnet: str) -> str:
    """
    Update paragraph IDs from 2-digit book format to 3-digit carnet format.

    Examples:
    - %% 01.15 %% -> %% 001.0015 %%
    - %%01.0045%% -> %%001.0045%%
    """
    # Pattern matches both formats: %% 01.15 %% and %%01.0045%%
    # We want to standardize to 3-digit carnet and 4-digit paragraph

    def replace_para_id(match):
        prefix = match.group(1)  # %% or %%
        book = match.group(2)    # 01
        para = match.group(3)    # 15 or 0045
        suffix = match.group(4)  # %% or %%

        # Only replace if book matches the old_book
        if book != old_book:
            return match.group(0)

        # Standardize paragraph to 4 digits
        para_num = int(para)
        new_para = f'{para_num:04d}'

        # Preserve original spacing style
        if prefix == '%% ':
            return f'%% {new_carnet}.{new_para} %%'
        else:
            return f'%%{new_carnet}.{new_para}%%'

    # Match patterns like %% 01.15 %% or %%01.0045%%
    pattern = r'(%%\s?)(\d{2})\.(\d+)(\s?%%)'
    content = re.sub(pattern, replace_para_id, content)

    return content


def process_book00_file(
    src_path: Path,
    dst_dir: Path,
    dry_run: bool,
    verbose: bool,
    stats: MigrationStats
) -> bool:
    """Process a book 00 file (preface material)."""
    filename = src_path.name
    section = parse_section_from_filename(filename)

    if section is None:
        # Not a numbered section (e.g., README.md)
        if filename == 'README.md':
            new_filename = 'README.md'
        else:
            if verbose:
                print(f"  Skipping non-standard file: {filename}")
            stats.files_skipped += 1
            return False
    else:
        # Convert 00-01.md to 000-01.md
        new_filename = f'000-{section}.md'

    dst_path = dst_dir / new_filename

    # Read and update content
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update paragraph IDs: %% 00.XX %% -> %% 000.00XX %%
    updated_content = update_paragraph_ids(content, '00', '000')

    if dry_run:
        if verbose:
            print(f"  Would copy {src_path} -> {dst_path}")
            if content != updated_content:
                print(f"    (with paragraph ID updates)")
        return True

    # Write updated file
    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    # Preserve timestamps
    stat_info = os.stat(src_path)
    os.utime(dst_path, (stat_info.st_atime, stat_info.st_mtime))

    if verbose:
        print(f"  Migrated {filename} -> {new_filename}")

    stats.files_migrated += 1
    stats.carnet_file_counts['000'] = stats.carnet_file_counts.get('000', 0) + 1
    return True


def process_entry_file(
    src_path: Path,
    old_book: str,
    carnets: dict,
    base_dst_dir: Path,
    dry_run: bool,
    verbose: bool,
    stats: MigrationStats
) -> bool:
    """Process a diary entry file."""
    filename = src_path.name
    entry_date = parse_date_from_filename(filename)

    if entry_date is None:
        if verbose:
            print(f"  Skipping non-date file: {filename}")
        stats.files_skipped += 1
        return False

    # Find target carnet
    result = find_carnet_for_date_with_tolerance(entry_date, carnets)

    if result is None:
        # Can't find carnet - use book mapping as fallback
        new_carnet = old_book_to_new_carnet_id(old_book, carnets)
        if new_carnet:
            stats.warnings.append(
                f"Date {entry_date.date()} not in any carnet range, "
                f"using book {old_book} -> carnet {new_carnet} mapping"
            )
        else:
            stats.unmapped_dates.append((filename, str(entry_date.date()), old_book))
            stats.errors.append(f"Cannot find carnet for {filename} (date: {entry_date.date()}, book: {old_book})")
            return False
    else:
        new_carnet, exact_match = result
        if not exact_match:
            stats.warnings.append(
                f"Date {entry_date.date()} in {filename} assigned to carnet {new_carnet} "
                f"(using tolerance, not exact date range)"
            )

    # Read content
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update frontmatter and paragraph IDs
    updated_content = update_frontmatter(content, old_book, new_carnet)
    updated_content = update_paragraph_ids(updated_content, old_book, new_carnet)

    # Create destination
    dst_dir = base_dst_dir / new_carnet
    dst_path = dst_dir / filename

    if dry_run:
        if verbose:
            changes = []
            if content != updated_content:
                changes.append("frontmatter/IDs updated")
            change_str = f" ({', '.join(changes)})" if changes else ""
            print(f"  Would copy {src_path.name} -> {new_carnet}/{filename}{change_str}")
        return True

    # Ensure directory exists
    dst_dir.mkdir(parents=True, exist_ok=True)

    # Write updated file
    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    # Preserve timestamps
    stat_info = os.stat(src_path)
    os.utime(dst_path, (stat_info.st_atime, stat_info.st_mtime))

    if verbose:
        print(f"  Migrated {old_book}/{filename} -> {new_carnet}/{filename}")

    stats.files_migrated += 1
    stats.carnet_file_counts[new_carnet] = stats.carnet_file_counts.get(new_carnet, 0) + 1
    return True


def create_carnet_directories(base_dir: Path, carnets: dict, dry_run: bool, verbose: bool):
    """Create all carnet directories."""
    for carnet_id in carnets.keys():
        carnet_dir = base_dir / carnet_id
        if not carnet_dir.exists():
            if dry_run:
                if verbose:
                    print(f"  Would create directory: {carnet_dir}")
            else:
                carnet_dir.mkdir(parents=True, exist_ok=True)
                if verbose:
                    print(f"  Created directory: {carnet_dir}")


def migrate_language(
    src_base: Path,
    carnets: dict,
    dry_run: bool,
    verbose: bool,
    language: str
) -> MigrationStats:
    """Migrate all entries for a specific language."""
    stats = MigrationStats()

    print(f"\n{'='*60}")
    print(f"Migrating {language.upper()} entries")
    print(f"{'='*60}")

    # Create carnet directories
    if verbose:
        print("\nCreating carnet directories...")
    create_carnet_directories(src_base, carnets, dry_run, verbose)

    # Process each old book directory
    for book_num in range(17):  # 00-16
        old_book = f'{book_num:02d}'
        old_dir = src_base / old_book

        if not old_dir.exists():
            if verbose:
                print(f"\nSkipping {old_book}/ (directory not found)")
            continue

        print(f"\nProcessing book {old_book}/...")

        # Get all .md files
        md_files = sorted(old_dir.glob('*.md'))

        for md_file in md_files:
            stats.files_processed += 1

            if old_book == '00':
                # Special handling for book 00 (preface)
                dst_dir = src_base / '000'
                if not dry_run:
                    dst_dir.mkdir(parents=True, exist_ok=True)
                process_book00_file(md_file, dst_dir, dry_run, verbose, stats)
            else:
                # Regular diary entry
                process_entry_file(
                    md_file, old_book, carnets, src_base,
                    dry_run, verbose, stats
                )

    return stats


def print_report(stats_original: MigrationStats, stats_cz: Optional[MigrationStats], dry_run: bool):
    """Print migration report."""
    print("\n" + "="*60)
    print("MIGRATION REPORT")
    print("="*60)

    if dry_run:
        print("\n*** DRY RUN - No changes were made ***\n")

    print("\n--- Original (French) ---")
    print(f"Files processed: {stats_original.files_processed}")
    print(f"Files migrated:  {stats_original.files_migrated}")
    print(f"Files skipped:   {stats_original.files_skipped}")
    print(f"Errors:          {len(stats_original.errors)}")
    print(f"Warnings:        {len(stats_original.warnings)}")

    if stats_cz:
        print("\n--- Czech Translations ---")
        print(f"Files processed: {stats_cz.files_processed}")
        print(f"Files migrated:  {stats_cz.files_migrated}")
        print(f"Files skipped:   {stats_cz.files_skipped}")
        print(f"Errors:          {len(stats_cz.errors)}")
        print(f"Warnings:        {len(stats_cz.warnings)}")

    # Carnet distribution
    print("\n--- Carnet Distribution (Original) ---")
    for carnet_id in sorted(stats_original.carnet_file_counts.keys()):
        count = stats_original.carnet_file_counts[carnet_id]
        print(f"  Carnet {carnet_id}: {count} files")

    # Errors
    all_errors = stats_original.errors + (stats_cz.errors if stats_cz else [])
    if all_errors:
        print("\n--- ERRORS ---")
        for error in all_errors[:20]:  # Limit output
            print(f"  ! {error}")
        if len(all_errors) > 20:
            print(f"  ... and {len(all_errors) - 20} more errors")

    # Warnings
    all_warnings = stats_original.warnings + (stats_cz.warnings if stats_cz else [])
    if all_warnings:
        print("\n--- WARNINGS ---")
        for warning in all_warnings[:20]:
            print(f"  ? {warning}")
        if len(all_warnings) > 20:
            print(f"  ... and {len(all_warnings) - 20} more warnings")

    # Unmapped dates
    all_unmapped = stats_original.unmapped_dates + (stats_cz.unmapped_dates if stats_cz else [])
    if all_unmapped:
        print("\n--- UNMAPPED DATES ---")
        for filename, date, book in all_unmapped:
            print(f"  {filename} ({date}) from book {book}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Migrate diary entries from books to carnets')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--original-only', action='store_true', help='Only migrate _original, skip cz/')
    args = parser.parse_args()

    # Paths
    project_root = Path(__file__).parent.parent
    mapping_path = project_root / 'src' / '_original' / '_carnets' / 'carnet-mapping.json'
    original_dir = project_root / 'src' / '_original'
    cz_dir = project_root / 'src' / 'cz'

    print("="*60)
    print("CARNET MIGRATION SCRIPT")
    print("="*60)
    print(f"\nProject root: {project_root}")
    print(f"Mapping file: {mapping_path}")
    print(f"Dry run: {args.dry_run}")
    print(f"Verbose: {args.verbose}")

    # Load mapping
    if not mapping_path.exists():
        print(f"\nERROR: Mapping file not found: {mapping_path}")
        sys.exit(1)

    mapping = load_carnet_mapping(mapping_path)
    carnets = mapping['carnets']

    print(f"\nLoaded mapping with {len(carnets)} carnets")

    # Migrate original
    stats_original = migrate_language(original_dir, carnets, args.dry_run, args.verbose, 'original')

    # Migrate Czech translations
    stats_cz = None
    if not args.original_only and cz_dir.exists():
        # Check if there are any book directories in cz/
        cz_book_dirs = list(cz_dir.glob('[0-9][0-9]'))
        if cz_book_dirs:
            stats_cz = migrate_language(cz_dir, carnets, args.dry_run, args.verbose, 'cz')
        else:
            print(f"\nSkipping cz/ - no book directories found")

    # Print report
    print_report(stats_original, stats_cz, args.dry_run)

    if args.dry_run:
        print("\n" + "="*60)
        print("To perform the migration, run without --dry-run flag")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("Migration complete!")
        print("="*60)
        print("\nNext steps:")
        print("1. Verify the new carnet directories contain correct files")
        print("2. Check frontmatter updates (book: -> carnet:)")
        print("3. Check paragraph ID updates (XX.YYYY -> XXX.YYYY)")
        print("4. After verification, old book directories can be removed")


if __name__ == '__main__':
    main()

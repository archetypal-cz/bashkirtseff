#!/usr/bin/env python3
"""
Fix glossary links to use relative paths.

This script standardizes all glossary internal links to use relative paths
instead of absolute paths, ensuring they work properly in compiled HTML.

Changes:
- [Text](/src/_original/_glossary/Entry.md) → [Text](Entry.md)
- [#Text](/src/_original/_glossary/Entry.md) → [#Text](Entry.md)
"""

import re
from pathlib import Path
from typing import List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def find_glossary_files(glossary_dir: Path) -> List[Path]:
    """Find all .md files in the glossary directory."""
    return sorted(glossary_dir.glob("*.md"))


def fix_links_in_content(content: str) -> Tuple[str, int]:
    """
    Fix all absolute glossary links to relative paths and standardize hashtag prefixes.
    
    Returns:
        Tuple of (fixed_content, number_of_changes)
    """
    changes = 0
    
    # Pattern 1: [Text](/src/_original/_glossary/Entry.md) → [#Text](Entry.md)
    pattern1 = r'\[([^\]]+)\]\(/src/_original/_glossary/([^)]+)\.md\)'
    def replace1(match):
        nonlocal changes
        changes += 1
        text = match.group(1)
        filename = match.group(2)
        # Add hashtag prefix if not already present
        if not text.startswith('#'):
            text = f'#{text}'
        return f'[{text}]({filename}.md)'
    
    content = re.sub(pattern1, replace1, content)
    
    # Pattern 2: [Text](Entry.md) → [#Text](Entry.md) (standardize hashtag prefix)
    pattern2 = r'\[([^#][^\]]*)\]\(([^/)]+\.md)\)'
    def replace2(match):
        nonlocal changes
        changes += 1
        text = match.group(1)
        filename = match.group(2)
        return f'[#{text}]({filename})'
    
    content = re.sub(pattern2, replace2, content)
    
    return content, changes


def fix_glossary_links(glossary_dir: Path, dry_run: bool = False) -> None:
    """
    Fix all glossary links in the specified directory.
    
    Args:
        glossary_dir: Path to the glossary directory
        dry_run: If True, only report what would be changed without making changes
    """
    files = find_glossary_files(glossary_dir)
    total_changes = 0
    files_changed = 0
    
    logger.info(f"Found {len(files)} glossary files to process")
    
    for file_path in files:
        logger.info(f"Processing {file_path.name}")
        
        try:
            # Read the file
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Fix the links
            fixed_content, changes = fix_links_in_content(original_content)
            
            if changes > 0:
                files_changed += 1
                total_changes += changes
                logger.info(f"  - Found {changes} links to fix")
                
                if not dry_run:
                    # Write the fixed content back
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(fixed_content)
                    logger.info(f"  - Fixed {changes} links in {file_path.name}")
                else:
                    logger.info(f"  - Would fix {changes} links in {file_path.name}")
            else:
                logger.info(f"  - No changes needed")
                
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
    
    logger.info(f"Summary: {total_changes} links fixed in {files_changed} files")
    if dry_run:
        logger.info("DRY RUN - No files were actually modified")


def main():
    """Main function to run the link fixing process."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix glossary links to use relative paths")
    parser.add_argument(
        "--glossary-dir", 
        type=Path,
        default=Path("src/_original/_glossary"),
        help="Path to the glossary directory"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without making changes"
    )
    
    args = parser.parse_args()
    
    if not args.glossary_dir.exists():
        logger.error(f"Glossary directory {args.glossary_dir} does not exist")
        return 1
    
    fix_glossary_links(args.glossary_dir, args.dry_run)
    return 0


if __name__ == "__main__":
    exit(main())
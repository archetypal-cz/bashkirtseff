#!/usr/bin/env python3
"""
Fix lines where a %% comment %% is followed by text on the same line.

The parser at paragraph-parser.ts line 221 checks:
    if (strippedLine.startsWith('%%') && strippedLine.endsWith('%%'))
This means lines like:
    %% comment %% Some text here...
are not parsed as comments, and the text after the closing %% is lost.

This script splits such lines so the comment is on its own line and the
text follows on the next line.

It also handles the case where text is followed by a trailing %% comment %%
(splitting into three lines: comment, text, comment).
"""

import re
import sys
from pathlib import Path

# Pattern to find lines that start with %% and have text after a closing %%
# We need to be careful:
# - Lines that are JUST %% comment %% should be left alone
# - Lines that are glossary links %% [#...] %% should be left alone
# - We want lines where after the closing %% there's actual text

def find_split_point(line: str) -> tuple[str, str, str] | None:
    """
    Given a line like:
        %% comment %% text here
    or:
        %% comment %% text here %% another comment %%

    Returns (leading_comment, middle_text, trailing_comment) or None if no split needed.

    The leading_comment includes the closing %%.
    The trailing_comment includes its opening %%, or is empty string.
    """
    stripped = line.strip()

    # Must start with %%
    if not stripped.startswith('%%'):
        return None

    # If it ends with %% and the whole thing is just a comment, skip it
    # We need to check if there's text BETWEEN comment blocks

    # Strategy: find all %% positions
    # A comment is %% ... %% where the content doesn't contain %%
    # But actually, comments CAN'T contain %% since %% is the delimiter

    # Find all %% occurrences
    positions = []
    idx = 0
    while idx < len(stripped):
        pos = stripped.find('%%', idx)
        if pos == -1:
            break
        positions.append(pos)
        idx = pos + 2

    # We need at least 2 %% markers (one open, one close) for the leading comment
    if len(positions) < 2:
        return None

    # The first %% is the opening of the leading comment (position 0 for stripped)
    # The second %% is the closing of the leading comment
    # Check what comes after the second %%

    close_pos = positions[1]
    after_close = stripped[close_pos + 2:]

    # If nothing meaningful after the close, it's just a comment line
    if not after_close.strip():
        return None

    # Check if what follows is just whitespace + another %% comment %%
    # That would be: %% comment1 %% %% comment2 %%  -- unusual but possible
    after_stripped = after_close.strip()

    # Check if after_stripped starts with a letter (actual text content)
    # or if it starts with another %% (another comment)
    # The grep pattern excludes [# (glossary links), so we should too
    if after_stripped.startswith('[#'):
        return None

    # The text immediately after %% (after whitespace) must start with a letter
    # This distinguishes diary text from timestamps (which start with digits)
    if not re.match(r'[A-Za-zÀ-ž]', after_stripped):
        return None

    # We have text after the closing %%
    # Now check if there's a TRAILING comment at the end
    # Pattern: text %% trailing comment %%

    # The text portion starts after close_pos + 2
    rest = after_close

    # Check for trailing %% comment %%
    trailing_comment = ''
    middle_text = rest

    # If there are more %% pairs after the text, the last pair might be a trailing comment
    if len(positions) >= 4:
        # Check if the last two %% form a comment at the end
        last_close = positions[-1]
        second_last = positions[-2]

        # The trailing comment would be from second_last to last_close+2
        potential_trailing = stripped[second_last:last_close + 2]

        # Only treat as trailing comment if:
        # 1. It ends at the end of the stripped line
        # 2. The second_last position is after close_pos
        if (last_close + 2 >= len(stripped) and
            second_last > close_pos + 2 and
            potential_trailing.startswith('%%') and
            potential_trailing.endswith('%%')):
            trailing_comment = potential_trailing
            # Middle text is between leading comment close and trailing comment open
            middle_text = stripped[close_pos + 2:second_last]

    leading_comment = stripped[:close_pos + 2]

    # Verify we actually have text content in the middle
    if not middle_text.strip():
        return None

    # Verify the middle text has actual word characters (not just whitespace/punctuation)
    if not re.search(r'[A-Za-zÀ-ž]', middle_text):
        return None

    return (leading_comment, middle_text.strip(), trailing_comment.strip())


def process_file(filepath: Path, dry_run: bool = False) -> int:
    """Process a single file. Returns number of lines fixed."""
    content = filepath.read_text(encoding='utf-8')
    lines = content.split('\n')
    new_lines = []
    fixes = 0

    for i, line in enumerate(lines):
        result = find_split_point(line)
        if result is None:
            new_lines.append(line)
            continue

        leading, text, trailing = result
        fixes += 1

        if dry_run:
            print(f"  Line {i+1}: WOULD SPLIT")
            print(f"    BEFORE: {line[:120]}{'...' if len(line) > 120 else ''}")
            print(f"    AFTER:")
            print(f"      {leading}")
            print(f"      {text[:100]}{'...' if len(text) > 100 else ''}")
            if trailing:
                print(f"      {trailing}")
            print()

        new_lines.append(leading)
        new_lines.append(text)
        if trailing:
            new_lines.append(trailing)

    if fixes > 0 and not dry_run:
        filepath.write_text('\n'.join(new_lines), encoding='utf-8')

    return fixes


def main():
    dry_run = '--dry-run' in sys.argv
    single_file = None

    for arg in sys.argv[1:]:
        if arg != '--dry-run' and not arg.startswith('-'):
            single_file = arg

    content_dir = Path('/home/krr/bashkirtseff/content')

    if single_file:
        files = [Path(single_file).resolve()]
    else:
        # Process en/, cz/, fr/ directories
        files = sorted(
            list(content_dir.glob('en/**/*.md')) +
            list(content_dir.glob('cz/**/*.md')) +
            list(content_dir.glob('fr/**/*.md'))
        )

    total_fixes = 0
    fixed_files = 0

    for filepath in files:
        # Skip non-entry files
        if filepath.name in ('CLAUDE.md', 'README.md', 'PROGRESS.md', 'TranslationMemory.md'):
            continue

        fixes = process_file(filepath, dry_run=dry_run)
        if fixes > 0:
            total_fixes += fixes
            fixed_files += 1
            action = "Would fix" if dry_run else "Fixed"
            print(f"{action} {fixes} line(s) in {filepath.relative_to(content_dir)}")

    print(f"\n{'Would fix' if dry_run else 'Fixed'} {total_fixes} lines across {fixed_files} files")


if __name__ == '__main__':
    main()

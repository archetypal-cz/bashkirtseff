#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
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

import argparse
import re
from pathlib import Path

from _fileio import read_text, write_text_atomic

CONTENT = Path(__file__).resolve().parents[2] / 'content'
TREES = ('en', 'cz', 'fr', 'uk', 'es')
# A role comment continuing after a closing %%: `2026-01-29T09:13:00 LAN: ...` or `LAN: ...`.
# In fr these follow a promoted source block on the same line and are NOT diary text.
RE_ROLE_HEADER = re.compile(r'^(?:\d{4}-\d{2}-\d{2}(?:T[\d:]+)?\s+)?[A-Z]{2,5}:\s')

# Pattern to find lines that start with %% and have text after a closing %%
# We need to be careful:
# - Lines that are JUST %% comment %% should be left alone
# - Lines that are glossary links %% [#...] %% should be left alone
# - We want lines where after the closing %% there's actual text

def _marker_positions(stripped: str) -> list[int]:
    """Indices of every `%%` marker in the line, left to right, non-overlapping."""
    positions = []
    idx = 0
    while idx < len(stripped):
        pos = stripped.find('%%', idx)
        if pos == -1:
            break
        positions.append(pos)
        idx = pos + 2
    return positions


def _closes_with_role_comment(stripped: str, positions: list[int]) -> bool:
    """True if the line's LAST `%% ... %%` pair is itself a role comment.

    That is the signature of a genuine splice (`%% LAN: x %% prose %% RSR: y %%`):
    real diary text sits between two role comments. A role comment that merely QUOTES
    markers in its prose (`... removed a redundant `%% 229 %%` comment line ... %%`)
    ends on a fragment of its own sentence instead, so it is left intact.
    """
    if len(positions) < 4 or positions[-1] + 2 < len(stripped):
        return False
    return bool(RE_ROLE_HEADER.match(stripped[positions[-2] + 2:positions[-1]].strip()))


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

    positions = _marker_positions(stripped)

    # A role comment whose prose QUOTES literal markers is ONE comment; splitting on an
    # inner marker would tear it in half. Two shapes occur in content: an odd %% count
    # ("...text stranded after the closing %%. Rejoined. %%"), and an even count from a
    # quoted PAIR ("...removed a redundant `%% 229 %%` comment line... %%"). Both are
    # suppressed, but only for a line that opens with a role header and closes on the
    # same line — and only when its last %% pair is not itself a role comment, so a
    # genuine splice (`%% LAN: x %% prose %% RSR: y %%`) is still caught below.
    if stripped.endswith('%%') and RE_ROLE_HEADER.match(stripped[2:].lstrip()):
        if (stripped.count('%%') % 2 == 1
                or not _closes_with_role_comment(stripped, positions)):
            return None

    # If it ends with %% and the whole thing is just a comment, skip it
    # We need to check if there's text BETWEEN comment blocks

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

    # The text immediately after %% must start with a real character (Latin or
    # Cyrillic letter, digit, quote, emphasis marker, ...), not another marker, and
    # must not be a role comment that simply continues past the closing %%.
    if not re.match(r'[^\s%]', after_stripped):
        return None
    # Only the segment immediately following the first closing %% is examined: in fr
    # these carry a role comment that continues past a promoted source block and are
    # not diary text. Text beyond the NEXT %% belongs to another comment, so it must
    # not veto the split (`%% LAN: x %% prose %% RSR: y %%` is a real splice).
    if RE_ROLE_HEADER.match(after_stripped.split('%%', 1)[0].strip()):
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

    # Verify the middle text carries real content, not just whitespace and markers
    if not re.search(r'[^\s%]', middle_text):
        return None

    return (leading_comment, middle_text.strip(), trailing_comment.strip())


def process_file(filepath: Path, apply: bool = False) -> int:
    """Process a single file. Returns number of lines fixed."""
    content, newline = read_text(filepath)
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

        if not apply:
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

    if fixes > 0 and apply:
        write_text_atomic(filepath, '\n'.join(new_lines), newline)

    return fixes


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('file', nargs='?', help='single file to process (default: all trees)')
    ap.add_argument('--apply', action='store_true', help='write changes (default: dry-run)')
    args = ap.parse_args()

    if args.file:
        files = [Path(args.file).resolve()]
    else:
        files = sorted(f for tree in TREES for f in CONTENT.glob(f'{tree}/**/*.md'))

    total_fixes = 0
    fixed_files = 0

    for filepath in files:
        # Skip non-entry files
        if filepath.name in ('CLAUDE.md', 'README.md', 'PROGRESS.md', 'TranslationMemory.md'):
            continue

        fixes = process_file(filepath, apply=args.apply)
        if fixes > 0:
            total_fixes += fixes
            fixed_files += 1
            action = "Fixed" if args.apply else "Would fix"
            rel = filepath.relative_to(CONTENT) if filepath.is_relative_to(CONTENT) else filepath
            print(f"{action} {fixes} line(s) in {rel}")

    print(f"\n{'Fixed' if args.apply else 'Would fix'} {total_fixes} lines "
          f"across {fixed_files} files")


if __name__ == '__main__':
    main()

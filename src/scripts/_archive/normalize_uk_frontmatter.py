#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Normalize a translation carnet's frontmatter to the lean canonical form.

Translators sometimes copy the French original's heavy frontmatter (nested
`workflow:` block, entities, para ranges). The verify-carnet gate and the
frontend expect the lean translation frontmatter:

    date: <date>
    carnet: "<NNN>"
    language: <lang>
    translation_complete: <preserved|true>
    editor_approved: <preserved|false>
    conductor_approved: <preserved|false>

The body (everything after the closing `---`) is preserved verbatim, except that
line endings are normalized to the file's dominant style (see _fileio.read_text).
Usage: normalize_uk_frontmatter.py <lang> <carnet_dir>
"""
import sys
import re
from pathlib import Path

from _fileio import read_text, write_text_atomic

TRUE_TOKENS = {'true', 'yes', 'on'}
FALSE_TOKENS = {'false', 'no', 'off'}


def parse_scalar(fm_text: str, key: str):
    # match top-level or nested `key: value`
    m = re.search(rf'^\s*{re.escape(key)}:\s*(.+?)\s*$', fm_text, re.MULTILINE)
    if not m:
        return None
    return m.group(1).strip()


def bool_token(val, default):
    """Parse a YAML boolean scalar, ignoring a trailing inline `# comment`.

    Returns `default` when the key is absent or its value is not a recognised
    boolean, so an unexpected value is never silently flipped.
    """
    if val is None:
        return default
    tok = re.sub(r'\s+#.*$', '', val).strip().strip('"\'').lower()
    if tok in TRUE_TOKENS:
        return True
    if tok in FALSE_TOKENS:
        return False
    return default


def normalize(path: Path, lang: str):
    text, newline = read_text(path)
    if not text.startswith('---'):
        return 'no-frontmatter'
    # split: ---\n FM \n---\n BODY
    m = re.match(r'^---\n(.*?)\n---\n?(.*)$', text, re.DOTALL)
    if not m:
        return 'malformed'
    fm, body = m.group(1), m.group(2)

    date = parse_scalar(fm, 'date')
    carnet = parse_scalar(fm, 'carnet')
    if carnet:
        carnet = carnet.strip('"\'')
    if not date or not carnet:
        return 'missing-date-or-carnet'

    # preserve approval state if already present (idempotent re-runs)
    tc = bool_token(parse_scalar(fm, 'translation_complete'), True)
    ea = bool_token(parse_scalar(fm, 'editor_approved'), False)
    ca = bool_token(parse_scalar(fm, 'conductor_approved'), False)

    new_fm = (
        f"date: {date}\n"
        f'carnet: "{carnet}"\n'
        f"language: {lang}\n"
        f"translation_complete: {'true' if tc else 'false'}\n"
        f"editor_approved: {'true' if ea else 'false'}\n"
        f"conductor_approved: {'true' if ca else 'false'}\n"
    )
    new_text = f"---\n{new_fm}---\n{body}"
    if new_text != text:
        write_text_atomic(path, new_text, newline)
        return 'normalized'
    return 'unchanged'


def main():
    if len(sys.argv) != 3:
        print("usage: normalize_uk_frontmatter.py <lang> <carnet_dir>")
        sys.exit(2)
    lang, d = sys.argv[1], Path(sys.argv[2])
    counts = {}
    for f in sorted(d.glob('*.md')):
        if f.name in ('README.md', '_summary.md'):
            continue
        r = normalize(f, lang)
        counts[r] = counts.get(r, 0) + 1
        if r not in ('normalized', 'unchanged'):
            print(f"  [{r}] {f.name}")
    print("  " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items())))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Normalize a translation carnet's frontmatter to the lean canonical form.

Translators sometimes copy the French original's heavy frontmatter (nested
`workflow:` block, entities, para ranges). The verify-carnet gate and the
frontend expect the lean translation frontmatter:

    date: <date>
    carnet: "<NNN>"
    language: <lang>
    translation_complete: true
    editor_approved: <preserved|false>
    conductor_approved: <preserved|false>

The body (everything after the closing `---`) is preserved byte-for-byte.
Usage: normalize_uk_frontmatter.py <lang> <carnet_dir>
"""
import sys
import re
from pathlib import Path


def parse_scalar(fm_text: str, key: str):
    # match top-level or nested `key: value`
    m = re.search(rf'^\s*{re.escape(key)}:\s*(.+?)\s*$', fm_text, re.MULTILINE)
    if not m:
        return None
    return m.group(1).strip()


def truthy(val):
    return val is not None and val.strip().lower() in ('true', 'yes', 'on')


def normalize(path: Path, lang: str):
    text = path.read_text(encoding='utf-8')
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
    tc = truthy(parse_scalar(fm, 'translation_complete'))
    ea = truthy(parse_scalar(fm, 'editor_approved'))
    ca = truthy(parse_scalar(fm, 'conductor_approved'))

    new_fm = (
        f"date: {date}\n"
        f'carnet: "{carnet}"\n'
        f"language: {lang}\n"
        f"translation_complete: {'true' if tc else 'true'}\n"  # translation done => true
        f"editor_approved: {'true' if ea else 'false'}\n"
        f"conductor_approved: {'true' if ca else 'false'}\n"
    )
    new_text = f"---\n{new_fm}---\n{body}"
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
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

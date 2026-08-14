#!/usr/bin/env python3
"""Gate check: %%-comment structure violations that break rendering.

The renderer (src/frontend/src/lib/content.ts) treats comments PER LINE:
a line is hidden iff it starts with %% (or [^ / [//]:). Consequences:

- cz/uk/en/_original: a multi-line %% block (opener without closer on the
  same line) LEAKS its interior lines as visible French source text.
- ALL trees incl. fr: a splice line `%% comment %% trailing text` is
  dropped whole, so the trailing translation text VANISHES from the page.
- fr: doubled `%% %%` markers corrupt block promotion (English research
  text renders as the paragraph).
- any tree: a closer without an opener / EOF inside a block signals a
  mangled edit.

Repo-wide cleanup happened 2026-08-13 (see reports/2026-08-13-report-
triage-099.md); this check keeps the families from coming back. Run as
`just check-comments` before committing content changes; wire it into
editor/conductor end-of-review passes.

Exit 0 = clean, 1 = violations found. Optional args: tree names to limit
the scan (default: all five).
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'content'
TREES = ['cz', 'uk', 'en', 'fr', '_original']
# multi-line %% blocks are the DESIGNED shape in fr (visible text lives in
# them and gets promoted); everywhere else they are violations
MULTILINE_OK = {'fr'}
LEAD_PAIRS = re.compile(r'^(\s*)((?:%%(?:[^%]|%(?!%))*%%\s*)+)(\S.*)$')

def check_file(path, tree):
    violations = []
    in_block = False
    lines = path.read_text(encoding='utf-8').split('\n')
    for i, ln in enumerate(lines, 1):
        s = ln.strip()
        if in_block:
            if s.endswith('%%'):
                in_block = False
            continue
        if s.startswith('%% %%'):
            violations.append((i, 'doubled %% %% marker', s))
            # treat as opener if unclosed so the scan can continue
            if not s.endswith('%%') or s == '%% %%':
                in_block = True
            continue
        if s.startswith('%%') and not s.endswith('%%') and len(s) > 2:
            m = LEAD_PAIRS.match(ln)
            if m and '%%' not in m.group(3):
                violations.append((i, 'mid-line splice (trailing text is dropped from the page)', s))
                continue
            if tree in MULTILINE_OK:
                in_block = True
                continue
            violations.append((i, 'multi-line %% block (interior leaks as visible text)', s))
            in_block = True
            continue
        if not s.startswith('%%') and s.endswith('%%') and s not in ('', '%%'):
            # fr and _original carry ~1,700 legacy lines of this shape (bare
            # French with a trailing marker); the glyph is stripped at render
            # time and the text is French-in-French-context, so it is noise
            # there — but in translation trees it leaks source French or
            # marks a reverse splice. Gate only where it damages readers.
            if tree in ('fr', '_original'):
                continue
            if not s.startswith('[^') and not s.startswith('[//]:'):
                violations.append((i, 'closer without opener', s))
    if in_block:
        violations.append((len(lines), 'EOF inside unclosed %% block', ''))
    return violations

def main():
    trees = sys.argv[1:] or TREES
    total = 0
    for tree in trees:
        base = ROOT / tree
        if not base.is_dir():
            print(f'unknown tree: {tree}', file=sys.stderr)
            return 2
        for p in sorted(base.rglob('*.md')):
            sp = str(p)
            if '_glossary' in sp or '_archive' in sp or p.name in ('TranslationMemory.md', 'CLAUDE.md', 'PROGRESS.md', 'README.md'):
                continue
            for lineno, kind, text in check_file(p, tree):
                print(f'{p.relative_to(ROOT.parent)}:{lineno}: {kind}: {text[:90]}')
                total += 1
    if total:
        print(f'\ncheck-comments: {total} violation(s)')
        return 1
    print(f'check-comments: OK ({", ".join(trees)})')
    return 0

if __name__ == '__main__':
    sys.exit(main())

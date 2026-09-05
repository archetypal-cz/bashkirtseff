#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
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
- any tree: several complete %% spans glued onto one line (S1) are read as
  a single comment, so the French source or the role comment glued to it
  disappears. A role comment that merely QUOTES a literal %% is tolerated;
  the two are told apart structurally (see `glued_spans`).
- fr: a retired `[//]: # (…)` line trapped inside an open block (S3) is
  joined into the promoted paragraph and renders as prose.
- fr/_original: a glossary-tag line whose `%%` wrapper is incomplete (S4)
  leaks raw tag markdown into the page (and, in fr, opens a stray block).

Repo-wide cleanup happened 2026-08-13 (see reports/2026-08-13-report-
triage-099.md); the S1/S3/S4 families were repaired 2026-09-05 by
`just fix-marker-shapes` (step 2 of docs/COMMENT_MARKER_RULES.md). This
check keeps them from coming back. Run as `just check-comments` before
committing content changes; wire it into editor/conductor end-of-review
passes.

Exit 0 = clean, 1 = violations found. Optional args: tree names to limit
the scan (default: all six), `--root DIR` to scan a content tree elsewhere
(e.g. an extracted `git archive`), `--selftest` to run the inline fixtures.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'content'
TREES = ['cz', 'uk', 'en', 'fr', 'es', '_original']
# multi-line %% blocks are the DESIGNED shape in fr (visible text lives in
# them and gets promoted); everywhere else they are violations
MULTILINE_OK = {'fr'}
LEAD_PAIRS = re.compile(r'^(\s*)((?:%%(?:[^%]|%(?!%))*%%\s*)+)(\S.*)$')

# Shapes of a self-contained annotation span, used to tell an S1 splice ("two
# comments glued end to end") from a role comment that merely QUOTES a literal
# `%%` in its prose. Same vocabulary as src/scripts/fix_marker_shapes.py, whose
# repairs this gate keeps from coming back.
ROLE_CODES = 'RSR|LAN|TR|OPS|RED|CON|ED|FAB|VOX|GEM|PPX|FRE|KRR'
TIMESTAMP = r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?'
RE_COMMENT_HEAD = re.compile(rf'^(?:{TIMESTAMP}\s+)?(?:{ROLE_CODES})\s*:')
RE_TAG_HEAD = re.compile(r'^\[#[^\]]+\]\(')
RE_FOOTNOTE_HEAD = re.compile(r'^\[\^[^\]]+\]:')


def segment_kind(segment):
    body = segment.strip()
    if not body:
        return 'empty'
    if RE_COMMENT_HEAD.match(body):
        return 'comment'
    if RE_TAG_HEAD.match(body):
        return 'tag'
    if RE_FOOTNOTE_HEAD.match(body):
        return 'footnote'
    return 'text'


def glued_spans(s):
    """S1: a `%%`-wrapped line that has several complete spans glued together.

    `%% A %% B %%` is a violation only when every span after the first is a
    self-contained annotation — a role comment (timestamp + ROLE header), a
    glossary tag or a footnote definition. If any of them is loose prose, the
    inner `%%` is a literal quotation inside one role comment; the 27 lines of
    that shape are tolerated (docs/COMMENT_MARKER_RULES.md section (d)).
    """
    if len(s) < 4 or not (s.startswith('%%') and s.endswith('%%')):
        return False
    if s.count('%%') < 3:
        return False
    kinds = [segment_kind(x) for x in s[2:-2].split('%%')]
    tail = [k for k in kinds[1:] if k != 'empty']
    return bool(tail) and all(k != 'text' for k in tail)


def check_lines(lines, tree):
    """Structural violations in one file's lines. 1-based line numbers."""
    violations = []
    in_block = False
    for i, ln in enumerate(lines, 1):
        s = ln.strip()
        if in_block:
            # A retired `[//]: # (…)` line trapped inside a block is joined into
            # the promoted paragraph and renders as visible prose.
            if s.startswith('[//]:'):
                violations.append((i, 'retired [//]: line inside an open %% block (renders as prose)', s))
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
            # A glossary-tag line missing its closing `%%` opens a block that
            # swallows the text after it and leaks the raw tag markdown.
            if RE_TAG_HEAD.match(s[2:].strip()):
                violations.append((i, 'glossary-tag line not closed with %% (raw tag markdown leaks)', s))
                continue
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
        if glued_spans(s):
            violations.append((i, 'glued %% spans on one line (read as a single comment)', s))
            continue
        if '%%' not in s and RE_TAG_HEAD.match(s):
            violations.append((i, 'glossary-tag line without %% markers (renders as prose)', s))
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


def check_file(path, tree):
    return check_lines(path.read_text(encoding='utf-8').split('\n'), tree)


# (label, tree, source, expected number of violations)
FIXTURES = [
    ('tolerated: role comment quoting a literal %%', 'cz',
     '%% 001.0001 %%\n'
     '%% 2026-08-14T02:10:00 ED: Splice repair — stranded text after closing %%. Rejoined. %%\n'
     'Přeložený text.\n', 0),
    ('tolerated: multi-line source block in fr', 'fr',
     '%% 002.0023 %%\n'
     '%% A la promenade avec Sophie,\n'
     'nous allâmes nous promener, assez de monde. %%\n', 0),
    ('tolerated: paragraph-ID line', 'uk',
     '%% 011.0152 %%\nПерекладений текст.\n', 0),
    ('tolerated: glossary-tag line', 'en',
     '%% 009.0278 %%\n'
     '%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%\n'
     'Translated text.\n', 0),
    ('S1: two comments glued end to end', 'fr',
     '%% 011.0152 %%\n'
     '%% Nous sortons enfin au quai Saint-Jean-Baptiste. %% 2026-01-29T09:05:00 LAN: NEOLOGISM note %%\n', 1),
    ('S1: source line with an inner glossary-tag span', 'cz',
     '%% 009.0278 %%\n'
     '%% Je descends dans la salle à manger. %% [#Miloradovitch](../../_original/_glossary/culture/literature/MILORADOVITCH.md) %%\n', 1),
    ('S3: retired [//]: line inside an open block', 'fr',
     '%% 002.0024 %%\n'
     '%% Hier j\'étais sur le point de croire que j\'aime Boreel,\n'
     '[//]: # (Voyez-vous ça ! Voilà une tête.)\n'
     'mais aujourd\'hui je ne puis aimer que lui ! %%\n', 1),
    ('S4: glossary-tag line missing its closing %%', 'fr',
     '%% 081.0341 %%\n'
     '%% [#Soden](../../_original/_glossary/places/cities/SODEN.md) )\n'
     'Nous sommes arrivés à Soden.\n', 1),
    ('S4: glossary-tag line with no %% markers at all', '_original',
     '%% 081.0341 %%\n'
     '[#Soden](../../_glossary/places/cities/SODEN.md)\n'
     'Nous sommes arrivés à Soden.\n', 1),
    ('splice: trailing text after a closed comment', 'cz',
     '%% 012.1686 %%\n'
     '%% 2026-06-12T10:00:03 RED: Splice repair %% Poznala jsem v Pavlově koni závodníka.\n', 1),
    ('unclosed block: EOF inside an open comment', 'fr',
     '%% 004.0100 %%\n'
     '%% 2025-06-28T14:30:00 RSR: Opening research notes\n'
     'qui ne se ferment jamais.\n', 1),
]


def selftest():
    failures = 0
    for label, tree, source, expected in FIXTURES:
        found = check_lines(source.split('\n'), tree)
        ok = len(found) == expected
        if not ok:
            failures += 1
        print(f'{"ok  " if ok else "FAIL"}  {label}  (expected {expected}, got {len(found)})')
        for lineno, kind, text in found:
            print(f'        line {lineno}: {kind}: {text[:80]}')
    print(f'\nselftest: {len(FIXTURES) - failures}/{len(FIXTURES)} passed')
    return 1 if failures else 0


def parse_args(argv):
    """`[--root DIR] [--selftest] [tree ...]` — trees stay positional for just."""
    root, trees, i = ROOT, [], 0
    while i < len(argv):
        arg = argv[i]
        if arg == '--selftest':
            return None, None, True
        elif arg == '--root':
            i += 1
            if i >= len(argv):
                print('--root needs a directory', file=sys.stderr)
                sys.exit(2)
            root = pathlib.Path(argv[i]).resolve()
        elif arg.startswith('--root='):
            root = pathlib.Path(arg.split('=', 1)[1]).resolve()
        elif arg.startswith('-'):
            print(f'unknown option: {arg}', file=sys.stderr)
            sys.exit(2)
        else:
            trees.append(arg)
        i += 1
    return root, trees, False


def main():
    root, trees, run_selftest = parse_args(sys.argv[1:])
    if run_selftest:
        return selftest()
    explicit = bool(trees)
    trees = trees or TREES
    total = 0
    for tree in trees:
        base = root / tree
        if not base.is_dir():
            if explicit:
                print(f'unknown tree: {tree}', file=sys.stderr)
                return 2
            continue  # default tree not created yet (e.g. a language in preparation)
        for p in sorted(base.rglob('*.md')):
            sp = str(p)
            if '_glossary' in sp or '_archive' in sp or p.name in ('TranslationMemory.md', 'CLAUDE.md', 'PROGRESS.md', 'README.md'):
                continue
            for lineno, kind, text in check_file(p, tree):
                print(f'{p.relative_to(root.parent)}:{lineno}: {kind}: {text[:90]}')
                total += 1
    if total:
        print(f'\ncheck-comments: {total} violation(s)')
        return 1
    print(f'check-comments: OK ({", ".join(trees)})')
    return 0

if __name__ == '__main__':
    sys.exit(main())

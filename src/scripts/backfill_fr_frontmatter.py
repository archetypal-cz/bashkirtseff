#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Backfill YAML frontmatter onto content/fr/ entries that have none.

The French modern edition was bulk-generated body-first (see the archived
src/scripts/_archive/fr_bulk_copy.py), so most fr entry files start straight
with a `%% NNN.NNNN %%` marker and carry no frontmatter at all. This script
copies each entry's frontmatter from its `content/_original/` counterpart,
line for line, and appends one new key: `edition_complete`.

Frontmatter shape
-----------------
The copied block keeps the original's key order, quoting and indentation
VERBATIM, minus the keys the fr tree does not carry (content/fr/CLAUDE.md,
"Contenu à supprimer"): the whole `workflow:` block plus `research_complete`,
`linguistic_annotation_complete`, `kernberger_covered` and `empty_in_source`
wherever they sit. All 182 fr files that already had frontmatter follow exactly
that shape. `--keep-workflow` disables the stripping. A `flags:` mapping whose
every child was stripped is dropped too, rather than left dangling as a null
key (the archived generator left that wart behind in e.g. fr/087/1879-12-25.md).

edition_complete
----------------
Nothing in the codebase reads the flag — the frontend keys entry availability
on file existence alone (`hasTranslation` in src/frontend/src/lib/content.ts)
and project-status.ts counts translation_complete/editor_approved/
conductor_approved — so the flag is documentation of where the edition pass
stands. Its value is derived from the file, never assumed:

  true   the entry has no diary text to edit at all (the `_original` counterpart
         renders nothing but a date heading), or every text-bearing paragraph of
         the fr file already renders as plain visible French
  false  the fr file is still in the generated scaffold shape, wholly or partly:
         at least one text-bearing paragraph has its French only inside a
         `%% … %%` block, which the renderer promotes but no editor has touched

That rule reproduces all 182 pre-existing `edition_complete: true` files with no
conflicts: 163 of them are empty entries, 19 are fully edited, and not one is a
scaffold. `%%`-wrapped text is the DESIGNED fr scaffold shape and does render
(content.ts promotes `currentOriginal` when a paragraph has no visible text), so
the wrapped/plain split is about editorial progress, not about broken pages.

Usage:
    uv run src/scripts/backfill_fr_frontmatter.py                 # dry run, all
    uv run src/scripts/backfill_fr_frontmatter.py --carnet 067    # one carnet
    uv run src/scripts/backfill_fr_frontmatter.py --apply         # write
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _fileio import read_text, write_text_atomic  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FR = ROOT / 'content' / 'fr'
ORIGINAL = ROOT / 'content' / '_original'

NON_ENTRY = {'README.md', 'PROGRESS.md', 'CLAUDE.md'}
CARNET_DIR = re.compile(r'^\d{3}$')
PARA_ID = re.compile(r'^%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%$')
KEY = re.compile(r'^(\s*)([A-Za-z_][\w-]*):')
# Comment bodies that are markup, not diary text
ROLE_COMMENT = re.compile(
    r'^(?:RSR|LAN|TR|OPS|RED|CON|ED|FAB|VOX|GEM|PPX|FRE|REV):'
)
DATED_COMMENT = re.compile(r'^\d{4}-\d{2}-\d{2}')

# Keys the fr tree does not carry (content/fr/CLAUDE.md)
DROP_KEYS = {
    'research_complete',
    'linguistic_annotation_complete',
    'kernberger_covered',
    'empty_in_source',
}
# Lines the renderer never shows as their own text
NON_TEXT_PREFIXES = ('#', '[^', '[//]:')


# ---------------------------------------------------------------- frontmatter

def split_frontmatter(text):
    """Return (frontmatter_including_delimiters, body); frontmatter is '' if none."""
    if not text.startswith('---\n'):
        return '', text
    end = text.find('\n---\n', 3)
    if end == -1:
        return '', text
    return text[:end + 5], text[end + 5:]


def fr_frontmatter(original_frontmatter, flag, keep_workflow=False):
    """Rebuild the original's frontmatter for fr and append `edition_complete`."""
    lines = original_frontmatter.split('\n')
    # lines[0] is '---'; the closing '---' is the last non-empty entry
    out = [lines[0]]
    body = lines[1:-2] if lines[-1] == '' else lines[1:-1]
    closing = '---'

    kept = []
    in_workflow = False
    for line in body:
        match = KEY.match(line)
        indent = match.group(1) if match else None
        name = match.group(2) if match else None

        if in_workflow:
            # the block ends at the next line that is not indented under it
            if line.strip() and indent == '':
                in_workflow = False
            else:
                continue
        if not keep_workflow and name == 'workflow' and indent == '':
            in_workflow = True
            continue
        if not keep_workflow and name in DROP_KEYS:
            continue
        kept.append(line)

    # A mapping whose every child was stripped would parse as null; drop it.
    pruned = []
    for i, line in enumerate(kept):
        match = KEY.match(line)
        if match and line.rstrip().endswith(':'):
            depth = len(match.group(1))
            nxt = kept[i + 1] if i + 1 < len(kept) else ''
            has_child = bool(nxt.strip()) and (len(nxt) - len(nxt.lstrip())) > depth
            if not has_child:
                continue
        pruned.append(line)

    out.extend(pruned)
    out.append(f'edition_complete: {flag}')
    out.append(closing)
    return '\n'.join(out) + '\n'


# ------------------------------------------------------------- text detection

def has_wrapped_text(block):
    """True if the paragraph carries diary text inside `%% … %%` (scaffold shape).

    A `%%` line that is only markup — the paragraph id, a glossary-tag line, a
    dated or role-prefixed annotation — is not text. Anything else is: either it
    opens a multi-line block whose interior is the French, or the French sits
    wrapped on that one line.
    """
    for line in block.split('\n'):
        s = line.strip()
        if not s.startswith('%%'):
            continue
        if not s.endswith('%%') and len(s) > 2:
            return True  # opens a multi-line block: its interior is the text
        inner = s[2:-2].strip()
        if not inner or PARA_ID.match(s):
            continue
        if inner.startswith('[#') or DATED_COMMENT.match(inner):
            continue
        if ROLE_COMMENT.match(inner):
            continue
        return True
    return False


def plain_lines(block, allow_trailing_marker=False):
    """Text lines the paragraph carries outside any `%%` markup.

    A line ending in `%%` is, by default, not counted: it is the legacy
    `bare French … %%` shape that check_comment_structure.py tolerates in fr and
    _original (~1,700 lines), i.e. wrapped text whose opener went missing, or
    text leaking out of a block that a spliced tag line closed early.
    """
    out = []
    for line in block.split('\n'):
        s = line.strip()
        if not s or s.startswith('%%') or s.startswith(NON_TEXT_PREFIXES):
            continue
        if s.endswith('%%') and not allow_trailing_marker:
            continue
        out.append(s)
    return out


def paragraph_blocks(body):
    """Body split into the lines following each `%% NNN.NNNN %%` marker."""
    current = []
    blocks = [current]  # text before the first marker counts too
    for line in body.split('\n'):
        if PARA_ID.match(line.strip()):
            current = []
            blocks.append(current)
        else:
            current.append(line)
    return ['\n'.join(b) for b in blocks]


def has_text(block):
    """True if the paragraph carries diary text in any shape."""
    return has_wrapped_text(block) or bool(plain_lines(block, allow_trailing_marker=True))


def decide_flag(fr_body, original_body):
    """Return (flag, reason) for one entry."""
    if not any(has_text(b) for b in paragraph_blocks(original_body)):
        return 'true', 'empty-entry'

    total = 0
    edited = 0
    for block in paragraph_blocks(fr_body):
        if not has_text(block):
            continue
        total += 1
        # Edited = the French stands on its own, with no `%%` wrapper left.
        if not has_wrapped_text(block) and plain_lines(block):
            edited += 1
    if total and edited == total:
        return 'true', 'edited'
    return 'false', 'scaffold'


# ---------------------------------------------------------------------- main

def entry_files(carnet=None):
    dirs = sorted(d for d in FR.iterdir() if d.is_dir() and CARNET_DIR.match(d.name))
    if carnet:
        dirs = [d for d in dirs if d.name == carnet]
    for d in dirs:
        for path in sorted(d.glob('*.md')):
            if path.name in NON_ENTRY or path.name.startswith('_summary'):
                continue
            yield path


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--apply', action='store_true',
                        help='write the files (default: dry run)')
    parser.add_argument('--carnet', metavar='NNN',
                        help='limit to one carnet directory')
    parser.add_argument('--keep-workflow', action='store_true',
                        help='copy the original frontmatter verbatim, workflow block included')
    parser.add_argument('--list', action='store_true',
                        help='print every file with its decided flag')
    args = parser.parse_args()

    if args.carnet and not CARNET_DIR.match(args.carnet):
        parser.error(f'--carnet expects a three-digit directory name, got {args.carnet!r}')

    counts = {'true': 0, 'false': 0}
    reasons = {}
    per_carnet = {}
    already = 0
    skipped = []
    written = 0

    for path in entry_files(args.carnet):
        text, newline = read_text(path)
        frontmatter, body = split_frontmatter(text)
        if frontmatter:
            already += 1
            continue

        source = ORIGINAL / path.relative_to(FR)
        if not source.exists():
            skipped.append(str(path.relative_to(ROOT)))
            continue
        source_text, _ = read_text(source)
        source_frontmatter, source_body = split_frontmatter(source_text)
        if not source_frontmatter:
            skipped.append(f'{path.relative_to(ROOT)} (source has no frontmatter)')
            continue

        flag, reason = decide_flag(body, source_body)
        counts[flag] += 1
        reasons[reason] = reasons.get(reason, 0) + 1
        per_carnet.setdefault(path.parent.name, {'true': 0, 'false': 0})[flag] += 1
        if args.list:
            print(f'{flag:5} {reason:11} {path.relative_to(ROOT)}')

        if args.apply:
            block = fr_frontmatter(source_frontmatter, flag, args.keep_workflow)
            write_text_atomic(path, block + '\n' + body, newline)
            written += 1

    verb = 'written' if args.apply else 'would write'
    print(f'\n{"APPLY" if args.apply else "DRY RUN"} — {verb} {counts["true"] + counts["false"]} files')
    print(f'  edition_complete: true   {counts["true"]}')
    print(f'  edition_complete: false  {counts["false"]}')
    print(f'  reasons: ' + ', '.join(f'{k}={v}' for k, v in sorted(reasons.items())))
    print(f'  already had frontmatter: {already}')
    if skipped:
        print(f'  skipped (no _original counterpart): {len(skipped)}')
        for s in skipped:
            print(f'    {s}')
    if args.apply:
        print(f'  files written: {written}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

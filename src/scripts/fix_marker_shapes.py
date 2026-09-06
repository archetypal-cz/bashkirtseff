#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Repair the `%%` marker shapes that drop or leak text at render time.

Step 2 of docs/COMMENT_MARKER_RULES.md. Five families, all of them shapes the
frontend parser (src/frontend/src/lib/content.ts) mis-reads:

S1  a line wrapped in `%%` that carries further `%%` markers inside it, so the
    French source and the role comment (or glossary tag) glued onto it are read
    as one span. Split into one line per span: glossary tags go BEFORE the
    source line (tag lines belong between the paragraph ID and the text), role
    comments and footnote definitions AFTER it. A role comment that merely
    QUOTES a literal `%%` in its prose is left alone (docs section (d)).

S3  a retired `[//]: # (…)` line INSIDE a multi-line `fr` block. The block
    promotion joins it into the paragraph, so it renders as visible French.
    A retired-format paragraph ID (`[//]: # ( 10.802 )`) is dropped — the file
    already carries `%% NNN.NNNN %%` IDs and `_original` keeps the retired
    marker verbatim. Anything else is moved out to its own bare line after the
    block, the precedent recorded at content/fr/081/1878-07-12.md:14.

S4  a glossary-tag line that opens a block because its closing `%%` is missing,
    so the raw tag markdown is promoted into the paragraph. Close the line.

S7  a complete `%% … %%` annotation span GLUED onto the end of a text line
    (`<French> %% 2026-…T… LAN: … %%`). 132 lines: `_original` 97, `fr` 35.
    The span is well formed, so `content.ts` strips it and the page is correct
    — this family costs the reader nothing today, and no gate sees it because
    check-comments exempts a line ending in `%%` in `fr`/`_original` (docs
    shape S5, the bare prose closer) and this hides inside that exemption. In
    `_original` the exemption is in fact vacuous: all 97 S5 lines there are
    this shape, not bare closers.

    What it does cost is the MODEL. Because the line does not START with `%%`,
    comment-scanner.ts leaves `outsideText` non-empty, so the whole line —
    annotation and all — is classified as paragraph TEXT
    (paragraph-parser.ts:180) and the span never becomes a `Note`. 115 LAN
    notes in `_original` are therefore invisible to `just sync`, to
    verify-carnet and to the scaffolder, and a newly scaffolded language tree
    silently inherits none of them. Lifting the span onto its own line makes
    them visible again (+115 notes).

    The repair is content-preserving: every span is relocated, none is ever
    dropped, so the file's non-whitespace characters and its multiset of
    `[#Tag]` occurrences are identical afterwards. 10 of the 17 glued glossary
    tags do duplicate a tag line their own paragraph already carries, but
    removing a duplicate is a separate decision with its own evidence and its
    own approval — it does not belong inside a marker-shape repair. NOTE that
    S1 above still carries exactly that conflation and can delete a tag.

    It does NOT cause the French-into-translation leak `just sync` produces in
    these carnets: that comes from multi-line paragraph text being re-emitted
    as a `%% … %%` block, and is unchanged by this repair (161 of 222
    glued-line paragraphs shift on sync both before and after it, alongside 77
    paragraphs that never had a glued line).

SPECIAL  content/_original/055/1876-03-11.md — a LAN annotation whose opening
    `%% <timestamp> LAN:` was lost, leaving the note as diary prose.

Dry run by default; `--apply` writes. Filters: `--tree`, `--carnet`, `--only`.
"""
import argparse
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _fileio import read_text, write_text_atomic  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'content'
TREES = ['cz', 'uk', 'en', 'fr', '_original']
SKIP_NAMES = {'TranslationMemory.md', 'CLAUDE.md', 'PROGRESS.md', 'README.md'}
FAMILIES = ['S1', 'S3', 'S4', 'S7', 'SPECIAL']

ROLE_CODES = 'RSR|LAN|TR|OPS|RED|CON|ED|FAB|VOX|GEM|PPX|FRE|KRR'
TIMESTAMP = r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?'
RE_COMMENT_HEAD = re.compile(rf'^(?:{TIMESTAMP}\s+)?(?:{ROLE_CODES})\s*:')
RE_TAG_HEAD = re.compile(r'^\[#[^\]]+\]\(')
RE_FOOTNOTE_HEAD = re.compile(r'^\[\^[^\]]+\]:')
RE_RETIRED_ID = re.compile(r'^\d+\.\d+$')
RE_RETIRED_LINE = re.compile(r'^\[//\]:\s*#\s*\((.*)\)\s*$', re.DOTALL)
RE_PARAGRAPH_ID = re.compile(r'^%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%$')
# The LAST `%% … %%` span on a line, with the text that precedes it. The span
# body may not itself contain `%%`, so a quoted marker inside a role comment
# (docs section (d)) never matches.
RE_TRAILING_SPAN = re.compile(r'^(.*[^%\s])\s*%%((?:[^%]|%(?!%))*)%%$')
RE_CARNET_DIR = re.compile(r'^\d{3}$')

SPECIAL_PATH = '_original/055/1876-03-11.md'
SPECIAL_OLD = ("Caccia-Club z...z...z.. Zucchini - Marie's onomatopoeia "
               'imitating a fly before saying the name %%')
SPECIAL_NEW = ('%% 2026-02-02T12:10:00 LAN: ' + SPECIAL_OLD)


def gated_files(trees, carnets):
    """Every entry file the `check-comments` gate looks at, in tree order."""
    for tree in trees:
        base = ROOT / tree
        if not base.is_dir():
            continue
        for path in sorted(base.rglob('*.md')):
            text = str(path)
            if '_glossary' in text or '_archive' in text:
                continue
            if path.name in SKIP_NAMES:
                continue
            if carnets and path.parent.name not in carnets:
                continue
            yield tree, path


def opens_block(stripped):
    """Rule 3: exactly one `%%`, nothing but whitespace before it."""
    return (stripped.startswith('%%')
            and stripped.count('%%') == 1
            and not stripped.endswith('%%'))


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


def split_wrapped_line(stripped):
    """Return the replacement lines for an S1 line, or None to leave it alone.

    `%% A %% B %%` splits into segments A and B. The line is only rewritten
    when every segment after the first is a self-contained annotation — a role
    comment, a glossary tag or a footnote definition. If any of them is loose
    prose the inner `%%` is a literal quotation inside a role comment, which
    docs section (d) says to keep as it stands.
    """
    segments = stripped[2:-2].split('%%')
    kinds = [segment_kind(s) for s in segments]
    tail = [k for k in kinds[1:] if k != 'empty']
    if not tail or any(k == 'text' for k in tail):
        return None

    head_kind, head = kinds[0], segments[0].strip()
    before, after = [], []
    if head_kind == 'text':
        for segment, kind in zip(segments[1:], kinds[1:]):
            if kind == 'empty':
                continue
            (before if kind == 'tag' else after).append(segment.strip())
        body = re.sub(r'  +', ' ', head).strip()
        middle = [body]
    else:
        middle = [s.strip() for s, k in zip(segments, kinds) if k != 'empty']
    return [f'%% {part} %%' for part in before + middle + after]


def fix_s4(lines, log):
    """Give a glossary-tag line back the `%%` markers it is missing.

    Two variants, both of which leak raw tag markdown into the reader's page:
    in `fr` the closing `%%` is gone, so the line opens a block that swallows
    the French text after it; in `_original` the whole wrapper is gone, so the
    line is not a comment line at all and renders as prose.
    """
    out, in_block = [], False
    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if in_block:
            if stripped.endswith('%%'):
                in_block = False
            out.append(line)
            continue
        if opens_block(stripped):
            if stripped[2:].strip().startswith('[#'):
                out.append(line.rstrip() + ' %%')
                log.append(('S4', number, stripped))
                continue
            in_block = True
        elif '%%' not in stripped and RE_TAG_HEAD.match(stripped):
            out.append('%% ' + stripped + ' %%')
            log.append(('S4', number, stripped))
            continue
        out.append(line)
    return out


def fix_s3(lines, log):
    """Take retired `[//]:` lines out of the block they are trapped inside."""
    out, in_block, pending = [], False, []
    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if not in_block:
            if opens_block(stripped):
                in_block = True
            out.append(line)
            continue

        if stripped.startswith('[//]:'):
            closes = stripped.endswith('%%')
            payload_line = stripped[:-2].rstrip() if closes else stripped
            match = RE_RETIRED_LINE.match(payload_line)
            payload = match.group(1).strip() if match else payload_line
            if RE_RETIRED_ID.match(payload):
                log.append(('S3-drop', number, payload_line[:80]))
            else:
                pending.append(payload_line)
                log.append(('S3-move', number, payload_line[:80]))
            if closes:
                # The stranded line was carrying the block's closing marker;
                # hand it back to the last line that stays inside the block.
                in_block = False
                if out and not out[-1].strip().endswith('%%'):
                    out[-1] = out[-1].rstrip() + ' %%'
                out.extend(pending)
                pending = []
            continue

        out.append(line)
        if stripped.endswith('%%'):
            in_block = False
            out.extend(pending)
            pending = []
    out.extend(pending)
    return out


def paragraph_span(lines, index):
    """The lines of the `%% NNN.NNNN %%` paragraph that `index` falls inside."""
    start = 0
    for i in range(index, -1, -1):
        if RE_PARAGRAPH_ID.match(lines[i].strip()):
            start = i
            break
    end = len(lines)
    for i in range(index + 1, len(lines)):
        if RE_PARAGRAPH_ID.match(lines[i].strip()):
            end = i
            break
    return {l.strip() for l in lines[start:end]}


def fix_s1(lines, log):
    """Split a wrapped line that has glued several `%%` spans together."""
    out, in_block = [], False
    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if in_block:
            if stripped.endswith('%%'):
                in_block = False
            out.append(line)
            continue
        if opens_block(stripped):
            in_block = True
            out.append(line)
            continue
        if (stripped.startswith('%%') and stripped.endswith('%%')
                and stripped.count('%%') > 2):
            replacement = split_wrapped_line(stripped)
            if replacement:
                # A tag span lifted onto its own line is often already carried
                # verbatim by the paragraph; do not add a second copy.
                siblings = paragraph_span(lines, number - 1)
                kept = [r for r in replacement
                        if not (r.startswith('%% [#') and r in siblings)]
                out.extend(kept)
                log.append(('S1', number, f'{len(kept)} lines'))
                continue
        out.append(line)
    return out


def peel_trailing_spans(stripped):
    """Split `<text> %% A %% %% B %%` into ('<text>', ['%% A %%', '%% B %%']).

    Returns (None, None) unless EVERY peeled span is a self-contained
    annotation — a role comment, a glossary tag or a footnote definition — and
    real text is left in front of them. A trailing span of loose prose is left
    alone: the line is then either a bare S5 closer or a shape this family has
    no opinion about.
    """
    head, spans = stripped, []
    while True:
        match = RE_TRAILING_SPAN.match(head)
        if not match:
            break
        body = match.group(2).strip()
        if segment_kind(body) not in ('comment', 'tag', 'footnote'):
            return None, None
        spans.insert(0, f'%% {body} %%')
        head = match.group(1).rstrip()
    if not spans or not head or head.startswith('%%'):
        return None, None
    return head, spans


def fix_s7(relative, lines, log):
    """Lift an annotation span off the end of the text line it is glued to.

    Entry files only. `content/fr/_non_french_passages.md` is a bulleted work
    manifest whose 1,482 rows all end in a quoted LAN span (`- **005/…** para
    005.0210 [ITALIAN]: %% … %%`); those are list items, not diary text, and
    splitting them would shred the list.
    """
    if not RE_CARNET_DIR.match(pathlib.PurePosixPath(relative).parent.name):
        return lines
    out, in_block = [], False
    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if in_block:
            if not stripped.endswith('%%'):
                out.append(line)
                continue
            # The line that closes an `fr` source block can carry a glued span
            # too (10 lines). There the block's closing `%%` is the one at the
            # very END, so the annotation is swallowed INTO the block, and
            # content.ts — seeing a timestamped role code inside it — discards
            # the block as an annotation (fr 101.0497). Those blocks happen not
            # to reach the page either way, because the paragraph also carries
            # a bare text line that wins, so this is a model repair like the
            # rest of S7, not a rendering one. Close the block on the text and
            # put the span after it, as fix_s3 does for a trapped `[//]:` line.
            in_block = False
            head, spans = peel_trailing_spans(stripped)
            if head is None:
                out.append(line)
                continue
            out.append(head + ' %%')
            out.extend(spans)
            log.append(('S7-block', number, f'{len(spans)} span(s) lifted'))
            continue
        if opens_block(stripped):
            in_block = True
            out.append(line)
            continue
        # A line that STARTS with `%%` is S1's business, not this family's.
        if stripped.startswith('%%') or not stripped.endswith('%%'):
            out.append(line)
            continue
        head, spans = peel_trailing_spans(stripped)
        if head is None:
            out.append(line)
            continue
        # Every span is relocated, never dropped — including a tag the
        # paragraph already carries verbatim. A marker-shape repair moves
        # characters between lines and does nothing else; deciding that a
        # duplicate tag is redundant is a separate call needing its own
        # evidence, and it must not ride along inside this one.
        out.append(head)
        out.extend(spans)
        log.append(('S7', number, f'{len(spans)} span(s) lifted'))
    return out


def fix_special(relative, lines, log):
    if relative != SPECIAL_PATH:
        return lines
    out = []
    for number, line in enumerate(lines, 1):
        if line.strip() == SPECIAL_OLD:
            out.append(SPECIAL_NEW)
            log.append(('SPECIAL', number, 'wrapped as LAN comment'))
            continue
        out.append(line)
    return out


def repair(relative, lines, families, log):
    if 'S4' in families:
        lines = fix_s4(lines, log)
    if 'S3' in families:
        lines = fix_s3(lines, log)
    if 'S1' in families:
        lines = fix_s1(lines, log)
    if 'S7' in families:
        lines = fix_s7(relative, lines, log)
    if 'SPECIAL' in families:
        lines = fix_special(relative, lines, log)
    return lines


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--apply', action='store_true',
                        help='write the repairs (default: report only)')
    parser.add_argument('--tree', action='append', default=[],
                        help=f'limit to a content tree ({", ".join(TREES)})')
    parser.add_argument('--carnet', action='append', default=[],
                        help='limit to a carnet directory, e.g. 070')
    parser.add_argument('--only', default='',
                        help=f'comma-separated families ({",".join(FAMILIES)})')
    parser.add_argument('--verbose', action='store_true',
                        help='list every repaired line')
    args = parser.parse_args()

    trees = args.tree or TREES
    for tree in trees:
        if tree not in TREES:
            parser.error(f'unknown tree: {tree}')
    families = [f.strip().upper() for f in args.only.split(',') if f.strip()] or FAMILIES
    for family in families:
        if family not in FAMILIES:
            parser.error(f'unknown family: {family}')

    counts, touched = {}, 0
    for tree, path in gated_files(trees, set(args.carnet)):
        text, newline = read_text(path)
        lines = text.split('\n')
        log = []
        relative = str(path.relative_to(ROOT))
        fixed = repair(relative, list(lines), families, log)
        if not log:
            continue
        touched += 1
        for family, number, detail in log:
            counts[(family, tree)] = counts.get((family, tree), 0) + 1
            if args.verbose:
                print(f'  {relative}:{number} {family}: {detail}')
        if args.apply:
            write_text_atomic(path, '\n'.join(fixed), newline)

    print(f'{"applied" if args.apply else "dry run"}: '
          f'{sum(counts.values())} repairs in {touched} files '
          f'(trees: {", ".join(trees)}; families: {", ".join(families)})')
    for key in sorted({f for f, _ in counts}):
        rows = {t: n for (f, t), n in sorted(counts.items()) if f == key}
        detail = ', '.join(f'{t} {n}' for t, n in rows.items())
        print(f'  {key}: {sum(rows.values())}  ({detail})')
    return 0


if __name__ == '__main__':
    sys.exit(main())

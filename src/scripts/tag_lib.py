#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Shared helpers for the tag-audit tooling (dump_tag_audit, apply_tag_audit, tag_reconcile).

Everything here works on `%%`-style files only: a paragraph is the ID line `%% NNN.NNNN %%`
up to the next ID line; a tag line is a PURE line of `[#Display](path)` tokens wrapped in `%% … %%`.
Tag edits are token-level: a token is removed from its line and the line is dropped only when
it ends up empty. New tags go after the ID line, the `%% kind: … %%` line and the existing tag
block (the consecutive pure tag lines), before notes and text.
"""
import re
from pathlib import Path

from _fileio import read_text, write_text_atomic  # noqa: F401  (re-exported)

ROOT = Path(__file__).resolve().parents[2] / 'content'
GLOSSARY = ROOT / '_original' / '_glossary'
THEMES_DIR = GLOSSARY / 'culture' / 'themes'

ID_RE = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
OLD_ID_RE = re.compile(r'^\[//\]: # \((\d{3}\.\d{4})\)')
KIND_NAME_RE = re.compile(r'^%% kind: *([a-zé_]+)')
TAGLINE_RE = re.compile(r'^%% (?:\[#[^\]]+\]\([^)]+\)\s*)+%%$')
TAG_RE = re.compile(r'\[#([^\]]+)\]\(([^)]+)\)')
FOOTNOTE_DEF_RE = re.compile(r'^\[\^[^\]]+\]:')
COMMENT_RE = re.compile(r'^%%.*%%\s*$')
RSR_RE = re.compile(r'^%%\s*\d{4}-\d\d-\d\dT[\d:]+\s+RSR:\s*(.*?)\s*%%\s*$')

THEME_PREFIX = 'culture/themes/'
# Themes that exist as files but must never be emitted by the audit (reconcile still removes them
# carnet by carnet; the files are retired at the end of the wave).
RETIRED = {'DISEASES', 'FEMINISM'}
# qualifier -> parent
QUALIFIERS = {
    'MONEY_FAMILY': 'MONEY', 'MONEY_OTHERS': 'MONEY',
    'PROPERTY_FAMILY': 'PROPERTY', 'PROPERTY_OTHERS': 'PROPERTY',
}
QUALIFIED_PARENTS = {'MONEY', 'PROPERTY'}
MAX_THEMES = 3


def rel_of(path):
    """Glossary-relative path of a tag target, whatever depth the file wrote it at."""
    return path.split('_glossary/', 1)[-1]


def theme_id(rel):
    """THEME file id for a glossary-relative path under culture/themes/, else None."""
    if rel.startswith(THEME_PREFIX):
        return rel[len(THEME_PREFIX):].removesuffix('.md')
    return None


def allowed_themes():
    return {p.stem for p in THEMES_DIR.glob('*.md')} - RETIRED


def default_display(file_id):
    """Display convention of existing tags: first letter upper, rest lower, underscores kept."""
    return file_id[:1].upper() + file_id[1:].lower()


def tag_prefix(lang):
    return '../' if lang == '_original' else '../../_original/'


def make_token(display, rel, lang='_original'):
    return f'[#{display}]({tag_prefix(lang)}_glossary/{rel})'


def carnet_files(lang, carnet):
    d = ROOT / lang / carnet
    return sorted(p for p in d.glob('*.md') if p.name != 'README.md')


class Block:
    """One paragraph: lines[start:end] of a file's line list."""
    def __init__(self, pid, start, end):
        self.pid, self.start, self.end = pid, start, end


def parse_blocks(lines):
    idx = [(i, ID_RE.match(l).group(1)) for i, l in enumerate(lines) if ID_RE.match(l)]
    out = []
    for n, (i, pid) in enumerate(idx):
        end = idx[n + 1][0] if n + 1 < len(idx) else len(lines)
        out.append(Block(pid, i, end))
    return out


def has_old_format(lines):
    return any(OLD_ID_RE.match(l) for l in lines)


def block_tokens(block_lines):
    """[(display, rel)] of every tag token on pure tag lines of the paragraph, in order."""
    out = []
    for l in block_lines[1:]:
        if TAGLINE_RE.match(l):
            out.extend((d, rel_of(p)) for d, p in TAG_RE.findall(l))
    return out


def block_kind(block_lines):
    for l in block_lines[1:4]:
        m = KIND_NAME_RE.match(l)
        if m:
            return m.group(1)
    return None


def insertion_index(block_lines):
    """Index within the block after the ID line, kind line and consecutive pure tag lines."""
    j = 1
    if j < len(block_lines) and block_lines[j].startswith('%% kind: '):
        j += 1
    while j < len(block_lines) and TAGLINE_RE.match(block_lines[j]):
        j += 1
    return j


def edit_block(block_lines, remove, add_groups):
    """Return (new_lines, n_removed). `remove(display, rel, first_seen)` -> bool decides per
    token (first_seen False means a duplicate of a rel already seen in the block). Emptied tag
    lines are dropped; surviving lines keep the untouched tokens verbatim. `add_groups` is a
    list of token lists, each emitted as one new line at the insertion point."""
    seen, removed, out = set(), 0, [block_lines[0]]
    for l in block_lines[1:]:
        if TAGLINE_RE.match(l):
            toks = TAG_RE.findall(l)
            kept = []
            for d, p in toks:
                rel = rel_of(p)
                if remove(d, rel, rel not in seen):
                    removed += 1
                else:
                    kept.append(f'[#{d}]({p})')
                seen.add(rel)
            if len(kept) == len(toks):
                out.append(l)
            elif kept:
                out.append('%% ' + ' '.join(kept) + ' %%')
            continue
        out.append(l)
    if add_groups:
        k = insertion_index(out)
        out[k:k] = ['%% ' + ' '.join(g) + ' %%' for g in add_groups if g]
    return out, removed


def visible_text(block_lines, clip_quote=True):
    """Visible French of an _original paragraph: no comments, footnote definitions, blanks."""
    parts = []
    for l in block_lines[1:]:
        s = l.strip()
        if not s or COMMENT_RE.match(s) or FOOTNOTE_DEF_RE.match(s):
            continue
        if clip_quote and s.startswith('>'):
            s = s.lstrip('> ').strip()
        parts.append(s)
    return '\n'.join(parts)


def rsr_notes(block_lines):
    out = []
    for l in block_lines[1:]:
        m = RSR_RE.match(l.strip())
        if m:
            out.append(m.group(1))
    return out


def display_by_rel():
    """rel path -> most common display text across _original (for entity tags added by id)."""
    from collections import Counter
    c = {}
    for f in (ROOT / '_original').glob('[0-9][0-9][0-9]/*.md'):
        text = f.read_text(encoding='utf-8')
        if '[#' not in text:
            continue
        for l in text.split('\n'):
            if TAGLINE_RE.match(l):
                for d, p in TAG_RE.findall(l):
                    c.setdefault(rel_of(p), Counter())[d] += 1
    return {r: cnt.most_common(1)[0][0] for r, cnt in c.items()}


def glossary_index():
    """upper file stem -> [rel paths] for every glossary entry (for resolving bare entity ids)."""
    idx = {}
    for p in GLOSSARY.rglob('*.md'):
        rel = str(p.relative_to(GLOSSARY))
        if p.name.startswith('_') or p.name in ('README.md', 'CLAUDE.md') or rel.startswith('_'):
            continue
        idx.setdefault(p.stem.upper(), []).append(rel)
    return idx

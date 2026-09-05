#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
Propagate a single glossary tag from the French source into existing translations.

For every source paragraph (content/_original/NNN/*.md) that carries the target
glossary tag, add the same tag to the matching paragraph (by paragraph ID) in each
translation language — using a path localized to that translation file's own
existing glossary-link convention (so it never reintroduces the path-depth bug).

Surgical and additive: only inserts the one tag line, never edits text or other tags,
skips paragraphs already tagged, skips paragraphs/files absent in a translation.

Usage:
  python3 src/scripts/propagate_glossary_tag.py                 # dry-run, MARRIAGE
  python3 src/scripts/propagate_glossary_tag.py --apply
  python3 src/scripts/propagate_glossary_tag.py --target culture/themes/MARRIAGE.md --display Marriage --apply
  python3 src/scripts/propagate_glossary_tag.py --langs cz,uk --apply
"""
import os, re, glob, sys, argparse

from _fileio import read_text, write_text_atomic

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--target', default='culture/themes/MARRIAGE.md',
                   help='glossary path fragment after _glossary/')
    p.add_argument('--display', default='Marriage', help='display name for [#Name]')
    p.add_argument('--langs', default='cz,uk,en,fr,es')
    p.add_argument('--apply', action='store_true', help='write changes (default: dry-run)')
    p.add_argument('--from', dest='from_lang', default=None, metavar='LANG',
                   help='Seed propagation from paragraphs tagged in this language '
                        '(e.g. en). For each (carnet, paragraph) tagged in <LANG>, '
                        'ensure the tag is present in source AND every other language. '
                        'Omit for the default source -> translations behavior.')
    return p.parse_args()

PARA_RE = re.compile(r'^(?:%%\s*([0-9]{3}\.[0-9]{4})\s*%%|\[//\]:\s*#\s*\(\s*([0-9]{3}\.[0-9]{4})\s*\))\s*$')
GLOSS_PREFIX_RE = re.compile(r'\]\((\.\.[^)]*?)_glossary/')
TAG_LINE_RE = re.compile(
    r'^\s*(?:%%|\[//\]:\s*#\s*\()\s*((?:\[#[^\]]+\]\([^)]+\)\s*)+)(?:%%|\))\s*$')
LINK_TARGET_RE = re.compile(r'\[#[^\]]+\]\(([^)]+)\)')

def para_id(line):
    m = PARA_RE.match(line.rstrip('\n'))
    if not m:
        return None
    return m.group(1) or m.group(2)

def is_gloss_tag_line(line):
    return '_glossary/' in line and line.lstrip().startswith(('%%', '[//]:'))

def tag_line_targets(line):
    """Glossary paths carried by a PURE tag line (one holding nothing but [#X](path)
    links). Prose that merely mentions a path — an RSR comment quoting one, say — yields
    nothing, so it can neither seed nor suppress propagation."""
    m = TAG_LINE_RE.match(line.rstrip('\n'))
    if not m:
        return []
    return [t.split('_glossary/')[-1] for t in LINK_TARGET_RE.findall(m.group(1))]

def line_tags_target(line, target):
    return target in tag_line_targets(line)

def source_tagged_paras(orig_dir, target):
    """Return {(carnet, basename): set(paraIds)} for source paragraphs carrying target."""
    out = {}
    for f in glob.glob(f'{orig_dir}/[0-9][0-9][0-9]/*.md'):
        base = os.path.basename(f)
        if base in ('README.md', 'PROGRESS.md'):
            continue
        carnet = os.path.basename(os.path.dirname(f))
        lines = read_text(f)[0].split('\n')
        cur = None
        tagged = set()
        for ln in lines:
            pid = para_id(ln)
            if pid:
                cur = pid
            elif cur and line_tags_target(ln, target):
                tagged.add(cur)
        if tagged:
            out[(carnet, base)] = tagged
    return out

def detect_prefix(lines, lang='_translation'):
    # The canonical glossary lives at content/_original/_glossary/. Relative path depth
    # depends on the tree the target file lives in:
    #   - source  content/_original/{carnet}/file.md -> ../_glossary/        (one ..)
    #   - lang    content/{lang}/{carnet}/file.md     -> ../../_original/_glossary/ (two ..)
    # We deliberately do NOT copy the file's own prefix: fr and parts of uk carry a
    # pre-existing path-depth bug (../_glossary/ which doesn't resolve from this depth),
    # and replicating it would insert broken links. Use the correct fixed prefix.
    if lang == '_original':
        return '../'
    return '../../_original/'

def tag_style(lines):
    """Return ('%%'|'[//]') based on how this file writes glossary tag lines."""
    for ln in lines:
        s = ln.lstrip()
        if '_glossary/' in ln and s.startswith('[//]:'):
            return '[//]'
        if '_glossary/' in ln and s.startswith('%%'):
            return '%%'
    return '%%'

def propagate(args):
    target, display = args.target, args.display
    from_lang = getattr(args, 'from_lang', None)
    if from_lang:
        # Seed from a translation: read tags in content/<from_lang>/, then ensure the
        # tag in source AND every other language that has the paragraph.
        seed_dir = f'content/{from_lang}'
        src = source_tagged_paras(seed_dir, target)
        all_langs = ['_original'] + [l.strip() for l in args.langs.split(',') if l.strip()]
        langs = [l for l in all_langs if l != from_lang]
        print(f"Seed language: {from_lang}")
        print(f"{from_lang} paragraphs with [#{display}]: "
              f"{sum(len(v) for v in src.values())} across {len(src)} files")
        print(f"Propagating into: {', '.join(langs)}\n")
    else:
        langs = [l.strip() for l in args.langs.split(',') if l.strip()]
        src = source_tagged_paras('content/_original', target)
        print(f"Source paragraphs with [#{display}]: "
              f"{sum(len(v) for v in src.values())} across {len(src)} files\n")

    grand = {}
    for lang in langs:
        added = files_touched = missing_para = already = no_file = 0
        for (carnet, base), pids in src.items():
            tf = f'content/{lang}/{carnet}/{base}'
            if not os.path.isfile(tf):
                no_file += 1
                continue
            text, newline = read_text(tf)
            lines = text.split('\n')
            prefix = detect_prefix(lines, lang)
            style = tag_style(lines)
            link = f'[#{display}]({prefix}_glossary/{target})'
            tagline = f'%% {link} %%' if style == '%%' else f'[//]: # ({link})'

            # index paragraph blocks: pid -> (start_idx)
            file_changed = False
            i = 0
            out_lines = []
            n = len(lines)
            while i < n:
                ln = lines[i]
                out_lines.append(ln)
                pid = para_id(ln)
                if pid and pid in pids:
                    # gather following contiguous glossary-tag lines
                    j = i + 1
                    block_has_target = False
                    insert_at = len(out_lines)  # after the ID line
                    while j < n and is_gloss_tag_line(lines[j]):
                        out_lines.append(lines[j])
                        if line_tags_target(lines[j], target):
                            block_has_target = True
                        j += 1
                    # also scan rest of block for an existing target tag (defensive)
                    k = j
                    while k < n and para_id(lines[k]) is None:
                        if line_tags_target(lines[k], target):
                            block_has_target = True
                        k += 1
                    if not block_has_target:
                        out_lines.insert(len(out_lines), tagline)  # after last gloss tag
                        added += 1
                        file_changed = True
                    else:
                        already += 1
                    # append the rest of the already-consumed gloss lines region pointer
                    i = j
                    continue
                i += 1
            # account paras present in source-tag set but absent in this translation file
            present = {p for p in (para_id(l) for l in lines) if p}
            missing_para += len(pids - present)
            if file_changed:
                files_touched += 1
                if args.apply:
                    write_text_atomic(tf, '\n'.join(out_lines), newline)
        grand[lang] = dict(added=added, files=files_touched, already=already,
                           missing_para=missing_para, no_file=no_file)
        print(f"{lang}: +{added} tags in {files_touched} files | "
              f"already={already} missing_para={missing_para} no_translation_file={no_file}")
    print(f"\n{'APPLIED' if args.apply else 'DRY-RUN (no changes written)'}")
    return grand

if __name__ == '__main__':
    propagate(parse_args())

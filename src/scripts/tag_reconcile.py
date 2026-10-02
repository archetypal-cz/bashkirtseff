#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Make a translation tree's tag set EQUAL to _original's, per paragraph ID (dry run unless --write).

Unlike tag_sync.py this also REMOVES tags the source no longer has. Token-level: a token leaves
its line, the line is dropped only when empty. Adds go after the ID/kind/tag block with the
tree's own path depth. Never touches visible text, comments, flags or frontmatter.
  --scope themes (default)  only culture/themes/* tags
  --scope all               every glossary tag (use for audited carnets)
Paragraph IDs the carnet's _original does not have are left alone and reported.
Then run `just sync-verify CARNET LANG`.

Usage: tag_reconcile.py LANG CARNET [CARNET…|all] [--scope themes|all] [--write] [-v]
"""
import argparse, sys
from collections import Counter
from tag_lib import (ROOT, read_text, write_text_atomic, carnet_files, parse_blocks, block_tokens,
                     edit_block, theme_id, make_token, has_old_format, TAG_RE, TAGLINE_RE)


def in_scope(rel, scope):
    return scope == 'all' or bool(theme_id(rel))


def source_tags(carnet):
    """pid -> ordered [(display, rel)] across all _original files of the carnet."""
    out = {}
    for f in carnet_files('_original', carnet):
        lines = read_text(f)[0].split('\n')
        if has_old_format(lines):
            continue
        for b in parse_blocks(lines):
            out[b.pid] = block_tokens(lines[b.start:b.end])
    return out


def reconcile(lang, carnet, scope, write, verbose):
    src = source_tags(carnet)
    stat = Counter()
    for f in carnet_files(lang, carnet):
        text, nl = read_text(f)
        lines = text.split('\n')
        if has_old_format(lines):
            stat['files_old_format'] += 1
            continue
        out, pos, changed = [], 0, False
        for b in parse_blocks(lines):
            out.extend(lines[pos:b.start]); pos = b.end
            blk = lines[b.start:b.end]
            if b.pid not in src:
                stat['orphan_ids'] += 1
                out.extend(blk); continue
            want, seen = [], set()
            for d, rel in src[b.pid]:
                if in_scope(rel, scope) and rel not in seen:
                    seen.add(rel); want.append((d, rel))
            want_rels = {r for _, r in want}
            have = [(d, r) for d, r in block_tokens(blk) if in_scope(r, scope)]
            have_rels = {r for _, r in have}

            def remove(d_, rel, first):
                if not in_scope(rel, scope):
                    return False
                gone = rel not in want_rels or not first
                if gone:
                    stat['removed'] += 1
                    stat['-' + (theme_id(rel) or rel)] += 1
                return gone
            adds = [(d, r) for d, r in want if r not in have_rels]
            groups = []
            th = [(d, r) for d, r in adds if theme_id(r)]
            en = [(d, r) for d, r in adds if not theme_id(r)]
            for d, r in th:
                groups.append([make_token(d, r, lang)])
            if en:
                groups.append([make_token(d, r, lang) for d, r in en])
            for d, r in adds:
                stat['added'] += 1
                stat['+' + (theme_id(r) or r)] += 1
            nb, _ = edit_block(blk, remove, groups)
            if nb != blk:
                changed = True
                stat['paragraphs'] += 1
            out.extend(nb)
        out.extend(lines[pos:])
        if changed:
            stat['files'] += 1
            if write:
                write_text_atomic(f, '\n'.join(out), nl)
    return stat


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('lang')
    ap.add_argument('carnets', nargs='+')
    ap.add_argument('--scope', choices=['themes', 'all'], default='themes')
    ap.add_argument('--write', action='store_true')
    ap.add_argument('-v', '--verbose', action='store_true')
    a = ap.parse_args()
    cs = a.carnets
    if cs == ['all']:
        cs = sorted(p.name for p in (ROOT / a.lang).glob('[0-9][0-9][0-9]'))
    tot = Counter()
    for c in cs:
        c = c.zfill(3)
        if not (ROOT / a.lang / c).is_dir():
            continue
        s = reconcile(a.lang, c, a.scope, a.write, a.verbose)
        tot.update({k: v for k, v in s.items()})
        if s['added'] or s['removed'] or a.verbose:
            print(f'{a.lang}/{c}: +{s["added"]} -{s["removed"]} in {s["paragraphs"]} paragraphs, '
                  f'{s["files"]} files' + (f', {s["orphan_ids"]} orphan ids' if s['orphan_ids'] else '')
                  + (f', {s["files_old_format"]} old-format files skipped' if s['files_old_format'] else ''))
    print(f'TOTAL {a.lang} scope={a.scope}: +{tot["added"]} -{tot["removed"]} in {tot["paragraphs"]} '
          f'paragraphs / {tot["files"]} files, orphan ids {tot["orphan_ids"]}'
          f'{"" if a.write else " (DRY RUN)"}')
    if a.verbose:
        for k, v in sorted(tot.items()):
            if k[0] in '+-' :
                print(f'   {k}: {v}')


if __name__ == '__main__':
    main()

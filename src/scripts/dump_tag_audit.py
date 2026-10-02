#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Dump one carnet of _original as JSON for the tag audit (input for the taggers).

One record per paragraph ID:
  {id, entry_file, kind, text, themes: [{id, path}], entities: [{display, path}],
   rsr: [notes], split_parent}
`text` is the visible French only (comments, footnote definitions, blank lines excluded;
clipping blockquote marks stripped). `split_parent` is always null for now (the _renumber maps
record old -> new ids, not split pieces). Read-only.

Usage: dump_tag_audit.py CARNET [CARNET…] [--out FILE]
"""
import argparse, json, sys
from tag_lib import (ROOT, read_text, carnet_files, parse_blocks, block_tokens, block_kind,
                     visible_text, rsr_notes, theme_id, has_old_format)


def dump(carnet):
    recs = []
    for f in carnet_files('_original', carnet):
        lines = read_text(f)[0].split('\n')
        if has_old_format(lines):
            print(f'warning: {f.name} uses the old [//]: # id format; skipped', file=sys.stderr)
            continue
        for b in parse_blocks(lines):
            blk = lines[b.start:b.end]
            themes, ents = [], []
            for d, rel in block_tokens(blk):
                tid = theme_id(rel)
                if tid:
                    themes.append({'id': tid, 'path': rel})
                else:
                    ents.append({'display': d, 'path': rel})
            recs.append({
                'id': b.pid,
                'entry_file': str(f.relative_to(ROOT.parent)),
                'kind': block_kind(blk),
                'text': visible_text(blk),
                'themes': themes,
                'entities': ents,
                'rsr': rsr_notes(blk),
                'split_parent': None,
            })
    return recs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('carnets', nargs='+')
    ap.add_argument('--out')
    a = ap.parse_args()
    recs = []
    for c in a.carnets:
        recs.extend(dump(c.zfill(3)))
    s = json.dumps(recs, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, 'w', encoding='utf-8').write(s + '\n')
        print(f'{len(recs)} paragraphs -> {a.out}', file=sys.stderr)
    else:
        print(s)


if __name__ == '__main__':
    main()

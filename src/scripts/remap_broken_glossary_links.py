#!/usr/bin/env python3
"""
Repair broken glossary links in translations by resolving each broken target's
BASENAME to the entry's actual location under content/_original/_glossary/.

Handles links that point to a path that no longer exists because the entry moved
into a subcategory or another category, or used an old bare-name/site-root style.
Only rewrites links whose basename resolves to exactly ONE glossary file
(preferring a same-top-level-category match when several exist); leaves genuinely
missing or ambiguous targets untouched and reports them.

Assumes the link prefix is already the correct ../../_original/_glossary/ (run the
path-depth fix first). Additive/idempotent: only edits the link path, nothing else.

Usage:
  python3 src/scripts/remap_broken_glossary_links.py --langs fr,uk           # dry-run
  python3 src/scripts/remap_broken_glossary_links.py --langs fr,uk --apply
"""
import glob, os, re, argparse
from collections import Counter

GLOSS = 'content/_original/_glossary'
LINK = re.compile(r'\]\((\.\./\.\./_original/_glossary/[^)#]+\.md)\)')

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--langs', default='fr,uk')
    p.add_argument('--apply', action='store_true')
    return p.parse_args()

def build_basename_index():
    idx = {}
    for f in glob.glob(f'{GLOSS}/**/*.md', recursive=True):
        rel = os.path.relpath(f, GLOSS)               # e.g. places/cities/GIOIA.md
        idx.setdefault(os.path.basename(f).lower(), []).append(rel)
    return idx

def resolve(tail, idx):
    """tail = subpath after _glossary/ (broken). Return (actual_rel|None, status)."""
    base = os.path.basename(tail).lower()
    hits = idx.get(base, [])
    if len(hits) == 1:
        return hits[0], 'unique'
    if not hits:
        return None, 'missing'
    # multiple: prefer same top-level category as the broken path
    top = tail.split('/')[0]
    same = [h for h in hits if h.split('/')[0] == top]
    if len(same) == 1:
        return same[0], 'unique-cat'
    return None, 'ambiguous'

def main():
    args = parse_args()
    langs = [l.strip() for l in args.langs.split(',') if l.strip()]
    idx = build_basename_index()

    for lang in langs:
        # gather broken tails across the language
        broken_tails = Counter()
        for f in glob.glob(f'content/{lang}/[0-9][0-9][0-9]/*.md'):
            d = os.path.dirname(f)
            for m in LINK.finditer(open(f, encoding='utf-8').read()):
                if not os.path.isfile(os.path.normpath(os.path.join(d, m.group(1)))):
                    broken_tails[m.group(1).split('_glossary/')[1]] += 1

        mapping = {}      # old_tail -> new_tail
        missing, ambig = [], []
        for tail, _ in broken_tails.items():
            actual, status = resolve(tail, idx)
            if actual and actual != tail:
                mapping[tail] = actual
            elif status == 'missing':
                missing.append(tail)
            elif status == 'ambiguous':
                ambig.append(tail)

        # apply per-file: literal replace ](.../_glossary/<old>) -> ](.../_glossary/<new>)
        changed_files = 0
        applied = 0
        for f in glob.glob(f'content/{lang}/[0-9][0-9][0-9]/*.md'):
            txt = open(f, encoding='utf-8').read()
            new = txt
            for old, act in mapping.items():
                a = f'](../../_original/_glossary/{old})'
                b = f'](../../_original/_glossary/{act})'
                if a in new:
                    cnt = new.count(a)
                    new = new.replace(a, b)
                    applied += cnt
            if new != txt:
                changed_files += 1
                if args.apply:
                    open(f, 'w', encoding='utf-8').write(new)

        print(f"{lang}: remapped {applied} links in {changed_files} files | "
              f"distinct remapped={len(mapping)} | "
              f"MISSING(left)={len(missing)} AMBIG(left)={len(ambig)}")
        if missing:
            print(f"   missing entries (need creation / not real refs): {sorted(set(os.path.basename(t) for t in missing))[:25]}")
        if ambig:
            print(f"   ambiguous (left untouched): {sorted(set(os.path.basename(t) for t in ambig))[:15]}")
    print('APPLIED' if args.apply else 'DRY-RUN (no changes written)')

if __name__ == '__main__':
    main()

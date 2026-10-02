#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Apply tag-audit decisions to content/_original (dry run unless --write).

Decisions JSON: {para_id: {themes: [...], entities_add: [...], entities_remove: [{id, reason}], notes}}
  themes           FULL desired theme set (ids like LOVE / Love / love; file ids of culture/themes/).
                   Omit the key to leave a paragraph's themes alone; [] removes them all.
  entities_add     glossary path ("people/core/X.md"), bare file id ("X"), or {id|path, display?}
  entities_remove  matched against the paragraph's existing tags by display text, file id or path
  notes            free text, ignored
Validation rejects a paragraph (nothing of it is applied; report + exit 1 unless --force-partial):
unknown/retired theme, qualifier without parent, MONEY/PROPERTY without qualifier, >3 themes
(qualifiers excluded), themes on a clipping or on a paragraph with no visible text, entity that
does not exist (or a bare id that is ambiguous), unknown paragraph id.

Usage: apply_tag_audit.py CARNET --decisions F [--write] [--force-partial] [-v]
"""
import argparse, json, sys
from collections import Counter
from tag_lib import (ROOT, GLOSSARY, read_text, write_text_atomic, carnet_files, parse_blocks,
                     block_tokens, block_kind, visible_text, edit_block, theme_id, make_token,
                     allowed_themes, default_display, QUALIFIERS, QUALIFIED_PARENTS, MAX_THEMES,
                     RETIRED, display_by_rel, glossary_index, has_old_format)


def norm_theme(t):
    return str(t).strip().removesuffix('.md').split('/')[-1].upper()


def resolve_entity(item, gidx, disp):
    """-> (rel, display) or raises ValueError."""
    display = None
    if isinstance(item, dict):
        display = item.get('display')
        item = item.get('path') or item.get('id')
    if not item:
        raise ValueError('empty entity')
    item = str(item).strip()
    if item.startswith('../'):
        item = item.split('_glossary/', 1)[-1]
    if '/' in item:
        if not (GLOSSARY / item).is_file():
            raise ValueError(f'entity path does not exist: {item}')
        rel = item
    else:
        cands = gidx.get(item.removesuffix('.md').upper(), [])
        if not cands:
            raise ValueError(f'unknown entity id: {item}')
        if len(cands) > 1:
            raise ValueError(f'ambiguous entity id {item}: {cands}')
        rel = cands[0]
    if theme_id(rel):
        raise ValueError(f'{rel} is a theme; put it in "themes"')
    return rel, display or disp.get(rel) or default_display(rel.split('/')[-1].removesuffix('.md'))


def removal_matcher(items):
    keys = set()
    for it in items:
        k = it.get('id') if isinstance(it, dict) else it
        k = str(k).strip()
        keys.add(k.split('_glossary/')[-1].lower())
        keys.add(k.removesuffix('.md').split('/')[-1].lower())
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('carnet')
    ap.add_argument('--decisions', required=True)
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--force-partial', action='store_true')
    ap.add_argument('-v', '--verbose', action='store_true')
    a = ap.parse_args()
    carnet = a.carnet.zfill(3)
    dec = json.load(open(a.decisions, encoding='utf-8'))
    dec = dec.get('decisions', dec)
    allowed = allowed_themes()
    gidx, disp = glossary_index(), display_by_rel()

    # index paragraphs
    files = {}
    where = {}
    for f in carnet_files('_original', carnet):
        lines = read_text(f)
        if has_old_format(lines[0].split('\n')):
            print(f'warning: {f.name} uses the old id format; skipped', file=sys.stderr)
            continue
        files[f] = lines
        for b in parse_blocks(lines[0].split('\n')):
            where[b.pid] = f

    rejects, warns, plan = [], [], {}
    for pid, d in dec.items():
        errs = []
        if pid not in where:
            rejects.append((pid, ['paragraph id not in carnet ' + carnet])); continue
        lines = files[where[pid]][0].split('\n')
        blk = next(lines[b.start:b.end] for b in parse_blocks(lines) if b.pid == pid)
        cur = block_tokens(blk)
        cur_themes = [theme_id(r) for _, r in cur if theme_id(r)]
        kind, text = block_kind(blk), visible_text(blk)
        want = None
        if d.get('themes') is not None:
            want = []
            for t in d['themes']:
                t = norm_theme(t)
                if t in RETIRED:
                    errs.append(f'retired theme {t}')
                elif t not in allowed:
                    errs.append(f'unknown theme {t}')
                if t not in want:
                    want.append(t)
            ws = set(want)
            for q, parent in QUALIFIERS.items():
                if q in ws and parent not in ws:
                    errs.append(f'qualifier {q} without {parent}')
            for p in QUALIFIED_PARENTS:
                if p in ws and not any(QUALIFIERS.get(x) == p and x in ws for x in ws):
                    errs.append(f'{p} without a qualifier ({p}_FAMILY / {p}_OTHERS)')
            if sum(1 for t in want if t not in QUALIFIERS) > MAX_THEMES:
                errs.append(f'more than {MAX_THEMES} themes')
            if want and kind == 'clipping':
                errs.append('themes on a clipping')
            if want and (not text or text.startswith('[Aucun texte')):
                errs.append('themes on a paragraph with no visible text')
        adds = []
        for it in d.get('entities_add') or []:
            try:
                adds.append(resolve_entity(it, gidx, disp))
            except ValueError as e:
                errs.append(str(e))
        rm_keys = removal_matcher(d.get('entities_remove') or [])
        if errs:
            rejects.append((pid, errs)); continue
        # entities to drop: existing non-theme tokens matching a removal key
        def match(disp_, rel):
            return (disp_.lower() in rm_keys or rel.lower() in rm_keys
                    or rel.split('/')[-1].removesuffix('.md').lower() in rm_keys)
        hit = {k for k in rm_keys if any(k == dd.lower() or k == r.lower() or
               k == r.split('/')[-1].removesuffix('.md').lower() for dd, r in cur if not theme_id(r))}
        for k in sorted(rm_keys - hit):
            warns.append((pid, f'entities_remove matches no tag: {k}'))
        have_rel = {r for _, r in cur}
        theme_adds = [t for t in (want or []) if f'culture/themes/{t}.md' not in have_rel]
        theme_rm = set(cur_themes) - set(want) if want is not None else set()
        ent_adds = [(r, dd) for r, dd in adds if r not in have_rel]
        plan[pid] = dict(file=where[pid], want=want, theme_adds=theme_adds, theme_rm=theme_rm,
                         ent_adds=ent_adds, match=match, rm_keys=rm_keys)

    # apply plan, per file
    ct = Counter()
    by_file = {}
    for pid, p in plan.items():
        by_file.setdefault(p['file'], {})[pid] = p
    if rejects and not a.force_partial:
        by_file = {}
    for f, pmap in by_file.items():
        text, nl = files[f]
        lines = text.split('\n')
        out, pos = [], 0
        for b in parse_blocks(lines):
            out.extend(lines[pos:b.start]); pos = b.end
            blk = lines[b.start:b.end]
            p = pmap.get(b.pid)
            if p:
                def remove(d_, rel, first, p=p):
                    t = theme_id(rel)
                    if t:
                        gone = t in p['theme_rm'] or (p['want'] is not None and not first)
                        if gone and t in p['theme_rm']:
                            ct['-' + t] += 1
                        return gone
                    if p['match'](d_, rel):
                        ct['-entity ' + rel] += 1
                        return True
                    return False
                groups = []
                for t in p['theme_adds']:
                    groups.append([make_token(default_display(t), f'culture/themes/{t}.md')])
                    ct['+' + t] += 1
                if p['ent_adds']:
                    groups.append([make_token(dd, r) for r, dd in p['ent_adds']])
                    for r, _ in p['ent_adds']:
                        ct['+entity ' + r] += 1
                blk, _n = edit_block(blk, remove, groups)
            out.extend(blk)
        out.extend(lines[pos:])
        new = '\n'.join(out)
        if new != text and a.write:
            write_text_atomic(f, new, nl)

    print(f'carnet {carnet}: {len(dec)} decisions, {len(plan)} valid, {len(rejects)} rejected'
          f'{"" if a.write else " (DRY RUN)"}')
    for pid, errs in rejects:
        print(f'  REJECT {pid}: ' + '; '.join(errs))
    for pid, w in warns:
        print(f'  warn   {pid}: {w}')
    if not (rejects and not a.force_partial):
        themes_add = {k[1:]: v for k, v in ct.items() if k[0] == '+' and not k.startswith('+entity')}
        themes_rm = {k[1:]: v for k, v in ct.items() if k[0] == '-' and not k.startswith('-entity')}
        for t in sorted(set(themes_add) | set(themes_rm)):
            print(f'  {t:18s} +{themes_add.get(t, 0):<4d} -{themes_rm.get(t, 0)}')
        ea = sum(v for k, v in ct.items() if k.startswith('+entity'))
        er = sum(v for k, v in ct.items() if k.startswith('-entity'))
        print(f'  entities           +{ea} -{er}')
        if a.verbose:
            for k, v in sorted(ct.items()):
                if 'entity' in k:
                    print(f'    {k}: {v}')
    else:
        print('  nothing applied (use --force-partial to apply the valid paragraphs)')
    if rejects:
        sys.exit(1)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Copy missing glossary tags per paragraph ID from _original into a translation tree.

Adds %% [#tag](…) lines only — never touches visible text, flags or comments
(unlike `just sync`, which also adds notes/paragraphs). Dry run unless --write.
Usage: tag_sync.py LANG CARNET [CARNET…] [--write]; then run `just sync-verify CARNET LANG`.
"""
import re, sys, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'content'
LANG = sys.argv[1]
ID_RE = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
TAGLINE_RE = re.compile(r'^%% (\[#[^\]]+\]\([^)]+\)\s*)+%%$')
TAG_RE = re.compile(r'\[#([^\]]+)\]\(([^)]+)\)')
write = '--write' in sys.argv
carnets = [a for a in sys.argv[2:] if a[0].isdigit()]
changed = []

def tags_by_para(lines):
    out, cur = {}, None
    for l in lines:
        m = ID_RE.match(l)
        if m:
            cur = m.group(1); out.setdefault(cur, [])
        elif cur and TAGLINE_RE.match(l):
            out[cur].extend(TAG_RE.findall(l))
    return out

for c in carnets:
    total = 0
    for tf in sorted((ROOT / LANG / c).glob('*.md')):
        if tf.name == 'README.md':
            continue
        of = ROOT / '_original' / c / tf.name
        if not of.exists():
            print(f'  no original for {tf}'); continue
        orig = tags_by_para(of.read_text().splitlines())
        lines = tf.read_text().split('\n')
        new, cur, i, added_file = [], None, 0, 0
        # find, per paragraph, insertion index = after ID line and any consecutive tag lines
        n = len(lines)
        while i < n:
            l = lines[i]; new.append(l)
            m = ID_RE.match(l)
            if m:
                pid = m.group(1)
                j = i + 1
                have = set()
                while j < n and TAGLINE_RE.match(lines[j]):
                    have.update(t for t, _ in TAG_RE.findall(lines[j])); new.append(lines[j]); j += 1
                # tags elsewhere in the paragraph (not directly after ID)
                k = j
                while k < n and not ID_RE.match(lines[k]):
                    if TAGLINE_RE.match(lines[k]):
                        have.update(t for t, _ in TAG_RE.findall(lines[k]))
                    k += 1
                missing, seen = [], set()
                for t, p in orig.get(pid, []):
                    if t not in have and t not in seen:
                        seen.add(t)
                        assert p.startswith('../_glossary/'), (tf, p)
                        missing.append(f'[#{t}](../../_original/_glossary/{p[len("../_glossary/"):]})')
                if missing:
                    new.append('%% ' + ' '.join(missing) + ' %%')
                    added_file += len(missing)
                i = j; continue
            i += 1
        if added_file:
            total += added_file
            changed.append(str(tf.relative_to(ROOT.parent)))
            if write:
                tf.write_text('\n'.join(new))
    print(f'{c}: {total} tags added')

if write:
    print('\n'.join(changed))

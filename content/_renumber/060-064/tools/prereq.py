#!/usr/bin/env python3
"""Tome 8 prerequisites (idempotent). Usage: prereq.py REPO
1. en/060 060.0257: stale partial embedded French line (renumber-check d FAIL).
2. uk/063 063.0092/0117/0132: duplicated embedded French / comment lines (renumber-check d FAIL).
3. stale citations 061.0241 -> 061.0043 (Collignon portrait, 23 May), 062.0248 -> 062.0283 (7 June),
   062.0256 -> 062.0317 (12 June), 076.0074 -> 076.0451 in COLLIGNON glossary and 060 notes (renumber-check c FAIL).
"""
import re, sys
from pathlib import Path
R = Path(sys.argv[1]) / 'content'
ID = re.compile(r'^%% \d{3}\.\d{4} %%$')

def fix_en060():
    p = R / 'en/060/1876-05-16.md'; L = p.read_text().split('\n'); out = []; cur = None; n = 0
    for l in L:
        if ID.match(l): cur = l
        if cur == '%% 060.0257 %%' and l == '%% A midi je ne voulais pas encore me lever. %%': n += 1; continue
        out.append(l)
    p.write_text('\n'.join(out)); print('en/060 0257 removed', n)

def dedupe_uk063():
    for p in sorted((R / 'uk/063').glob('*.md')):
        L = p.read_text().split('\n'); out = []; cur = None; seen = set(); n = 0
        for l in L:
            if ID.match(l): cur = l; seen = set()
            elif cur in ('%% 063.0092 %%', '%% 063.0117 %%', '%% 063.0132 %%') and l.startswith('%% ') and l.endswith(' %%'):
                if l in seen: n += 1; continue
                seen.add(l)
            out.append(l)
        if n: p.write_text('\n'.join(out)); print(p.name, 'dup lines removed', n)

def cites():
    M = {'061.0241': '061.0043', '062.0248': '062.0283', '062.0256': '062.0317', '076.0074': '076.0451'}
    files = [R / '_original/_glossary/people/mentioned/COLLIGNON.md'] + [R / t / '060/1876-05-18.md' for t in ('_original', 'en', 'uk', 'cz', 'fr')]
    for p in files:
        if not p.exists(): continue
        s = p.read_text(); t = re.sub(r'\b(061\.0241|062\.0248|062\.0256|076\.0074)\b', lambda m: M[m.group(1)], s) if 'COLLIGNON' in p.name else re.sub(r'\b061\.0241\b', '061.0043', s)
        if t != s: p.write_text(t); print(p, 'citations fixed')

fix_en060(); dedupe_uk063(); cites()

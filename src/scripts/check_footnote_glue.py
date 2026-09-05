#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
check_footnote_glue.py — find diary prose that has been glued onto a footnote-definition
line (`[^id]: <note> <swallowed sentences…>`), so it renders as footnote text and silently
vanishes from the reader's paragraph.

Cause (2026-09-05 audit): the 2026-06-18 canonical-footnote gap-fill (#17) inserted each
footnote definition after the sentence carrying its marker and appended everything that
followed in the paragraph to the definition line. At least 32 cz/uk blocks were affected;
22 were repaired en passant by later polish passes, 10 by hand. The glued tail is always
one or more whole sentences.

Signature ("text conserved but migrated"), measured per paragraph block against the
FRENCH SOURCE in content/_original:
    r1 = visible translation chars / source French chars      -> low   (< --r1, default 0.72)
    r2 = (visible + referenced footnote bodies) / French       -> normal (>= --r2, default 0.70)
    and the block references at least --min-fn chars of footnote definition.
On the ten known pre-repair cases this gives 10/10 recall (r1 ranged 0.20–0.64); a plain
"visible/French < 0.55" cut misses ~40 % of instances because a late-placed marker leaves
only one or two sentences to swallow. A first-person-voice test on the footnote tail was
also evaluated and adds nothing beyond this signal.

Why the denominator must be content/_original and NOT the `%% … %%` French embedded in the
translation file: the embedded copy is not trustworthy — in carnets 081/082 every block
repeats the previous block's paragraph (sliding-window duplication), old `[//]: # ( RSR …)`
comments and date-only `%% 2026-05-30 TR: … %%` notes are wrapped as if they were French,
and cz/044 embeds a paragraph that belongs to another block. Measured against the embedded
copy, 59 of 125 shortfall rows in the audit were pure measurement artifacts.

Known benign hits (leave as is): a short sentence carrying a long editorial note (e.g. a
Dante or Cicero quotation), a translator's note quoting Marie's English/Italian at length
(house convention), and blocks whose source line carries an inline `%% LAN: … %%` comment
(inflates the French count). These sit at r1 0.58–0.71; genuine glue is usually far lower.
Anything below ~0.55 with a multi-sentence footnote should be opened and read.

Usage:
    uv run src/scripts/check_footnote_glue.py                # all of cz, uk, en
    uv run src/scripts/check_footnote_glue.py --lang cz --carnet 092
    uv run src/scripts/check_footnote_glue.py --lang uk --quiet
Exit code: 0 when no candidate, 1 when at least one candidate is listed (so it can gate),
2 on usage error. --warn-only forces exit 0 (reporting mode for sweeps).

Companion checks: check_footnote_swallow.py (older sentence-delta heuristic, cz early
carnets), verify-carnet.ts check #4 (footnote ref/def integrity — orthogonal: a glued
definition is structurally valid, which is exactly why it slipped through).
"""
import argparse, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'content'
ID_RE = re.compile(r'^%% (\d{3}\.\d{4}) %%\s*$')
FNDEF_RE = re.compile(r'^\[\^([^\]]+)\]:\s*(.*)')
FNREF_RE = re.compile(r'\[\^([^\]]+)\]')


def blocks(text: str):
    """Per paragraph block: visible char count + footnote labels referenced; plus all defs.
    Visible = lines that are not %% comments, not bare [//]: comments, not headings, not
    footnote definitions, not blank."""
    out, fns, cur = {}, {}, None
    for line in text.splitlines():
        m = ID_RE.match(line)
        if m:
            cur = m.group(1)
            out[cur] = {'vis': 0, 'refs': set()}
            continue
        d = FNDEF_RE.match(line)
        if d:
            fns[d.group(1)] = d.group(2)
            continue
        s = line.strip()
        if cur is None or not s or line.startswith('%%') or line.startswith('[//]:') or line.startswith('#'):
            continue
        out[cur]['vis'] += len(s)
        out[cur]['refs'].update(FNREF_RE.findall(line))
    return out, fns


def scan(langs, carnet, r1_max, r2_min, min_fr, min_fn):
    rows, evaluated = [], 0
    pattern = f'{carnet}/[0-9]*.md' if carnet else '[0-9]*/[0-9]*.md'
    for src in sorted((ROOT / '_original').glob(pattern)):
        rel = src.relative_to(ROOT / '_original')
        ob, _ = blocks(src.read_text(encoding='utf-8'))
        for lang in langs:
            tp = ROOT / lang / rel
            if not tp.exists():
                continue
            tb, fns = blocks(tp.read_text(encoding='utf-8'))
            for pid, b in ob.items():
                t = tb.get(pid)
                if b['vis'] < min_fr or t is None or not t['refs']:
                    continue
                evaluated += 1
                fnlen = sum(len(fns.get(x, '')) for x in t['refs'])
                r1 = t['vis'] / b['vis']
                r2 = (t['vis'] + fnlen) / b['vis']
                if fnlen >= min_fn and r1 < r1_max and r2 >= r2_min:
                    rows.append((r1, r2, fnlen, b['vis'], f'{lang}/{rel}', pid, sorted(t['refs'])))
    return sorted(rows), evaluated


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--lang', default='cz,uk,en', help='comma-separated translation trees (default cz,uk,en)')
    ap.add_argument('--carnet', help='restrict to one carnet, e.g. 092')
    ap.add_argument('--r1', type=float, default=0.72, help='flag when visible/French is below this')
    ap.add_argument('--r2', type=float, default=0.70, help='…and (visible+footnotes)/French is at least this')
    ap.add_argument('--min-fr', type=int, default=150, help='ignore blocks with less French than this')
    ap.add_argument('--min-fn', type=int, default=60, help='ignore blocks whose footnotes total less than this')
    ap.add_argument('--quiet', action='store_true', help='print only candidates, no summary')
    ap.add_argument('--warn-only', action='store_true', help='always exit 0')
    a = ap.parse_args()
    langs = [x.strip() for x in a.lang.split(',') if x.strip()]
    for lang in langs:
        if not (ROOT / lang).is_dir():
            print(f'no such tree: content/{lang}', file=sys.stderr)
            return 2
    if a.carnet and not (ROOT / '_original' / a.carnet).is_dir():
        print(f'no such carnet: content/_original/{a.carnet}', file=sys.stderr)
        return 2
    rows, evaluated = scan(langs, a.carnet, a.r1, a.r2, a.min_fr, a.min_fn)
    if rows:
        print('r1\tr2\tfn\tFR\tfile\tblock\tfootnotes')
        for r1, r2, fnlen, fr, f, pid, refs in rows:
            print(f'{r1:.2f}\t{r2:.2f}\t{fnlen}\t{fr}\t{f}\t{pid}\t{",".join(refs)}')
    if not a.quiet:
        print(f'footnote-glue: {len(rows)} candidate(s) in {evaluated} footnote-bearing blocks '
              f'({",".join(langs)}{", carnet " + a.carnet if a.carnet else ""}); '
              f'r1<{a.r1} and r2>={a.r2}. Open each candidate and compare the footnote tail with the French.',
              file=sys.stderr)
    return 0 if (a.warn_only or not rows) else 1


if __name__ == '__main__':
    sys.exit(main())

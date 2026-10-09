"""Compare the printed-edition scan text (content/_raw/scans/TomeN.pdf text layer) with content/_original.

  just scan-compare 1            # one tome
  just scan-compare 1 2 3 4 5    # several
  just scan-compare 1 --json X   # override the output path

The whole tome's scan text and the whole carnet range's _original text (paragraphs in ID order) are
aligned as word streams: unique 6-word shingles common to both are chained into a monotone anchor
sequence (longest increasing subsequence), and the stretches between anchors are diffed word by word.
Every difference becomes a finding with the scan page, the nearest _original paragraph ID, context
from both sides, and whether the tome docx has the scan text too.

Kinds:
  scan-only        words the scan has and _original lacks (≥ 4 words: candidate missing text)
  original-only    words _original has and the scan lacks (≥ 4 words)
  accent           same words modulo diacritics
  bang-ocr         «I»/«II»/«l» on one side where the other has «!»
  word             any other short substitution / insertion / deletion
  front-back-matter  scan-only text before the first / after the last anchor (preface, index…)
Differences that are only a word split or joined differently (same letters) are counted, not listed.
Printed-edition apparatus (running heads, page numbers) is stripped before alignment; footnotes and
editorial brackets in the print are NOT stripped — deciding what they are is the reviewer's job.
Output: .cache/scan-compare/tomeN.json (+ a summary printed to stdout).
"""
from __future__ import annotations

import argparse
import bisect
import collections
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / 'content' / '_raw'
ORIG = ROOT / 'content' / '_original'
OUT = ROOT / '.cache' / 'scan-compare'

TOME_CARNETS = {1: (1, 7), 2: (8, 14), 3: (15, 20), 4: (21, 30), 5: (31, 44)}
SHINGLE = 6
CTX = 12

RE_TOKEN = re.compile(r"[^\W_]+|[!?]", re.UNICODE)
RE_PID = re.compile(r'^%% (\d{3})\.(\d{4}) %%\s*$')
RE_COMMENT = re.compile(r'%%.*?%%', re.S)
RE_FOOTREF = re.compile(r'\[\^[^\]]+\]')


def fold(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def norm(tok: str) -> str:
    return tok.lower().replace('œ', 'oe').replace('æ', 'ae')


# ---------------------------------------------------------------- scan side

def scan_pages(tome: int) -> list[list[str]]:
    """Lines per page, running heads and page numbers removed, line-break hyphens joined."""
    doc = fitz.open(str(RAW / 'scans' / f'Tome{tome}.pdf'))
    pages = []
    for page in doc:
        lines = [l.strip() for l in page.get_text('text').splitlines()]
        pages.append([l for l in lines if l])
    # running heads: first/last lines that recur on many pages once digits are removed
    edge = collections.Counter()
    for ls in pages:
        for l in ls[:2] + ls[-2:]:
            edge[re.sub(r'\d+', '#', l.lower())] += 1
    heads = {k for k, n in edge.items() if n >= 8 and len(k) < 60}
    out = []
    for ls in pages:
        keep = []
        for i, l in enumerate(ls):
            atedge = i < 2 or i >= len(ls) - 2
            if atedge and (re.fullmatch(r'[\divxlcIVXLC\s.\-–—]+', l) or re.sub(r'\d+', '#', l.lower()) in heads):
                continue
            keep.append(l)
        out.append(keep)
    return out


def scan_tokens(tome: int):
    """Scan word stream. The tome 1–5 PDFs sometimes repeat the last line(s) of a page at the top of the
    next one; such an overlap (3–40 words, identical modulo case/accents) is dropped from the new page."""
    toks, pages = [], []
    pending = ''
    repeats = 0
    for pno, ls in enumerate(scan_pages(tome), start=1):
        page = []
        for l in ls:
            if pending:
                l = pending + l
                pending = ''
            if re.search(r'[^\W\d_]-$', l):  # line-break hyphen: join with the next line
                pending = l[:-1]
                continue
            page += [m.group() for m in RE_TOKEN.finditer(l)]
        prev = [norm(fold(t)) for t in toks[-40:]]
        cur = [norm(fold(t)) for t in page[:40]]
        for n in range(min(len(prev), len(cur)), 2, -1):
            if prev[-n:] == cur[:n]:
                page = page[n:]
                repeats += 1
                break
        toks += page
        pages += [pno] * len(page)
    scan_tokens.repeats = repeats
    return toks, pages


# ---------------------------------------------------------------- _original side

def original_paragraphs(c0: int, c1: int):
    paras = []  # (pid, text)
    for c in range(c0, c1 + 1):
        d = ORIG / f'{c:03d}'
        for f in sorted(d.glob('*.md')):
            if f.name.upper() == 'README.MD':
                continue
            body = f.read_text(encoding='utf-8')
            if body.startswith('---'):
                body = body.split('\n---', 1)[1] if '\n---' in body[3:] else body
            body = RE_COMMENT.sub(lambda m: m.group() if RE_PID.match(m.group()) else '', body)
            pid, buf = None, []
            for line in body.splitlines():
                m = RE_PID.match(line.strip())
                if m:
                    if pid:
                        paras.append((pid, ' '.join(buf)))
                    pid, buf = f'{m.group(1)}.{m.group(2)}', []
                    continue
                if pid is None or re.match(r'^\[\^[^\]]+\]:', line):
                    continue
                line = RE_FOOTREF.sub('', line).lstrip('#> ').replace('==', '').replace('*', '')
                if line.strip():
                    buf.append(line.strip())
            if pid:
                paras.append((pid, ' '.join(buf)))
    paras.sort(key=lambda p: p[0])
    return paras


def original_tokens(c0: int, c1: int):
    toks, pids = [], []
    for pid, text in original_paragraphs(c0, c1):
        for m in RE_TOKEN.finditer(text):
            toks.append(m.group())
            pids.append(pid)
    return toks, pids


def docx_folded(tome: int) -> str:
    import docx
    d = docx.Document(str(RAW / f'tome{tome:02d}.docx'))
    return ' '.join(norm(fold(t)) for p in d.paragraphs for t in RE_TOKEN.findall(p.text))


# ---------------------------------------------------------------- alignment

def anchors(a: list[str], b: list[str]) -> list[tuple[int, int]]:
    def uniq(ts):
        seen = collections.Counter(tuple(ts[i:i + SHINGLE]) for i in range(len(ts) - SHINGLE + 1))
        return {tuple(ts[i:i + SHINGLE]): i for i in range(len(ts) - SHINGLE + 1) if seen[tuple(ts[i:i + SHINGLE])] == 1}
    ua, ub = uniq(a), uniq(b)
    pairs = sorted((i, ub[k]) for k, i in ua.items() if k in ub)
    # longest increasing subsequence on j
    tails, tails_idx, prev = [], [], [-1] * len(pairs)
    for n, (_, j) in enumerate(pairs):
        k = bisect.bisect_left(tails, j)
        if k == len(tails):
            tails.append(j); tails_idx.append(n)
        else:
            tails[k] = j; tails_idx[k] = n
        prev[n] = tails_idx[k - 1] if k else -1
    chain, n = [], tails_idx[-1] if tails_idx else -1
    while n >= 0:
        chain.append(pairs[n]); n = prev[n]
    return chain[::-1]


def is_bang_pair(x: list[str], y: list[str]) -> bool:
    sx, sy = set(x), set(y)
    ocr = {'I', 'II', 'l', 'Il', 'll', '1', '11'}
    return bool(sx) and bool(sy) and ((sx <= {'!'} and sy <= ocr) or (sy <= {'!'} and sx <= ocr))


def compare(tome: int):
    c0, c1 = TOME_CARNETS[tome]
    st, sp = scan_tokens(tome)
    ot, op = original_tokens(c0, c1)
    sn, on = [norm(t) for t in st], [norm(t) for t in ot]
    sf, of = [fold(t) for t in sn], [fold(t) for t in on]
    chain = anchors(sf, of)
    # extend anchors over their full shingle span, then diff the gaps
    spans, i0, j0 = [], 0, 0
    for i, j in chain + [(len(sf), len(of))]:
        if i >= i0 and j >= j0:
            spans.append((i0, i, j0, j))
            i0, j0 = i + SHINGLE, j + SHINGLE
    dx = docx_folded(tome)
    findings, split_only = [], 0
    for a0, a1, b0, b1 in spans:
        if a1 <= a0 and b1 <= b0:
            continue
        if (a1 - a0) > 4000 or (b1 - b0) > 4000:
            sm_ops = [('replace', a0, a1, b0, b1)]  # huge unaligned block: report as one
        else:
            sm = difflib.SequenceMatcher(None, sf[a0:a1], of[b0:b1], autojunk=False)
            sm_ops = [(t, a0 + x0, a0 + x1, b0 + y0, b0 + y1) for t, x0, x1, y0, y1 in sm.get_opcodes()]
        for tag, x0, x1, y0, y1 in sm_ops:
            if tag == 'equal':
                # accent differences hide inside fold-equal runs
                for k in range(x1 - x0):
                    if sn[x0 + k] != on[y0 + k]:
                        findings.append(mk(tome, 'accent', x0 + k, x0 + k + 1, y0 + k, y0 + k + 1, st, sp, ot, op, dx))
                continue
            sx, ox = st[x0:x1], ot[y0:y1]
            if sx and ox and ''.join(sf[x0:x1]) == ''.join(of[y0:y1]):
                split_only += 1  # same letters, split or joined differently (line-break artefact, compound)
                continue
            if is_bang_pair(sx, ox):
                kind = 'bang-ocr'
            elif tag == 'delete' or (tag == 'replace' and len(sx) - len(ox) >= 4):
                kind = 'scan-only' if len(sx) >= 4 else 'word'
            elif tag == 'insert' or (tag == 'replace' and len(ox) - len(sx) >= 4):
                kind = 'original-only' if len(ox) >= 4 else 'word'
            else:
                kind = 'word'
            if kind == 'scan-only' and chain and (x1 <= chain[0][0] or x0 >= chain[-1][0] + SHINGLE):
                kind = 'front-back-matter'
            elif kind == 'scan-only' and re.search(r'INDEX\s+ALPHA', ' '.join(st[x0:x1])):
                kind = 'front-back-matter'  # the index, glued to the tome's last diary words
            findings.append(mk(tome, kind, x0, x1, y0, y1, st, sp, ot, op, dx))
    stats = {'tome': tome, 'carnets': f'{c0:03d}-{c1:03d}', 'scan_words': len(st), 'original_words': len(ot),
             'anchors': len(chain), 'page_top_repeats_dropped': scan_tokens.repeats, 'anchored_scan_words': len(chain) * SHINGLE,
             'kinds': dict(collections.Counter(f['kind'] for f in findings)), 'split_only_dropped': split_only}
    return stats, findings


def mk(tome, kind, x0, x1, y0, y1, st, sp, ot, op, dx):
    def ctx(ts, a, b):
        return ' '.join(ts[max(0, a - CTX):a]) + ' ⟦' + ' '.join(ts[a:b]) + '⟧ ' + ' '.join(ts[b:b + CTX])
    sx = st[x0:x1]
    in_docx = None
    if len(sx) >= 3:
        in_docx = ' '.join(norm(fold(t)) for t in sx) in dx
    pid_at = op[min(y0, len(op) - 1)] if op else None
    return {'id': f't{tome}-{x0}', 'tome': tome, 'kind': kind,
            'scan_page': sp[min(x0, len(sp) - 1)], 'pid': pid_at,
            'scan_words': len(sx), 'original_words': y1 - y0,
            'scan_text': ' '.join(sx)[:1500], 'original_text': ' '.join(ot[y0:y1])[:1500],
            'scan_context': ctx(st, x0, x1)[:2000], 'original_context': ctx(ot, y0, y1)[:2000],
            'scan_text_in_docx': in_docx}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('tomes', nargs='+', type=int)
    ap.add_argument('--json')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for t in a.tomes:
        stats, findings = compare(t)
        path = Path(a.json) if a.json and len(a.tomes) == 1 else OUT / f'tome{t}.json'
        path.write_text(json.dumps({'stats': stats, 'findings': findings}, ensure_ascii=False, indent=1), encoding='utf-8')
        big = [f for f in findings if f['kind'] in ('scan-only', 'original-only')]
        print(f"Tome{t} {stats['carnets']}: scan {stats['scan_words']} words, _original {stats['original_words']}, "
              f"anchors {stats['anchors']}; findings {stats['kinds']}; scan-only words in big gaps "
              f"{sum(f['scan_words'] for f in big if f['kind'] == 'scan-only')} → {path.relative_to(ROOT)}")


if __name__ == '__main__':
    sys.exit(main())

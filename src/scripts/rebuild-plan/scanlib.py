"""Manuscript-scan helpers (content/_raw/scans/TomeN.pdf, ABBYY PDFs of the printed
«Mon Journal» edition, gitignored): PDF page → docx paragraph map with printed
page numbers, and figure candidates (ink outside the text layer, ABBYY picture
regions). Results are cached under .cache/rebuild-plan/.
"""
from __future__ import annotations

import json
import re
import statistics

from common import _cache_file, docx_path, dump_docx, norm, pdf_path

K = 6  # shingle size for page anchoring


def pagemap(tome: int) -> list[dict] | None:
    """[{pdf_page, printed_page?, docx_para_start?, docx_para_end?, words, coverage}] or None without a scan."""
    pdf = pdf_path(tome)
    if not pdf:
        return None
    cf = _cache_file(f'tome{tome:02d}.pagemap', pdf)
    if cf.exists():
        return json.loads(cf.read_text())
    import pymupdf as fitz

    paras = dump_docx(tome)
    dw, dpara = [], []
    for p in paras:
        for w in norm(p['t']).split():
            dw.append(w)
            dpara.append(p['i'])
    idx: dict[tuple, list[int]] = {}
    for i in range(len(dw) - K):
        idx.setdefault(tuple(dw[i:i + K]), []).append(i)
    out = []
    for pno, page in enumerate(fitz.open(str(pdf))):
        text = page.get_text()
        pw = norm(text).split()
        hits = []
        for j in range(max(0, len(pw) - K)):
            L = idx.get(tuple(pw[j:j + K]))
            if L and len(L) == 1:
                hits.append((j, L[0]))
        rec = {'pdf_page': pno + 1, 'words': len(pw), 'coverage': round(len(hits) / max(1, len(pw) - K), 3) if pw else 0}
        if hits:
            med = statistics.median(d - j for j, d in hits)
            good = [(j, d) for j, d in hits if abs((d - j) - med) < 200] or hits
            s = min(d for _, d in good)
            e = max(d for _, d in good) + K - 1
            rec.update(docx_para_start=dpara[s], docx_para_end=dpara[e])
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        # the printed page number is a bare number on the last (or, in some tomes, the first) line
        for cand in (lines[-1:] + lines[:1]) if lines else []:
            if re.fullmatch(r'\d{1,3}', cand):
                rec['printed_page'] = int(cand)
                break
        out.append(rec)
    cf.write_text(json.dumps(out))
    return out


def printed_pages(pm: list[dict] | None, a: int, b: int) -> str:
    """'p.X' / 'pp.X–Y' of the printed edition for docx ¶a–b, '' when unknown."""
    if not pm:
        return ''
    ps = sorted({x['printed_page'] for x in pm if x.get('docx_para_end') is not None and x.get('printed_page')
                 and x['docx_para_start'] <= b and x['docx_para_end'] >= a})
    if not ps:
        # an empty paragraph (a picture slot) sits between two pages' text: take the page before it
        before = [x for x in pm if x.get('docx_para_end') is not None and x.get('printed_page') and x['docx_para_end'] < a]
        if before and a - before[-1]['docx_para_end'] <= 3:
            return f"p.{before[-1]['printed_page']}"
        return ''
    return f'p.{ps[0]}' if len(ps) == 1 else f'pp.{ps[0]}–{ps[-1]}'


def pdf_pages_for(pm: list[dict] | None, a: int, b: int) -> list[int]:
    if not pm:
        return []
    return [x['pdf_page'] for x in pm if x.get('docx_para_end') is not None and x['docx_para_start'] <= b and x['docx_para_end'] >= a]


def figure_candidates(tome: int) -> list[dict] | None:
    """Pages with a sizeable ink region outside the OCR text layer, or an ABBYY picture region. Cached."""
    pdf = pdf_path(tome)
    if not pdf:
        return None
    cf = _cache_file(f'tome{tome:02d}.figures', pdf)
    if cf.exists():
        return json.loads(cf.read_text())
    import numpy as np
    import pymupdf as fitz

    res = []
    for i, p in enumerate(fitz.open(str(pdf))):
        words = p.get_text('words')
        pix = p.get_pixmap(dpi=72, colorspace=fitz.csGRAY)
        a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w)
        H, W = a.shape
        if words:
            x0 = int(np.percentile([w[0] for w in words], 2)) + 2
            x1 = int(np.percentile([w[2] for w in words], 98)) - 2
        else:
            x0, x1 = int(W * 0.12), int(W * 0.88)
        y0, y1 = int(H * 0.04), int(H * 0.90)
        mask = np.zeros_like(a, bool)
        for w in words:
            a0, b0, a1, b1 = (int(v) for v in w[:4])
            mask[max(0, b0 - 2):b1 + 3, max(0, a0 - 3):a1 + 4] = True
        sub = ((a < 120) & ~mask)[y0:y1, x0:x1]
        rowink = sub.sum(1)
        runs, start = [], None
        for y, v in enumerate(list(rowink >= 4) + [False]):
            if v and start is None:
                start = y
            if not v and start is not None:
                if y - start >= 18:
                    runs.append({'y0': start + y0, 'y1': y + y0, 'ink': int(rowink[start:y].sum())})
                start = None
        regions = [r for r in runs if r['ink'] >= 300]
        pics = [tuple(round(x) for x in r) for im in p.get_images(full=True) for r in p.get_image_rects(im[0])
                if r.width < p.rect.width * 0.9 and r.width * r.height > 900]
        if regions or pics:
            res.append({'pdf_page': i + 1, 'regions_pt': regions, 'abbyy_picture_regions': pics})
    cf.write_text(json.dumps(res))
    return res


INSET_MIN, INSET_MAX = 13.0, 40.0  # pt: pasted/quoted material is set in from both margins (~17–22 pt in tome 9)


def typography(tome: int) -> dict[int, dict] | None:
    """Per docx paragraph, layout signals from the printed edition's scan (text layer of the ABBYY PDF):

      inset:      the paragraph's wrapped lines are set in from BOTH body margins (quoted
                  letter, clipping) — {'page', 'left', 'right', 'lines'}
      in_picture: most of its lines lie inside an ABBYY picture region, i.e. a facsimile of
                  pasted printed matter (programme, clipping, ticket) — {'page', 'frac'}
      garbage:    share of OCR tokens that are not words (tables, columns) — float

    Lines are attributed to docx paragraphs by aligning the page's word stream with the
    docx word stream (difflib), so short dialogue lines do not blur the margins. Cached.
    """
    pdf = pdf_path(tome)
    if not pdf:
        return None
    cf = _cache_file(f'tome{tome:02d}.typography', pdf)
    if cf.exists():
        return {int(k): v for k, v in json.loads(cf.read_text()).items()}
    import collections
    import difflib

    import pymupdf as fitz

    paras = dump_docx(tome)
    pm = pagemap(tome) or []
    doc = fitz.open(str(pdf))
    out: dict[int, dict] = {}
    for rec in pm:
        if rec.get('docx_para_start') is None:
            continue
        page = doc[rec['pdf_page'] - 1]
        W, WP = [], []
        for q in paras[max(0, rec['docx_para_start'] - 1):rec['docx_para_end'] + 2]:
            for w in norm(q['t']).split():
                W.append(w)
                WP.append(q['i'])
        lines = []
        for bl in page.get_text('dict')['blocks']:
            if bl['type'] != 0:
                continue
            for l in bl['lines']:
                t = ''.join(s['text'] for s in l['spans'])
                if t.strip():
                    lines.append((l['bbox'], t))
        lines.sort(key=lambda x: (round(x[0][1]), x[0][0]))
        P, PL = [], []
        for k, (_, t) in enumerate(lines):
            for w in norm(t).split():
                P.append(w)
                PL.append(k)
        votes = collections.defaultdict(collections.Counter)
        for m in difflib.SequenceMatcher(None, P, W, autojunk=False).get_matching_blocks():
            for j in range(m.size):
                votes[PL[m.a + j]][WP[m.b + j]] += 1
        owner, prev = [], None
        for k in range(len(lines)):
            o = votes[k].most_common(1)[0][0] if votes[k] else prev
            owner.append(o)
            prev = o
        by = collections.defaultdict(list)
        for (bb, t), o in zip(lines, owner):
            if o is not None:
                by[o].append((bb, t))
        wr = [bb[2] for L in by.values() for bb, _ in L[:-1]]
        lx = [bb[0] for L in by.values() for bb, _ in L[1:]]
        pics = [r for im in page.get_images(full=True) for r in page.get_image_rects(im[0]) if r.width < page.rect.width * 0.9 and r.width * r.height > 900]
        X1 = statistics.median(wr) if len(wr) >= 6 else None
        X0 = statistics.median(lx) if len(lx) >= 6 else None
        for o, L in by.items():
            sig = out.setdefault(o, {})
            if X1 is not None and X0 is not None and len(L) >= 3:
                right = X1 - statistics.median(bb[2] for bb, _ in L[:-1])
                left = statistics.median(bb[0] for bb, _ in L[1:]) - X0
                if INSET_MIN <= left <= INSET_MAX and INSET_MIN <= right <= INSET_MAX:
                    sig['inset'] = {'page': rec['pdf_page'], 'printed_page': rec.get('printed_page'), 'left': round(left), 'right': round(right), 'lines': len(L)}
            if pics:
                inside = sum(1 for bb, _ in L if any(r.x0 - 3 <= bb[0] and bb[2] <= r.x1 + 3 and r.y0 - 3 <= bb[1] and bb[3] <= r.y1 + 3 for r in pics))
                if inside / len(L) >= 0.6:
                    sig['in_picture'] = {'page': rec['pdf_page'], 'printed_page': rec.get('printed_page'), 'frac': round(inside / len(L), 2)}
            toks = ' '.join(t for _, t in L).split()
            if len(toks) >= 8:
                bad = sum(1 for x in toks if re.search(r'[^\w’\'«»“”"().,;:!?…\-–—]', x) or re.search(r'\d[^\W\d_]|[^\W\d_]\d', x))
                sig['garbage'] = round(bad / len(toks), 2)
    out = {k: v for k, v in out.items() if v}
    cf.write_text(json.dumps(out))
    return out

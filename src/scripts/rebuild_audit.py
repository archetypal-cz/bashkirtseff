"""Post-rebuild audit of content/_original against the printed edition.

  just rebuild-audit                          # every carnet
  just rebuild-audit 001-074 081-100          # carnets / ranges
  just rebuild-audit 068 --json out.json      # --json / --report override the output paths

Source = the tome docx (content/_raw/tomeNN.docx, the OCR of «Mon Journal»), with
printed page numbers from the scans (content/_raw/scans/TomeN.pdf) where they exist.
The docx segmentation (Livre headings, date lines) and the docx → _original
alignment are the rebuild drafter's (src/scripts/rebuild-plan/draft.py, Tome).

Categories (severity high / medium / low / info):
  date-frontmatter, date-entry-id, date-primary-stale   filename vs frontmatter
  date-heading-mismatch, heading-missing, heading-other-day, heading-duplicate, heading-markup
  weekday-slip          heading weekday ≠ calendar, same as the printed edition (Marie's slip, kept)
  weekday-differs       heading weekday ≠ the printed edition's weekday for that date
  heading-not-in-source _original date heading with no date line in the tome
  heading-year-differs  same day and month in the tome, other year
  source-date-missing   tome date line with no _original heading
  heading-differs-from-source  the two above at the same place: the tome and _original date the day differently
  heading-position      tome text under date D sits in an _original entry of another date
  order-out-of-source   paragraphs out of the tome's order
  carnet-boundary       paragraphs whose tome position lies in another Livre
  carnet-continuity     carnet N+1 starts before carnet N ends (date or tome position)
  calendar-inversion    heading dates going backwards in paragraph order (info: manuscript order wins)
  pid-sequence, para-range   paragraph IDs / frontmatter para_start–para_end
  duplicate             identical / near-identical paragraph lines (≥ 60 chars)
  duplicate-in-source   the same, but the tome repeats the text too (info)
  not-in-source         _original text the tome does not have (invented / stale text?); info when an RSR
                        note documents it (facsimile transcription, typo correction…)
  editorial-not-in-source  a bracketed note the tome does not have («[Note de l'éd. : …]»)
  partial-in-source     _original line only partly found
  empty-no-stub, stub-with-text, stub-but-source-has-text, placeholder, empty-flag
Output: JSON findings (.cache/rebuild-audit/rebuild-audit-<date>.json) and a markdown
report (.claude/reports/rebuild-audit-<date>.md).
"""
from __future__ import annotations

import argparse
import bisect
import collections
import datetime
import itertools
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / 'rebuild-plan'))
import yaml  # noqa: E402

import draft  # noqa: E402
from common import (_MON as MON_RX, CONTENT, MONTH_NAME, ROOT, WEEKDAYS, dump_docx, entry_order_key, load_carnet, norm, parse_heading,  # noqa: E402
                    tome_carnets, visible_lines)
from scanlib import pagemap, printed_pages  # noqa: E402

# the drafter's Tome also scans for figures and typography; the audit needs neither
draft.figure_candidates = lambda tome: None
draft.typography = lambda tome: None

TODAY = datetime.date.today().isoformat()
ORIG = CONTENT / '_original'
SEV_ORDER = {'high': 0, 'medium': 1, 'low': 2, 'info': 3}
RE_STUB = re.compile(r'^\[Aucun texte')
RE_PLACEHOLDER = re.compile(r'\bTODO\b|\bFIXME\b|PLACEHOLDER|\[texte manquant|\[à compléter|^\s*(?:\.\.\.|…|\[\s*(?:\.\.\.|…)\s*\])\s*$')
# a date line the OCR spoilt beyond parse_heading: «Dimanche 14 décembe 1879», «Mardi 2.7 septembre 1881»
RE_GARBLED_DATE = re.compile(r'^\s*\S{3,12}\s+[\dIl][\d .]{0,4}\s*(?:er\s*)?[a-zéûA-Z]{3,10}\s*[1Il]\s?8\s?[678]\s?\d')
RE_WD_START = re.compile(r'^\s*(?:lundi|mardi|mercredi|jeudi|jeud|vendredi|samedi|dimanche)\b', re.I)
RE_FNAME = re.compile(r'^(\d{4})-(\d{2})-(\d{2})(?:-(\d{2}))?(?:-(.+))?\.md$')
# an RSR/KRR note on the paragraph that explains why its text differs from the tome docx
RE_DOCUMENTED = re.compile(r'fac-?simil|transcri|not in tome|typo|coquille|misprint|correct|corrig|placeholder|illisible|from the scan|PDF p\.', re.I)
N = 5  # shingle size for the tome index


def log(*a):
    print(*a, file=sys.stderr)


def parse_carnets(args: list[str]) -> list[str]:
    allc = sorted(p.name for p in ORIG.iterdir() if re.fullmatch(r'\d{3}', p.name))
    if not args:
        return allc
    out = []
    for a in args:
        for part in a.split(','):
            m = re.fullmatch(r'(\d{1,3})(?:-(\d{1,3}))?', part)
            if not m:
                raise SystemExit(f'bad carnet argument: {part}')
            lo, hi = int(m.group(1)), int(m.group(2) or m.group(1))
            out += [f'{x:03d}' for x in range(lo, hi + 1) if f'{x:03d}' in allc]
    return sorted(set(out))


def words(s: str) -> list[str]:
    return norm(s).split()


def shingles(ws: list[str], n: int = N) -> list[str]:
    return [' '.join(ws[i:i + n]) for i in range(len(ws) - n + 1)]


def ymd(d: str) -> datetime.date | None:
    try:
        return datetime.date.fromisoformat(d)
    except (TypeError, ValueError):
        return None


# --- _original ------------------------------------------------------------------------------

def text_line(line: str) -> str:
    """a visible line as diary text: quote marks, italics and footnote refs off"""
    s = re.sub(r'^(?:>\s?)+', '', line).strip()
    s = re.sub(r'\[\^[^\]]*\]', '', s)
    return s


class Entry:
    def __init__(self, carnet: str, path: Path):
        self.carnet = carnet
        self.path = path
        self.name = path.name
        raw = path.read_text(encoding='utf-8')
        m = re.match(r'---\n(.*?)\n---\n', raw, re.S)
        try:
            self.fm = (yaml.safe_load(m.group(1)) if m else {}) or {}
        except yaml.YAMLError:
            self.fm = {}
        fm = RE_FNAME.match(self.name)
        self.dates: list[str] = []
        self.suffix = ''
        if fm:
            y, mo, d, d2, suf = fm.groups()
            self.dates = [f'{y}-{mo}-{d}']
            if d2:  # 1876-07-26-27: a range file
                self.dates += [f'{y}-{mo}-{x:02d}' for x in range(int(d) + 1, int(d2) + 1)]
            self.suffix = suf or ''
        self.date = self.dates[0] if self.dates else None
        self.clusters: list[dict] = []


def load_entries(carnet: str) -> list[Entry]:
    d = ORIG / carnet
    ents = {}
    for f in sorted(d.iterdir(), key=lambda f: entry_order_key(f.name)):
        if f.suffix == '.md' and f.name != 'README.md' and not f.name.startswith('_'):
            ents[f.name] = Entry(carnet, f)
    for c in load_carnet('_original', carnet):
        if c['file'] in ents:
            ents[c['file']].clusters.append(c)
    # load_carnet only reads date-named files; 000-NN.md and friends
    for e in ents.values():
        if not e.clusters:
            body = re.sub(r'^---\n.*?\n---\n', '', e.path.read_text(encoding='utf-8'), flags=re.S)
            cur = None
            for line in body.split('\n'):
                mm = re.match(r'^%%\s*(\d{3}\.\d{4})\s*%%\s*$', line)
                if mm:
                    cur = {'id': mm.group(1), 'file': e.name, 'lines': []}
                    e.clusters.append(cur)
                elif cur is not None:
                    cur['lines'].append(line)
            for c in e.clusters:
                c['vis'] = visible_lines(c['lines'])
    for e in ents.values():
        for c in e.clusters:
            c['heads'] = [l for l in c['vis'] if l.startswith('#')]
            c['text'] = [text_line(l) for l in c['vis'] if not l.startswith('#') and not l.startswith('![')]
            c['text'] = [t for t in c['text'] if t]
            notes = ' '.join(re.findall(r'%%\s*\d{4}-\d\d-\d\dT[\d:]+\s+(?:RSR|KRR|ED|FRE|REV):(.*?)%%', '\n'.join(c['lines']), re.S))
            c['notes'] = notes
            km = re.search(r'%%\s*kind:\s*(\S+)', '\n'.join(c['lines']))
            c['kind'] = km.group(1) if km else None
            m = RE_DOCUMENTED.search(notes)
            c['documented'] = notes[max(0, m.start() - 60):m.end() + 60].strip() if m else ''
    return list(ents.values())


def heading_of(line: str, near: str | None) -> dict | None:
    level = len(line) - len(line.lstrip('#'))
    t = line.lstrip('#').strip().strip('*').strip()
    prev = None
    if near and ymd(near):
        dd = ymd(near)
        prev = (dd.year, dd.month, dd.day)
    h = parse_heading(t, prev)
    if h:
        h['level'] = level
        h['line'] = t
    return h


RE_TWO_DAYS = re.compile(rf'^(?P<wd1>\w+),?\s+(?P<d1>\d{1,2}(?:er)?)\s*(?:,|et|-|–|au)?\s*(?P<wd2>(?:{"|".join(WEEKDAYS)})\s+)?(?P<d2>\d{1,2}(?:er)?)\s+(?P<rest>(?:{MON_RX}).*)$', re.I)


def heading_dates(line: str, near: str | None) -> list[dict]:
    """the date(s) of a heading line: «Mercredi 10 mai 1876 - jeudi 11 mai 1876» and «Mercredi 26, jeudi
    27 novembre 1873» give both (later ones marked 'second'); each has 'wd', the weekday written for it"""
    t = line.lstrip('#').strip().strip('*').strip()
    h = heading_of(line, near)
    if h:
        out = chain_dates(h)
    else:
        m = RE_TWO_DAYS.match(t)
        if not m:
            return []
        out = []
        for wd, d in ((m.group('wd1'), m.group('d1')), ((m.group('wd2') or '').strip(), m.group('d2'))):
            h = heading_of(f'{wd} {d} {m.group("rest")}'.strip(), near)
            if h:
                out.append(h)
    for k, h in enumerate(out):
        h['line'] = t
        h['second'] = k > 0
    return out


def chain_dates(h: dict) -> list[dict]:
    """h plus the further date lines run on after it («Lundi 29 septembre 1879 Mardi 30 septembre 1879»),
    skipping a Julian second date («- 8 juin»)"""
    hs = [h]
    while True:
        rest = re.sub(rf'^[\s\-–—,.]*(?:\d{{1,2}}\s*(?:er)?\s*(?:{MON_RX})\b[\s,.]*)?[\s\-–—,.]*', '', hs[-1]['rest'] or '', flags=re.I)
        h2 = parse_heading(rest, hs[-1]['ymd']) if rest else None
        if not h2 or h2['date'] <= hs[-1]['date']:
            break
        hs.append(h2)
    for x in hs:
        x['wd'] = None if 'weekday' in x['guessed'] else x['heading'].split()[0].lower()
    return hs


def days(d: str) -> int:
    return ymd(d).toordinal()


# --- tome index -----------------------------------------------------------------------------

class Source:
    """All tome docx paragraphs: a 5-gram index over the text, per-tome normalised text, pages."""

    def __init__(self):
        self.rows: dict[int, list[dict]] = {}
        self.idx: dict[int, object] = {}
        self.pms: dict[int, list | None] = {}
        for t in range(1, 17):
            rows = dump_docx(t)
            self.rows[t] = rows
            for p in rows:
                ws = words(p['t'])
                if not ws:
                    continue
                pos = t * 100000 + p['i']
                for sh in shingles(ws) if len(ws) >= N else []:
                    h = hash(sh)
                    v = self.idx.get(h)
                    if v is None:
                        self.idx[h] = pos
                    elif isinstance(v, int):
                        if v != pos:
                            self.idx[h] = [v, pos]
                    elif v[-1] != pos:
                        v.append(pos)
        self.ntext = {t: ' ' + ' | '.join(norm(p['t']) for p in rows) + ' ' for t, rows in self.rows.items()}
        self.ngrams3 = {}
        self.ngrams4 = {}

    def hits(self, ws: list[str]) -> tuple[float, collections.Counter]:
        shs = shingles(ws)
        votes = collections.Counter()
        found = 0
        for sh in shs:
            v = self.idx.get(hash(sh))
            if v is None:
                continue
            found += 1
            for p in (v if isinstance(v, list) else (v,)):
                votes[p] += 1
        return (found / len(shs) if shs else 0.0), votes

    def grams3(self, t: int, i: int) -> set:
        k = (t, i)
        if k not in self.ngrams3:
            ws = words(self.rows[t][i]['t']) if 0 <= i < len(self.rows[t]) else []
            self.ngrams3[k] = {' '.join(ws[j:j + 3]) for j in range(len(ws) - 2)}
        return self.ngrams3[k]

    def window3(self, pos: int, span: int = 15) -> set:
        t, i = divmod(pos, 100000)
        out = set()
        for j in range(i - span, i + span + 1):
            out |= self.grams3(t, j)
        return out

    def window4(self, pos: int, span: int = 15) -> set:
        t, i = divmod(pos, 100000)
        out = set()
        for j in range(max(0, i - span), min(len(self.rows[t]), i + span + 1)):
            k = (t, j)
            if k not in self.ngrams4:
                n = norm(self.rows[t][j]['t']).replace(' ', '')
                self.ngrams4[k] = {n[x:x + 4] for x in range(len(n) - 3)}
            out |= self.ngrams4[k]
        return out

    def page(self, t: int, a: int, b: int | None = None) -> str:
        if t not in self.pms:
            self.pms[t] = pagemap(t)
        return printed_pages(self.pms[t], a, a if b is None else b)

    def ev(self, pos: int | None) -> dict:
        if pos is None:
            return {}
        t, i = divmod(pos, 100000)
        e = {'tome': t, 'docx': i}
        pg = self.page(t, i)
        if pg:
            e['page'] = pg
        return e

    def excerpt(self, pos: int, n: int = 70) -> str:
        t, i = divmod(pos, 100000)
        return self.rows[t][i]['t'].strip()[:n]


def evs(e: dict) -> str:
    if not e:
        return ''
    s = f"tome{e['tome']:02d} ¶{e['docx']}"
    return s + (f", {e['page']}" if e.get('page') else '')


# --- audit ----------------------------------------------------------------------------------

class Audit:
    def __init__(self, carnets: list[str]):
        self.carnets = carnets
        self.findings: list[dict] = []
        log('loading _original')
        self.E = {c: load_entries(c) for c in carnets}
        log('indexing the tomes')
        self.S = Source()
        tc = tome_carnets()
        self.tome_of = {c: t for t, cs in tc.items() for c in cs}
        self.tomes: dict[int, draft.Tome] = {}
        for t in sorted({self.tome_of[c] for c in carnets if c in self.tome_of}):
            if not all((ORIG / c).is_dir() for c in tc[t]):
                continue
            log(f'segmenting tome {t}')
            self.tomes[t] = draft.Tome(t)
        self.anchor: dict[str, int] = {}  # cluster id -> packed tome position

    def add(self, cat, sev, carnet, file, pid, msg, ev=None, **extra):
        f = {'carnet': carnet, 'file': file, 'pid': pid, 'category': cat, 'severity': sev, 'message': msg}
        if ev:
            f['evidence'] = ev
        f.update(extra)
        self.findings.append(f)

    # 6 (first, the others use the anchors) — reverse completeness
    def reverse(self):
        S = self.S
        for c in self.carnets:
            t0 = self.tome_of.get(c, 1)
            near = {t0 - 1, t0, t0 + 1}
            clusters = [cl for e in self.E[c] for cl in e.clusters]
            line_res = []
            # the previous anchor: a repeated sentence resolves to the copy nearest to it;
            # it starts at the carnet's first sentence that occurs only once in the tomes
            last = None
            for line in (x for cl in clusters for x in cl['text']):
                ws = words(line)
                if len(ws) >= 10:
                    cont, votes = S.hits(ws)
                    good = [p for p, n in votes.items() if p // 100000 in near and n >= 0.8 * (len(ws) - N + 1)]
                    if len(good) == 1:
                        last = good[0]
                        break
            for cl in clusters:
                pos_votes = collections.Counter()
                for line in cl['text']:
                    if RE_STUB.match(line):
                        continue
                    ws = words(line)
                    if len(ws) < 3:
                        continue
                    if len(ws) < N:
                        j = ' '.join(ws)
                        found = any((' ' + j + ' ') in S.ntext[t] for t in near if t in S.ntext)
                        line_res.append((cl, line, ws, 1.0 if found else 0.0, None))
                        continue
                    cont, votes = S.hits(ws)
                    best = None
                    if votes:
                        nearv = {p: n for p, n in votes.items() if p // 100000 in near} or dict(votes)
                        top = max(nearv.values())
                        cands = [p for p, n in nearv.items() if n >= top * 0.5]
                        best = min(sorted(cands), key=lambda p: abs(p - last) if last is not None else p)
                    line_res.append((cl, line, ws, cont, best))
                    if best is not None and cont >= 0.6 and len(ws) >= 8:
                        pos_votes[best] += len(ws)
                if pos_votes:
                    # the earliest well-supported row: a cluster holding several docx paragraphs starts at the first
                    top = max(pos_votes.values())
                    self.anchor[cl['id']] = min(p for p, n in pos_votes.items() if n >= top * 0.3)
                    last = max(pos_votes)
            ids = [cl['id'] for cl in clusters]
            for cl, line, ws, cont, best in line_res:
                if cont >= 0.8:
                    if best is not None and best // 100000 not in near and len(ws) >= 12:
                        self.add('not-in-source', 'medium', c, cl['file'], cl['id'],
                                 f'found only in tome {best // 100000} (carnet is in tome {t0}): «{line[:90]}»', S.ev(best))
                    continue
                anc = best if best is not None and best // 100000 in near else self.anchor.get(cl['id'])
                if anc is None:
                    k = ids.index(cl['id'])
                    for d in range(1, 8):
                        for j in (k - d, k + d):
                            if 0 <= j < len(ids) and ids[j] in self.anchor:
                                anc = self.anchor[ids[j]]
                                break
                        if anc is not None:
                            break
                g3 = {' '.join(ws[j:j + 3]) for j in range(len(ws) - 2)}
                c3 = len(g3 & S.window3(anc)) / len(g3) if anc is not None and g3 else 0.0
                score = max(cont, c3)
                if score >= 0.85 or (len(ws) < N and score >= 0.67):
                    continue
                if anc is not None:
                    # OCR-garbled tome text («On alloodait un Incident…»): character 4-grams still match
                    n4 = norm(line).replace(' ', '')
                    g4 = {n4[j:j + 4] for j in range(len(n4) - 3)}
                    c4 = len(g4 & S.window4(anc)) / len(g4) if g4 else 0.0
                    if c4 >= 0.8:
                        continue
                    if c4 >= 0.6:
                        score = max(score, 0.5)
                nw = len(ws)
                if cl['documented']:
                    self.add('not-in-source' if score < 0.5 else 'partial-in-source', 'info', c, cl['file'], cl['id'],
                             f'{nw} words, {score:.0%} found, documented («…{cl["documented"][:140]}…»): «{line[:80]}»', S.ev(anc), score=round(score, 2))
                    continue
                if score < 0.5 and re.fullmatch(r'\[[^\[\]]*\]', line.strip()):
                    self.add('editorial-not-in-source', 'low', c, cl['file'], cl['id'],
                             f'bracketed note the tome does not have: «{line[:110]}»', S.ev(anc), score=round(score, 2))
                elif score < 0.5:
                    sev = 'high' if nw >= 15 else 'medium' if nw >= 6 else 'low'
                    self.add('not-in-source', sev, c, cl['file'], cl['id'],
                             f'{nw} words, {score:.0%} found near the aligned tome text: «{line[:110]}»', S.ev(anc), score=round(score, 2))
                elif nw >= 12:
                    self.add('partial-in-source', 'medium' if score < 0.7 and nw >= 30 else 'low', c, cl['file'], cl['id'],
                             f'{nw} words, {score:.0%} found: «{line[:110]}»', S.ev(anc), score=round(score, 2))

    # 1, 2, 7 — per-entry checks
    def entries(self):
        for c in self.carnets:
            if c == '000':
                continue
            by_date = collections.defaultdict(list)
            by_date['_first'] = next((e for e in self.E[c] if e.date), None)
            for e in self.E[c]:
                for d in e.dates:
                    by_date[d].append(e)
            for e in self.E[c]:
                self.entry_dates(c, e, by_date)
                self.entry_text(c, e)

    def entry_dates(self, c, e: Entry, by_date):
        if not e.date:
            self.add('date-frontmatter', 'medium', c, e.name, None, 'filename is not a date')
            return
        fmd = e.fm.get('date')
        fmd = fmd.isoformat() if isinstance(fmd, datetime.date) else (str(fmd) if fmd is not None else None)
        if fmd != e.date:
            self.add('date-frontmatter', 'high', c, e.name, None, f'frontmatter date: {fmd} ≠ filename {e.date}')
        eid = e.fm.get('entry_id')
        if eid is not None and str(eid) != e.name[:-3] and str(eid) != e.date:
            self.add('date-entry-id', 'low', c, e.name, None, f'entry_id: {eid} ≠ filename {e.name[:-3]}')
        dts = e.fm.get('dates') if isinstance(e.fm.get('dates'), dict) else None
        if dts:
            prim = dts.get('primary')
            h = parse_heading(str(prim), (int(e.date[:4]), int(e.date[5:7]), 1)) if prim else None
            merged = [str(x) for x in (dts.get('merged') or [])]
            stale_m = [m for m in merged if m not in e.dates and by_date.get(m) and by_date[m] != [e]]
            if prim and (not h or h['date'] not in e.dates):
                self.add('date-primary-stale', 'low', c, e.name, None,
                         f'dates.primary «{prim}» ≠ filename {e.date}' + (f'; merged lists {", ".join(stale_m)} (own entries)' if stale_m else ''))
            elif stale_m:
                self.add('date-primary-stale', 'low', c, e.name, None, f'dates.merged lists {", ".join(stale_m)}, which have their own entries')
        heads = [(cl, l) for cl in e.clusters for l in cl['heads']]
        if not heads or e.clusters and not e.clusters[0]['heads']:
            lead = list(itertools.takewhile(lambda cl: not cl['heads'], e.clusters))
            # Marie's title-page / flyleaf notes go in before the first heading of the carnet (owner policy)
            title_notes = heads and e is by_date['_first'] and all(cl['kind'] in ('margin', 'other', 'editorial') for cl in lead)
            if e.suffix != 'cover':
                self.add('heading-missing', 'info' if title_notes else 'medium', c, e.name, e.clusters[0]['id'] if e.clusters else None,
                         'no date heading' if not heads else f'first paragraph has no heading (first heading in {heads[0][0]["id"]})')
        seen = collections.Counter()
        for k, (cl, l) in enumerate(heads):
            hs = heading_dates(l, e.date)
            if not hs:
                self.add('heading-markup', 'low', c, e.name, cl['id'], f'non-date text marked up as a heading: «{l[:90]}»')
                continue
            level = len(l) - len(l.lstrip('#'))
            if level != 1:
                self.add('heading-markup', 'low', c, e.name, cl['id'], f'date heading at level {level}: «{l[:60]}»')
            for h in hs:
                seen[h['date']] += 1
                if seen[h['date']] == 2:
                    self.add('heading-duplicate', 'medium', c, e.name, cl['id'], f'second heading for {h["date"]}: «{h["line"][:60]}»')
                if h['date'] in e.dates:
                    continue
                if k == 0 and not h.get('second'):
                    doc = re.search(r'filed (?:under|as)|filename', cl['notes'])
                    self.add('date-heading-mismatch', 'info' if doc else 'high', c, e.name, cl['id'],
                             f'heading «{h["line"][:60]}» = {h["date"]} ≠ filename {e.date}' + (' (documented in an RSR note)' if doc else ''))
                else:
                    other = [x.name for x in by_date.get(h['date'], []) if x is not e]
                    self.add('heading-other-day', 'medium' if other else 'low', c, e.name, cl['id'],
                             f'heading for {h["date"]} inside the {e.date} entry' + (f' (that day also has {", ".join(other)})' if other else ''))

    def entry_text(self, c, e: Entry):
        # title-page notes ahead of the carnet's first heading are not the day's text
        lead = set(id(cl) for cl in itertools.takewhile(lambda cl: not cl['heads'] and cl['kind'] in ('margin', 'other', 'editorial'), e.clusters))
        text = [(cl, t) for cl in e.clusters if id(cl) not in lead for t in cl['text']]
        stub = [(cl, t) for cl, t in text if RE_STUB.match(t)]
        real = [(cl, t) for cl, t in text if not RE_STUB.match(t)]
        pid = e.clusters[0]['id'] if e.clusters else None
        if not text:
            self.add('empty-no-stub', 'medium', c, e.name, pid, 'entry has no French text and no «[Aucun texte…]» stub')
        elif stub and real:
            self.add('stub-with-text', 'medium', c, e.name, stub[0][0]['id'], f'«[Aucun texte…]» stub next to {len(real)} text line(s)')
        for cl, t in real:
            if RE_PLACEHOLDER.search(t):
                self.add('placeholder', 'medium', c, e.name, cl['id'], f'placeholder-like text: «{t[:90]}»')
        flag = bool((e.fm.get('workflow') or {}).get('empty_in_source') or e.fm.get('empty_in_source'))
        if flag and real:
            self.add('empty-flag', 'low', c, e.name, pid, f'empty_in_source: true but {len(real)} text line(s)')

    # 3, 2 — date lines vs the tome
    def headings_vs_source(self):
        S = self.S
        for t, T in self.tomes.items():
            if not any(c in self.E for c in T.carnets):
                continue
            a, b = T.body
            # the tome's date lines; one docx paragraph can hold several («Lundi 29 septembre 1879 Mardi 30 septembre 1879»)
            src = []  # (row, head, is_last_on_row)
            for r in T.rows[a:b]:
                if r['cls'] != 'head':
                    continue
                hs = chain_dates(dict(r['head']))
                for k, h in enumerate(hs):
                    src.append((r, h, k == len(hs) - 1))
            src_by_date = collections.defaultdict(list)
            src_by_md = collections.defaultdict(list)
            src_heads = collections.defaultdict(list)
            for r, h, _ in src:
                src_heads[h['date']].append(h)
                src_by_date[h['date']].append(r)
                src_by_md[h['date'][5:]].append(r)
            # _original headings of the whole tome, with the entry they sit in
            oh = collections.defaultdict(list)
            unmarked = collections.defaultdict(list)
            file_of = {}
            span = collections.defaultdict(list)
            for c in T.carnets:
                for e in (self.E.get(c) or load_entries(c)):
                    span[c] += [d for d in e.dates]
                    for cl in e.clusters:
                        file_of[cl['id']] = e
                        for l in cl['heads']:
                            for h in heading_dates(l, e.date):
                                oh[h['date']].append((c, e, cl, h))
                        for l in cl['text'][:2]:
                            if len(l) < 70:
                                for h in heading_dates(l, e.date):
                                    unmarked[h['date']].append((c, e, cl))
            # text under each source date line
            under = collections.defaultdict(list)
            cur = None
            for r in T.rows[a:b]:
                if r['cls'] == 'head':
                    cur = r['i']
                    last = [h for rr, h, _ in src if rr is r][-1]
                    if re.search(r'[A-Za-zÀ-ÿ]{3}', last['rest'] or ''):
                        under[cur].append(last['rest'])
                elif r['cls'] == 'livre':
                    cur = None
                elif cur is not None and r['cls'] == 'text':
                    under[cur].append(r['t'])
            aligned = collections.defaultdict(list)
            for tr in T.text_rows:
                if tr.get('best') and tr.get('head') is not None and not tr.get('rest_of_head'):
                    aligned[tr['head']].append(tr['best'])

            # _original → tome
            for d, lst in oh.items():
                for c, e, cl, h in lst:
                    if c not in self.E:
                        continue
                    ss = src_by_date.get(d)
                    nearc = {f'{int(c) + k:03d}' for k in (-1, 0, 1)}
                    if not ss:
                        md = [r for r in src_by_md.get(d[5:], []) if T.seg.get(r['i']) in nearc]
                        if md:
                            self.add('heading-year-differs', 'low', c, e.name, cl['id'],
                                     f'«{h["line"][:60]}»: the tome has «{md[0]["t"][:50]}» ({md[0]["head"]["date"][:4]})', S.ev(t * 100000 + md[0]['i']))
                        else:
                            inside = self.date_in_text(T, d, nearc)
                            if inside and inside[1]:
                                sev, why = 'info', f'; the tome\'s date line is OCR-garbled: ¶{inside[0]} «{T.R[inside[0]]["t"][:60]}»'
                            elif inside:
                                sev, why = 'low', f'; a tome text paragraph starts with the date: ¶{inside[0]} «{T.R[inside[0]]["t"][:60]}»'
                            else:
                                sev, why = 'medium', ''
                            self.add('heading-not-in-source', sev, c, e.name, cl['id'], f'«{h["line"][:70]}» ({d}) has no date line in tome {t}{why}',
                                     S.ev(t * 100000 + inside[0]) if inside else None)
                    # 2. weekday: the calendar, and the tome's own date line for the same date
                    if not h['wd']:
                        continue
                    slip = next((g for g in h['guessed'] if g.startswith('weekday (')), None)
                    sw = {x['wd'] for x in src_heads.get(d, []) if x['wd']}
                    ev = S.ev(t * 100000 + src_by_date[d][0]['i']) if src_by_date.get(d) else None
                    if sw and h['wd'] not in sw:
                        r0 = src_by_date[d][0]
                        self.add('weekday-differs', 'medium', c, e.name, cl['id'],
                                 f'«{h["line"][:60]}»: the tome reads «{r0["t"][:60]}»'
                                 + (f' ({slip[9:-1]})' if slip else ' (the calendar agrees with _original)'), ev)
                    elif slip:
                        self.add('weekday-slip', 'info' if sw else 'low', c, e.name, cl['id'],
                                 f'«{h["line"][:60]}»: {slip[9:-1]}' + ('; the tome has the same' if sw else '; no tome date line to compare'), ev)
            # tome → _original
            for r, h, is_last in src:
                d = h['date']
                c = T.seg.get(r['i'])
                if c not in self.E:
                    continue
                ev = S.ev(t * 100000 + r['i'])
                near = [f'{int(c) + k:03d}' for k in (-1, 0, 1)]
                hits = [x for x in oh.get(d, []) if x[0] in near]
                if not hits:
                    if any(x[0] in near for k, v in oh.items() if k[5:] == d[5:] for x in v):
                        continue  # same day and month under another year: heading-year-differs
                    um = [x for x in unmarked.get(d, []) if x[0] in near]
                    ds = sorted(x for cc in near for x in span.get(cc, []))
                    under_txt = ' '.join(under.get(r['i'], [])) if is_last else ''
                    if um:
                        self.add('source-date-missing', 'low', um[0][0], um[0][1].name, um[0][2]['id'],
                                 f'tome date line «{r["t"][:60]}» is plain text in _original (no # heading)', ev)
                    elif ds and not (days(ds[0]) - 31 <= days(d) <= days(ds[-1]) + 31):
                        self.add('source-date-missing', 'info', c, None, None,
                                 f'tome date line «{r["t"][:60]}» ({d}) lies outside {c}\'s dates ({ds[0]}…{ds[-1]}): a recap, note or quoted date?', ev)
                    else:
                        self.add('source-date-missing', 'high' if len(under_txt) > 40 else 'medium', c, None, None,
                                 f'tome date line «{r["t"][:60]}» ({d}) has no _original entry heading'
                                 + (f'; text under it: «{under_txt[:80]}»' if under_txt else '; no text under it'), ev)
                    continue
                if not is_last:
                    continue
                # position: the tome's text under D sits in the entry for D?
                files = collections.Counter(file_of[k].name for k in aligned.get(r['i'], []) if k in file_of)
                heading_files = {x[1].name for x in hits}
                if files:
                    top, n = files.most_common(1)[0]
                    other = next(e for e in file_of.values() if e.name == top)
                    # only where the tome has the other entry's own date lines (else the tome lost a date line)
                    other_dated = [x for x in other.dates if x in src_by_date]
                    if top not in heading_files and n >= 2 and other_dated:
                        c2, e2, cl2, _ = hits[0]
                        self.add('heading-position', 'medium' if RE_WD_START.match(r['t']) else 'low', c2, e2.name, cl2['id'],
                                 f'tome text under «{r["t"][:50]}» ({n} ¶) sits in {top}, not in {e2.name}', ev)
                # stub although the tome has text under the date
                under_txt = ' '.join(under.get(r['i'], []))
                if RE_GARBLED_DATE.match(under_txt):
                    under_txt = ''  # the next day's date line, too garbled to parse: the text is that day's
                for c2, e2, cl2, _ in hits:
                    stub_only = any(cl['text'] for cl in e2.clusters) and all(RE_STUB.match(x) for cl in e2.clusters for x in cl['text'])
                    if stub_only and len(e2.dates) == 1 and len(under_txt) >= 15:
                        self.add('stub-but-source-has-text', 'high' if len(under_txt) > 40 else 'medium', c2, e2.name, cl2['id'],
                                 f'«[Aucun texte…]» stub, but the tome has under «{r["t"][:40]}»: «{under_txt[:100]}»', ev)

            self.pair_date_lines(t, sorted({r['i'] for r, _, _ in src}), file_of)

    def pair_date_lines(self, t: int, src_rows: list[int], file_of: dict):
        """An _original heading missing from the tome and a tome date line missing from _original at the same
        place are one finding: the two read differently («Dimanche 8 août 1883» in the tome, «Dimanche
        8 avril 1883» in _original) — a misprint, an OCR slip, or a wrong heading."""
        sdm = {f['evidence']['docx']: f for f in self.findings if f['category'] == 'source-date-missing'
               and (f['severity'] in ('high', 'medium') or 'lies outside' in f['message']) and f.get('evidence', {}).get('tome') == t}
        drop = set()
        for f in [f for f in self.findings if f['category'] == 'heading-not-in-source' and f['severity'] == 'medium']:
            if self.tome_of.get(f['carnet']) != t:
                continue
            e = next((x for x in file_of.values() if x.name == f['file'] and x.carnet == f['carnet']), None)
            ids = [cl['id'] for cl in e.clusters] if e else []
            k = ids.index(f['pid']) if f['pid'] in ids else 0
            p = next((self.anchor[i] for i in ids[k:] if i in self.anchor), None)
            if p is None or p // 100000 != t:
                continue
            j = bisect.bisect_left(src_rows, p % 100000) - 1
            g = sdm.get(src_rows[j]) if j >= 0 else None
            if g is None or id(g) in drop:
                continue
            drop |= {id(f), id(g)}
            line = f['message'].split('»')[0].lstrip('«')
            self.add('heading-differs-from-source', 'medium', f['carnet'], f['file'], f['pid'],
                     f'_original «{line}», the tome at the same place: {g["message"].split(" has no")[0].replace("tome date line ", "")}',
                     g['evidence'])
        self.findings = [f for f in self.findings if id(f) not in drop]

    def date_in_text(self, T, d: str, carnets: set) -> tuple[int, bool] | None:
        """a tome paragraph holding the date «D month»: (¶, True) for a short line (a date line the OCR garbled:
        «Lundi 25 août1873», «Dimancher 1er février 1880»), (¶, False) for one that starts a text paragraph"""
        m, dd = int(d[5:7]), int(d[8:])
        mon = norm(MONTH_NAME[m])
        day = '(?:1 ?er|1)' if dd == 1 else str(dd)
        short = re.compile(rf'(?<!\d){day} ?{mon}')
        start = re.compile(rf'^(?:\w+ )?{day} ?{mon}\b')
        a, b = T.body
        found = None
        for r in T.rows[a:b]:
            if r['cls'] in ('text', 'head', 'furniture') and T.seg.get(r['i']) in carnets:
                n = norm(r['t'])
                if len(r['t']) < 100 and short.search(n):
                    return r['i'], True
                if found is None and start.search(n):
                    found = (r['i'], False)
        return found

    # 4 — order, boundaries, continuity, IDs
    def order(self):
        S = self.S
        for c in self.carnets:
            ents = self.E[c]
            clusters = [cl for e in ents for cl in e.clusters]
            # IDs
            ids = [cl['id'] for cl in clusters]
            bad = [(k, i) for k, i in enumerate(ids) if i != f'{c}.{k + 1:04d}']
            if bad:
                k, i = bad[0]
                self.add('pid-sequence', 'high', c, clusters[k]['file'], i,
                         f'{len(bad)} ID(s) out of sequence in file order; first: position {k + 1} holds {i}')
            for e in ents:
                if not e.clusters:
                    continue
                ps, pe = e.fm.get('para_start'), e.fm.get('para_end')
                a, b = int(e.clusters[0]['id'][4:]), int(e.clusters[-1]['id'][4:])
                if ps is not None and pe is not None and (int(ps), int(pe)) != (a, b):
                    self.add('para-range', 'low', c, e.name, e.clusters[0]['id'], f'para_start/para_end {ps}–{pe} ≠ actual {a}–{b}')
            # calendar order of headings along the paragraphs
            last = None
            for e in ents:
                for cl in e.clusters:
                    for l in cl['heads']:
                        for h in heading_dates(l, e.date)[:1]:
                            if last and h['date'] < last[0]:
                                self.add('calendar-inversion', 'info', c, e.name, cl['id'], f'{h["date"]} follows {last[0]} ({last[1]})')
                            last = (h['date'], cl['id'])
            # source order: paragraphs off the longest increasing run of tome positions
            seq = [(cl, self.anchor[cl['id']]) for cl in clusters if cl['id'] in self.anchor]
            keep = lis([p for _, p in seq])
            run = []
            for k, (cl, p) in enumerate(seq):
                if k not in keep:
                    run.append((cl, p))
                if run and (k in keep or k == len(seq) - 1):
                    cl0, p0 = run[0]
                    self.add('order-out-of-source', 'medium', c, cl0['file'], cl0['id'],
                             f'{len(run)} paragraph(s) {cl0["id"]}–{run[-1][0]["id"]} out of tome order: at {evs(S.ev(p0))} «{S.excerpt(p0, 50)}»',
                             S.ev(p0))
                    run = []
            # Livre boundaries
            t = self.tome_of.get(c)
            T = self.tomes.get(t)
            if T:
                run = []
                for k, (cl, p) in enumerate(seq + [(None, None)]):
                    sc = None
                    if cl is not None and p // 100000 == t:
                        sc = T.seg.get(p % 100000)
                    if cl is not None and sc and sc != c:
                        if run and run[-1][2] != sc:
                            self._boundary(c, run)
                            run = []
                        run.append((cl, p, sc))
                    elif run:
                        self._boundary(c, run)
                        run = []
        # continuity between consecutive carnets
        for c in self.carnets:
            c2 = f'{int(c) + 1:03d}'
            if c2 not in self.E or c == '000':
                continue
            last = self._dated(self.E[c], -1)
            first = self._dated(self.E[c2], 0)
            if last and first and first[0] < last[0]:
                self.add('carnet-continuity', 'medium', c2, first[1], first[2], f'{c2} starts on {first[0]}, before {c} ends ({last[0]}, {last[1]})')
            cl_last = [cl for e in self.E[c] for cl in e.clusters if cl['id'] in self.anchor]
            cl_first = [cl for e in self.E[c2] for cl in e.clusters if cl['id'] in self.anchor]
            if cl_last and cl_first:
                pl, pf = self.anchor[cl_last[-1]['id']], self.anchor[cl_first[0]['id']]
                if pf < pl and self.tome_of.get(c) == self.tome_of.get(c2):
                    self.add('carnet-continuity', 'medium', c2, cl_first[0]['file'], cl_first[0]['id'],
                             f'{c2} opens at {evs(S.ev(pf))}, before {c} ends at {evs(S.ev(pl))} ({cl_last[-1]["id"]})', S.ev(pf))

    def _boundary(self, c, run):
        S = self.S
        cl0, p0, sc = run[0]
        self.add('carnet-boundary', 'medium' if len(run) > 1 else 'low', c, cl0['file'], cl0['id'],
                 f'{len(run)} paragraph(s) {cl0["id"]}–{run[-1][0]["id"]} lie under «Livre {int(sc)}» in the tome', S.ev(p0))

    def _dated(self, ents, k):
        ds = [(h['date'], e.name, cl['id']) for e in ents for cl in e.clusters for l in cl['heads'] for h in heading_dates(l, e.date)[:1]]
        return ds[k] if ds else None

    # 5 — duplicates
    def duplicates(self):
        S = self.S
        lines = []
        for c in self.carnets:
            for e in self.E[c]:
                for cl in e.clusters:
                    for t in cl['text']:
                        n = norm(t)
                        if len(n) >= 60:
                            lines.append((c, e.name, cl['id'], t, n))
        exact = collections.defaultdict(list)
        for k, x in enumerate(lines):
            exact[x[4]].append(k)
        pairs = set()
        for ks in exact.values():
            for a in ks[1:]:
                pairs.add((ks[0], a, 1.0))
        inv = collections.defaultdict(list)
        sh = []
        for k, x in enumerate(lines):
            s = set(shingles(x[4].split()))
            sh.append(s)
            for g in s:
                inv[g].append(k)
        done = {(a, b) for a, b, _ in pairs}
        for k, s in enumerate(sh):
            cnt = collections.Counter()
            for g in s:
                L = inv[g]
                if len(L) > 25:
                    continue
                for j in L:
                    if j > k:
                        cnt[j] += 1
            for j, n in cnt.items():
                m = min(len(s), len(sh[j]))
                if m and n / m >= 0.8 and (k, j) not in done and lines[k][4] != lines[j][4]:
                    pairs.add((k, j, round(n / m, 2)))
        for a, b, sim in sorted(pairs):
            A, B = lines[a], lines[b]
            # does the tome repeat it too?
            _, votes = S.hits(A[4].split())
            nsh = max(1, len(A[4].split()) - N + 1)
            rows = sorted(p for p, n in votes.items() if n >= 0.6 * nsh)
            distinct = [p for k, p in enumerate(rows) if k == 0 or p - rows[k - 1] > 3]
            where = f'{B[0]}/{B[1]} {B[2]}'
            if len(distinct) >= 2:
                self.add('duplicate-in-source', 'info', A[0], A[1], A[2],
                         f'also at {where} ({sim:.0%}); the tome has it {len(distinct)}×: «{A[3][:80]}»', S.ev(distinct[0]))
            else:
                sev = 'high' if sim == 1.0 else 'medium'
                self.add('duplicate', sev, A[0], A[1], A[2], f'{"identical" if sim == 1.0 else f"{sim:.0%} similar"} to {where}: «{A[3][:90]}»',
                         S.ev(distinct[0]) if distinct else None, other=where)

    def run(self):
        log('reverse completeness')
        self.reverse()
        log('entries')
        self.entries()
        log('headings vs source')
        self.headings_vs_source()
        log('order')
        self.order()
        log('duplicates')
        self.duplicates()
        self.findings.sort(key=lambda f: (f['carnet'], f['file'] or '', f['pid'] or '', SEV_ORDER[f['severity']], f['category']))


def lis(seq: list[int]) -> set[int]:
    """indices of one longest non-decreasing subsequence"""
    tails, tails_i, prev = [], [], [-1] * len(seq)
    for i, x in enumerate(seq):
        j = bisect.bisect_right(tails, x)
        if j == len(tails):
            tails.append(x)
            tails_i.append(i)
        else:
            tails[j] = x
            tails_i[j] = i
        prev[i] = tails_i[j - 1] if j else -1
    out, i = set(), tails_i[-1] if tails_i else -1
    while i >= 0:
        out.add(i)
        i = prev[i]
    return out


# --- report ---------------------------------------------------------------------------------

def report(A: Audit, secs: float) -> str:
    F = A.findings
    cats = collections.Counter(f['category'] for f in F)
    L = [f'# Rebuild audit — {TODAY}', '',
         f'`just rebuild-audit {" ".join(A.args)}`'.replace('  ', ' ') + f' — {len(A.carnets)} carnets '
         f'({A.carnets[0]}–{A.carnets[-1]}), {len(F)} findings, {secs:.0f} s. Script: `src/scripts/rebuild_audit.py` (categories in its docstring).', '',
         'Evidence: `tomeNN ¶i` = docx paragraph index of content/_raw/tomeNN.docx; `p.X` = printed page of «Mon Journal» (scans, tomes 6–16).', '',
         '## Counts per category', '', '| category | high | medium | low | info | total |', '|---|---|---|---|---|---|']
    for cat in sorted(cats, key=lambda k: (-sum(1 for f in F if f['category'] == k and f['severity'] in ('high', 'medium')), k)):
        s = collections.Counter(f['severity'] for f in F if f['category'] == cat)
        L.append(f'| {cat} | {s["high"]} | {s["medium"]} | {s["low"]} | {s["info"]} | {cats[cat]} |')
    L += ['', '## Counts per carnet', '', '| carnet | high | medium | low | info | high + medium by category |', '|---|---|---|---|---|---|']
    for c in A.carnets:
        fs = [f for f in F if f['carnet'] == c]
        if not fs:
            continue
        s = collections.Counter(f['severity'] for f in fs)
        hm = collections.Counter(f['category'] for f in fs if f['severity'] in ('high', 'medium'))
        L.append(f'| {c} | {s["high"]} | {s["medium"]} | {s["low"]} | {s["info"]} | ' + ', '.join(f'{k} {n}' for k, n in hm.most_common()) + ' |')
    L += ['', '## Findings', '']
    for cat in sorted(cats, key=lambda k: min(SEV_ORDER[f['severity']] for f in F if f['category'] == k)):
        fs = sorted((f for f in F if f['category'] == cat), key=lambda f: (SEV_ORDER[f['severity']], f['carnet'], f['file'] or '', f['pid'] or ''))
        L += [f'### {cat} ({len(fs)})', '']
        cap = 300
        for f in fs[:cap]:
            loc = '/'.join(x for x in (f['carnet'], f['file']) if x) + (f' {f["pid"]}' if f['pid'] else '')
            ev = evs(f.get('evidence') or {})
            L.append(f'- [{f["severity"]}] **{loc}** — {f["message"]}' + (f' — {ev}' if ev else ''))
        if len(fs) > cap:
            L.append(f'- … {len(fs) - cap} more in the JSON')
        L.append('')
    return '\n'.join(L)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('carnets', nargs='*', help='carnets or ranges (068, 001-074); default all')
    ap.add_argument('--json', help='findings JSON path')
    ap.add_argument('--report', help='markdown report path')
    args = ap.parse_args()
    t0 = datetime.datetime.now()
    A = Audit(parse_carnets(args.carnets))
    A.args = args.carnets
    A.run()
    secs = (datetime.datetime.now() - t0).total_seconds()
    jp = Path(args.json) if args.json else ROOT / '.cache' / 'rebuild-audit' / f'rebuild-audit-{TODAY}.json'
    rp = Path(args.report) if args.report else ROOT / '.claude' / 'reports' / f'rebuild-audit-{TODAY}.md'
    jp.parent.mkdir(parents=True, exist_ok=True)
    jp.write_text(json.dumps({'date': TODAY, 'carnets': A.carnets, 'findings': A.findings}, ensure_ascii=False, indent=1))
    rp.write_text(report(A, secs))
    cats = collections.Counter((f['category'], f['severity']) for f in A.findings)
    for (cat, sev), n in sorted(cats.items(), key=lambda x: (x[0][0], SEV_ORDER[x[0][1]])):
        print(f'{cat:28} {sev:7} {n}')
    print(f'{len(A.findings)} findings in {secs:.0f} s\nreport: {rp}\njson:   {jp}')


if __name__ == '__main__':
    main()

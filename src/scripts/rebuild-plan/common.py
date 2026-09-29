"""Shared helpers for the rebuild-plan drafting tools: paths, the tome/carnet
table, cached docx dumps, _original cluster loading, text normalisation and
French date headings.

Run the tools through `just` (uv provides python-docx / pymupdf / numpy):
  just rebuild-draft-plan 068
  just source-completeness
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / 'content'
RAW = CONTENT / '_raw'
SCANS = RAW / 'scans'
CACHE = ROOT / '.cache' / 'rebuild-plan'
TREES = ['cz', 'uk', 'en', 'fr', 'es']


def tome_carnets() -> dict[int, list[str]]:
    """tome number -> carnet ids, from content/_original/_carnets/carnet-mapping.json"""
    books = json.loads((CONTENT / '_original' / '_carnets' / 'carnet-mapping.json').read_text())['books']
    return {int(k): v['carnets'] for k, v in books.items() if int(k) > 0}


def tome_of(carnet: str) -> int:
    for t, cs in tome_carnets().items():
        if carnet in cs:
            return t
    raise SystemExit(f'carnet {carnet} is in no tome (carnet-mapping.json)')


def docx_path(tome: int) -> Path:
    return RAW / f'tome{tome:02d}.docx'


def pdf_path(tome: int) -> Path | None:
    p = SCANS / f'Tome{tome}.pdf'
    return p if p.exists() else None


CACHE_VERSION = 2  # bump when a cached format or its derivation changes


def _cache_file(name: str, src: Path) -> Path:
    st = src.stat()
    key = hashlib.sha1(f'{src}:{st.st_size}:{st.st_mtime_ns}:{CACHE_VERSION}'.encode()).hexdigest()[:10]
    CACHE.mkdir(parents=True, exist_ok=True)
    return CACHE / f'{name}.{key}.json'


def dump_docx(tome: int) -> list[dict]:
    """Every docx paragraph: index i (0-based = "docx ¶"), text, style, italic runs, picture flag. Cached."""
    src = docx_path(tome)
    cf = _cache_file(f'tome{tome:02d}.docx', src)
    if cf.exists():
        return json.loads(cf.read_text())
    import docx  # python-docx

    d = docx.Document(str(src))
    out = []
    for i, p in enumerate(d.paragraphs):
        runs = [[r.text, bool(r.italic)] for r in p.runs]
        pic = bool(p._p.xpath('.//w:drawing') or p._p.xpath('.//w:pict'))
        out.append({'i': i, 't': p.text, 's': p.style.name if p.style is not None else '', 'runs': runs, 'pic': pic})
    cf.write_text(json.dumps(out, ensure_ascii=False))
    return out


# --- text ---------------------------------------------------------------------------

LIG = str.maketrans({'œ': 'oe', 'Œ': 'oe', 'æ': 'ae', 'Æ': 'ae', '’': "'", 'ß': 'ss'})


def norm(s: str) -> str:
    """lowercase, no accents, no punctuation; OCR-split digits rejoined; footnote refs dropped"""
    s = re.sub(r'\[\^[^\]]*\]', '', s).translate(LIG)
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    s = re.sub(r'(?<=\d) (?=\d)', '', s)
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def grams(s: str, n: int = 4) -> set:
    w = s.split()
    return {tuple(w[i:i + n]) for i in range(len(w) - n + 1)}


def para_text(p: dict) -> str:
    """docx paragraph as _original markdown: italic runs as *…*, the minimal OCR repairs _original uses."""
    segs: list[list] = []
    for t, it in p.get('runs') or []:
        if segs and segs[-1][1] == it:
            segs[-1][0] += t
        else:
            segs.append([t, it])
    out = ''
    for t, it in segs:
        if it and t.strip():
            lead = t[:len(t) - len(t.lstrip())]
            trail = t[len(t.rstrip()):]
            out += lead + '*' + t.strip() + '*' + trail
        else:
            out += t
    if not segs:
        out = p['t']
    s = re.sub(r'\*\s*\*', '', out.strip())
    s = re.sub(r'(?<=\s)II!!', '!!!!', s)
    s = re.sub(r'(?<=\s)II!', '!!!', s)
    s = re.sub(r'(?<=\s)I!', '!!', s)
    s = re.sub(r'(?<=\s)II$', '!!', s)
    s = re.sub(r'\b1 ?8 ?(\d) ?(\d)\b', r'18\1\2', s)
    return s


OCR_SUSPECT = [
    (r'\b[a-zà-ÿ]+\d+[a-zà-ÿ]*\b|\b\d+[a-zà-ÿ]{2,}\b', 'letters and digits mixed'),
    (r'[•■□▪¤§¶©®]', 'stray symbol'),
    (r'\b[a-zà-ÿ]{2,}[A-Z][a-zà-ÿ]+\b', 'capital inside a word'),
    (r'(?:^|\s)[‘’\'",.;:]{2,}', 'punctuation cluster'),
    (r'\b(?:II|Il|I1|l1)!', 'OCR exclamation'),
    (r'\b\d \d{2,}\b', 'split number'),
]


def ocr_flags(s: str) -> list[str]:
    return sorted({why for rx, why in OCR_SUSPECT if re.search(rx, s)})


# --- French date headings ----------------------------------------------------------------

WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
MONTHS = {'janvier': 1, 'fevrier': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6, 'juillet': 7,
          'aout': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'decembre': 12}
MONTH_NAME = {1: 'janvier', 2: 'février', 3: 'mars', 4: 'avril', 5: 'mai', 6: 'juin', 7: 'juillet',
              8: 'août', 9: 'septembre', 10: 'octobre', 11: 'novembre', 12: 'décembre'}
_MON = r'janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre'
_DAY = r'[1Il]\s?er|Ier|\d(?:\s?\d)?'   # OCR splits two-digit days: «1 3 janvier»
_YEAR = r'[1Iîl]\s*8\s*[678]\s*\d'
RE_HEAD = re.compile(
    rf'^\s*(?:\(?suite\)?\s*)?(?:(?P<wd>lundi|mardi|mercredi|jeudi|jeud|vendredi|samedi|dimanche)\b[\s,.]*)?'
    rf'(?P<day>{_DAY})(?:\s*,\s*(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d\d?)?\s*(?P<mon>{_MON})(?![a-zà-ÿ])[\s,.]*(?P<yr>{_YEAR})?', re.I)
# («août1873»: no \b after the month, a year may follow without a space; «Mercredi 26, jeudi 27 novembre»: the first day counts)
# the Julian date Marie often adds: «(22 août)», «/ 1er janvier 1877», «Ier janvier 1877»
RE_JULIAN = re.compile(rf'^\s*[/(]?\s*(?P<day>{_DAY})\s*(?P<mon>{_MON})(?![a-zà-ÿ])[\s,.]*(?P<yr>{_YEAR})?\s*\)?', re.I)
RE_YEAR_ONLY = re.compile(rf'^\s*{_YEAR}\s*$')


def _day(raw: str) -> int:
    raw = raw.replace(' ', '')
    return 1 if re.fullmatch(r'[1Il]er|Ier', raw, re.I) else int(re.sub(r'\D', '', raw) or 0)


def _mon(raw: str) -> int:
    k = unicodedata.normalize('NFKD', raw.lower())
    return MONTHS[''.join(ch for ch in k if not unicodedata.combining(ch)).replace('û', 'u')]


def _year(raw: str) -> int:
    return int(re.sub(r'\D', '', raw.translate(str.maketrans('IîÎl', '1111'))))


def parse_heading(text: str, prev: tuple[int, int, int] | None) -> dict | None:
    """A diary date line: {'date', 'ymd', 'heading' (canonical), 'rest' (text after the date), 'guessed'}.
    Without a weekday only short lines count («1 Janvier 1 877»)."""
    t = text.strip()
    if len(t) > 160:
        return None
    m = RE_HEAD.match(t)
    if not m:
        return None
    if not m.group('wd') and len(t) > 60:
        return None
    guessed = []
    day = _day(m.group('day'))
    if not 1 <= day <= 31:
        return None
    mon = _mon(m.group('mon'))
    rest = t[m.end():]
    julian = ''
    jm = RE_JULIAN.match(rest)
    yr = _year(m.group('yr')) if m.group('yr') else None
    if jm:
        jday, jmon = _day(jm.group('day')), _mon(jm.group('mon'))
        jyr = _year(jm.group('yr')) if jm.group('yr') else None
        if yr is None and jyr:
            yr = jyr
        julian = f"{'1er' if jday == 1 else jday} {MONTH_NAME[jmon]}" + (f' {jyr}' if jyr and jyr != yr else '')
        rest = rest[jm.end():]
    if yr is None:
        if not prev:
            return None
        yr = prev[0] + (1 if mon < prev[1] - 6 else 0)
        guessed.append('year')
    rest = rest.lstrip(' .,').rstrip()
    try:
        wd_real = WEEKDAYS[datetime.date(yr, mon, day).weekday()]
    except ValueError:
        return None
    wd = (m.group('wd') or '').lower()
    wd = 'jeudi' if wd == 'jeud' else wd
    if not wd:
        wd = wd_real
        guessed.append('weekday')
    elif wd != wd_real:
        guessed.append(f'weekday ({wd} written, {wd_real} by the calendar)')
    dstr = '1er' if day == 1 else str(day)
    heading = f'{wd.capitalize()} {dstr} {MONTH_NAME[mon]} {yr}' + (f' ({julian})' if julian else '')
    return {'date': f'{yr}-{mon:02d}-{day:02d}', 'ymd': (yr, mon, day), 'heading': heading, 'rest': rest, 'guessed': guessed}


RE_LIVRE = re.compile(r'^\s*(?:livre|carnet|cahier)\s*(?:n°)?\s*([0-9IOlQDî ]{1,4})', re.I)  # OCR: O/o/Q/D for 0, I/l/î for 1 («Livre 4Qème»)


def livre_number(text: str) -> int | None:
    """Number of a notebook title line: «Livre 68ème», «[Livre] 1 03», «[Cahier n°] 102», «[Livre 1 06]».
    The title may be preceded by Marie's motto on its own line («Gloriae Cupiditas\n[Livre] 101»),
    so the first three lines of the paragraph are tried."""
    if len(text) > 250:
        return None
    for line in text.split('\n')[:3]:
        m = RE_LIVRE.match(line.replace('[', '').replace(']', ''))
        # a «Carnet N° 3 Mon journal commencé le …» title may run long; a bare «Livre 3 …» may not
        if not m or len(line) > (200 if re.match(r'\s*\[?\s*(carnet|cahier|livre)\s*\]?\s*n°', line, re.I) else 80):
            continue
        num = m.group(1).replace(' ', '').translate(str.maketrans('OoQqDdIiLlî', '00000011111'))
        if num.isdigit() and 0 < int(num) < 107:
            return int(num)
    return None


# --- _original ------------------------------------------------------------------------------

RE_ID = re.compile(r'^%%\s*(\d{3}\.\d{4})\s*%%\s*$')


def visible_lines(lines: list[str]) -> list[str]:
    """Reader-visible lines of a cluster: comments, footnote definitions and [//] lines removed."""
    out = []
    inblock = False
    indef = False
    for line in lines:
        l = line
        if re.match(r'^\s*\[\^[^\]]+\]:', line):
            indef = True
            continue
        if indef and re.match(r'^[ \t]+\S', line):
            continue
        indef = False
        if inblock:
            if '%%' in l:
                l = l.split('%%', 1)[1]
                inblock = False
            else:
                continue
        l = re.sub(r'%%.*?%%', '', l)
        if '%%' in l:
            l = l.split('%%', 1)[0]
            inblock = True
        if l.strip().startswith('[//]:'):
            continue
        if l.strip():
            out.append(l.strip())
    return out


def load_carnet(tree: str, carnet: str) -> list[dict]:
    """Clusters of content/<tree>/<carnet> in file order: id, file, lines (raw), vis (visible lines)."""
    d = CONTENT / tree / carnet
    if not d.is_dir():
        return []
    files = sorted((f for f in d.iterdir() if re.match(r'\d{4}-\d{2}-\d{2}.*\.md$', f.name)), key=lambda f: entry_order_key(f.name))
    out = []
    for f in files:
        s = f.read_text(encoding='utf-8')
        m = re.match(r'---\n.*?\n---\n', s, re.S)
        body = s[m.end():] if m else s
        cur = None
        for line in body.split('\n'):
            mm = RE_ID.match(line)
            if mm:
                cur = {'id': mm.group(1), 'file': f.name, 'lines': []}
                out.append(cur)
                continue
            if cur is not None:
                cur['lines'].append(line)
    for c in out:
        c['vis'] = visible_lines(c['lines'])
    return out


def entry_order_key(name: str):
    """Same reading order as entryOrder() in src/scripts/lib/rebuild-carnet-core.ts."""
    x = name[:-3] if name.endswith('.md') else name
    return (x[:10], 0 if x.endswith('-cover') else 1, x)

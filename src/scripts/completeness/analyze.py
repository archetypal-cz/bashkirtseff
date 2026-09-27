"""Source completeness: tome docx paragraphs vs content/_original visible text."""
import json, re, unicodedata, sys, os, glob, collections

from paths import ORIGINAL, work
ROOT = str(ORIGINAL)
N = 5  # shingle size (words)

LIG = str.maketrans({'œ': 'oe', 'Œ': 'oe', 'æ': 'ae', 'Æ': 'ae', '’': "'", 'ß': 'ss'})

def norm_words(s):
    s = s.translate(LIG)
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    s = re.sub(r'(?<=\d) (?=\d)', '', s)  # OCR '1 876'
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return s.split()

def shingles(ws, n=N):
    if len(ws) < n:
        return [' '.join(ws)] if ws else []
    return [' '.join(ws[i:i + n]) for i in range(len(ws) - n + 1)]

# ---------------- _original ----------------
RE_SPAN = re.compile(r'%%.*?%%', re.S)
RE_PID = re.compile(r'%%\s*(\d{3})\.(\d{4})\s*%%')

def parse_original():
    paras = []  # (carnet, file, pid, text)
    for d in sorted(glob.glob(ROOT + '/[01][0-9][0-9]')):
        c = os.path.basename(d)
        for f in sorted(glob.glob(d + '/*.md')):
            if os.path.basename(f) == 'README.md':
                continue
            raw = open(f, encoding='utf-8').read()
            # frontmatter
            if raw.startswith('---'):
                m = re.match(r'---\n.*?\n---\n', raw, re.S)
                if m:
                    raw = raw[m.end():]
            pid = None
            buf = []
            # split keeping pid markers
            pos = 0
            tokens = []
            for m in RE_PID.finditer(raw):
                tokens.append((raw[pos:m.start()], pid))
                pid = m.group(1) + '.' + m.group(2)
                pos = m.end()
            tokens.append((raw[pos:], pid))
            for chunk, p in tokens:
                chunk = RE_SPAN.sub('\n', chunk)
                lines = []
                for ln in chunk.split('\n'):
                    s = ln.strip()
                    if not s:
                        continue
                    if s.startswith('#'):
                        continue
                    if s.startswith('[//]: #'):
                        continue
                    if re.match(r'^\[\^[^\]]+\]:', s):
                        continue
                    s = re.sub(r'\[\^[^\]]+\]', '', s)
                    lines.append(s)
                if lines:
                    paras.append((c, os.path.basename(f)[:-3], p, ' '.join(lines)))
    return paras

# ---------------- tomes ----------------
RE_DATEHEAD = re.compile(r'^\s*(\(?suite\)?\s*)?(lundi|mardi|mercredi|jeudi|jeud|vendredi|samedi|dimanche)\b', re.I)
RE_DATEHEAD2 = re.compile(r'^\s*\d{1,2}\s*(er)?\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\b', re.I)
RE_LIVRE = re.compile(r'^\s*(livre|carnet|cahier)\b', re.I)
SKIP_STYLES = {'Header or footer', 'Table of contents', 'Picture caption'}

def classify_tome_para(p):
    t = p['t'].strip()
    if not t:
        return 'empty'
    if p['s'] in SKIP_STYLES:
        return 'furniture'
    if re.fullmatch(r'[\d\s\-–—.*]+', t):
        return 'furniture'
    if len(t) < 120 and (RE_DATEHEAD.match(t) or RE_DATEHEAD2.match(t)) and re.search(r'\d', t):
        return 'head'
    if len(t) < 200 and RE_LIVRE.match(t):
        return 'livre'
    return 'text'

def main():
    orig = parse_original()
    print('orig paras', len(orig), file=sys.stderr)
    # index
    idx = {}
    carnet_text = collections.defaultdict(list)
    for k, (c, f, p, t) in enumerate(orig):
        ws = norm_words(t)
        carnet_text[c].append(' '.join(ws))
        for sh in shingles(ws):
            h = hash(sh)
            if h not in idx:
                idx[h] = k
            else:
                v = idx[h]
                if isinstance(v, int):
                    if orig[v][0] != c:
                        idx[h] = (v, k)
    ctext = {c: ' ' + ' | '.join(v) + ' ' for c, v in carnet_text.items()}
    alltext = ' '.join(ctext.values())
    print('index', len(idx), file=sys.stderr)

    T = json.load(open(work('tomes.json')))
    result = {}
    for tn in range(1, 17):
        ps = T[str(tn)]
        rows = []
        for p in ps:
            cls = classify_tome_para(p)
            r = {'i': p['i'], 'cls': cls, 's': p['s'], 'len': len(p['t'].strip()), 'text': p['t'].strip()}
            if cls in ('text', 'head', 'livre'):
                ws = norm_words(p['t'])
                r['nw'] = len(ws)
                shs = shingles(ws)
                hits = 0
                votes = collections.Counter()
                first_loc = None
                last_loc = None
                hitks = []
                for sh in shs:
                    v = idx.get(hash(sh))
                    if v is None:
                        continue
                    hits += 1
                    ks = v if isinstance(v, tuple) else (v,)
                    for k in ks:
                        votes[orig[k][0]] += 1
                    hitks.append(ks)
                cont = hits / len(shs) if shs else 0.0
                if len(ws) < N:
                    # short: exact substring anywhere
                    j = ' '.join(ws)
                    cont = 1.0 if (j and (' ' + j + ' ') in alltext) else 0.0
                r['cont'] = round(cont, 3)
                if votes:
                    r['carnet'] = votes.most_common(1)[0][0]
                    inc = [k for ks in hitks for k in ks if orig[k][0] == r['carnet']]
                    if inc:
                        first_loc, last_loc = inc[0], inc[-1]
                if first_loc is not None:
                    r['loc'] = first_loc
                    r['loc2'] = last_loc
            rows.append(r)
        result[tn] = rows
    json.dump({'orig': orig, 'tomes': result}, open(work('scored.json'), 'w'), ensure_ascii=False)

if __name__ == '__main__':
    main()

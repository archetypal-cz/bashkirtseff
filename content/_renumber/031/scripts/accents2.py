"""(post-rebuild version: anchors = new IDs from final/ plans) Restore accents stripped from _original French (038-044 were extracted accent-less).
Only word tokens that equal the tome05.docx token with its accents/ligatures removed are
replaced, so nothing but diacritics changes. Usage: accents.py ROOT [--write] [carnets...]"""
import sys, re, json, os, unicodedata, difflib, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib5 import T, IDRE
root = sys.argv[1]; write = '--write' in sys.argv
carnets = [a for a in sys.argv[2:] if re.fullmatch(r'\d{3}', a)] or ['%03d' % n for n in range(38, 45)]
P = os.path.dirname(os.path.abspath(__file__))
anchor = {}  # new ID (after the rebuild) -> docx ¶, from the final plans' reading order
for f in glob.glob(P + '/final/plan-0*.json'):
    pl = json.load(open(f)); c = pl['carnet']; k = 0
    for e in pl['entries']:
        for q in e['paragraphs']:
            k += 1
            d = q.get('_docx')
            if isinstance(d, list): d = d[0]
            if d is not None and d != '?': anchor[f'{c}.{k:04d}'] = int(float(d))
def asc(s):
    s = s.replace('œ', 'oe').replace('Œ', 'Oe').replace('æ', 'ae').replace('Æ', 'Ae')
    return ''.join(ch for ch in unicodedata.normalize('NFD', s) if not unicodedata.combining(ch))
WORD = re.compile(r"[^\W\d_]+", re.U)
def fix_line(line, window_toks):
    toks = list(WORD.finditer(line))
    if not toks: return line, 0
    a = [asc(m.group()).lower() for m in toks]; b = [asc(t).lower() for t in window_toks]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    rep = {}
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag != 'equal': continue
        for k in range(i2 - i1):
            o = toks[i1 + k].group(); d = window_toks[j1 + k]
            if o != d and o.isascii() and asc(d) == o: rep[i1 + k] = d
    if not rep: return line, 0
    out = []; last = 0
    for k, m in enumerate(toks):
        if k in rep: out.append(line[last:m.start()]); out.append(rep[k]); last = m.end()
    out.append(line[last:]); return ''.join(out), len(rep)
stats = {}; changed_ids = []
for c in carnets:
    for f in sorted(glob.glob(f'{root}/content/_original/{c}/*.md')):
        if f.endswith('README.md'): continue
        lines = open(f).read().split('\n'); cur = None; n_file = 0; fm = 0; inblk = False; prev_anchor = None
        for i, l in enumerate(lines):
            if i == 0 and l == '---': fm = 1; continue
            if fm == 1:
                if l == '---': fm = 2
                continue
            m = IDRE.match(l)
            if m: cur = m.group(1); continue
            s = l.strip()
            if inblk:
                if '%%' in s: inblk = False
                continue
            if s.startswith('%%'):
                if s.count('%%') == 1: inblk = True
                continue
            if not s or re.match(r'^\[\^[^\]]+\]:', s) or cur is None: continue
            a = anchor.get(cur)
            if a is None:  # unmatched: nearest anchored neighbour in the same carnet
                n = int(cur[4:])
                for d in range(1, 6):
                    a = anchor.get(f'{c}.{n-d:04d}') or anchor.get(f'{c}.{n+d:04d}')
                    if a: break
            if a is None: continue
            win = ' '.join(T[j]['text'] for j in range(max(0, a - 4), min(len(T), a + 8)))
            new, k = fix_line(l, WORD.findall(win))
            if k:
                lines[i] = new; n_file += k; changed_ids.append(cur)
                if os.environ.get("SHOW"): print(cur, "|", l[:150], "\n   =>", new[:150])
        if n_file:
            stats[c] = stats.get(c, 0) + n_file
            if write: open(f, 'w').write('\n'.join(lines))
print(json.dumps(stats), 'paragraphs:', len(set(changed_ids)))
json.dump(sorted(set(changed_ids)), open(P + '/accent_ids_new.json', 'w'))

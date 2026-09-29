"""Helpers for fix_085.py / fix_086.py (worker C). Plan editing by docx ¶ and old IDs."""
import json, re, sys, os, difflib, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tk
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import para_text  # noqa

W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DX = tk.docx('13')
PM = tk.pagemap('13')
NUM = json.load(open(f'{W}/tools/numpr13.json'))
WITHDRAW = 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)'
PLACEHOLDER = re.compile(r"\[(Aucun texte|Pas d'entr|Aucune entr)", re.I)
EMPTY = '[Aucun texte - date seule mentionnée]'
FR_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']


def q(s):
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')


def printed(a, b):
    ps = sorted({x['printed_page'] for x in PM if x.get('docx_para_end') is not None and x.get('printed_page')
                 and x['docx_para_start'] <= b and x['docx_para_end'] >= a})
    if not ps:
        before = [x for x in PM if x.get('docx_para_end') is not None and x.get('printed_page') and x['docx_para_end'] < a]
        return f"p.{before[-1]['printed_page']}" if before else ''
    return f'p.{ps[0]}' if len(ps) == 1 else f'pp.{ps[0]}–{ps[-1]}'


def rsr(a, b=None, note=''):
    b = b or a
    r = f'¶{a}' if a == b else f'¶{a}–{b}'
    return f'Restored from tome13.docx {r}, Mon Journal t.13 {printed(a, b)} (missing from original extraction, 2026-09-28 rebuild).' + (f' {note}' if note else '')


def dtext(i):
    t = q(para_text(DX[i])).strip()
    t = re.sub(r'\s*\n\s*(?=[a-zà-ÿ(«"])', ' ', t)
    if NUM.get(str(i)) == '-' and not t.startswith(('-', '—')):
        t = '- ' + t
    return t


def newpara(a, b=None, joiner=' ', kind=None, source=None, text=None, note=''):
    b = b or a
    if text is None:
        parts = [dtext(i) for i in range(a, b + 1) if DX[i]['t'].strip() and DX[i]['s'] not in ('Header or footer',)]
        text = joiner.join(parts)
    n = {'french': text, 'rsr': rsr(a, b, note)}
    if kind: n['kind'] = kind
    if source: n['source'] = source
    return {'new': n}


class Plan:
    def __init__(self, c):
        self.c = c
        self.p = json.load(open(f'{W}/common/plan-{c}.json'))
        self.p.setdefault('drop', [])
        self.withdrawn = json.load(open(f'{W}/common/withdrawn-{c}.json'))
        self.O = {}
        for cc in {x['old'][:3] for e in self.p['entries'] for x in e['paragraphs'] if 'old' in x} | {c}:
            self.O.update(tk.orig(cc))
        self.log = []
        self.typo_list = []

    # --- lookup
    def entry(self, f):
        f = f if f.endswith('.md') else f + '.md'
        for e in self.p['entries']:
            if e['file'] == f: return e
        raise KeyError(f)

    def where_old(self, i):
        for e in self.p['entries']:
            for k, x in enumerate(e['paragraphs']):
                if x.get('old') == i: return e, k
        return None, None

    def where_new(self, para):
        """new paragraph whose rsr cites ¶para first"""
        for e in self.p['entries']:
            for k, x in enumerate(e['paragraphs']):
                if 'new' in x:
                    m = re.search(r'¶(\d+)', x['new']['rsr'])
                    if m and int(m.group(1)) == para: return e, k
        return None, None

    def old_text(self, i):
        return '\n'.join(self.O[i][1])

    # --- edits
    def take_old(self, i):
        e, k = self.where_old(i)
        if e is None: raise KeyError(i)
        return e['paragraphs'].pop(k)

    def take_new(self, para):
        e, k = self.where_new(para)
        if e is None: raise KeyError(f'new ¶{para}')
        return e['paragraphs'].pop(k)

    def remove_new(self, para, withdraw=False, why=''):
        x = self.take_new(para)
        if withdraw:
            self.withdrawn.append({'french': x['new']['french'], 'rsr': x['new']['rsr']})
        self.log.append(f'removed new ¶{para}: {why}')
        return x

    def drop(self, i, reason):
        self.take_old(i)
        self.p['drop'].append({'id': i, 'reason': reason})
        self.log.append(f'drop {i}: {reason}')

    def put(self, f, x, pos=None, after=None, before=None):
        e = self.entry(f)
        ps = e['paragraphs']
        if after is not None:
            k = next(j for j, y in enumerate(ps) if y.get('old') == after or self._isnew(y, after)) + 1
        elif before is not None:
            k = next(j for j, y in enumerate(ps) if y.get('old') == before or self._isnew(y, before))
        elif pos is not None:
            k = pos if pos >= 0 else len(ps) + 1 + pos
        else:
            k = len(ps)
        ps.insert(k, x)

    @staticmethod
    def _isnew(y, para):
        if 'new' not in y or not isinstance(para, int): return False
        m = re.search(r'¶(\d+)', y['new']['rsr'])
        return bool(m and int(m.group(1)) == para)

    def move_old(self, i, f, **kw):
        x = self.take_old(i)
        self.put(f, x, **kw)
        self.log.append(f'move {i} -> {f}')

    def set_french(self, i, text, why=''):
        e, k = self.where_old(i)
        e['paragraphs'][k]['set_french'] = text
        e['paragraphs'][k].pop('_tiler', None)
        self.log.append(f'set_french {i}: {why}')

    def unset_french(self, i, why=''):
        e, k = self.where_old(i)
        e['paragraphs'][k].pop('set_french', None)
        e['paragraphs'][k].pop('_tiler', None); e['paragraphs'][k].pop('_tiler_para', None)
        self.log.append(f'unset set_french {i}: {why}')

    def kind_old(self, i, kind=None, source=None):
        e, k = self.where_old(i)
        x = e['paragraphs'][k]
        x.pop('kind', None); x.pop('source', None); x.pop('_kind_guess_reason', None)
        if kind: x['kind'] = kind
        if source: x['source'] = source
        self.log.append(f'kind {i}: {kind}')

    def kind_new(self, para, kind=None, source=None):
        e, k = self.where_new(para)
        n = e['paragraphs'][k]['new']
        n.pop('kind', None); n.pop('source', None); e['paragraphs'][k].pop('_kind_guess_reason', None)
        if kind: n['kind'] = kind
        if source: n['source'] = source
        self.log.append(f'kind new ¶{para}: {kind}')

    def edit_new(self, para, fn, why=''):
        e, k = self.where_new(para)
        n = e['paragraphs'][k]['new']
        n['french'] = fn(n['french'])
        self.log.append(f'edit new ¶{para}: {why}')

    def replace_new(self, para, *xs):
        e, k = self.where_new(para)
        e['paragraphs'][k:k + 1] = list(xs)

    def add_entry(self, f, date, heading, paragraphs=(), frontmatter_from=None):
        e = {'file': f, 'date': date, 'heading': heading, 'paragraphs': list(paragraphs)}
        if frontmatter_from: e['frontmatter_from'] = frontmatter_from
        es = self.p['entries']
        k = next((j for j, y in enumerate(es) if y['file'] > f), len(es))
        es.insert(k, e)
        return e

    def remove_entry(self, f):
        e = self.entry(f)
        assert not e['paragraphs'], (f, e['paragraphs'])
        self.p['entries'].remove(e)

    def strip_heading(self, i):
        lines = self.old_text(i).split('\n')
        body = [l for l in lines if not l.startswith('#')]
        self.set_french(i, '\n'.join(body), 'heading of the next day removed: the text belongs to the previous day (docx)')

    def placeholders(self):
        """«[Pas d'entrée…]»-type old clusters: dropped where the day has text, else set to the standard text"""
        for e in self.p['entries']:
            for x in list(e['paragraphs']):
                if 'old' not in x: continue
                t = x.get('set_french', self.old_text(x['old']))
                body = [l for l in t.split('\n') if not l.startswith('#')]
                if len(body) != 1 or not PLACEHOLDER.search(body[0]): continue
                others = [y for y in e['paragraphs'] if y is not x and self._has_text(y)]
                if others:
                    if any(l.startswith('#') for l in t.split('\n')):
                        heads = [l for l in t.split('\n') if l.startswith('#')]
                        self.set_french(x['old'], '\n'.join(heads), 'placeholder text removed (the day has text in the manuscript); heading kept')
                    else:
                        self.drop(x['old'], 'extraction artefact: placeholder for a day that has text in the manuscript (tome13.docx)')
                elif body[0] != EMPTY:
                    heads = [l for l in t.split('\n') if l.startswith('#')]
                    self.set_french(x['old'], '\n'.join(heads + [EMPTY]), 'placeholder normalised: bare date line in the manuscript')

    def _has_text(self, y):
        if 'new' in y:
            return not y['new']['french'].startswith('[Aucun texte')
        t = y.get('set_french', self.old_text(y['old']))
        body = [l for l in t.split('\n') if not l.startswith('#') and l.strip()]
        return bool(body) and not PLACEHOLDER.search(' '.join(body))

    # --- accents: substitute the docx word forms (positionally aligned) into an accentless old cluster
    def restore_accents(self, i, lo=0, hi=10**6):
        lines = self.old_text(i).split('\n')
        def fold(w):
            w = unicodedata.normalize('NFKD', w)
            return ''.join(ch for ch in w if not unicodedata.combining(ch)).lower()
        toks = [(li, m.start(), m.end(), m.group()) for li, l in enumerate(lines) if not l.startswith('#') for m in re.finditer(r'\w+', l)]
        ot = [fold(t[3]) for t in toks]
        if len(ot) < 3: return False
        # candidate docx paragraphs: consecutive run starting where the first trigram matches
        key = ' '.join(ot[:3]); start = None
        for p in DX[lo:hi]:
            if key in ' '.join(fold(m.group()) for m in re.finditer(r'\w+', p['t'])): start = p['i']; break
        if start is None: return False
        dt = []
        for p in DX[start:start + 12]:
            if p['s'] == 'Header or footer': continue
            dt += [m.group() for m in re.finditer(r'\w+', q(p['t']))]
        sm = difflib.SequenceMatcher(None, ot, [fold(w) for w in dt], autojunk=False)
        if sum(b.size for b in sm.get_matching_blocks()) < 0.8 * len(ot): return False
        rep = {}
        for bl in sm.get_matching_blocks():
            for k in range(bl.size):
                ow = toks[bl.a + k][3]; dw = dt[bl.b + k]
                if ow != dw and ow.lower() != dw.lower() and fold(ow) == fold(dw):
                    rep[bl.a + k] = (dw[0].upper() + dw[1:]) if ow[0].isupper() else dw
        if not rep: return False
        out = [list(l) for l in lines]
        for k in sorted(rep, reverse=True):
            li, a0, b0, _ = toks[k]
            out[li][a0:b0] = list(rep[k])
        self.set_french(i, '\n'.join(''.join(l) for l in out), f'accents restored from tome13.docx ¶{start}ff ({len(rep)} words)')
        return True

    # --- bracket labels / struck words the extraction dropped: replace the cluster by its docx paragraph
    LABEL = re.compile(r"\[\s*(Mots? noircis?|Mots? rayés?|Rayé|Mots? cancellés?|Mots? barrés?|En travers|Dans la marge|Ligne|Une ligne|Deux lignes|Trois lignes)", re.I)

    def restore_labels(self, lo, hi):
        def fold(w):
            w = unicodedata.normalize('NFKD', w.replace('œ', 'oe'))
            return ''.join(ch for ch in w if not unicodedata.combining(ch)).lower()
        def words(s):
            return [fold(m.group()) for m in re.finditer(r'\w+', s)]
        units = []  # logical paragraphs: page-break halves joined
        k = lo
        while k < hi:
            p = DX[k]
            if p['s'] == 'Header or footer' or not p['t'].strip(): k += 1; continue
            idx = [k]; j = k + 1
            while True:
                m = j
                while m < hi and (DX[m]['s'] == 'Header or footer' or not DX[m]['t'].strip()): m += 1
                if m == j or m >= hi: break
                prev = DX[idx[-1]]['t'].rstrip()
                nxt = DX[m]['t'].lstrip()
                if nxt[:1].islower() or not re.search(r'[.!?»:"”)\]]\s*(\d{1,3})?$', prev) or re.search(r'\[[^\]]*$', prev):
                    idx.append(m); j = m + 1
                else: break
            units.append(idx); k = idx[-1] + 1
        def utext(idx):
            parts = [re.sub(r'\s\d{1,3}$', '', dtext(i)) if n < len(idx) - 1 else dtext(i) for n, i in enumerate(idx)]
            out = parts[0]
            for nx in parts[1:]:
                if re.search(r'[a-zà-ÿ]-$', out) and nx[:1].islower(): out = out[:-1] + nx
                else: out += ' ' + nx
            return out
        index = {}
        for n, idx in enumerate(units):
            w = words(re.sub(r'\[[^\]]*\]', ' ', ' '.join(DX[i]['t'] for i in idx)))
            for k in range(len(w) - 2): index.setdefault(tuple(w[k:k + 3]), set()).add(n)
        done = []
        for e in self.p['entries']:
            for x in e['paragraphs']:
                if 'old' not in x: continue
                t = x.get('set_french', self.old_text(x['old']))
                lines = t.split('\n')
                heads = [l for l in lines if l.startswith('#')]
                body = ' '.join(l for l in lines if not l.startswith('#'))
                if '[^' in body or len(lines) - len(heads) != 1: continue
                ow = words(re.sub(r'\[[^\]]*\]', ' ', body))
                if len(ow) < 5: continue
                votes = {}
                for k in range(len(ow) - 2):
                    for i in index.get(tuple(ow[k:k + 3]), ()): votes[i] = votes.get(i, 0) + 1
                if not votes: continue
                un = max(votes, key=votes.get)
                pi = units[un][0]
                P = ' '.join(DX[i]['t'] for i in units[un])
                if not self.LABEL.search(P) or self.LABEL.search(body) and len(self.LABEL.findall(body)) >= len(self.LABEL.findall(P)): continue
                pw = words(re.sub(r'\[[^\]]*\]', ' ', P))
                if difflib.SequenceMatcher(None, ow, pw, autojunk=False).ratio() < 0.92: continue
                new = utext(units[un]).replace('\n', ' ')
                if body.lstrip().startswith(('-', '—')) and not new.startswith(('-', '—')):
                    new = body.lstrip()[0] + ' ' + new
                elif body.lstrip().startswith('—') and new.startswith('- '):
                    new = '— ' + new[2:]
                self.set_french(x['old'], '\n'.join(heads + [new]), f'bracket labels / struck words restored from tome13.docx ¶{"–".join(map(str, sorted({units[un][0], units[un][-1]})))}')
                done.append(x['old'])
        return done

    def restore_inline_labels(self, lo, hi):
        """«[content]» in an old cluster whose docx has «[Label: content]» (same content): add the label"""
        def fold(w):
            w = unicodedata.normalize('NFKD', q(w))
            return re.sub(r'\s+', ' ', ''.join(ch for ch in w if not unicodedata.combining(ch)).lower()).strip(' .')
        lab = {}
        for p in DX[lo:hi]:
            for m in re.finditer(r'\[\s*([^\]:;]{3,40}?)\s*[:;]\s*([^\]]+)\]', q(p['t'])):
                if self.LABEL.match('[' + m.group(1)):
                    lab.setdefault(fold(m.group(2)), set()).add((m.group(1).strip(), m.group(2).strip()))
        for e in self.p['entries']:
            for x in e['paragraphs']:
                if 'old' not in x: continue
                t = x.get('set_french', self.old_text(x['old']))
                def sub(m):
                    c = lab.get(fold(m.group(1)))
                    if not c or len(c) != 1: return m.group(0)
                    l, _ = next(iter(c))
                    return f'[{l}: {m.group(1)}]'
                t2 = re.sub(r'\[([^\]:]{2,})\]', sub, t)
                if t2 != t:
                    self.set_french(x['old'], t2, 'inline bracket label restored from the docx')

    def typos(self, fixes, lo, hi):
        """printer's typos (policy KRR 2026-09-28): (wrong, right) applied in new text and set_french, with an RSR note"""
        def page(w):
            for p in DX[lo:hi]:
                if w in q(p['t']): return printed(p['i'], p['i'])
            return '?'
        for wrong, right in fixes:
            hit = False
            for e in self.p['entries']:
                for x in e['paragraphs']:
                    note = f"Printer's typo corrected: «{wrong}» → «{right}» (Mon Journal t.13 {page(wrong)})."
                    if 'new' in x and wrong in x['new']['french']:
                        x['new']['french'] = x['new']['french'].replace(wrong, right)
                        x['new']['rsr'] += ' ' + note; hit = True
                    elif 'old' in x and wrong in x.get('set_french', ''):
                        x['set_french'] = x['set_french'].replace(wrong, right)
                        x['_rsr'] = (x['_rsr'] + ' ' if x.get('_rsr') else '') + note; hit = True
                    else: continue
                    self.log.append(f"typo {x.get('old') or 'new'}: {wrong} -> {right}")
                    self.typo_list.append((x.get('old') or x['new']['rsr'][24:36], wrong, right, page(wrong)))
            assert hit, wrong

    def ocr_hyphens(self):
        for e in self.p['entries']:
            for x in e['paragraphs']:
                if 'new' in x:
                    t = x['new']['french']; t2 = re.sub(r'(?<=[a-zà-ÿ])- (?=[a-zà-ÿA-Z])', '-', t)
                    if t2 != t: x['new']['french'] = t2; self.log.append('ocr hyphen-space joined in new ' + x['new']['rsr'][24:36])

    def join_breaks(self):
        for e in self.p['entries']:
            for x in e['paragraphs']:
                if 'new' not in x or x['new'].get('kind'): continue
                t = x['new']['french']; ls = t.split('\n')
                if len(ls) > 1 and all(l.startswith('*') for l in ls): continue
                t2 = re.sub(r'(?<=[\w,;])\n(?=[\wÀ-ÿ])', ' ', t)
                if t2 != t:
                    x['new']['french'] = t2; self.log.append('page-break line joined in new ' + x['new']['rsr'][26:40])

    def save(self):
        os.makedirs(f'{W}/final', exist_ok=True)
        json.dump(self.p, open(f'{W}/final/plan-{self.c}.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(self.withdrawn, open(f'{W}/final/withdrawn-{self.c}.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(self.typo_list, open(f'{W}/final/typos-{self.c}.json', 'w'), ensure_ascii=False, indent=0)
        open(f'{W}/final/fixlog-{self.c}.txt', 'w').write('\n'.join(self.log) + '\n')
        print(self.c, 'entries', len(self.p['entries']), 'edits', len(self.log))

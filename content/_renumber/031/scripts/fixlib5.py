"""Helpers that turn the drafter's plans (d2/) into reviewed plans (final/) for tome 5 (carnets 031–044).

Adapted from plan-tome0304/fixlib.py. Every operation logs one line (carnet, category, text) so REVIEW.md can
list the decisions. Per-carnet decisions live in fix_CCC.py modules (function `fix(X)`), run by fix5.py.

Identifiers:
  old paragraph = its old ID ('031.0042');
  new paragraph = ('new', N) where N is the first docx ¶ of the draft's `_docx` range (see cview.py output «N [a, b]»).
"""
import copy, json, re, sys
from pathlib import Path

W = Path('/home/coder/rebuild-state/plan-tome05')
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import load_carnet, entry_order_key  # noqa: E402

CARNETS = [f'{c:03d}' for c in range(31, 45)]
T = json.load(open(W / 't05.json'))
ORIG = {c: {x['id']: x for x in load_carnet('_original', c)} for c in CARNETS}
IDENT = {c: json.load(open(W / 'identity' / f'{c}.json')) for c in CARNETS}
LOG = []          # (carnet, category, text)
WITHDRAWN = []    # (carnet, source, text)
QUESTIONS = []    # (carnet, text) — owner questions, conservative default applied
EMPTY = '[Aucun texte - date seule mentionnée]'
REBUILD = '2026-09-28 rebuild'


def log(c, cat, text):
    LOG.append((c, cat, text))


def question(c, text):
    QUESTIONS.append((c, text))


def typo(s: str) -> str:
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')


def dtext(i: int) -> str:
    return typo(T[i]['text'])


def lines(*idx) -> str:
    return '\n'.join(dtext(i) for i in idx)


def vis(oid: str) -> str:
    return '\n'.join(ORIG[oid[:3]][oid]['vis'])


def rsr(a, b=None, extra=''):
    rng = f'¶{a}' if b is None or a == b else f'¶{a}–{b}'
    s = f'Restored from tome05.docx {rng} (missing from original extraction, {REBUILD}).'
    return s + (' ' + extra if extra else '')


def is_heading_only(oid):
    v = ORIG[oid[:3]][oid]['vis']
    return len(v) == 1 and v[0].startswith('# ')


class Plans:
    def __init__(self, src='d2'):
        self.P = {}
        for c in CARNETS:
            self.P[c] = json.load(open(W / src / f'plan-{c}.json'))
            self.P[c].setdefault('drop', [])

    # --- locating -------------------------------------------------------------------------
    def where_old(self, oid):
        for c, p in self.P.items():
            for e in p['entries']:
                for i, q in enumerate(e['paragraphs']):
                    if q.get('old') == oid:
                        return c, e, i
        raise KeyError(oid)

    def item_old(self, oid):
        c, e, i = self.where_old(oid)
        return e['paragraphs'][i]

    def where_new(self, c, docx):
        cs = [c] if c else list(self.P)
        for cc in cs:
            for e in self.P[cc]['entries']:
                for i, q in enumerate(e['paragraphs']):
                    if 'new' in q and q.get('_docx', [None])[0] == docx:
                        return e, i
        raise KeyError(f'{c} new ¶{docx}')

    def entry(self, c, file):
        for e in self.P[c]['entries']:
            if e['file'] == file:
                return e
        return None

    def _index(self, e, ref):
        for i, q in enumerate(e['paragraphs']):
            if isinstance(ref, tuple) and 'new' in q and q.get('_docx', [None])[0] == ref[1]:
                return i
            if q.get('old') == ref:
                return i
        raise KeyError(ref)

    def _pos(self, e, pos):
        where, ref = pos
        if ref == 'start':
            return 0
        if ref == 'end':
            return len(e['paragraphs'])
        return self._index(e, ref) + (1 if where == 'after' else 0)

    # --- new paragraphs -------------------------------------------------------------------
    def drop_new(self, c, docx, why, cat='new-dropped'):
        try:
            e, i = self.where_new(c, docx)
        except KeyError:
            print(f'note: {c} new ¶{docx} already gone ({why})')
            return None
        q = e['paragraphs'].pop(i)
        log(c, cat, f"docx ¶{docx} «{q['new']['french'][:70]}»: {why}")
        return q

    def edit_new(self, c, docx, why=None, **kw):
        """kw: french=, kind=, source=, rsr=, tags= (None removes the key)."""
        e, i = self.where_new(c, docx)
        n = e['paragraphs'][i]['new']
        for k, v in kw.items():
            if v is None:
                n.pop(k, None)
            else:
                n[k] = v
        if why:
            log(c, 'new-edited', f"docx ¶{docx}: {why}")

    def get_new(self, c, docx):
        e, i = self.where_new(c, docx)
        return e['paragraphs'][i]['new']

    def insert_new(self, c, file, pos, french, rsr_note, why, kind=None, source=None, docx=None, tags=None):
        """pos: ('before'|'after', ref) with ref an old ID or ('new', docx), or ('at', 'start'|'end')."""
        e = self.entry(c, file)
        assert e is not None, (c, file)
        n = {'french': french, 'rsr': rsr_note}
        if kind:
            n['kind'] = kind
        if source:
            n['source'] = source
        if tags:
            n['tags'] = tags
        q = {'new': n}
        if docx is not None:
            q['_docx'] = [docx, docx] if isinstance(docx, int) else list(docx)
        e['paragraphs'].insert(self._pos(e, pos), q)
        log(c, 'new-added', f"{file}: «{french[:70]}» — {why}")

    def split_new(self, c, docx, parts, why):
        """Replace a new paragraph by several. parts: list of french strings or (french, docx_first, kind, source)."""
        e, i = self.where_new(c, docx)
        q = e['paragraphs'].pop(i)
        for k, t in enumerate(parts):
            nq = copy.deepcopy(q)
            if isinstance(t, tuple):
                fr, d0 = t[0], t[1]
                nq['new']['french'] = fr
                nq['_docx'] = [d0, d0]
                nq['new']['rsr'] = rsr(d0)
                nq['new'].pop('kind', None); nq['new'].pop('source', None)
                if len(t) > 2 and t[2]:
                    nq['new']['kind'] = t[2]
                if len(t) > 3 and t[3]:
                    nq['new']['source'] = t[3]
            else:
                nq['new']['french'] = t
                if k:
                    nq['_docx'] = [q['_docx'][0] + k / 100, q['_docx'][-1]]
            e['paragraphs'].insert(i + k, nq)
        log(c, 'new-edited', f"docx ¶{docx}: split into {len(parts)} paragraphs — {why}")

    def move_new(self, c, docx, tc, file, pos, why):
        e, i = self.where_new(c, docx)
        q = e['paragraphs'].pop(i)
        tgt = self.entry(tc, file)
        tgt['paragraphs'].insert(self._pos(tgt, pos), q)
        log(c, 'moved', f"new ¶{docx} → {tc}/{file}: {why}")

    # --- old paragraphs -------------------------------------------------------------------
    def sf(self, oid, text, why):
        q = self.item_old(oid)
        q['set_french'] = text
        log(oid[:3], 'set_french', f"{oid}: {why}")

    def unsf(self, oid, why):
        q = self.item_old(oid)
        if q.pop('set_french', None) is not None:
            log(oid[:3], 'set_french-rejected', f"{oid}: {why}")

    def kind(self, oid, kind, why, source=None):
        q = self.item_old(oid)
        if kind is None:
            if q.pop('kind', None):
                q.pop('_kind_guess_reason', None)
                q.pop('source', None)
                log(oid[:3], 'kind-removed', f"{oid}: {why}")
            return
        q['kind'] = kind
        q['_kind_guess_reason'] = why
        if source:
            q['source'] = source
        log(oid[:3], 'kind', f"{oid} → {kind}{' (' + source + ')' if source else ''}: {why}")

    def kind_new(self, c, docx, kind, why, source=None):
        n = self.get_new(c, docx)
        if kind is None:
            n.pop('kind', None); n.pop('source', None)
        else:
            n['kind'] = kind
            if source:
                n['source'] = source
        log(c, 'kind', f"new ¶{docx} → {kind}{' (' + source + ')' if source else ''}: {why}")

    def letter(self, oids, source, why='letter copied into the notebook'):
        """kind letter + `> ` quoting of the old French via set_french."""
        for oid in oids:
            q = self.item_old(oid)
            t = q.get('set_french', vis(oid))
            q['kind'] = 'letter'
            q['source'] = source
            q['_kind_guess_reason'] = why
            q['set_french'] = '\n'.join(l if l.startswith('> ') or not l.strip() else '> ' + l for l in t.split('\n'))
        log(oids[0][:3], 'kind', f"{oids[0]}–{oids[-1][4:]} → letter ({source}), quoted: {why}")

    def drop_old(self, oid, reason, cat='old-dropped'):
        c, e, i = self.where_old(oid)
        e['paragraphs'].pop(i)
        self.P[oid[:3]]['drop'].append({'id': oid, 'reason': reason})
        log(oid[:3], cat, f"{oid} «{vis(oid)[:70]}»: {reason}")

    def undrop(self, oid):
        p = self.P[oid[:3]]
        n = len(p['drop'])
        p['drop'] = [d for d in p['drop'] if d['id'] != oid]
        assert len(p['drop']) == n - 1, oid

    def move_old(self, oid, c, file, pos, why):
        _, e, i = self.where_old(oid)
        q = e['paragraphs'].pop(i)
        tgt = self.entry(c, file)
        assert tgt is not None, (c, file)
        tgt['paragraphs'].insert(self._pos(tgt, pos), q)
        log(oid[:3], 'moved', f"{oid} → {c}/{file}: {why}")

    def replace_new_with_old(self, c, docx, oid, why):
        """The draft took docx ¶docx for new text while oid (placed elsewhere) is that text."""
        _, e0, i0 = self.where_old(oid)
        q = e0['paragraphs'].pop(i0)
        e, i = self.where_new(c, docx)
        e['paragraphs'][i] = q
        log(c, 'moved', f"{oid} replaces new ¶{docx}: {why}")

    # --- entries --------------------------------------------------------------------------
    def rename_entry(self, c, old, new, why, heading=None):
        e = self.entry(c, old)
        e['file'] = new
        e['date'] = new[:10]
        if heading:
            e['heading'] = heading
        self.P[c]['entries'].sort(key=lambda e: entry_order_key(e['file']))
        log(c, 'entry', f"{old} → {new}: {why}")

    def add_entry(self, c, file, heading=None, frontmatter_from=None, why=''):
        e = {'file': file, 'date': file[:10], 'paragraphs': []}
        if heading:
            e['heading'] = heading
        if frontmatter_from:
            e['frontmatter_from'] = frontmatter_from
        self.P[c]['entries'].append(e)
        self.P[c]['entries'].sort(key=lambda e: entry_order_key(e['file']))
        if why:
            log(c, 'entry', f"{file} added: {why}")
        return e

    def remove_entry(self, c, file, why):
        """Remove an entry: its old paragraphs must have been moved/dropped first; its new ones are dropped."""
        e = self.entry(c, file)
        for q in e['paragraphs']:
            assert 'old' not in q, (file, q)
            log(c, 'new-dropped', f"docx ¶{q.get('_docx', ['?'])[0]} «{q['new']['french'][:60]}»: {why}")
        self.P[c]['entries'].remove(e)
        log(c, 'entry', f"{file} removed: {why}")

    def merge_entries(self, c, src, dst, why):
        """Append all paragraphs of entry src to entry dst and remove src."""
        a = self.entry(c, src); b = self.entry(c, dst)
        b['paragraphs'].extend(a['paragraphs'])
        self.P[c]['entries'].remove(a)
        log(c, 'entry', f"{src} merged into {dst}: {why}")

    def split_entry(self, c, file, at, newfile, why, heading=None):
        """Paragraphs from `at` (old ID or ('new', docx)) to the end of entry `file` go to a new entry newfile."""
        e = self.entry(c, file)
        k = self._index(e, at)
        tail = e['paragraphs'][k:]
        e['paragraphs'] = e['paragraphs'][:k]
        ne = self.add_entry(c, newfile, heading=heading)
        ne['paragraphs'] = tail
        log(c, 'entry', f"{file} split at {at}: rest → {newfile}: {why}")
        return ne

    # --- output ---------------------------------------------------------------------------
    def check(self):
        """Every old ID placed or dropped exactly once across all plans."""
        seen = {}
        for c, p in self.P.items():
            for e in p['entries']:
                for q in e['paragraphs']:
                    if 'old' in q:
                        seen[q['old']] = seen.get(q['old'], 0) + 1
            for d in p['drop']:
                seen[d['id']] = seen.get(d['id'], 0) + 1
        errs = [k for k, v in seen.items() if v != 1]
        for c in CARNETS:
            errs += [k for k in ORIG[c] if k not in seen]
        return errs

    def finish(self, out):
        for c, p in self.P.items():
            p['entries'] = [e for e in p['entries'] if e['paragraphs']]
            live = {e['file'] for e in p['entries']}
            oldfiles = {x['file'] for x in ORIG[c].values()}
            for e in p['entries']:
                if 'redirect_from' in e:
                    e['redirect_from'] = [f for f in e['redirect_from'] if f not in live and f in oldfiles]
                    if not e['redirect_from']:
                        del e['redirect_from']
                if e.get('frontmatter_from') and e['frontmatter_from'] not in oldfiles:
                    del e['frontmatter_from']
            p['entries'].sort(key=lambda e: entry_order_key(e['file']))
            p.pop('_draft', None)
            p['_reviewed'] = 'planner-tome05, 2026-09-29: draft reviewed; see REVIEW.md'
        out = Path(out)
        out.mkdir(exist_ok=True, parents=True)
        for c, p in self.P.items():
            json.dump(p, open(out / f'plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(LOG, open(out / 'log.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(WITHDRAWN, open(out / 'withdrawn.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(QUESTIONS, open(out / 'questions.json', 'w'), ensure_ascii=False, indent=1)
        errs = self.check()
        if errs:
            print('PLACEMENT ERRORS:', errs[:40])
        return errs

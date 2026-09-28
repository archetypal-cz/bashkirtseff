"""Helpers that turn the drafter's plans (d3/, d4/) into reviewed plans (final/).

Every operation logs one line (carnet, what, why) so REVIEW.md can list the decisions.
"""
import copy, json, re, sys, unicodedata
from pathlib import Path

W = Path('/home/coder/rebuild-state/plan-tome0304')
sys.path.insert(0, '/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from common import load_carnet, entry_order_key  # noqa: E402

CARNETS = [f'{c:03d}' for c in range(15, 31)]
TOME = {c: ('03' if int(c) <= 20 else '04') for c in CARNETS}
DOCX = {t: {r['i']: r for r in json.load(open(W / f't{t}.json'))} for t in ('03', '04')}
ORIG = {c: {x['id']: x for x in load_carnet('_original', c)} for c in CARNETS}
IDENT = {c: json.load(open(W / 'identity' / f'{c}.json')) for c in CARNETS}
LOG = []          # (carnet, category, text)
WITHDRAWN = []    # (carnet, source, text)


def log(c, cat, text):
    LOG.append((c, cat, text))


def load_drafts():
    P = {}
    for c in CARNETS:
        d = 'd3' if int(c) <= 20 else 'd4'
        P[c] = json.load(open(W / d / f'plan-{c}.json'))
        P[c].setdefault('drop', [])
    return P


def typo(s: str) -> str:
    return s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')


def dtext(tome: str, i: int) -> str:
    return DOCX[tome][i]['text']


def vis(oid: str) -> str:
    return '\n'.join(ORIG[oid[:3]][oid]['vis'])


class Plans:
    def __init__(self):
        self.P = load_drafts()
        self.keep_placeholders()

    def keep_placeholders(self):
        """The drafter drops empty clusters (old RSR entry summaries); dropping them changes the entry's
        paragraph list and so resets the translations' approval flags. Keep them where they are."""
        for c, p in self.P.items():
            ph = [d['id'] for d in p['drop'] if d['reason'].startswith('empty placeholder')]
            p['drop'] = [d for d in p['drop'] if d['id'] not in ph]
            order = list(ORIG[c])
            for oid in ph:
                k = order.index(oid)
                f = ORIG[c][oid]['file']
                prev = next((order[j] for j in range(k - 1, -1, -1) if ORIG[c][order[j]]['file'] == f and order[j] not in ph), None)
                nxt = next((order[j] for j in range(k + 1, len(order)) if ORIG[c][order[j]]['file'] == f and order[j] not in ph), None)
                ref, off = (prev, 1) if prev else (nxt, 0)
                if ref is None:
                    raise SystemExit(f'cannot place {oid}')
                _, e, i = self.where_old(ref)
                # after any placeholders already re-inserted after prev
                j = i + off
                e['paragraphs'].insert(j, {'old': oid})
            if ph:
                log(c, 'kept', f"{len(ph)} empty clusters (old RSR summaries) kept in place, not dropped: {', '.join(ph)}")

    # --- locating -------------------------------------------------------------------------
    def where_old(self, oid):
        for c, p in self.P.items():
            for e in p['entries']:
                for i, q in enumerate(e['paragraphs']):
                    if q.get('old') == oid:
                        return c, e, i
        raise KeyError(oid)

    def where_new(self, c, docx):
        for e in self.P[c]['entries']:
            for i, q in enumerate(e['paragraphs']):
                if 'new' in q and q.get('_docx', [None])[0] == docx:
                    return e, i
        raise KeyError(f'{c} new ¶{docx}')

    def entry(self, c, file):
        for e in self.P[c]['entries']:
            if e['file'] == file:
                return e
        return None

    # --- new paragraphs -------------------------------------------------------------------
    def drop_new(self, c, docx, why):
        try:
            e, i = self.where_new(c, docx)
        except KeyError:
            print(f'note: {c} new ¶{docx} already gone ({why})')
            return
        q = e['paragraphs'].pop(i)
        log(c, 'new-dropped', f"docx ¶{docx} «{q['new']['french'][:70]}»: {why}")

    def edit_new(self, c, docx, why=None, **kw):
        e, i = self.where_new(c, docx)
        n = e['paragraphs'][i]['new']
        for k, v in kw.items():
            if v is None:
                n.pop(k, None)
            else:
                n[k] = v
        if why:
            log(c, 'new-edited', f"docx ¶{docx}: {why}")

    def insert_new(self, c, file, pos, french, rsr, why, kind=None, source=None, docx=None):
        """pos: ('before'|'after', ref) with ref an old ID or ('new', docx) or 'start'/'end'."""
        e = self.entry(c, file)
        n = {'french': french, 'rsr': rsr}
        if kind:
            n['kind'] = kind
        if source:
            n['source'] = source
        q = {'new': n}
        if docx is not None:
            q['_docx'] = [docx, docx]
        where, ref = pos
        if ref == 'start':
            i = 0
        elif ref == 'end':
            i = len(e['paragraphs'])
        else:
            i = self._index(e, ref) + (1 if where == 'after' else 0)
        e['paragraphs'].insert(i, q)
        log(c, 'new-added', f"{file}: «{french[:70]}» — {why}")

    def _index(self, e, ref):
        for i, q in enumerate(e['paragraphs']):
            if isinstance(ref, tuple) and 'new' in q and q.get('_docx', [None])[0] == ref[1]:
                return i
            if q.get('old') == ref:
                return i
        raise KeyError(ref)

    def split_new(self, c, docx, parts, why):
        """Replace a new paragraph by several (list of french strings)."""
        e, i = self.where_new(c, docx)
        q = e['paragraphs'].pop(i)
        for k, t in enumerate(parts):
            nq = copy.deepcopy(q)
            nq['new']['french'] = t
            nq['_docx'] = [q['_docx'][0], q['_docx'][-1]]
            e['paragraphs'].insert(i + k, nq)
        log(c, 'new-edited', f"docx ¶{docx}: split into {len(parts)} paragraphs — {why}")

    # --- old paragraphs -------------------------------------------------------------------
    def sf(self, oid, text, why):
        c, e, i = self.where_old(oid)
        e['paragraphs'][i]['set_french'] = text
        log(oid[:3], 'set_french', f"{oid}: {why}")

    def unsf(self, oid, why):
        c, e, i = self.where_old(oid)
        if e['paragraphs'][i].pop('set_french', None) is not None:
            log(oid[:3], 'set_french-rejected', f"{oid}: {why}")

    def kind(self, oid, kind, why, source=None):
        c, e, i = self.where_old(oid)
        q = e['paragraphs'][i]
        if kind is None:
            if q.pop('kind', None):
                q.pop('_kind_guess_reason', None)
                log(oid[:3], 'kind-removed', f"{oid}: {why}")
            return
        q['kind'] = kind
        q['_kind_guess_reason'] = why
        if source:
            q['source'] = source
        log(oid[:3], 'kind', f"{oid} → {kind}{' (' + source + ')' if source else ''}: {why}")

    def drop_old(self, oid, reason, cat='old-dropped'):
        c, e, i = self.where_old(oid)
        e['paragraphs'].pop(i)
        self.P[oid[:3]]['drop'].append({'id': oid, 'reason': reason})
        log(oid[:3], cat, f"{oid} «{vis(oid)[:70]}»: {reason}")

    def move_old(self, oid, c, file, pos, why):
        _, e, i = self.where_old(oid)
        q = e['paragraphs'].pop(i)
        tgt = self.entry(c, file)
        where, ref = pos
        if ref == 'start':
            j = 0
        elif ref == 'end':
            j = len(tgt['paragraphs'])
        else:
            j = self._index(tgt, ref) + (1 if where == 'after' else 0)
        tgt['paragraphs'].insert(j, q)
        log(oid[:3], 'moved', f"{oid} → {c}/{file}: {why}")

    def replace_new_with_old(self, c, docx, oid, why):
        """The draft took docx ¶docx for new text while oid (placed elsewhere) is that text."""
        _, e0, i0 = self.where_old(oid)
        q = e0['paragraphs'].pop(i0)
        e, i = self.where_new(c, docx)
        e['paragraphs'][i] = q
        log(c, 'moved', f"{oid} back to docx ¶{docx}: {why}")

    def restore_files(self, c, files, why):
        """Put these old _original files back exactly as they are (identity), dropping draft entries
        of the same names; new paragraphs the draft had put in those entries are dropped and logged."""
        ids = {}
        dropped = {d['id'] for d in self.P[c]['drop']}
        for f in files:
            ie = next(x for x in IDENT[c]['entries'] if x['file'] == f)
            ids[f] = [q['old'] for q in ie['paragraphs'] if q['old'] not in dropped]
        allids = {i for v in ids.values() for i in v}
        for e in self.P[c]['entries']:
            keep = []
            for q in e['paragraphs']:
                if q.get('old') in allids:
                    continue
                if e['file'] in files and 'new' in q:
                    log(c, 'new-dropped', f"docx ¶{q.get('_docx', ['?'])[0]} «{q['new']['french'][:60]}»: entry {e['file']} restored as in _original")
                    continue
                keep.append(q)
            e['paragraphs'] = keep
        self.P[c]['entries'] = [e for e in self.P[c]['entries'] if e['paragraphs'] and e['file'] not in files]
        for f in files:
            # keep any kind/set_french decisions already made on these ids? none yet at this stage
            self.P[c]['entries'].append({'file': f, 'date': f[:10], 'paragraphs': [{'old': i} for i in ids[f]]})
        self.P[c]['entries'].sort(key=lambda e: entry_order_key(e['file']))
        log(c, 'restored', f"{', '.join(files)} kept as in _original: {why}")

    def rename_entry(self, c, old, new, why, heading=None):
        e = self.entry(c, old)
        e['file'] = new
        e['date'] = new[:10]
        if heading:
            e['heading'] = heading
        self.P[c]['entries'].sort(key=lambda e: entry_order_key(e['file']))
        log(c, 'entry', f"{old} → {new}: {why}")

    def add_entry(self, c, file, heading=None, frontmatter_from=None):
        e = {'file': file, 'date': file[:10], 'paragraphs': []}
        if heading:
            e['heading'] = heading
        if frontmatter_from:
            e['frontmatter_from'] = frontmatter_from
        self.P[c]['entries'].append(e)
        self.P[c]['entries'].sort(key=lambda e: entry_order_key(e['file']))
        return e

    # --- output ---------------------------------------------------------------------------
    def finish(self):
        for c, p in self.P.items():
            p['entries'] = [e for e in p['entries'] if e['paragraphs']]
            live = {e['file'] for e in p['entries']}
            oldfiles = {x['file'] for x in ORIG[c].values()}
            for e in p['entries']:
                if 'redirect_from' in e:
                    e['redirect_from'] = [f for f in e['redirect_from'] if f not in live and f in oldfiles]
                    if not e['redirect_from']:
                        del e['redirect_from']
            for e in p['entries']:
                if e.get('heading'):
                    e['heading'] = re.sub(r'^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche) ', r'\1, ', e['heading'])
            p['entries'].sort(key=lambda e: entry_order_key(e['file']))
            p.pop('_draft', None)
            p['_reviewed'] = 'planner-tome0304, 2026-09-28: draft reviewed; see REVIEW.md'
        out = W / 'final'
        out.mkdir(exist_ok=True)
        for c, p in self.P.items():
            json.dump(p, open(out / f'plan-{c}.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(LOG, open(out / 'log.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(WITHDRAWN, open(out / 'withdrawn.json', 'w'), ensure_ascii=False, indent=1)

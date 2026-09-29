"""Draft a rebuild plan (docs/REBUILD_CARNET.md) for one or more carnets from
the tome docx, plus a REVIEW.md of everything that needs judgement.

  just rebuild-draft-plan 068            # → .cache/rebuild-drafts/068/{plan-068.json, REVIEW.md}
  just rebuild-draft-plan 065 066 --out /tmp/drafts

Method (the one used by hand for 068, docs/REBUILD_CARNET.md "Drafting a plan"):
 1. Segment the tome docx by `Livre NN` headings (cover lines around each
    heading become the carnet's cover entry) and by date headings.
 2. Align docx paragraphs to _original clusters: word-4-gram containment for
    long paragraphs, then a windowed fuzzy match for short ones between long
    anchors; a short match under a day where the cluster has no long match is
    rejected.
 3. Every old cluster goes to the day of its first matched docx paragraph
    (unmatched ones follow their predecessor); unmatched docx text becomes new
    paragraphs, grouped per manuscript paragraph with OCR line breaks rejoined.
 4. Guesses: kinds from markers, completions (`set_french`) for clusters cut
    short, `heading_to_next` for clusters that end with the next day's heading,
    cross-carnet placement when the Livre boundary disagrees with _original.
The draft is a starting point: read REVIEW.md, fix the plan, then
`just rebuild-carnet CCC plan.json` (or `just rebuild-carnets …`).
"""
from __future__ import annotations

import argparse
import collections
import datetime
import difflib
import json
import re
import sys
from pathlib import Path

from common import (RE_YEAR_ONLY, CACHE, CONTENT, TREES, dump_docx, entry_order_key, grams, livre_number, load_carnet, norm,
                    ocr_flags, para_text, parse_heading, tome_carnets, tome_of)
from scanlib import figure_candidates, pagemap, pdf_pages_for, printed_pages, typography

SKIP_STYLES = {'Header or footer', 'Table of contents'}
# ABBYY files the text of a pasted facsimile (programme, clipping, card) as picture captions
CAPTION_STYLE = 'Picture caption'
TODAY = datetime.date.today().isoformat()
EMPTY_DAY = '[Aucun texte - date seule mentionnée]'

RE_BRACKET_ONLY = re.compile(r'^\[[^\[\]]*\]$|^\(Ray[ée][^()]*\)$', re.S)
RE_MARGIN = re.compile(r'^\[(En travers|Dans la marge|En marge|En haut|En bas|Bas de page|Au bas|En tête|Au dos)', re.I)
RE_RAYE = re.compile(r'Ray[ée]|cancell|noirci|barr[ée]|biff', re.I)
RE_EDITORIAL = re.compile(r'Marie (est passée|a (noté|écrit|collé|dessiné|laissé|numéroté|arraché))|manuscrit|\bp(?:ages?)?\.?\s*\d|feuillet|Note d[eu]|illisible|déchiré|Il manque|lacune', re.I)
# a letter opens with a salutation on a line of its own («Monsieur,»); «— Monsieur, vous …» is dialogue
RE_SALUTATION = re.compile(r'^\s*["«“]?\s*(Monsieur|Madame|Mademoiselle|Mon cher|Ma chère|Cher|Chère|Mon bon|Ma bonne|Mon ami|Ma petite)\b[^.!?\n]{0,40},?\s*(\n|$)', re.I)
# «[3 lignes cancellées]»: a note that text was struck, without the text — editorial, not rayé
RE_STRUCK_COUNT = re.compile(r'^\[\s*(\d+|une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quelques|plusieurs)\s+(lignes?|mots?|pages?)\s+(cancell|ray|noirci|barr|biff)', re.I)
RE_LETTER_OPEN = re.compile(r'^\s*["«“]\s*(Monsieur|Madame|Mademoiselle|Mon cher|Ma chère|Cher|Chère)\b', re.I)
RE_CAPS_TITLE = re.compile(r'^[^a-zà-ÿ]{6,}$')
RE_NOTE_LINE = re.compile(r'^\s*%%\s*(\d{4}-\d{2}-\d{2}T[\d:]+\s+)?[A-Z]{2,4}:')


def log(*a):
    print(*a, file=sys.stderr)


class Tome:
    """Everything the drafting needs about one tome: docx rows, segments, alignment."""

    def __init__(self, tome: int):
        self.tome = tome
        self.carnets = tome_carnets()[tome]
        self.paras = dump_docx(tome)
        self.P = {p['i']: p for p in self.paras}
        self.orig = {c: load_carnet('_original', c) for c in self.carnets}
        self.C = [c for cn in self.carnets for c in self.orig[cn]]
        self.CB = {c['id']: c for c in self.C}
        self.pos = {c['id']: k for k, c in enumerate(self.C)}
        self.pm = pagemap(tome)
        self.figs = figure_candidates(tome)
        self.typo = typography(tome) or {}
        self.review: dict[str, list[str]] = collections.defaultdict(list)
        self._classify()
        self._segment()
        self._align()
        self._segment_fallback()

    # --- 1. classify and segment -------------------------------------------------------------
    def _classify(self):
        rows = []
        prev = None
        for p in self.paras:
            t = p['t'].strip()
            r = {'i': p['i'], 't': t, 's': p['s'], 'pic': p.get('pic', False), 'caption': p['s'] == CAPTION_STYLE}
            if not t:
                r['cls'] = 'empty'
            elif p['s'] in SKIP_STYLES or (re.fullmatch(r'[\d\s\-–—.*]+', t) and p['s'] != CAPTION_STYLE) or RE_YEAR_ONLY.match(t):
                r['cls'] = 'furniture'
            elif p['s'] == CAPTION_STYLE:
                r['cls'] = 'text'
            elif livre_number(t) is not None:
                r['cls'] = 'livre'
                r['livre'] = f'{livre_number(t):03d}'
            else:
                h = parse_heading(t, prev)
                if h and (h['rest'] == '' or len(t) < 120):
                    r['cls'] = 'head'
                    r['head'] = h
                    prev = h['ymd']
                else:
                    r['cls'] = 'text'
            rows.append(r)
        self.rows = rows
        self.R = {r['i']: r for r in rows}
        # body: first Livre heading of this tome (or first date heading) … before the index / table
        livres = [r for r in rows if r['cls'] == 'livre' and r['livre'] in self.carnets]
        heads = [r for r in rows if r['cls'] == 'head']
        start = livres[0]['i'] if livres else (heads[0]['i'] if heads else 0)
        end = len(rows)
        for r in rows[len(rows) // 2:]:
            if re.match(r'\s*(I?NDEX|TABLE DES MATI|\[Marie Bashkirtseff est d)', r['t']):
                end = r['i']
                break
        self.body = (start, end)

    def _segment(self):
        """carnet of every body row, from Livre headings (carnets without one: _segment_fallback)."""
        a, b = self.body
        seg = {}
        cur = self.carnets[0]
        occ = collections.defaultdict(list)
        for r in self.rows[a:b]:
            if r['cls'] == 'livre' and r['livre'] in self.carnets:
                occ[r['livre']].append(r['i'])
        # A Livre number that occurs twice (tome 9 has two «Livre 67ème») leaves the
        # stretch between the two ambiguous: there nothing changes carnet.
        self.livre_at = {c: v[-1] for c, v in occ.items()}
        ambiguous = set()
        for c, v in occ.items():
            if len(v) > 1:
                ambiguous |= set(range(v[0], v[-1]))
                self.review['segments'].append(f"«Livre {int(c)}» occurs {len(v)} times (docx ¶{', ¶'.join(map(str, v))}): ¶{v[0]}–{v[-1] - 1} is left in whatever carnet _original has it in; decide by hand")
        for r in self.rows[a:b]:
            if r['cls'] == 'livre' and r['livre'] in self.carnets:
                cur = r['livre']
            seg[r['i']] = None if r['i'] in ambiguous else cur
        self.seg = seg

    def _segment_fallback(self):
        """A carnet without a Livre heading starts at the date line before its first long match
        in _original and runs to the next Livre heading."""
        a, b = self.body
        self.fallback_at = {}
        for c in [c for c in self.carnets if c not in self.livre_at]:
            longs = [r for r in self.text_rows if r.get('how') == 'long']
            # the start of a sustained run of this carnet's text, not a stray repeated sentence
            first = next((r['src'] for j, r in enumerate(longs) if r['best'].startswith(c + '.')
                          and sum(x['best'].startswith(c + '.') for x in longs[j:j + 10]) >= 7), None)
            if first is None:
                continue
            head = max([x['i'] for x in self.rows[a:b] if x['cls'] == 'head' and x['i'] <= first], default=first)
            nxt = min([v for v in self.livre_at.values() if v > head], default=b)
            for i in range(head, nxt):
                if self.seg.get(i) is not None:
                    self.seg[i] = c
            self.fallback_at[c] = head
            self.review['segments'].append(f"no «Livre {int(c)}» heading in tome{self.tome:02d}.docx: carnet {c} starts at the date line ¶{head} before its first paragraph found in _original (¶{first}) and runs to ¶{nxt - 1}; check the boundary")

    # --- 2. alignment --------------------------------------------------------------------------
    def _align(self):
        a, b = self.body
        cn = {c['id']: norm(' '.join(l for l in c['vis'] if not l.startswith('#'))) for c in self.C}
        cg = {k: grams(v) for k, v in cn.items()}
        clines = {c['id']: [norm(l) for l in c['vis'] if not l.startswith('#')] for c in self.C}
        index = collections.defaultdict(set)
        for k, g in cg.items():
            for x in g:
                index[x].add(k)
        text_rows = []
        head = None
        for r in self.rows[a:b]:
            if r['cls'] == 'head':
                head = r['i']
                if r['head']['rest'] and re.search(r'[A-Za-zÀ-ÿ]', r['head']['rest']):
                    # a date line that goes on with text («Jeudi 22 février 1877 Il pleut.»)
                    text_rows.append({'i': r['i'] + 0.5, 'src': r['i'], 't': r['head']['rest'], 's': r['s'], 'head': head,
                                      'n': norm(r['head']['rest']), 'best': None, 'sc': 0, 'rest_of_head': True})
                continue
            if r['cls'] != 'text':
                continue
            text_rows.append({'i': r['i'], 'src': r['i'], 't': r['t'], 's': r['s'], 'head': head, 'n': norm(r['t']),
                              'best': None, 'sc': 0, 'caption': r['caption']})
        # pass 1: long paragraphs, gram containment
        for r in text_rows:
            g = grams(r['n'])
            if len(r['n'].split()) >= 7 and g:
                votes = collections.Counter()
                for x in g:
                    for k in index.get(x, ()):
                        votes[k] += 1
                if votes:
                    k, n = votes.most_common(1)[0]
                    if n / len(g) >= 0.5:
                        r.update(best=k, sc=round(n / len(g), 2), how='long')
                    elif cg[k] and n / len(cg[k]) >= 0.9 and n / len(g) >= 0.2:
                        # the docx paragraph holds the whole cluster and more: a cut-short paragraph
                        r.update(best=k, sc=round(n / len(g), 2), how='long', contains=True)
        ids = [c['id'] for c in self.C]
        # pass 2: short / unmatched rows, windowed between long anchors
        for j, r in enumerate(text_rows):
            if r['best'] or not r['n']:
                continue
            pv = next((text_rows[k]['best'] for k in range(j - 1, max(-1, j - 15), -1) if text_rows[k].get('how') == 'long'), None)
            nx = next((text_rows[k]['best'] for k in range(j + 1, min(len(text_rows), j + 15)) if text_rows[k].get('how') == 'long'), None)
            lo = self.pos[pv] - 2 if pv else 0
            hi = self.pos[nx] + 2 if nx else len(ids) - 1
            if hi < lo:
                lo, hi = hi, lo
            if hi - lo > 40 and (pv or nx):
                lo, hi = (self.pos[pv] - 3, self.pos[pv] + 6) if pv else (self.pos[nx] - 6, self.pos[nx] + 3)
            elif hi - lo > 40:
                continue
            best, bs = None, 0.0
            n = r['n']
            for k in ids[max(0, lo):hi + 1]:
                if (' ' + n + ' ') in (' ' + cn[k] + ' '):
                    s = 1.0
                else:
                    s = max([difflib.SequenceMatcher(None, n, l).ratio() for l in clines[k] if l and abs(len(l) - len(n)) < max(20, 0.5 * len(n))] + [0])
                    if s < 0.8:
                        g3 = grams(n, 3)
                        if g3:
                            s = max(s, len(g3 & grams(cn[k], 3)) / len(g3) * 0.95)
                if s > bs:
                    bs, best = s, k
            if bs >= 0.75:
                r.update(best=best, sc=round(bs, 2), how='win')
        # stage: a short match under a day where the cluster has no long match is rejected
        home = collections.defaultdict(set)
        for r in text_rows:
            if r.get('how') == 'long':
                home[r['best']].add(r['head'])
        for r in text_rows:
            if r.get('how') == 'win' and r['best'] in home and r['head'] not in home[r['best']]:
                self.review['alignment'].append(f"docx ¶{r['src']} «{r['t'][:60]}» looked like {r['best']} (score {r['sc']}) but sits under another day than its other lines — treated as new text")
                r.update(best=None, sc=0, how=None)
            elif r.get('how') == 'win' and r['sc'] < 0.9:
                self.review['alignment'].append(f"docx ¶{r['src']} «{r['t'][:60]}» → {r['best']} on a fuzzy short match (score {r['sc']})")
        self.text_rows = text_rows
        self.TR = {r['i']: r for r in text_rows}

    # --- helpers ---------------------------------------------------------------------------------
    def pages(self, a: int, b: int) -> str:
        return printed_pages(self.pm, a, b)



def dominant_style(tome: Tome, carnet: str) -> str:
    c = collections.Counter(r['s'] for r in tome.text_rows if tome.seg.get(r['src']) == carnet and len(r['t']) > 80)
    return c.most_common(1)[0][0] if c else ''


def with_headings(vis: list[str], text: str) -> str:
    """set_french replaces a paragraph's heading lines too: keep the old ones around the new text."""
    first = next((n for n, l in enumerate(vis) if not l.startswith('#')), len(vis))
    last = max((n for n, l in enumerate(vis) if not l.startswith('#')), default=-1)
    return '\n'.join(vis[:first] + [text] + vis[last + 1:])


def guess_kind(text: str) -> tuple[str | None, str]:
    """(kind, why) from the text's own markers."""
    t = text.strip()
    if RE_BRACKET_ONLY.match(t):
        if RE_STRUCK_COUNT.match(t):
            return 'editorial', 'bracketed note that lines/words were struck, without their text'
        if RE_EDITORIAL.search(t) and not t.lower().startswith(('[rayé', '[raye', '[mots', '[trois', '[deux', '[quelques')):
            return 'editorial', 'bracketed note about the manuscript'
        if RE_MARGIN.match(t):
            return 'margin', 'bracketed marginal note'
        if RE_RAYE.search(t):
            return 'rayé', 'bracketed struck passage'
        return 'other', 'bracketed note of unknown kind'
    if RE_SALUTATION.match(t):
        return 'letter', 'opens with a salutation'
    return None, ''


def typo_kind(tome: 'Tome', rows: list[int], text: str) -> tuple[str | None, str]:
    """(kind, kind_guess_reason) from how the printed edition sets these docx paragraphs."""
    rows = [int(x) for x in rows]
    if any(tome.R.get(i, {}).get('caption') for i in rows):
        return 'clipping', 'set as a picture caption in the docx: the text of a pasted facsimile (programme, clipping, card)'
    sig = [tome.typo.get(i, {}) for i in rows]
    pic = [s['in_picture'] for s in sig if 'in_picture' in s]
    if pic and len(pic) * 2 >= len(rows):
        return 'clipping', f"inside a picture region of the scan (printed p.{pic[0].get('printed_page') or '?'}, PDF p.{pic[0]['page']}): a facsimile of pasted printed matter"
    ins = [s['inset'] for s in sig if 'inset' in s]
    if ins:
        x = ins[0]
        where = f"set in from both margins on printed p.{x.get('printed_page') or '?'} (PDF p.{x['page']}; left {x['left']} pt, right {x['right']} pt, {x['lines']} lines)"
        if RE_SALUTATION.match(text):
            return 'letter', where + ' and opens with a salutation: a copied letter'
        return 'clipping', where + ': quoted material — a clipping, a letter or a programme; decide which'
    return None, ''


def build(tome: Tome, wanted: set[str]) -> dict[str, dict]:
    """Draft plans for every carnet of the tome that `wanted` touches (cross-carnet partners added)."""
    rv = tome.review
    a, b = tome.body
    heads = {r['i']: r['head'] for r in tome.rows[a:b] if r['cls'] == 'head'}
    hidx = sorted(heads)
    CB, C = tome.CB, tome.C

    def dayof(k: float) -> int | None:
        h = [x for x in hidx if x <= k]
        return h[-1] if h else None

    # --- covers: short lines around each Livre heading, up to the first date heading
    cover_rows: dict[str, list[int]] = {}
    for carnet, li in tome.livre_at.items():
        cov = [li]
        j = li - 1
        while j >= a and tome.R[j]['cls'] == 'text' and len(tome.R[j]['t']) < 100 and not tome.TR.get(j, {}).get('best') \
                and tome.R[j]['s'] == tome.R[li]['s']:
            cov.insert(0, j)
            j -= 1
        j = li + 1
        while j < b and tome.R[j]['cls'] in ('text', 'empty', 'furniture') and not tome.TR.get(j, {}).get('best'):
            if tome.R[j]['cls'] == 'text':
                if len(tome.R[j]['t']) > 150:
                    break
                cov.append(j)
            j += 1
        cover_rows[carnet] = cov
    covered = {i for v in cover_rows.values() for i in v}

    # --- old clusters: position (key) in the docx
    bycl = collections.defaultdict(list)
    for r in tome.text_rows:
        if r['best']:
            bycl[r['best']].append(r['i'])
    # a cluster whose matches fall far apart (a repeated sentence elsewhere in the
    # tome): keep the largest group of nearby matches, preferring its own Livre
    for k, rows_ in list(bycl.items()):
        rows_.sort()
        groups_, cur = [], [rows_[0]]
        for x in rows_[1:]:
            if x - cur[-1] > 150:
                groups_.append(cur)
                cur = [x]
            else:
                cur.append(x)
        groups_.append(cur)
        if len(groups_) > 1:
            own = lambda g: tome.seg.get(int(g[0])) == k[:3]
            best = max(groups_, key=lambda g: (len(g), own(g)))
            for g in groups_:
                if g is not best:
                    for x in g:
                        tome.TR[x]['best'] = None
                    rv['alignment'].append(f"{k} also matches docx ¶{int(g[0])}{'–' + str(int(g[-1])) if len(g) > 1 else ''}, far from its main place ¶{int(best[0])} — repeated text? those lines are treated as new")
            bycl[k] = best
    trans = {lang: {c['id']: c for cn in tome.carnets for c in load_carnet(lang, cn)} for lang in TREES}
    empty, dropped = [], {}
    key: dict[str, float] = {}
    for c in C:
        k = c['id']
        vis = c['vis']
        if not vis:
            texty = [lang for lang in TREES if trans[lang].get(k) and trans[lang][k]['vis']]
            noted = any(RE_NOTE_LINE.match(l) for l in c['lines'])
            if texty:
                rv['empty'].append(f"{k} ({c['file']}) has no French text but has text in {', '.join(texty)} — kept, placed after its predecessor")
            elif noted:
                rv['empty'].append(f"{k} ({c['file']}) has no French text but carries notes (RSR summary, LAN, a verdict) — kept, placed after its predecessor; drop it only if the notes can go")
            else:
                empty.append(k)
                dropped[k] = 'empty placeholder cluster (no text in _original or any translation)'
                continue
        if k in bycl:
            key[k] = min(bycl[k])
            days = sorted({dayof(i) for i in bycl[k]} - {None})
            if len(days) > 1:
                rv['splits'].append(f"{k} ({c['file']}) matches docx ¶{min(bycl[k])}–{max(bycl[k])}, under {len(days)} days "
                                    f"({', '.join(heads[d]['date'] for d in days)}) — split it (set_french + new paragraph) if the lines belong to different days")
        elif vis and vis[0].startswith('#'):
            # a date line with nothing the docx has under it («## Dimanche 17 décembre» + «[Aucun texte…]»)
            h = parse_heading(vis[0].lstrip('#').strip(), None)
            hi = [x for x in hidx if h and heads[x]['date'] == h['date']]
            if hi:
                key[k] = hi[0] + 0.5
    # «[Aucun texte - date seule mentionnée]» without its date line: the first empty day after its predecessor
    texty_heads = {r['head'] for r in tome.text_rows if r['best'] or r['n']}
    for j, c in enumerate(C):
        k = c['id']
        if k in key or k in dropped or not c['vis'] or not c['vis'][0].startswith('[Aucun texte'):
            continue
        p = j - 1
        while p >= 0 and C[p]['id'] not in key:
            p -= 1
        after = key[C[p]['id']] if p >= 0 else a
        h = next((x for x in hidx if x > after and x not in texty_heads), None)
        if h is not None:
            key[k] = h + 0.5
    for j, c in enumerate(C):
        k = c['id']
        if k in dropped or k in key:
            continue
        p = j - 1
        while p >= 0 and C[p]['id'] not in key:
            p -= 1
        if p >= 0 and C[p]['id'][:3] == k[:3]:
            key[k] = key[C[p]['id']] + 0.01 * (j - p)
        else:
            n = j + 1
            while n < len(C) and C[n]['id'] not in key:
                n += 1
            key[k] = key[C[n]['id']] - 0.01 if n < len(C) else float(b)
        if c['vis']:  # a text-less cluster kept for its notes is listed under «empty» already
            rv['nodocx'].append(f"{k} ({c['file']}) not found in the docx — placed after {C[p]['id'] if p >= 0 else 'the start'}: «{' '.join(c['vis'])[:70]}»")

    # --- set_french: completions of clusters cut short
    setf: dict[str, str] = {}
    row_clusters = collections.defaultdict(set)
    for r in tome.text_rows:
        if r['best']:
            row_clusters[r['src']].add(r['best'])
    for k, rows in bycl.items():
        c = CB[k]
        textl = [l for l in c['vis'] if not l.startswith('#')]
        if len(rows) != 1 or len(textl) != 1:
            continue
        r = tome.TR[rows[0]]
        if len(row_clusters[r['src']]) != 1 or r.get('rest_of_head'):
            continue
        cgr, rgr = grams(norm(textl[0])), grams(r['n'])
        if not cgr or not rgr:
            continue
        inside = len(cgr & rgr) / len(cgr)
        covered_ = len(cgr & rgr) / len(rgr)
        extra = len(r['n'].split()) - len(norm(textl[0]).split())
        if inside >= 0.95 and covered_ < 0.8 and extra >= 5:
            # _original may split one docx paragraph over several clusters: the rest is in the next ones
            j = tome.pos[k]
            nxt = set().union(*(grams(norm(' '.join(l for l in x['vis'] if not l.startswith('#')))) for x in C[j + 1:j + 4] if x['file'] == c['file'])) if j + 1 < len(C) else set()
            if len((cgr | nxt) & rgr) / len(rgr) >= 0.8:
                continue
            setf[k] = with_headings(c['vis'], para_text(tome.P[r['src']]))
            rv['completions'].append(f"{k}: _original holds {len(norm(textl[0]).split())} words of docx ¶{r['src']} ({len(r['n'].split())} words) — set_french to the docx text; check the OCR")

    # --- letters copied into the diary: a cluster that opens with a quoted salutation,
    # up to the cluster that closes the quotation (at most 15 clusters)
    letter_of: dict[str, int] = {}
    for n0, c in enumerate(C):
        textl = [l for l in c['vis'] if not l.startswith('#')]
        if c['id'] in letter_of or not textl or not RE_LETTER_OPEN.match(textl[0]):
            continue
        run = []
        for c2 in C[n0:n0 + 15]:
            if c2['file'] != c['file'] or c2['id'] in dropped:
                break
            run.append(c2['id'])
            t2 = [l for l in c2['vis'] if not l.startswith('#')]
            if t2 and re.search(r'["»”]\s*$', t2[-1]) and (c2 is not c or len(t2) > 1):
                break
        else:
            run = run[:1]
        for x in run:
            letter_of[x] = n0
        rv['kinds'].append(f"old {run[0]}–{run[-1][4:]} ({c['file']}) → **letter**, French quoted with set_french; give it a source. kind_guess_reason: opens with a quoted salutation «{textl[0][:40]}» and runs to the closing quote")

    # --- heading_to_next: clusters that end with the next day's heading
    h2n = set()
    for c in C:
        v = c['vis']
        if c['id'] in key and len(v) >= 2 and v[-1].startswith('#') and not all(l.startswith('#') for l in v):
            h2n.add(c['id'])

    # --- new text
    newrows = [r for r in tome.text_rows if not r['best'] and r['src'] not in covered]
    groups = []
    for r in newrows:
        t = r['t'] if r.get('rest_of_head') else para_text(tome.P[r['src']])
        if groups:
            g = groups[-1]
            between = [x for x in range(int(g['last']) + 1, int(r['src'])) if tome.R[x]['cls'] not in ('empty', 'furniture')]
            if not between and dayof(g['first']) == dayof(r['i']) and tome.seg.get(g['src']) == tome.seg.get(r['src']) and g['s'] == r['s']:
                prev = g['text']
                pl = prev.split('\n')[-1].rstrip('*').rstrip()
                join = None
                if r.get('caption') and g.get('caption'):
                    join = '\n'  # one pasted facsimile: keep its lines together
                elif not re.search(r'[A-Za-zÀ-ÿ]', t):
                    join = '\n'
                elif re.match(r'^[a-zà-ÿ]', t) or pl.endswith('-') or (pl.startswith('[') and pl.count('[') > pl.count(']')):
                    join = ' '
                elif not re.search(r'[.!?…:;»"”\)\]]$', pl):
                    join = '\n'
                if join:
                    g['text'] = prev + join + t
                    g['last'] = r['src']
                    continue
        groups.append({'first': r['i'], 'last': r['src'], 'src': r['src'], 'text': t, 's': r['s'], 'caption': r.get('caption')})

    def rsr(g) -> str:
        a_, b_ = int(g['first']), int(g['last'])
        rng = f'¶{a_}' if a_ == b_ else f'¶{a_}–{b_}'
        pg = tome.pages(a_, b_)
        where = f"tome{tome.tome:02d}.docx {rng}" + (f", Mon Journal t.{tome.tome} {pg}" if pg else '')
        return f'Restored from {where} (missing from original extraction, {TODAY} rebuild).'

    items = []  # (key, carnet, plan paragraph, info)
    doms = {c: dominant_style(tome, c) for c in tome.carnets}
    placed = sorted((kk, k) for k, kk in key.items())

    def carnet_near(i: float) -> str | None:
        before = [k for kk, k in placed if kk <= i]
        after = [k for kk, k in placed if kk > i]
        k = before[-1] if before else (after[0] if after else None)
        return (tome.seg.get(int(key[k])) or k[:3]) if k else None

    for g in groups:
        carnet = tome.seg.get(g['src']) or carnet_near(g['first'])
        if carnet is None:
            continue
        dom = doms[carnet]
        kind, why = guess_kind(g['text'])
        grow = [r['src'] for r in newrows if g['first'] <= r['i'] <= g['last']]
        tk, twhy = typo_kind(tome, grow, g['text'])
        if tk and (not kind or kind == 'letter'):
            kind, why = tk, twhy
        if not kind and dom and g['s'] != dom and len(g['text']) > 150:
            kind, why = 'clipping', f"set in style «{g['s']}», not the diary's «{dom}»"
        prev_row = tome.R.get(int(g['first']) - 1)
        if not kind and prev_row and RE_CAPS_TITLE.match(prev_row['t'] or 'x') and len(prev_row['t']) > 8:
            kind, why = 'clipping', f"follows the capitals title «{prev_row['t'][:40]}»"
        nw = {'french': g['text'], 'rsr': rsr(g)}
        para = {'new': nw}
        if kind:
            nw['kind'] = kind
            para['_kind_guess_reason'] = why
            rv['kinds'].append(f"new ¶{int(g['first'])} → **{kind}**. kind_guess_reason: {why}. «{g['text'][:60]}»")
        fl = ocr_flags(g['text'])
        if fl:
            rv['ocr'].append(f"new ¶{int(g['first'])}: {', '.join(fl)} — «{g['text'][:80]}»")
        items.append((g['first'], carnet, para, g))

    for c in C:
        k = c['id']
        if k in dropped:
            continue
        kk = key[k]
        carnet = tome.seg.get(int(kk)) or k[:3]
        para = {'old': k}
        if k in setf:
            para['set_french'] = setf[k]
        if k in h2n:
            para['heading_to_next'] = True
        kind, why = guess_kind('\n'.join(l for l in c['vis'] if not l.startswith('#')))
        tk, twhy = typo_kind(tome, bycl.get(k, []), '\n'.join(c['vis']))
        if tk and k not in letter_of and not kind:
            rv['kinds'].append(f"old {k} → candidate **{tk}** (not set). kind_guess_reason: {twhy}. «{' '.join(c['vis'])[:60]}»")
        if k in letter_of:
            kind, why = 'letter', 'part of a copied letter: opens with a quoted salutation (see the letter entry above)'
            base = setf.get(k, '\n'.join(c['vis']))
            para['set_french'] = '\n'.join(l if l.startswith(('> ', '#')) else '> ' + l for l in base.split('\n'))
        elif kind:
            rv['kinds'].append(f"old {k} → **{kind}**. kind_guess_reason: {why}. «{' '.join(c['vis'])[:60]}»")
        if kind:
            para['kind'] = kind
            para['_kind_guess_reason'] = why
        items.append((kk, carnet, para, None))
        if carnet != k[:3]:
            rv['cross'].append(f"{k} ({c['file']}) sits in the docx under Livre {carnet} (¶{int(kk)}) — moved to carnet {carnet}")

    # empty days
    for h in hidx:
        nxt = next((x for x in hidx if x > h), b)
        if not any(h <= kk < nxt for kk, *_ in items) and (tome.seg.get(h) or carnet_near(h)):
            items.append((h + 0.5, tome.seg.get(h) or carnet_near(h), {'new': {'french': EMPTY_DAY, 'rsr': f"tome{tome.tome:02d}.docx ¶{h}: the date line «{tome.R[h]['t'][:40]}» has no text under it ({TODAY} rebuild)."}}, None))
            rv['empty_days'].append(f"{heads[h]['date']} (¶{h}, Livre {int(tome.seg.get(h) or carnet_near(h))}): no text under the date line — «{EMPTY_DAY}» inserted")

    # --- entries per carnet
    plans = {}
    for carnet in tome.carnets:
        its = sorted((x for x in items if x[1] == carnet), key=lambda x: x[0])
        if not its and carnet not in cover_rows:
            continue
        entries = collections.OrderedDict()
        first_head = next((h for h in hidx if tome.seg.get(h) == carnet), None)
        if carnet in tome.livre_at:
            first_head = next((h for h in hidx if h > tome.livre_at[carnet]), first_head)
        for kk, _, para, g in its:
            h = dayof(kk)
            if h is None or tome.seg.get(h) not in (carnet, None):
                h = first_head
                rv['placement'].append(f"{para.get('old') or '¶' + str(int(kk))} precedes the carnet's first date line — put in the first entry")
            date = heads[h]['date']
            e = entries.get(date)
            if not e:
                e = entries[date] = {'file': f'{date}.md', 'date': date, 'heading': heads[h]['heading'], 'paragraphs': []}
                if heads[h]['guessed']:
                    rv['headings'].append(f"¶{h} «{tome.R[h]['t'][:50]}» → {date}: {' and '.join(heads[h]['guessed'])} inferred from the previous date line")
            elif e.get('_head') != h:
                rv['headings'].append(f"¶{h} «{tome.R[h]['t'][:50]}» repeats the date {date}: merged into one entry")
            e['_head'] = h
            e['paragraphs'].append(para)
        # cover entry
        if carnet in cover_rows and first_head is not None:
            rows_ = cover_rows[carnet]
            chunks, cur = [], []
            for i in rows_:
                t = para_text(tome.P[i])
                if RE_BRACKET_ONLY.match(t):
                    if cur:
                        chunks.append(cur)
                    chunks.append([(i, t)])
                    cur = []
                else:
                    cur.append((i, t))
            if cur:
                chunks.append(cur)
            # the cover sorts first: an entry dated before the first date line (a day Marie wrote in
            # at the end of the notebook, 002 «Lundi 2 février») pulls the cover's date back
            cdate = min([heads[first_head]['date']] + [e['date'] for e in entries.values()])
            cover = {'file': f'{cdate}-cover.md', 'date': cdate, 'paragraphs': []}
            for ch in chunks:
                a_, b_ = ch[0][0], ch[-1][0]
                pg = tome.pages(a_, b_)
                cover['paragraphs'].append({'new': {'french': '\n'.join(t for _, t in ch), 'kind': 'cover', 'source': f'page de titre du Livre {int(carnet)}',
                                                    'rsr': f"Restored from tome{tome.tome:02d}.docx ¶{a_}{'' if a_ == b_ else '–' + str(b_)}" + (f", Mon Journal t.{tome.tome} {pg}" if pg else '') + f": the title page Marie wrote for Livre {int(carnet)}; cover entry ({TODAY} rebuild)."}})
                fl = ocr_flags(' '.join(t for _, t in ch))
                if fl:
                    rv['ocr'].append(f"cover ¶{a_}: {', '.join(fl)} — «{' / '.join(t for _, t in ch)[:80]}»")
            rv['cover'].append(f"{carnet}: cover entry {cover['file']} from docx ¶{rows_[0]}–{rows_[-1]} ({len(chunks)} paragraph(s)) — check which lines are Marie's title page")
            entries_list = [cover] + list(entries.values())
        else:
            entries_list = list(entries.values())
        # headings_to_next only when the next paragraph opens the next day
        flat = [(e, p) for e in entries_list for p in e['paragraphs']]
        for n_, (e, p) in enumerate(flat):
            if p.get('heading_to_next'):
                nxt = flat[n_ + 1] if n_ + 1 < len(flat) else None
                if not nxt or nxt[0] is e or nxt[1] is not nxt[0]['paragraphs'][0]:
                    del p['heading_to_next']
                    rv['headings'].append(f"{p['old']} ends with a date heading that does not open the next entry — left in place")
        # frontmatter_from / redirect_from
        old_files = sorted({c['file'] for c in tome.orig[carnet]}, key=entry_order_key)
        for e in entries_list:
            if not any(p.get('old', '').startswith(carnet + '.') for p in e['paragraphs']):
                cands = [f for f in old_files if f[:10] <= e['date']] or old_files[:1]
                if cands:
                    e['frontmatter_from'] = cands[-1]
        live = {e['file'] for e in entries_list}
        first_dest = {}
        for e in entries_list:
            for p in e['paragraphs']:
                if p.get('old', '').startswith(carnet + '.'):
                    f = CB[p['old']]['file']
                    first_dest.setdefault(f, e['file'])
        for f in old_files:
            same = f'{f[:10]}.md'
            if f not in live and same in live and first_dest.get(f) not in (None, same):
                tgt = next(e for e in entries_list if e['file'] == same)
                tgt.setdefault('redirect_from', []).append(f)
        for e in entries_list:
            e.pop('_head', None)
        entries_list.sort(key=lambda e: entry_order_key(e['file']))
        drop = [{'id': k, 'reason': r} for k, r in dropped.items() if k.startswith(carnet + '.')]
        plans[carnet] = {'carnet': carnet, 'source': f'tome{tome.tome:02d}.docx',
                         '_draft': f'rebuild-draft-plan {TODAY}: a draft — read REVIEW.md before using it', 'drop': drop, 'entries': entries_list}
        # ID-less old files (empty-day stubs): rebuild-carnet refuses a plan that neither carries (body_from) nor drops them
        idless = [f.name for f in sorted((CONTENT / '_original' / carnet).glob('*.md'), key=lambda f: entry_order_key(f.name))
                  if re.match(r'\d{4}-\d{2}-\d{2}', f.name) and f.name not in old_files]
        if idless:
            plans[carnet]['drop_files'] = [{'file': f, 'reason': 'ID-less old entry (no paragraph IDs); the docx day is drafted as its own entry'} for f in idless]
            for f in idless:
                rv['empty'].append(f"_original/{carnet}/{f} has no paragraph IDs — listed in drop_files; to keep its body instead, give its entry `body_from`")

    # --- drawings / figures
    for r in tome.rows[a:b]:
        if r['pic'] or (r['cls'] == 'empty' and r['s'] == 'Normal' and a < r['i'] < b and tome.R.get(r['i'] - 1, {}).get('cls') == 'text'
                        and tome.R.get(r['i'] + 1, {}).get('cls') == 'text'):
            h = dayof(r['i'])
            rv['drawings'].append(f"docx ¶{r['i']} ({'picture in the docx' if r['pic'] else 'empty Normal paragraph between text = picture slot?'}), "
                                  f"{heads[h]['date'] if h else '?'} (Livre {tome.seg.get(r['i'])}), {tome.pages(r['i'], r['i']) or 'page ?'}")
    for f in tome.figs or []:
        rng = [x for x in (tome.pm or []) if x['pdf_page'] == f['pdf_page'] and x.get('docx_para_start') is not None]
        if rng and a <= rng[0]['docx_para_start'] < b:
            h = dayof(rng[0]['docx_para_start'])
            rv['drawings'].append(f"scan PDF p.{f['pdf_page']} (printed p.{rng[0].get('printed_page', '?')}): figure candidate "
                                  f"({len(f['regions_pt'])} ink region(s), {len(f['abbyy_picture_regions'])} picture region(s)), docx ¶{rng[0]['docx_para_start']}–{rng[0]['docx_para_end']}, "
                                  f"{heads[h]['date'] if h else '?'} (Livre {tome.seg.get(rng[0]['docx_para_start'])})")
    for w in [c for c in tome.carnets if c not in tome.livre_at and c not in tome.fallback_at]:
        rv['segments'].append(f"no «Livre {int(w)}» heading in tome{tome.tome:02d}.docx and none of its paragraphs found: carnet {w} gets no segment")
    return plans


def review_md(tome: Tome, plans: dict, carnets: list[str]) -> str:
    rv = tome.review
    L = [f'# Draft rebuild plan review: {", ".join(carnets)} (tome {tome.tome:02d}, {TODAY})', '',
         'Generated by `just rebuild-draft-plan`. The plan files next to this one are **drafts**: every section below lists a decision the drafter guessed or could not make. Fix the plan, then dry-run it with `just rebuild-carnet` (or `just rebuild-carnets` when carnets exchange paragraphs).', '',
         f"Source: `content/_raw/tome{tome.tome:02d}.docx`, body ¶{tome.body[0]}–{tome.body[1] - 1}. Scan: {'content/_raw/scans/Tome%d.pdf (page map used for «Mon Journal» page citations)' % tome.tome if tome.pm else 'none (no printed-page citations)'}.", '',
         '## Summary', '', '| Carnet | Entries | Old placed | Old dropped | Moved in | New | New chars | set_french | heading_to_next | kinds |', '|---|---|---|---|---|---|---|---|---|---|']
    for c in carnets:
        p = plans[c]
        ps = [x for e in p['entries'] for x in e['paragraphs']]
        old = [x for x in ps if 'old' in x]
        new = [x for x in ps if 'new' in x]
        kinds = collections.Counter((x.get('kind') or x.get('new', {}).get('kind')) for x in ps if x.get('kind') or x.get('new', {}).get('kind'))
        L.append(f"| {c} | {len(p['entries'])} | {len(old)} | {len(p['drop'])} | {sum(1 for x in old if not x['old'].startswith(c))} | {len(new)} | "
                 f"{sum(len(x['new']['french']) for x in new):,} | {sum(1 for x in ps if 'set_french' in x)} | {sum(1 for x in ps if x.get('heading_to_next'))} | "
                 f"{', '.join(f'{k}×{v}' for k, v in kinds.items()) or '—'} |")
    L.append('')
    # things rebuild-carnet will refuse, whatever the plan says
    for c in carnets:
        for f in sorted((CONTENT / '_original' / c).glob('*.md')):
            n = len(re.findall(r'^\[//\]: # \(\s*\d{2,3}\.\d+\s*\)\s*$', f.read_text(encoding='utf-8'), re.M))
            if n:
                rv['blockers'].append(f"_original/{c}/{f.name}: {n} legacy `[//]: # (NN.NNNN)` ID line(s) — migrate them to `%% CCC.NNNN %%` first; the draft ignores those paragraphs")
    sections = [
        ('blockers', 'Blockers', 'Fix these before the plan can be applied.'),
        ('cross', 'Cross-carnet placements', 'The Livre heading in the docx disagrees with the carnet `_original` files these paragraphs in. Run the plans together: `just rebuild-carnets plan-A.json plan-B.json`.'),
        ('segments', 'Carnet boundaries', ''),
        ('splits', 'Clusters that span several days', 'One old paragraph matches docx text under more than one date line. The draft keeps it at its first line. Split it with `set_french` plus a `new` paragraph if the rest belongs to another day.'),
        ('completions', 'Completions (`set_french` proposed)', 'The old text is a strict part of one docx paragraph. The draft replaces it with the docx text: check the OCR.'),
        ('nodocx', 'Old paragraphs not found in the docx', 'Placed after their predecessor. Check them against the printed page.'),
        ('alignment', 'Uncertain alignments', ''),
        ('kinds', 'Kind guesses', 'Each line gives the kind the draft set (or only suggests: «candidate … (not set)») and its `kind_guess_reason` — the same text as `_kind_guess_reason` on the plan paragraph. Signals: brackets and salutations in the text; a docx style other than the diary\'s or a picture caption; in the scan, text set in from both margins (quoted letters, clippings) or lying inside a picture region (a pasted facsimile). Letters and clippings need `source`, clippings a newspaper tag.'),
        ('cover', 'Cover entries', ''),
        ('headings', 'Date lines', ''),
        ('empty_days', 'Empty days', ''),
        ('empty', 'Empty _original clusters kept', 'No French text in _original, but text in a translation or notes (RSR entry summary, LAN, a verdict); ID-less old files go to drop_files.'),
        ('placement', 'Text before the first date line', ''),
        ('ocr', 'OCR oddities in new text', 'The docx text is used as it is (italic runs as `*…*`, `II!`→`!!!`, split years rejoined). Compare with the printed page.'),
        ('drawings', 'Drawings and figure candidates', 'Drawings go into the entry frontmatter `drawings:` (docs/REBUILD_CARNET.md, "Drawings").'),
    ]
    def concerns(text: str) -> bool:
        # an item belongs to this review if it names one of its carnets (ID, «Livre N», docx ¶ in its Livre)
        cs = {m for m in re.findall(r'\b(\d{3})\.\d{4}\b', text)}
        cs |= {f'{int(m):03d}' for m in re.findall(r'Livre (\d{1,3})\b', text)}
        cs |= {tome.seg.get(int(m)) for m in re.findall(r'¶(\d+)', text)} - {None}
        return not cs or bool(cs & set(carnets))

    for key, title, intro in sections:
        items = [x for x in rv.get(key, []) if concerns(x)]
        if not items:
            continue
        L += [f'## {title} ({len(items)})', '']
        if intro:
            L += [intro, '']
        L += [f'- {x}' for x in items] + ['']
    return '\n'.join(L)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('carnets', nargs='+')
    ap.add_argument('--out', help='output directory (default .cache/rebuild-drafts/<carnets>)')
    args = ap.parse_args()
    wanted = [c.zfill(3) for c in args.carnets]
    by_tome = collections.defaultdict(list)
    for c in wanted:
        by_tome[tome_of(c)].append(c)
    out = Path(args.out) if args.out else CACHE.parent / 'rebuild-drafts' / '+'.join(wanted)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('plan-*.json'):
        old.unlink()
    for t, cs in by_tome.items():
        log(f'tome {t:02d}: docx, scan, alignment …')
        tome = Tome(t)
        plans = build(tome, set(cs))
        # carnets exchanging paragraphs with a wanted one come along
        involved = set(cs)
        for c, p in plans.items():
            for e in p['entries']:
                for x in e['paragraphs']:
                    if 'old' in x and (x['old'][:3] in involved or c in involved) and x['old'][:3] != c:
                        involved |= {c, x['old'][:3]}
        emit = sorted(involved & plans.keys())
        for c in emit:
            (out / f'plan-{c}.json').write_text(json.dumps(plans[c], ensure_ascii=False, indent=1) + '\n')
        name = 'REVIEW.md' if len(by_tome) == 1 else f'REVIEW-tome{t:02d}.md'
        (out / name).write_text(review_md(tome, plans, emit) + '\n')
        extra = sorted(set(emit) - set(cs))
        log(f"wrote {', '.join(f'plan-{c}.json' for c in emit)} and {name} to {out}" + (f" (added {', '.join(extra)}: paragraphs move between them)" if extra else ''))
        if len(emit) > 1:
            log('dry run: just rebuild-carnets ' + ' '.join(str(out / f'plan-{c}.json') for c in emit))
        else:
            log(f'dry run: just rebuild-carnet {emit[0]} {out / f"plan-{emit[0]}.json"}')


if __name__ == '__main__':
    main()

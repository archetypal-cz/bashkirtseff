"""Reviewed plans for carnets 031–044 (tome 5): python3 fix5.py [OUTDIR] → OUTDIR/plan-CCC.json + log/withdrawn/questions.

1. generic(): fixes for the drafter's known defects, applied to every carnet;
2. fix_CCC.fix(X) per carnet (per-carnet review decisions), in carnet order.
"""
import importlib, re, sys
from fixlib5 import (Plans, W, ORIG, T, CARNETS, WITHDRAWN, LOG, QUESTIONS, log, question, typo, vis, dtext,
                     lines, rsr, is_heading_only, EMPTY, REBUILD)

MONTHS = {'janvier': 1, 'février': 2, 'fevrier': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6, 'juillet': 7,
          'août': 8, 'aout': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12, 'decembre': 12}

# docx ¶ ranges of the Livre title pages (formula lines: H[is] G[race]…, Livre N, commencé/depuis…, address,
# «écrit sur papier à en-tête»). Withdrawn (owner 2026-09-28: no cover pages until the manuscript is scanned).
TITLE_PAGES = {'031': (48, 51), '032': (474, 476), '033': (1092, 1095), '034': (1691, 1694), '035': (2371, 2374),
               '036': (2764, 2767), '037': (2979, 2982), '038': (3587, 3589), '039': (3960, 3962),
               '040': (4307, 4309), '041': (4556, 4559), '042': (4847, 4851), '043': (4925, 4929),
               '044': (5381, 5384)}
# old _original paragraphs that are title-page text
TITLE_OLD = ['032.0002', '032.0003', '032.0462', '032.0473', '033.0507', '034.0002', '034.0003', '034.0004',
             '034.0447', '035.0093', '040.0002', '040.0003', '040.0004', '040.0228', '040.0229', '040.0230',
             '040.0231', '042.0002', '042.0003', '042.0004', '042.0005', '042.0006', '043.0422', '043.0423',
             '043.0424', '043.0425']
WITHDRAW_REASON = 'title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)'


def keep_placeholders(X):
    """The drafter drops empty clusters that hold only an RSR entry summary; dropping them changes the entry's
    paragraph list and resets the translations' approval flags. Keep them after their old predecessor."""
    for c, p in X.P.items():
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
            _, e, i = X.where_old(ref)
            j = i + off
            if off:  # after placeholders of the same run already put back after prev
                while j < len(e['paragraphs']) and e['paragraphs'][j].get('old') in ph:
                    j += 1
            e['paragraphs'].insert(j, {'old': oid})
        if ph:
            log(c, 'kept', f"{len(ph)} empty clusters (old RSR entry summaries) kept in place, not dropped: {', '.join(ph)}")


def withdraw_title_pages(X):
    for c, p in X.P.items():
        for e in [e for e in p['entries'] if e['file'].endswith('-cover.md')]:
            for q in e['paragraphs']:
                if 'new' in q:
                    m = re.search(r'¶(\d+)(?:–(\d+))?', q['new']['rsr'])
                    WITHDRAWN.append((c, f"tome05.docx ¶{m.group(1)}{'–' + m.group(2) if m.group(2) else ''}", q['new']['french']))
                else:
                    WITHDRAWN.append((c, f"_original {q['old']}", vis(q['old'])))
                    p['drop'].append({'id': q['old'], 'reason': WITHDRAW_REASON})
            p['entries'].remove(e)
            log(c, 'cover', f"cover entry {e['file']} not created (title page withdrawn)")
    for c, p in X.P.items():
        for e in p['entries']:
            keep = []
            for q in e['paragraphs']:
                if 'new' in q and q.get('_docx'):
                    a, b = q['_docx'][0], q['_docx'][-1]
                    hit = [cc for cc, (x, y) in TITLE_PAGES.items() if x <= a and b <= y]
                    if hit:
                        WITHDRAWN.append((hit[0], f"tome05.docx ¶{a}{'–' + str(b) if b != a else ''}", q['new']['french']))
                        log(c, 'cover', f"docx ¶{a} «{q['new']['french'][:60]}»: title-page line of Livre {int(hit[0])}, withdrawn")
                        continue
                keep.append(q)
            e['paragraphs'] = keep
    for oid in TITLE_OLD:
        try:
            X.where_old(oid)
        except KeyError:
            if any(d['id'] == oid for d in X.P[oid[:3]]['drop']):
                continue
            raise
        WITHDRAWN.append((oid[:3], f"_original {oid} ({ORIG[oid[:3]][oid]['file']})", vis(oid)))
        X.drop_old(oid, WITHDRAW_REASON, cat='cover')


def clean_new(X):
    for c, p in X.P.items():
        for e in p['entries']:
            keep = []
            for q in e['paragraphs']:
                if 'new' in q:
                    n = q['new']
                    n['french'] = typo(n['french'])
                    t = n['french'].strip()
                    d = q.get('_docx', ['?'])[0]
                    if re.fullmatch(r'\d+', t):
                        log(c, 'new-dropped', f"docx ¶{d} «{t}»: printed page number, not text")
                        continue
                    if len(re.sub(r'[^A-Za-zÀ-ÿ]', '', t)) < 3 and not t.startswith('['):
                        log(c, 'new-dropped', f"docx ¶{d} «{t}»: OCR debris")
                        continue
                if 'set_french' in q:
                    q['set_french'] = typo(q['set_french'])
                keep.append(q)
            e['paragraphs'] = keep


def heading_date(oid):
    t = ORIG[oid[:3]][oid]['vis'][0].lower()
    m = re.search(r'(\d{1,2})(?:er)?,?\s+([a-zéû]+)', t)
    if not m or m.group(2) not in MONTHS:
        return None
    return MONTHS[m.group(2)], int(m.group(1))


def relocate_headings(X):
    """Heading-only old clusters («# Dimanche, 4 avril») were left at the end of the previous day by the drafter:
    put them at the start of the entry of their date (same carnet)."""
    for c, p in X.P.items():
        for oid in [k for k in ORIG[c] if is_heading_only(k)]:
            try:
                cc, e, i = X.where_old(oid)
            except KeyError:
                continue
            hd = heading_date(oid)
            if not hd:
                continue
            tgt = [x for x in X.P[cc]['entries'] if (int(x['date'][5:7]), int(x['date'][8:10])) == hd]
            if len(tgt) != 1:
                if not tgt:
                    log(cc, 'heading', f"{oid} «{vis(oid)}»: no entry of that date in {cc}; left in place")
                continue
            t = tgt[0]
            if t is e and i == 0:
                continue
            q = e['paragraphs'].pop(i)
            t['paragraphs'].insert(0, q)
            if t is not e:
                log(cc, 'heading', f"{oid} «{vis(oid)}» moved to the start of {t['file']}")


BRACKET_EDITORIAL = re.compile(r"^\[(?:(?:Une|Deux|Trois|Quatre|Cinq|Six|Sept|Huit|Neuf|Dix|\d+) lignes? (?:cancell|ray)[ée]+s?"
                               r"|[^\]:]*(?:page|pages) (?:enlev|supprim|non num)|(?:une|deux|trois|\d+) lignes? illisibles?|Lettre de [^\]]+|DERNIERE PAGE[^\]]*)\s*\]$", re.I)


def normalise_kinds(X):
    for c, p in X.P.items():
        for e in p['entries']:
            for q in e['paragraphs']:
                isnew = 'new' in q
                t = (q['new']['french'] if isnew else q.get('set_french', vis(q['old']))).strip()
                k = q['new'].get('kind') if isnew else q.get('kind')
                ident = f"new ¶{q['_docx'][0]}" if isnew else q['old']
                want = k
                src = None
                why = None
                if k == 'letter' and not isnew and re.match(r'^[-—–]\s', t):
                    want, why = None, 'dialogue line, not a copied letter (drafter guess from a salutation)'
                elif k == 'letter' and isnew and 'salutation' in (q['new'].get('_kind_guess_reason') or q.get('_kind_guess_reason') or 'salutation'):
                    want, why = None, 'reported speech/dialogue, not a copied letter (drafter guess from a salutation; per-carnet review re-sets real letters)'
                elif k == 'letter':
                    want, why = None, 'drafter salutation guess removed; per-carnet review re-sets real letters'
                if re.match(r'^[\[(]\s*Annotation\s*[:;]?', t):
                    m = re.search(r'[1!]\s?8\s?[0-9]\s?[0-9]', t[:40])
                    yr = m.group(0).replace('!', '1').replace(' ', '') if m else ''
                    want, src, why = 'margin', f"annotation ultérieure de Marie{', ' + yr if len(yr) == 4 else ''}", "Marie's later annotation"
                elif BRACKET_EDITORIAL.match(t):
                    want, why = 'editorial', 'bracketed editors\' note about the manuscript (no text by Marie)'
                elif re.match(r'^\[(?:Une|Deux|Trois|Quatre|Cinq|Six|\d+) lignes? (?:cancell|barr|ray)[ée]+s?\s*:', t, re.I) or re.match(r'^\[(?:Rayé|Raye|Rayé et cancellé)\s*:', t):
                    if t.endswith(']') and t.count('[') == 1:
                        want, why = 'rayé', 'whole paragraph struck out'
                elif re.match(r'^\[(?:En travers|Dans la marge|En marge)\s*:', t) and t.endswith(']') and t.count('[') == 1:
                    want, why = 'margin', 'whole paragraph is a marginal note'
                elif re.match(r'^\[Sur un papier épinglé', t):
                    want, src, why = 'other', 'papier épinglé dans le carnet', 'note on a paper pinned into the notebook'
                elif re.match(r'^\(?[EÉ]crit sur (du )?papier', t):
                    want, why = 'editorial', "editors' note about the paper"
                elif k in ('rayé', 'margin', 'other', 'editorial') and not isnew:
                    # drafter guess on a paragraph that is not wholly a bracketed note: drop it
                    if not (t.startswith('[') and t.endswith(']')):
                        want, why = None, 'not a whole bracketed note'
                if want == k and not src:
                    continue
                if isnew:
                    n = q['new']
                    if want is None:
                        n.pop('kind', None); n.pop('source', None)
                    else:
                        n['kind'] = want
                        if src:
                            n['source'] = src
                    q.pop('_kind_guess_reason', None)
                else:
                    if want is None:
                        q.pop('kind', None); q.pop('source', None)
                    else:
                        q['kind'] = want
                        if src:
                            q['source'] = src
                    q['_kind_guess_reason'] = why
                log(c, 'kind', f"{ident}: {k} → {want}{' (' + src + ')' if src else ''}: {why} «{t[:50]}»")


def carnet_031_front(X):
    """Livre 31: the draft made entries 1873-* and 1875-10/12-* out of Marie's annotated front page (a list of the
    dates of her 1872–1873 journal) and put the continuation of 2 April (docx ¶70–74) into «1873-02-12»."""
    c = '031'
    for e in [e for e in X.P[c]['entries'] if e['date'] < '1875-04-01' or e['date'] > '1875-05-01']:
        for q in e['paragraphs']:
            assert 'old' not in q, q
            d = q.get('_docx', [None])[0]
            if d in (70, 71, 74):
                log(c, 'new-dropped', f"docx ¶{d} «{q['new']['french'][:60]}»: end of Friday 2 April, already in carnet 030 "
                    "(030.0456–0458, rebuilt with tome 4); the manuscript has it after the Livre 31 title page")
        X.P[c]['entries'].remove(e)
        log(c, 'entry', f"{e['file']} not created: the date lines are Marie's list on the annotated front page (docx ¶53–69), not diary days")
    for i in (48, 51):
        WITHDRAWN.append((c, f'tome05.docx ¶{i}', dtext(i)))
    first = X.P[c]['entries'][0]
    assert first['file'] == '1875-04-03.md', first['file']
    note = '[Page annotée: ' + '\n'.join(dtext(i) for i in range(53, 69)) + '\nMercredi 12 février]'
    first['paragraphs'].insert(1, {'new': {
        'kind': 'margin', 'source': 'note de Marie sur une page liminaire du Livre 31',
        'french': note,
        'rsr': ("Marie's note on the annotated front page of Livre 31 (after the title page): the date her journal "
                "began and a list of dates of her 1872–1873 journal. The printed edition has «Mercredi 1 2 février» "
                "(OCR-split digits rejoined). tome05.docx ¶52–69. Restored in the " + REBUILD + " (owner policy: "
                "Marie's own notes on title/index pages go in as margin paragraphs at the carnet's first entry)."),
    }, '_docx': [52, 69]})
    log(c, 'new-added', '1875-04-03.md: «[Page annotée: Journal commencé le 6 août 1872 …]» margin note from the front page (docx ¶52–69)')


def generic(X):
    keep_placeholders(X)
    withdraw_title_pages(X)
    carnet_031_front(X)
    clean_new(X)
    relocate_headings(X)
    normalise_kinds(X)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else str(W / 'final')
    only = [a for a in sys.argv[2:] if re.fullmatch(r'\d{3}', a)]
    X = Plans('d2')
    generic(X)
    for c in (only or CARNETS):
        try:
            mod = importlib.import_module(f'fix_{c}')
        except ModuleNotFoundError:
            continue
        mod.fix(X)
    errs = X.finish(out)
    print(f'{len(LOG)} log lines, {len(WITHDRAWN)} withdrawn, {len(QUESTIONS)} questions → {out}')
    sys.exit(1 if errs else 0)

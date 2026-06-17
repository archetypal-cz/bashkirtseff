#!/usr/bin/env python3
"""
Harvest reader-facing [^n] footnotes from a translation (default: English) into the
French source (content/_original/NNN/*.md), so future/new-language translations
inherit them via the existing sync tool.

English (content/en/) is currently the richest, canonical footnote set; the French
source has almost none. Paragraph IDs (%% NNN.PPPP %%) are identical between
content/en/NNN/X.md and content/_original/NNN/X.md (same filenames), so a footnote
DEFINITION maps deterministically to its source paragraph by paragraph ID.

Per harvested footnote, the script does two things in the source paragraph:
  1. Insert the definition `[^key]: <english def>` verbatim after the French text,
     with a blank line before it (mirroring the English layout). The English def
     becomes the canonical source footnote.
  2. Insert the inline `[^key]` REF into the French paragraph text, anchored by
     confidence:
       HIGH  - def leads with an italic *French term* found literally in the French
               text -> place [^key] right after that substring; OR the English inline
               ref sits at the very end of the paragraph's last sentence -> place
               [^key] at the end of the French paragraph text.
       LOW / needs_review - cannot reliably locate a French anchor (English/no leading
               term AND the English ref is mid-sentence). Placed at the END of the
               French paragraph as a fallback, but flagged in the report so a human
               can verify/move it.

Surgical, additive, idempotent: only inserts; never edits existing French text or
other footnotes; skips a footnote whose key already appears (as ref or def) in the
source paragraph; logs and skips paragraphs/files absent in the source.

Usage:
  python3 src/scripts/harvest_footnotes.py                       # dry-run, carnet 063, source=en
  python3 src/scripts/harvest_footnotes.py --carnet 063
  python3 src/scripts/harvest_footnotes.py --carnet 063 --apply
  python3 src/scripts/harvest_footnotes.py --carnet 063 --source en --langs en
"""
import os, re, glob, sys, argparse

REPO_CONTENT = 'content'

# Paragraph ID line: %% NNN.PPPP %%  (also tolerate the legacy [//]: # (NNN.PPPP) form)
PARA_RE = re.compile(
    r'^(?:%%\s*([0-9]{3}\.[0-9]{4})\s*%%|\[//\]:\s*#\s*\(\s*([0-9]{3}\.[0-9]{4})\s*\))\s*$')
# Footnote DEFINITION:  [^key]: text
DEF_RE = re.compile(r'^\[\^([^\]]+)\]:\s?(.*)$')
# Leading italic term in a def body:  *Costume de capucin* — ...
ITALIC_LEAD_RE = re.compile(r'^\*([^*]+)\*')
# Any italic *...* span in a def body (used by the anchor-rescue pass).
ITALIC_ANY_RE = re.compile(r'\*([^*\n]+)\*')


def parse_args():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--carnet', default='063',
                   help='carnet number, 3-digit (default: 063)')
    p.add_argument('--source', default='en',
                   help='language to harvest footnotes FROM (default: en). '
                        'Future: pick the richest language per entry; seam left below.')
    p.add_argument('--langs', default='en',
                   help='comma list of candidate source languages (future multi-source '
                        'selection). For now only --source is read; default: en')
    p.add_argument('--apply', action='store_true',
                   help='write changes (default: dry-run, no writes)')
    p.add_argument('--high-only', dest='high_only', action='store_true',
                   help='only harvest HIGH-confidence footnotes; skip LOW/needs_review '
                        'entirely (no def AND no ref inserted for LOW)')
    p.add_argument('--report', default=None,
                   help='optional path to write a markdown dry-run report')
    p.add_argument('--selftest', action='store_true',
                   help='assert known 063 anchor cases (emphasis-span + rescues) and exit')
    return p.parse_args()


def para_id(line):
    m = PARA_RE.match(line.rstrip('\n'))
    if not m:
        return None
    return m.group(1) or m.group(2)


def is_comment_or_blank(line):
    """Lines that are NOT translation/source body text within a cluster."""
    s = line.strip()
    if s == '':
        return True
    if s.startswith('%%') or s.startswith('[//]:'):
        return True
    return False


def split_clusters(lines):
    """Split a file's lines into (pid, start, end) cluster ranges.

    Returns list of dicts: {pid, start, end} where [start, end) is the line range
    that belongs to that paragraph (from its ID line up to the next ID line or EOF).
    Lines before the first ID (frontmatter) are ignored.
    """
    clusters = []
    cur = None
    for i, ln in enumerate(lines):
        pid = para_id(ln)
        if pid is not None:
            if cur is not None:
                cur['end'] = i
                clusters.append(cur)
            cur = {'pid': pid, 'start': i, 'end': None}
    if cur is not None:
        cur['end'] = len(lines)
        clusters.append(cur)
    return clusters


def parse_en_footnotes(lines, clusters):
    """Return {pid: [footnote, ...]} for the English file.

    Each footnote: {key, def_text, def_lines, term, en_end_of_para}
      key            - footnote key (e.g. '1')
      def_text       - full definition body text (may be multi-line, joined with \n)
      term           - leading italic *term* (without asterisks) or None
      en_end_of_para - True if the inline [^key] ref sits at the end of the English
                       paragraph's text (after stripping trailing quotes/punct)
    Footnotes are returned in their English document order within the cluster.
    """
    out = {}
    n = len(lines)
    for c in clusters:
        pid, start, end = c['pid'], c['start'], c['end']
        defs = []                  # (order_index, key, def_text, term)
        # 1) collect footnote definitions physically inside this cluster
        i = start
        order = 0
        while i < end:
            m = DEF_RE.match(lines[i].rstrip('\n'))
            if m:
                key, body = m.group(1), m.group(2)
                def_body_lines = [body]
                j = i + 1
                # multi-line def: continuation lines until blank / next def / para ID
                while j < end:
                    nxt = lines[j].rstrip('\n')
                    # A def body continues only onto plain text lines. Stop at a blank
                    # line, the next def, a paragraph ID, or a %% / [//]: comment line
                    # (TR/LAN/etc. comments can directly follow a def with no blank line).
                    if (nxt.strip() == '' or DEF_RE.match(nxt) or para_id(nxt)
                            or is_comment_or_blank(nxt)):
                        break
                    def_body_lines.append(nxt)
                    j += 1
                def_text = '\n'.join(def_body_lines).rstrip()
                term_m = ITALIC_LEAD_RE.match(def_text)
                term = term_m.group(1).strip() if term_m else None
                defs.append((order, key, def_text, term))
                order += 1
                i = j
                continue
            i += 1
        if not defs:
            continue
        # 2) english body text of this cluster (lines that are real text, not %% / def)
        en_text_lines = []
        for k in range(start, end):
            ln = lines[k].rstrip('\n')
            if para_id(ln):
                continue
            if is_comment_or_blank(ln):
                continue
            if DEF_RE.match(ln):
                continue
            # English heading line "# Friday, 7 July 1876" still counts as body for
            # ref-position purposes, but refs never sit on headings, so harmless.
            en_text_lines.append(ln)
        en_text = '\n'.join(en_text_lines)
        # 3) for each footnote, find its inline ref position in the english text and
        #    decide whether it is at the very end of the paragraph.
        # Determine end-of-paragraph: position of the last [^...] that is followed
        # only by closing quotes / punctuation / whitespace until end of en_text.
        fns = []
        for order, key, def_text, term in sorted(defs):
            ref_token = f'[^{key}]'
            pos = en_text.find(ref_token)
            en_end = False
            if pos != -1:
                tail = en_text[pos + len(ref_token):]
                # allow trailing closing quotes, punctuation, footnote refs, spaces
                tail_stripped = re.sub(r'["\'”’)\].,;:!?\s]', '', tail)
                # also strip any other footnote ref tokens in the tail
                tail_stripped = re.sub(r'\[\^[^\]]+\]', '', tail_stripped)
                en_end = (tail_stripped == '')
            fns.append({
                'key': key,
                'def_text': def_text,
                'term': term,
                'en_end_of_para': en_end,
                'en_ref_found': pos != -1,
            })
        out[pid] = fns
    return out


def find_fr_text_span(lines, start, end):
    """Within a source cluster [start,end), return (first_idx, last_idx) of the French
    body text lines (contiguous run of non-comment, non-blank, non-def lines, excluding
    a leading bare '# heading' line). Returns (None, None) if no body text.

    In originals the French text is the LAST content of the cluster: ID line, then
    %%/LAN comment lines, optional bare '# Date heading', then the French text line(s).
    """
    text_idxs = []
    for i in range(start, end):
        ln = lines[i].rstrip('\n')
        if para_id(ln):
            continue
        if is_comment_or_blank(ln):
            continue
        if DEF_RE.match(ln):
            continue
        if ln.lstrip().startswith('#'):
            # bare French date heading line, e.g. "# Vendredi 7 juillet 1876"
            continue
        text_idxs.append(i)
    if not text_idxs:
        return (None, None)
    return (text_idxs[0], text_idxs[-1])


def harvest(args, orig_root=None):
    """Plan (and, with --apply, write) the footnote harvest for one carnet.

    orig_root overrides the directory tree the _original/ source files are read from
    (defaults to REPO_CONTENT). Used by --selftest to run against a pristine temp copy
    so the test is independent of whether the real carnet has already been harvested.
    """
    carnet = args.carnet
    source = args.source
    orig_root = orig_root or REPO_CONTENT
    en_glob = f'{REPO_CONTENT}/{source}/{carnet}/*.md'
    files = sorted(glob.glob(en_glob))
    files = [f for f in files if os.path.basename(f) not in ('README.md', 'PROGRESS.md')]

    records = []          # one per harvested footnote, for the report
    stats = dict(en_footnotes=0, inserted=0, high=0, needs_review=0,
                 skip_already=0, skip_para_missing=0, skip_file_missing=0,
                 skip_low=0)
    # planned writes per source file: { src_path: list of (line_index, kind, text, key) }
    plans = {}

    for ef in files:
        base = os.path.basename(ef)
        en_lines = open(ef, encoding='utf-8').read().split('\n')
        en_clusters = split_clusters(en_lines)
        en_fns = parse_en_footnotes(en_lines, en_clusters)
        total_in_file = sum(len(v) for v in en_fns.values())
        stats['en_footnotes'] += total_in_file
        if total_in_file == 0:
            continue

        src_path = f'{orig_root}/_original/{carnet}/{base}'
        if not os.path.isfile(src_path):
            stats['skip_file_missing'] += total_in_file
            for pid, fns in en_fns.items():
                for fn in fns:
                    records.append(_rec(fn, pid, base, 'skip', 'file-missing', None))
            continue

        src_lines = open(src_path, encoding='utf-8').read().split('\n')
        src_clusters = {c['pid']: c for c in split_clusters(src_lines)}

        # We compute insertions as (line_index, kind, text) and apply per file after
        # all paragraphs are processed (kind: 'def' appended after fr text; 'ref' is a
        # text replacement handled inline via a separate map).
        text_replacements = {}   # line_index -> new_line_text
        def_inserts = []         # (after_line_index, [lines_to_insert])

        for pid, fns in en_fns.items():
            if pid not in src_clusters:
                stats['skip_para_missing'] += len(fns)
                for fn in fns:
                    records.append(_rec(fn, pid, base, 'skip', 'para-missing', None))
                continue
            c = src_clusters[pid]
            cstart, cend = c['start'], c['end']
            fr_first, fr_last = find_fr_text_span(src_lines, cstart, cend)
            if fr_first is None:
                # empty entry / no French text to anchor into
                stats['skip_para_missing'] += len(fns)
                for fn in fns:
                    records.append(_rec(fn, pid, base, 'skip', 'no-fr-text', None))
                continue

            # idempotency: gather existing footnote keys/refs already in this source cluster
            cluster_blob = '\n'.join(src_lines[cstart:cend])

            for fn in fns:
                key = fn['key']
                ref_token = f'[^{key}]'
                def_token = f'[^{key}]:'
                if ref_token in cluster_blob or def_token in cluster_blob:
                    stats['skip_already'] += 1
                    records.append(_rec(fn, pid, base, 'skip', 'already-present', None))
                    continue

                # --- decide ref placement & confidence ---
                # _place_ref is pure: it returns the edit but does NOT apply it, so we
                # can inspect confidence first and (under --high-only) skip LOW entirely
                # before mutating anything.
                # current working text of the French last line (may already have an
                # earlier ref inserted this run -> read from text_replacements first)
                last_line = text_replacements.get(fr_last, src_lines[fr_last])
                anchor_desc, confidence, new_last_line = _place_ref(
                    last_line, src_lines, fr_first, fr_last, text_replacements, fn)

                # --high-only: skip LOW/needs_review footnotes outright (no ref, no def)
                if args.high_only and confidence != 'HIGH':
                    stats['skip_low'] += 1
                    records.append(_rec(fn, pid, base, 'skip', 'low-skipped', anchor_desc))
                    continue

                # record the ref edit (always on the last French text line, except the
                # HIGH italic-anchor case which may be on an earlier fr line)
                if new_last_line is not None:
                    line_idx, new_text = new_last_line
                    text_replacements[line_idx] = new_text

                # queue the definition insert: after the LAST French text line, blank + def
                def_lines_out = [''] + _format_def_lines(key, fn['def_text'])
                def_inserts.append((fr_last, def_lines_out, key))

                stats['inserted'] += 1
                if confidence == 'HIGH':
                    stats['high'] += 1
                else:
                    stats['needs_review'] += 1
                records.append(_rec(fn, pid, base, 'insert', confidence, anchor_desc))

        # ---- assemble new file content for this source file ----
        plans[src_path] = {
            'text_replacements': text_replacements,
            'def_inserts': def_inserts,
        }
        if args.apply and (text_replacements or def_inserts):
            new_lines = _apply_plan(src_lines, text_replacements, def_inserts)
            open(src_path, 'w', encoding='utf-8').write('\n'.join(new_lines))

    return stats, records, plans


def _format_def_lines(key, def_text):
    """Render the definition block lines (def_text may be multi-line)."""
    parts = def_text.split('\n')
    first = f'[^{key}]: {parts[0]}'
    rest = parts[1:]
    return [first] + rest


def _place_ref(last_line, src_lines, fr_first, fr_last, text_replacements, fn):
    """Decide where to insert [^key] and return (anchor_desc, confidence, edit).

    edit is (line_index, new_line_text) or None.
    HIGH:
      - an italic French term from the def body found UNIQUELY in the French prose
        -> insert after it (the leading term is tried first, then any other *...*
        span in the def body, in order; first unique match wins)
      - else english ref at end-of-paragraph -> append at end of last French line
    LOW (needs_review):
      - append at end of last French line, flagged
    """
    key = fn['key']
    ref = f'[^{key}]'

    # 1) HIGH via an italic French term anchored uniquely in the French prose.
    # Candidate terms, in priority order: the leading *term* (if any), then every
    # other italic *...* span in the def body. A candidate qualifies only if it
    # appears EXACTLY ONCE across the cluster's French text lines (comment lines are
    # already excluded by find_fr_text_span). This rescues cases where the French
    # term is not the leading gloss (e.g. "Eight-spring barouche — *calèche
    # huit-ressorts*"). Sub-phrase splitting / proper-noun matching are deliberately
    # NOT attempted — those stay flagged for human judgement.
    candidates = []
    seen = set()
    for t in _candidate_terms(fn):
        if t and t not in seen:
            seen.add(t)
            candidates.append(t)

    for term in candidates:
        hit = _unique_term_hit(term, src_lines, fr_first, fr_last, text_replacements)
        if hit is not None:
            idx, line, m = hit
            insert_pos = _advance_past_emphasis(line, m.end())
            new_line = line[:insert_pos] + ref + line[insert_pos:]
            return (f'after "{m.group(0)}"', 'HIGH', (idx, new_line))

    # 2) HIGH via end-of-paragraph english ref -> append at end of last French line
    if fn['en_end_of_para']:
        new_line = _append_ref_end(last_line, ref)
        return ('END', 'HIGH', (fr_last, new_line))

    # 3) LOW / needs_review -> append at end of last French line, flagged
    new_line = _append_ref_end(last_line, ref)
    return ('FLAGGED (end fallback)', 'LOW', (fr_last, new_line))


def _candidate_terms(fn):
    """Yield candidate French anchor terms from a footnote: the leading italic term
    first (fn['term']), then every other italic *...* span in the def body, in order."""
    if fn.get('term'):
        yield fn['term'].strip()
    for m in ITALIC_ANY_RE.finditer(fn['def_text']):
        yield m.group(1).strip()


def _unique_term_hit(term, src_lines, fr_first, fr_last, text_replacements):
    """Return (line_idx, line_text, match) if `term` occurs EXACTLY ONCE across the
    French text lines [fr_first, fr_last]; else None. Prefers an exact-case match;
    falls back to case-insensitive only if there is no exact-case occurrence at all.
    """
    pat = re.escape(term)
    for flags, _name in ((0, 'cs'), (re.IGNORECASE, 'ci')):
        hits = []
        for idx in range(fr_first, fr_last + 1):
            line = text_replacements.get(idx, src_lines[idx])
            for m in re.finditer(pat, line, flags):
                hits.append((idx, line, m))
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            # ambiguous at this case-sensitivity; do not fall through to a looser
            # match that could only be MORE ambiguous — bail out for this term.
            return None
    return None


def _advance_past_emphasis(line, pos):
    """If the chars right after `pos` are markdown emphasis markers (* ** _ __), move
    past them so the ref lands OUTSIDE the emphasis span, e.g. *papabile*[^2] rather
    than *papabile[^2]*. Handles up to two markers (e.g. closing ** or __)."""
    n = len(line)
    while pos < n and line[pos] in '*_':
        pos += 1
    return pos


def _append_ref_end(line, ref):
    """Append [^key] at the end of the French text, before any trailing whitespace."""
    stripped = line.rstrip()
    trailing = line[len(stripped):]
    return stripped + ref + trailing


def _apply_plan(src_lines, text_replacements, def_inserts):
    """Build the new file lines: apply ref text replacements, then insert def blocks.

    def_inserts: list of (after_line_index, [lines]) — inserted AFTER that line index
    (after any earlier inserts for the same anchor preserve EN order).
    """
    # group def inserts by their anchor line, preserving append order
    inserts_by_line = {}
    for after_idx, block, key in def_inserts:
        inserts_by_line.setdefault(after_idx, []).extend(block)

    out = []
    for i, ln in enumerate(src_lines):
        out.append(text_replacements.get(i, ln))
        if i in inserts_by_line:
            out.extend(inserts_by_line[i])
    return out


def _rec(fn, pid, base, action, confidence, anchor):
    return {
        'key': fn['key'],
        'pid': pid,
        'file': base,
        'action': action,          # insert | skip
        'confidence': confidence,  # HIGH | LOW | reason-for-skip
        'anchor': anchor,          # matched substring / END / FLAGGED / None
        'term': fn.get('term'),
        'en_end_of_para': fn.get('en_end_of_para'),
        'en_ref_found': fn.get('en_ref_found'),
        'def_text': fn['def_text'],
    }


def print_summary(args, stats, records):
    mode = ' [HIGH-ONLY]' if args.high_only else ''
    print(f"=== harvest_footnotes: carnet {args.carnet}, source={args.source}{mode} ===")
    print(f"EN footnotes found:        {stats['en_footnotes']}")
    print(f"{'Inserted' if args.apply else 'Would insert'}:              {stats['inserted']}")
    print(f"  HIGH confidence:         {stats['high']}")
    print(f"  needs_review (LOW):      {stats['needs_review']}")
    if args.high_only:
        print(f"Skipped (LOW, high-only):  {stats['skip_low']}")
    print(f"Skipped (already present): {stats['skip_already']}")
    print(f"Skipped (para missing):    {stats['skip_para_missing']}")
    print(f"Skipped (file missing):    {stats['skip_file_missing']}")
    print(f"\n{'APPLIED' if args.apply else 'DRY-RUN (no changes written)'}")


def write_report(args, stats, records, path):
    def trunc(s, n=80):
        s = s.replace('\n', ' ').strip()
        return s if len(s) <= n else s[:n - 1] + '…'

    inserts = [r for r in records if r['action'] == 'insert']
    skips = [r for r in records if r['action'] == 'skip']
    flagged = [r for r in inserts if r['confidence'] == 'LOW']

    L = []
    L.append(f"# Footnote harvest dry-run — carnet {args.carnet} (source: {args.source})\n")
    L.append(f"_Generated by `src/scripts/harvest_footnotes.py --carnet {args.carnet}` "
             f"(dry-run, no files modified)._\n")
    L.append("## Summary\n")
    L.append(f"| Metric | Count |")
    L.append(f"|--------|------:|")
    L.append(f"| EN footnotes found | {stats['en_footnotes']} |")
    L.append(f"| Would insert | {stats['inserted']} |")
    L.append(f"| — HIGH confidence | {stats['high']} |")
    L.append(f"| — needs_review (LOW) | {stats['needs_review']} |")
    L.append(f"| Skipped: already present | {stats['skip_already']} |")
    L.append(f"| Skipped: paragraph/text missing | {stats['skip_para_missing']} |")
    L.append(f"| Skipped: source file missing | {stats['skip_file_missing']} |")
    ratio = (f"{stats['high']}:{stats['needs_review']}"
             if stats['needs_review'] else f"{stats['high']}:0")
    L.append(f"\n**HIGH : needs_review ratio = {ratio}**\n")

    L.append("## Per-footnote plan\n")
    L.append("| key | paragraph | entry | confidence | anchor | def (truncated) |")
    L.append("|-----|-----------|-------|------------|--------|-----------------|")
    for r in sorted(inserts, key=lambda r: (r['file'], r['pid'], r['key'])):
        L.append(f"| [^{r['key']}] | {r['pid']} | {r['file']} | {r['confidence']} | "
                 f"{trunc(str(r['anchor']), 40)} | {trunc(r['def_text'])} |")

    if skips:
        L.append("\n## Skipped footnotes\n")
        L.append("| key | paragraph | entry | reason |")
        L.append("|-----|-----------|-------|--------|")
        for r in sorted(skips, key=lambda r: (r['file'], r['pid'], r['key'])):
            L.append(f"| [^{r['key']}] | {r['pid']} | {r['file']} | {r['confidence']} |")

    if flagged:
        L.append("\n## Ambiguous cases (needs_review)\n")
        L.append("Each was placed at the END of the French paragraph as a fallback. "
                 "A human should confirm or move the inline `[^key]`.\n")
        for r in sorted(flagged, key=lambda r: (r['file'], r['pid'], r['key'])):
            L.append(f"### [^{r['key']}] — {r['pid']} ({r['file']})\n")
            L.append(f"- **Why flagged:** "
                     f"{'no leading French term; ' if not r['term'] else f'leading term *{r['term']}* not found literally in French; '}"
                     f"{'English ref not at end of paragraph' if not r['en_end_of_para'] else 'end-of-para'}"
                     f"{'; English inline ref not found' if not r['en_ref_found'] else ''}")
            L.append(f"- **Definition:** {r['def_text']}\n")

    open(path, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f"\nReport written: {path}")


def run_selftest(args):
    """Dry-run 063 and assert the emphasis-span fix and the three italic-rescue cases.

    Checks (verified against the real source files):
      - 063.0248 [^2] -> "*papabile*[^2]"        (ref OUTSIDE the emphasis span)
      - 063.0500 [^6] -> "*Gloriae cupiditate*[^6]"
      - 063.0118 [^6] -> ref right after "calèche huit-ressorts"  (italic rescue, HIGH)
      - 063.0124 [^13] -> ref right after "grisés ensemble"        (italic rescue, HIGH)

    NOTE: 063.0162 [^13] (Psyché) is intentionally NOT rescued — its EN def reads
    "Psyché — the Greek mythological figure..." with NO italic *...* span, so it is a
    plain proper-noun-led def. Per the rescue spec, non-italic proper-noun matching is
    left to human judgement, so this stays LOW/flagged (asserted below).
    """
    import tempfile, shutil
    args.carnet = '063'
    args.apply = False
    args.high_only = False

    # Build a PRISTINE temp copy of _original/063 with any previously-harvested
    # footnotes stripped, so the test holds regardless of whether the real carnet has
    # already been --apply'd. (Strips inline [^k] refs and [^k]: def blocks + the blank
    # line we insert before each def.) EN is read from the real tree, unmodified.
    tmp = tempfile.mkdtemp(prefix='hf_selftest_')
    try:
        od = f'{tmp}/_original/063'
        os.makedirs(od, exist_ok=True)
        for f in glob.glob(f'{REPO_CONTENT}/_original/063/*.md'):
            raw = open(f, encoding='utf-8').read().split('\n')
            out = []
            for ln in raw:
                if re.match(r'^\[\^[^\]]+\]:', ln):
                    # drop a def line, and a preceding blank line we had inserted
                    if out and out[-1].strip() == '':
                        out.pop()
                    continue
                out.append(re.sub(r'\[\^[^\]]+\](?!:)', '', ln))  # strip inline refs
            open(f'{od}/{os.path.basename(f)}', 'w', encoding='utf-8').write('\n'.join(out))

        _stats, records, plans = harvest(args, orig_root=tmp)

        _selftest_assert(records, plans)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _selftest_assert(records, plans):
    # rebuild each source file's planned lines (no writes) and index them by paragraph
    expect_substr = {
        ('1876-07-18.md', '063.0248'): '*papabile*[^2]',
        ('1876-07-19.md', '063.0500'): '*Gloriae cupiditate*[^6]',
        ('1876-07-09.md', '063.0118'): 'calèche huit-ressorts[^6]',
        ('1876-07-09.md', '063.0124'): 'grisés ensemble[^13]',
    }
    expect_high = {  # these rescues/cases must be HIGH (not flagged)
        ('1876-07-09.md', '063.0118', '6'),
        ('1876-07-09.md', '063.0124', '13'),
        ('1876-07-18.md', '063.0248', '2'),
        ('1876-07-19.md', '063.0500', '6'),
    }
    expect_low = {  # plain proper-noun def: must stay flagged for human placement
        ('1876-07-12.md', '063.0162', '13'),
    }

    failures = []

    # 1) confirm the produced lines contain the expected anchored ref
    for src_path, plan in plans.items():
        base = os.path.basename(src_path)
        src_lines = open(src_path, encoding='utf-8').read().split('\n')
        new_lines = _apply_plan(src_lines, plan['text_replacements'], plan['def_inserts'])
        blob = '\n'.join(new_lines)
        for (b, pid), needle in expect_substr.items():
            if b == base and needle not in blob:
                failures.append(f"{base} {pid}: expected substring {needle!r} not produced")

    # 2) confirm the HIGH classification for those cases
    high_recs = {(r['file'], r['pid'], r['key']) for r in records
                 if r['action'] == 'insert' and r['confidence'] == 'HIGH'}
    for tup in expect_high:
        if tup not in high_recs:
            failures.append(f"{tup[0]} {tup[1]} [^{tup[2]}]: expected HIGH, was not")

    # 3) confirm the plain proper-noun cases stay LOW (flagged)
    low_recs = {(r['file'], r['pid'], r['key']) for r in records
                if r['action'] == 'insert' and r['confidence'] == 'LOW'}
    for tup in expect_low:
        if tup not in low_recs:
            failures.append(f"{tup[0]} {tup[1]} [^{tup[2]}]: expected LOW/flagged, was not")

    if failures:
        print("SELFTEST FAILED:")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("SELFTEST PASSED: emphasis-span fix (*papabile*[^2], "
          "*Gloriae cupiditate*[^6]) + 2 italic rescues (calèche huit-ressorts, "
          "grisés ensemble) verified; Psyché correctly left flagged (no italic span).")


if __name__ == '__main__':
    args = parse_args()
    if args.selftest:
        run_selftest(args)
        sys.exit(0)
    stats, records, plans = harvest(args)
    print_summary(args, stats, records)
    if args.report:
        write_report(args, stats, records, args.report)

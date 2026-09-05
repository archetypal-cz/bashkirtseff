#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
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

from _fileio import read_text, write_text_atomic

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
                   help='apply only DETERMINISTICALLY ANCHORED footnotes (HIGH italic + '
                        'MED proper-noun literal); skip only LOW/flagged. Implies --med.')
    p.add_argument('--med', action='store_true',
                   help='enable the conservative MED tier: anchor a footnote on its def '
                        'leading-segment term by an exact, case-sensitive, UNIQUE literal '
                        'match in the French prose (safety-filtered). Off by default; '
                        '--high-only turns it on automatically.')
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


def comment_flags(lines, path=None):
    """Per-line flags: True = annotation/blank, not translation/source body text.

    Classification of a line that starts with `%%`, by n = how many `%%` it carries:
      n == 1                      -> opens a multi-line block, closed by the next line
                                     ending in `%%`; every line between is annotation.
      n >= 2, ends with `%%`      -> one complete annotation line. A role comment may
                                     quote a literal `%%` in its prose, so an inner
                                     marker is tolerated and does NOT open a block.
      n >= 2, no trailing `%%`    -> complete leading comment followed by prose
                                     (`%% note %% body`); no block is opened either.
    A block still open at EOF is reported on stderr (naming `path` when given) rather
    than raised, so one malformed file cannot abort a whole-carnet run.
    """
    flags = []
    in_block = False
    for ln in lines:
        s = ln.strip()
        if in_block:
            flags.append(True)
            if s.endswith('%%'):
                in_block = False
            continue
        flags.append(s == '' or s.startswith('%%') or s.startswith('[//]:'))
        if s.startswith('%%') and s.count('%%') == 1:
            in_block = True
    if in_block:
        print(f'WARNING: unclosed %% comment block at EOF: {path or "<lines>"}',
              file=sys.stderr)
    return flags


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


def parse_en_footnotes(lines, clusters, flags=None):
    """Return {pid: [footnote, ...]} for the English file, keyed by the paragraph that
    holds each footnote's inline [^key] REF (NOT the paragraph the def physically sits in).

    This matters for ENDNOTES-STYLE entries, where the translator collects all the
    definitions in a closing block (e.g. a "[End of Cahier]" paragraph) while the inline
    [^n] markers stay in the earlier prose. Footnote keys restart per file and are unique
    within a file, so the inline ref location is unambiguous file-wide. A footnote is
    anchored to its REF paragraph; the def text travels there. For co-located layouts
    (def right after the paragraph that references it) the ref- and def-paragraphs are the
    same, so behaviour is unchanged.

    Each footnote: {key, def_text, term, en_end_of_para, en_ref_found, order}
      key            - footnote key (e.g. '1')
      def_text       - full definition body text (may be multi-line, joined with \n)
      term           - leading italic *term* (without asterisks) or None
      en_end_of_para - True if the inline [^key] ref sits at the end of its REF paragraph
      en_ref_found   - True if an inline [^key] ref was located anywhere in the file
      order          - English document order of the def (stable ordering within a pid)
    """
    flags = comment_flags(lines) if flags is None else flags
    # 1) collect ALL footnote definitions across the file, with the cluster they sit in.
    all_defs = []
    order = 0
    for c in clusters:
        start, end, def_pid = c['start'], c['end'], c['pid']
        i = start
        while i < end:
            m = None if flags[i] else DEF_RE.match(lines[i].rstrip('\n'))
            if m:
                key, body = m.group(1), m.group(2)
                def_body_lines = [body]
                j = i + 1
                # multi-line def: continuation lines until blank / next def / para ID /
                # %% or [//]: comment (TR/LAN comments can follow a def with no blank line)
                while j < end:
                    nxt = lines[j].rstrip('\n')
                    if flags[j] or DEF_RE.match(nxt) or para_id(nxt):
                        break
                    def_body_lines.append(nxt)
                    j += 1
                def_text = '\n'.join(def_body_lines).rstrip()
                term_m = ITALIC_LEAD_RE.match(def_text)
                term = term_m.group(1).strip() if term_m else None
                all_defs.append({'key': key, 'def_text': def_text, 'term': term,
                                 'def_pid': def_pid, 'order': order})
                order += 1
                i = j
                continue
            i += 1
    if not all_defs:
        return {}

    # 2) per-cluster English body text (real text only, not %% / def lines) — used to
    #    locate each footnote's inline ref and decide end-of-paragraph.
    cluster_text = {}
    for c in clusters:
        body = []
        for k in range(c['start'], c['end']):
            ln = lines[k].rstrip('\n')
            if flags[k] or para_id(ln) or DEF_RE.match(ln):
                continue
            body.append(ln)
        cluster_text[c['pid']] = '\n'.join(body)
    cluster_order = [c['pid'] for c in clusters]

    # 3) inline-ref OCCURRENCES in document order, per key. A key is NOT unique per file:
    #    footnote numbering restarts per diary entry, so the same [^1] can recur. We must
    #    pair by occurrence, not by key-search-first (which would collapse every [^1] into
    #    the first paragraph and stack refs/defs). cluster_text holds prose only (def lines
    #    excluded), so finditer yields inline refs in positional order.
    ref_occ = {}   # key -> [ {pid, en_end}, ... ] in document order
    for pid in cluster_order:
        txt = cluster_text[pid]
        for m in re.finditer(r'\[\^([^\]]+)\]', txt):
            tail = txt[m.end():]
            tail = re.sub(r'["\'”’)\].,;:!?\s]', '', tail)
            tail = re.sub(r'\[\^[^\]]+\]', '', tail)
            ref_occ.setdefault(m.group(1), []).append({'pid': pid, 'en_end': (tail == '')})

    # 4) pair the i-th def of a key with the i-th [^key] inline-ref occurrence. Identical
    #    to a single match for unique keys; correct for duplicate keys. A def with no
    #    remaining ref occurrence (orphan) stays at the def's own paragraph (end-fallback).
    out = {}
    used = {}
    for d in all_defs:
        key = d['key']
        i = used.get(key, 0)
        occs = ref_occ.get(key, [])
        if i < len(occs):
            target_pid, en_end, en_ref_found = occs[i]['pid'], occs[i]['en_end'], True
        else:
            target_pid, en_end, en_ref_found = d['def_pid'], False, False
        used[key] = i + 1
        out.setdefault(target_pid, []).append({
            'key': key,
            'def_text': d['def_text'],
            'term': d['term'],
            'en_end_of_para': en_end,
            'en_ref_found': en_ref_found,
            'order': d['order'],
        })
    # preserve English document order within each target paragraph
    for pid in out:
        out[pid].sort(key=lambda f: f['order'])
    return out


def find_fr_text_idxs(lines, start, end, flags):
    """Within a source cluster [start,end), return the line indices of the French body
    text (non-comment, non-blank, non-def lines, excluding a bare '# heading' line).

    In originals the French text is the LAST content of the cluster: ID line, then
    %%/LAN comment lines, optional bare '# Date heading', then the French text line(s).
    """
    text_idxs = []
    for i in range(start, end):
        ln = lines[i].rstrip('\n')
        if flags[i] or para_id(ln) or DEF_RE.match(ln):
            continue
        if ln.lstrip().startswith('#'):
            # bare French date heading line, e.g. "# Vendredi 7 juillet 1876"
            continue
        text_idxs.append(i)
    return text_idxs


def _alloc_key(key, used, reserved):
    """Return a footnote key that is unique within the file, recording it in `used`.

    Markdown footnote labels are file-scoped, so every allocation is checked against
    the FULL reserved set: keys already in the source file, keys the other footnotes
    of this file still intend to claim (`reserved`), and every key already handed out
    earlier in this run (`used`, which grows with each allocation). The chosen key is
    marked in both sets immediately, so two footnotes that arrive with the SAME
    original key cannot be reallocated onto each other.
    """
    if key not in used:
        used.add(key)
        reserved.add(key)
        return key
    taken = used | reserved
    if key.isdigit():
        n = 1
        while str(n) in taken:
            n += 1
        cand = str(n)
    else:
        i = 2
        while f'{key}-{i}' in taken:
            i += 1
        cand = f'{key}-{i}'
    used.add(cand)
    reserved.add(cand)
    return cand


def harvest(args, orig_root=None, src_root=None):
    """Plan (and, with --apply, write) the footnote harvest for one carnet.

    orig_root overrides the directory tree the _original/ source files are read from
    and src_root the tree the translation is harvested FROM (both default to
    REPO_CONTENT). Used by --selftest to run against pristine temp copies so the test is
    independent of whether the real carnet has already been harvested.
    """
    carnet = args.carnet
    source = args.source
    orig_root = orig_root or REPO_CONTENT
    src_root = src_root or REPO_CONTENT
    # --high-only applies all deterministically-anchored footnotes (HIGH + MED), so the
    # MED tier must be active when it is set.
    med_on = bool(getattr(args, 'med', False) or getattr(args, 'high_only', False))
    en_glob = f'{src_root}/{source}/{carnet}/*.md'
    files = sorted(glob.glob(en_glob))
    files = [f for f in files if os.path.basename(f) not in ('README.md', 'PROGRESS.md')]

    records = []          # one per harvested footnote, for the report
    stats = dict(en_footnotes=0, inserted=0, high=0, med=0, needs_review=0,
                 skip_already=0, skip_para_missing=0, skip_file_missing=0,
                 skip_low=0)
    # planned writes per source file: { src_path: list of (line_index, kind, text, key) }
    plans = {}

    for ef in files:
        base = os.path.basename(ef)
        en_lines = read_text(ef)[0].split('\n')
        en_clusters = split_clusters(en_lines)
        en_fns = parse_en_footnotes(en_lines, en_clusters, comment_flags(en_lines, ef))
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

        src_text, src_nl = read_text(src_path)
        src_lines = src_text.split('\n')
        src_flags = comment_flags(src_lines, src_path)
        src_clusters = {c['pid']: c for c in split_clusters(src_lines)}
        # Footnote labels are file-scoped: never reuse a key already in the source file,
        # nor one another footnote of this file is about to claim.
        file_keys = set(re.findall(r'\[\^([^\]]+)\]', '\n'.join(src_lines)))
        reserved_keys = file_keys | {fn['key'] for fns in en_fns.values() for fn in fns}

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
            fr_idxs = find_fr_text_idxs(src_lines, cstart, cend, src_flags)
            if not fr_idxs:
                # empty entry / no French text to anchor into
                stats['skip_para_missing'] += len(fns)
                for fn in fns:
                    records.append(_rec(fn, pid, base, 'skip', 'no-fr-text', None))
                continue

            # idempotency: gather existing footnote keys/refs already in this source cluster
            cluster_blob = '\n'.join(src_lines[cstart:cend])

            fr_last = fr_idxs[-1]
            for fn in fns:
                ref_token = f'[^{fn["key"]}]'
                if ref_token in cluster_blob:
                    stats['skip_already'] += 1
                    records.append(_rec(fn, pid, base, 'skip', 'already-present', None))
                    continue
                key = _alloc_key(fn['key'], file_keys, reserved_keys)

                # --- decide ref placement & confidence ---
                # _place_ref is pure: it returns the edit but does NOT apply it, so we
                # can inspect confidence first and (under --high-only) skip LOW entirely
                # before mutating anything.
                # current working text of the French last line (may already have an
                # earlier ref inserted this run -> read from text_replacements first)
                last_line = text_replacements.get(fr_last, src_lines[fr_last])
                anchor_desc, confidence, new_last_line = _place_ref(
                    last_line, src_lines, fr_idxs, text_replacements, fn, key,
                    med=med_on)

                # --high-only: apply all deterministically-anchored footnotes (HIGH and
                # MED); skip ONLY the LOW/flagged ones (no def, no ref).
                if args.high_only and confidence not in ('HIGH', 'MED'):
                    stats['skip_low'] += 1
                    file_keys.discard(key)
                    records.append(_rec(fn, pid, base, 'skip', 'low-skipped', anchor_desc))
                    continue

                # record the ref edit (always on the last French text line, except the
                # HIGH/MED anchor cases which may be on an earlier fr line)
                if new_last_line is not None:
                    line_idx, new_text = new_last_line
                    text_replacements[line_idx] = new_text

                # queue the definition insert: after the LAST French text line, blank + def
                def_lines_out = [''] + _format_def_lines(key, fn['def_text'])
                def_inserts.append((fr_last, def_lines_out, key))

                stats['inserted'] += 1
                if confidence == 'HIGH':
                    stats['high'] += 1
                elif confidence == 'MED':
                    stats['med'] += 1
                else:
                    stats['needs_review'] += 1
                records.append(_rec(fn, pid, base, 'insert', confidence, anchor_desc, key))

        # ---- assemble new file content for this source file ----
        plans[src_path] = {
            'text_replacements': text_replacements,
            'def_inserts': def_inserts,
        }
        if args.apply and (text_replacements or def_inserts):
            new_lines = _apply_plan(src_lines, text_replacements, def_inserts)
            write_text_atomic(src_path, '\n'.join(new_lines), src_nl)

    return stats, records, plans


def _format_def_lines(key, def_text):
    """Render the definition block lines (def_text may be multi-line)."""
    parts = def_text.split('\n')
    first = f'[^{key}]: {parts[0]}'
    rest = parts[1:]
    return [first] + rest


def _place_ref(last_line, src_lines, fr_idxs, text_replacements, fn, key,
               med=False):
    """Decide where to insert [^key] and return (anchor_desc, confidence, edit).

    edit is (line_index, new_line_text) or None.
    HIGH:
      - an italic French term from the def body found UNIQUELY in the French prose
        -> insert after it (the leading term is tried first, then any other *...*
        span in the def body, in order; first unique match wins)
      - else english ref at end-of-paragraph -> append at end of last French line
    MED (only when med=True):
      - a distinctive proper-noun token from the def's LEADING segment found by an
        exact, case-sensitive, UNIQUE literal match in the French prose. Conservative
        safety filters (see _med_anchor) reject titles/articles, generic words, and
        multi-entity defs. Placed right after the matched token, labelled MED so a
        human can audit it separately from HIGH.
    LOW (needs_review):
      - append at end of last French line, flagged
    """
    ref = f'[^{key}]'
    fr_last = fr_idxs[-1]

    # 1) HIGH via an italic French term anchored uniquely in the French prose.
    # Candidate terms, in priority order: the leading *term* (if any), then every
    # other italic *...* span in the def body. A candidate qualifies only if it
    # appears EXACTLY ONCE across the cluster's French text lines (comment lines are
    # already excluded by find_fr_text_idxs). This rescues cases where the French
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
        hit = _unique_term_hit(term, src_lines, fr_idxs, text_replacements)
        if hit is not None:
            idx, line, m = hit
            insert_pos = _advance_past_emphasis(line, m.end())
            new_line = line[:insert_pos] + ref + line[insert_pos:]
            return (f'after "{m.group(0)}"', 'HIGH', (idx, new_line))

    # 2) HIGH via end-of-paragraph english ref -> append at end of last French line.
    # This MUST take precedence over the MED tier: when the English ref sits at the end
    # of its paragraph, the end of the French paragraph is the confirmed home, even if a
    # proper noun appears mid-paragraph. (Otherwise MED would mis-anchor END footnotes.)
    if fn['en_end_of_para']:
        new_line = _append_ref_end(last_line, ref)
        return ('END', 'HIGH', (fr_last, new_line))

    # 3) MED (opt-in): only for footnotes that are NOT end-of-paragraph and have no
    # italic French anchor. Anchor on a distinctive proper-noun token from the def's
    # leading segment, by exact case-sensitive UNIQUE literal match in the French prose.
    # Conservative safety filters live in _med_anchor (titles dropped, multi-entity defs
    # rejected). Labelled MED for separate human audit.
    if med:
        term = _med_anchor(fn['def_text'], src_lines, fr_idxs, text_replacements)
        if term is not None:
            hit = _unique_term_hit(term, src_lines, fr_idxs, text_replacements)
            if hit is not None:
                idx, line, m = hit
                insert_pos = _advance_past_emphasis(line, m.end())
                new_line = line[:insert_pos] + ref + line[insert_pos:]
                return (f'after "{m.group(0)}" (proper-noun)', 'MED', (idx, new_line))

    # 4) LOW / needs_review -> append at end of last French line, flagged
    new_line = _append_ref_end(last_line, ref)
    return ('FLAGGED (end fallback)', 'LOW', (fr_last, new_line))


def _candidate_terms(fn):
    """Yield candidate French anchor terms from a footnote: the leading italic term
    first (fn['term']), then every other italic *...* span in the def body, in order."""
    if fn.get('term'):
        yield fn['term'].strip()
    for m in ITALIC_ANY_RE.finditer(fn['def_text']):
        yield m.group(1).strip()


# --- MED tier (proper-noun / leading-term literal match) -----------------------

# Leading titles/honorifics to strip from the head before token matching (so we anchor
# on the distinctive NAME, e.g. "Montpensier" from "Duke of Montpensier"). Only a LEADING
# title token is dropped; articles inside a name are never touched.
_MED_TITLES = {
    'Duke', 'Duc', 'Baron', 'Baronne', 'Prince', 'Princesse', 'Princess',
    'Count', 'Comte', 'Comtesse', 'Countess', 'Mme', 'Mlle', 'M.', 'Monsieur',
    'Saint', 'St', 'St.', 'Sainte', 'Cardinal', 'Pope', 'Pape', 'Queen', 'Reine',
    'King', 'Roi', 'Lord', 'Lady', 'The',
}
# A capitalized token (incl. accents), optionally hyphenated (Caccia-Club, Saint-Pierre).
_MED_CAPTOK_RE = re.compile(r"[A-ZÀ-ÖØ-Þ][\wÀ-ÖØ-öø-ÿ'’]*(?:-[A-Za-zÀ-ÖØ-öø-ÿ'’]+)*")


def _med_token_candidates(head):
    """From a cleaned head, yield distinctive proper-noun token candidates for the MED
    token fallback, longest-first. Drops a LEADING title/honorific token only (never an
    article inside the name), then offers each remaining capitalized token of length >= 4.
    """
    words = head.split()
    # drop a single leading title token (e.g. "Duke of Montpensier" -> "of Montpensier")
    if words and words[0] in _MED_TITLES:
        head = head[len(words[0]):].lstrip()
    toks = _MED_CAPTOK_RE.findall(head)
    distinctive = [t for t in dict.fromkeys(toks) if len(t) >= 4]
    # try longest tokens first (most specific anchor)
    return sorted(distinctive, key=lambda s: -len(s))


def _med_leading_term(def_text):
    """Derive the MED candidate term from a def's LEADING segment, or None if it fails
    the safety filters. The leading segment is the text BEFORE the first em/en-dash
    separator (" — ", " – ", or a bare —/–). We then:
      - strip wrapping emphasis (*...*) and straight/curly quotes,
      - strip a trailing parenthetical like "(1843–1904)" or "(1807)",
      - trim surrounding whitespace/punctuation.
    Safety filters (return None = stay LOW, never guess):
      - term shorter than 4 chars,
      - term has NO uppercase letter AND is a single word (lowercase function words;
        genuine lowercase French terms are handled by the italic tier),
      - term looks like English meta/prose rather than a name: contains an
        apostrophe-s ("'s"/"’s"), or is a long phrase (> 6 words).
    """
    # Multi-gloss guard: a def with TWO or more GLOSS dash separators is several footnote
    # glosses merged (e.g. "Reboux — famous milliner. Caroline — celebrated couturière.")
    # and we cannot know which entity the marker belongs to -> stay LOW, never guess.
    # Count only " — " gloss separators, ignoring en-dashes inside parentheticals such as
    # date ranges "(1831–1902)" (which are not gloss boundaries).
    no_parens = re.sub(r'\([^)]*\)', '', def_text)
    if len(re.findall(r'\s[—–]\s', no_parens)) >= 2:
        return None

    # split on the first gloss dash separator (em/en-dash with surrounding spaces)
    head = re.split(r'\s[—–]\s', def_text, maxsplit=1)[0]
    head = head.strip()
    head = head.strip('*').strip('"“”\'‘’').strip()
    # drop a trailing parenthetical, e.g. "Paul de Cassagnac (1843–1904)"
    head = re.sub(r'\s*\([^)]*\)\s*$', '', head).strip()
    # trim trailing punctuation that isn't part of a name
    head = head.strip(' .,;:')
    if not head:
        return None

    # --- safety filters ---
    if len(head) < 4:
        return None
    words = head.split()
    has_upper = any(c.isupper() for c in head)
    if not has_upper and len(words) == 1:
        return None
    if re.search(r"['’]s\b", head):          # English possessive -> meta/prose
        return None
    if len(words) > 6:                        # whole-sentence gloss, not a name
        return None
    return head


def _med_unique_cs(term, src_lines, fr_idxs, text_replacements, word_bound=False):
    """True iff `term` occurs EXACTLY ONCE (case-sensitive) across the French lines.
    When word_bound=True, the term must match at word boundaries (so a token like "Club"
    does NOT match inside "Caccia-Club"); used for the single-token fallback to avoid
    in-word false matches. The whole-segment attempt uses substring matching (segments are
    specific and may legitimately abut punctuation)."""
    pat = (r'(?<![\wÀ-ɏ])' + re.escape(term) + r'(?![\wÀ-ɏ])'
           if word_bound else re.escape(term))
    n = 0
    for idx in fr_idxs:
        line = text_replacements.get(idx, src_lines[idx])
        n += len(re.findall(pat, line))
        if n > 1:
            return False
    return n == 1


def _med_anchor(def_text, src_lines, fr_idxs, text_replacements):
    """MED tier: anchor on the def's leading segment by an EXACT, CASE-SENSITIVE, UNIQUE
    literal match in the French prose. Returns the term to anchor on, or None.

    Two attempts, both gated by _med_leading_term's guards (multi-gloss def stays LOW;
    len >= 4; not a lowercase single word; no English possessive; <= 6 words):
      1. the WHOLE cleaned leading segment (e.g. "Mme Rattazzi", "Caccia-Club"); then
      2. a DISTINCTIVE TOKEN from it with a leading title/honorific dropped
         (e.g. "Montpensier" from "Duke of Montpensier"), longest token first.
    A candidate qualifies only if it occurs EXACTLY ONCE (case-sensitive) in the prose;
    0 or >1 -> skip. Both attempts share the same uniqueness rule, so we never guess an
    ambiguous position.
    """
    head = _med_leading_term(def_text)
    if head is None:
        return None
    # 1) whole leading segment
    if _med_unique_cs(head, src_lines, fr_idxs, text_replacements):
        return head
    # 2) distinctive token (title dropped), longest-first, WORD-BOUNDARY match so a token
    # never anchors inside a larger word (e.g. "Club" must not match in "Caccia-Club").
    for tok in _med_token_candidates(head):
        if _med_unique_cs(tok, src_lines, fr_idxs, text_replacements,
                          word_bound=True):
            return tok
    return None


def _unique_term_hit(term, src_lines, fr_idxs, text_replacements):
    """Return (line_idx, line_text, match) if `term` occurs EXACTLY ONCE across the
    French text lines `fr_idxs`; else None. Prefers an exact-case match;
    falls back to case-insensitive only if there is no exact-case occurrence at all.
    """
    pat = re.escape(term)
    for flags, _name in ((0, 'cs'), (re.IGNORECASE, 'ci')):
        hits = []
        for idx in fr_idxs:
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


def _rec(fn, pid, base, action, confidence, anchor, key=None):
    return {
        'key': key or fn['key'],
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
    med_on = args.med or args.high_only
    mode = ' [HIGH-ONLY: HIGH+MED]' if args.high_only else (' [+MED]' if args.med else '')
    print(f"=== harvest_footnotes: carnet {args.carnet}, source={args.source}{mode} ===")
    print(f"EN footnotes found:        {stats['en_footnotes']}")
    print(f"{'Inserted' if args.apply else 'Would insert'}:              {stats['inserted']}")
    print(f"  HIGH confidence:         {stats['high']}")
    if med_on:
        print(f"  MED (proper-noun):       {stats['med']}")
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
    if args.med or args.high_only:
        L.append(f"| — MED (proper-noun) | {stats['med']} |")
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
            term_note = ('no leading French term; ' if not r['term']
                         else f"leading term *{r['term']}* not found literally in French; ")
            L.append(f"- **Why flagged:** {term_note}"
                     f"{'English ref not at end of paragraph' if not r['en_end_of_para'] else 'end-of-para'}"
                     f"{'; English inline ref not found' if not r['en_ref_found'] else ''}")
            L.append(f"- **Definition:** {r['def_text']}\n")

    write_text_atomic(path, '\n'.join(L) + '\n')
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

        # Base pass (default tiers, MED off): HIGH anchors + emphasis fix.
        args.med = False
        _stats, records, plans = harvest(args, orig_root=tmp)
        _selftest_assert(records, plans)

        # MED pass: proper-noun tier on, validated against the human-placed positions
        # committed in carnet 063 (13 expected MED placements, all correct).
        args.med = True
        _stats_m, records_m, _plans_m = harvest(args, orig_root=tmp)
        _selftest_assert_med(records_m)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    _selftest_comment_flags()
    _selftest_keys_and_blocks(args)


def _selftest_comment_flags():
    """Unit-check comment_flags line classification (no I/O).

    Covers the three shapes a `%%` line can take: a genuine multi-line block opener;
    a complete role comment whose prose QUOTES a literal `%%` (odd marker count, still
    one annotation line); and `%% note %% body`, where the annotation closes on the
    line and the trailing body is prose. Neither of the last two may open a block —
    doing so silently swallows the following diary text.
    """
    lines = [
        '%% 001.0001 %%',
        'Texte français ordinaire.',
        '%% 2026-06-12T10:00:03 RED: stranded text after the closing %%. Rejoined. %%',
        'Encore du texte français.',
        '%% LAN: gloss %% Du texte après le commentaire.',
        'Une ligne de texte qui suit.',
        '%% 2026-01-01T00:00:00 TR: une note qui court',
        'sur deux lignes %%',
        'Fin du texte.',
    ]
    expect = [True, False, True, False, True, False, True, True, False]
    got = comment_flags(lines)
    if got != expect:
        print("SELFTEST FAILED (comment_flags):")
        for i, (g, e) in enumerate(zip(got, expect)):
            if g != e:
                print(f"  - line {i + 1}: got {g}, expected {e}: {lines[i][:70]!r}")
        sys.exit(1)
    print("SELFTEST PASSED (comment_flags): literal-%%-quoting role comment and "
          "`%% note %% body` both stay single lines; real block still spans 2 lines.")


def _selftest_keys_and_blocks(args):
    """Synthetic carnet 900: file-scoped key collisions and comment-line classification.

      (a) the source file already holds `[^1]:`, so the harvested `[^1]` must be
          reallocated to a key no other footnote of that file claims;
      (b) a `[^9]:` definition sitting inside a multi-line `%% ... %%` block is
          annotation, not a footnote, and must not be harvested at all;
      (c) TWO footnotes arriving with the SAME original key `1` (English numbering
          restarts per diary entry) must be reallocated to two DIFFERENT keys, neither
          of them the `[^1]` already present in the source file;
      (d) a `%% note %% body` line closes its annotation on the line, so it must NOT
          open a comment block that swallows the footnote definition below it.
    """
    import tempfile, shutil, copy

    en_text = """---
date: 1876-01-01
---

%% 900.0001 %%
English prose about a lampion.[^1]

[^1]: *lampion* — a paper lantern.

%% 900.0002 %%
English prose about a fiacre.[^2]

%% 2026-01-01T00:00:00 RED: a note that runs over
[^9]: this definition is inside the comment block %%

[^2]: *fiacre* — a hackney carriage.
"""
    fr_text = """---
date: 1876-01-01
---

%% 900.0001 %%
Un texte français avec un lampion ici.

%% 900.0002 %%
Une autre phrase avec un fiacre ici.

[^1]: note préexistante.
"""
    # (c) both English footnotes carry the ORIGINAL key `1`; the source file already
    # holds `[^1]`, so the two must land on two distinct freshly-allocated keys.
    en_dup = """---
date: 1876-01-02
---

%% 900.0010 %%
English prose about a lampion.[^1]

[^1]: *lampion* — a paper lantern.

%% 900.0011 %%
English prose about a fiacre.[^1]

[^1]: *fiacre* — a hackney carriage.
"""
    # the pre-existing `[^1]` lives in a THIRD paragraph, so neither harvested footnote
    # is skipped by the cluster-scoped already-present check and both must be allocated.
    fr_dup = """---
date: 1876-01-02
---

%% 900.0010 %%
Un texte français avec un lampion ici.

%% 900.0011 %%
Une autre phrase avec un fiacre ici.

%% 900.0012 %%
Un dernier paragraphe avec une note.

[^1]: note préexistante.
"""
    # (d) `%% gloss %% prose` closes on the line: the def below must stay harvestable.
    en_inline = """---
date: 1876-01-03
---

%% 900.0020 %%
%% LAN: gloss %% English prose about a calèche.[^1]

[^1]: *calèche* — an open carriage.
"""
    fr_inline = """---
date: 1876-01-03
---

%% 900.0020 %%
Une phrase française avec une voiture ici.
"""
    tmp = tempfile.mkdtemp(prefix='hf_selftest_keys_')
    try:
        os.makedirs(f'{tmp}/en/900')
        os.makedirs(f'{tmp}/_original/900')
        for base, en_t, fr_t in (('1876-01-01.md', en_text, fr_text),
                                 ('1876-01-02.md', en_dup, fr_dup),
                                 ('1876-01-03.md', en_inline, fr_inline)):
            open(f'{tmp}/en/900/{base}', 'w', encoding='utf-8').write(en_t)
            open(f'{tmp}/_original/900/{base}', 'w', encoding='utf-8').write(fr_t)

        a = copy.copy(args)
        a.carnet, a.source, a.apply, a.med, a.high_only = '900', 'en', False, False, False
        _stats, records, plans = harvest(a, orig_root=tmp, src_root=tmp)

        failures = []
        inserts = {(r['pid'], r['key']) for r in records if r['action'] == 'insert'}
        expect = {('900.0001', '3'), ('900.0002', '2'),
                  ('900.0010', '2'), ('900.0011', '3'), ('900.0020', '1')}
        if inserts != expect:
            failures.append(f"expected inserts {sorted(expect)}, got {sorted(inserts)}")
        if any(r['key'] == '9' for r in records):
            failures.append("[^9] inside a multi-line %% block was harvested")

        blobs = {}
        for src_path, plan in plans.items():
            src_lines = open(src_path, encoding='utf-8').read().split('\n')
            blobs[os.path.basename(src_path)] = '\n'.join(
                _apply_plan(src_lines, plan['text_replacements'], plan['def_inserts']))
        blob = blobs.get('1876-01-01.md', '')
        if 'lampion[^3]' not in blob:
            failures.append("reallocated ref [^3] not anchored after 'lampion'")
        if '[^3]: *lampion*' not in blob:
            failures.append("reallocated definition [^3] not emitted")
        if '[^1]: note préexistante.' not in blob or blob.count('[^1]:') != 1:
            failures.append("pre-existing [^1] definition was collided with")

        # (c) two same-key footnotes -> two distinct keys, neither colliding with [^1]
        dup = blobs.get('1876-01-02.md', '')
        dup_keys = [r['key'] for r in records if r['pid'].startswith('900.001')
                    and r['action'] == 'insert']
        if len(set(dup_keys)) != 2 or '1' in dup_keys:
            failures.append(f"duplicate original key `1` reallocated to {dup_keys} "
                            f"(expected two distinct non-'1' keys)")
        for needle in ('lampion[^2]', 'fiacre[^3]', '[^2]: *lampion*', '[^3]: *fiacre*'):
            if needle not in dup:
                failures.append(f"same-original-key case: {needle!r} not produced")
        if dup.count('[^1]:') != 1:
            failures.append("same-original-key case collided with the pre-existing [^1]")

        # (d) the `%% gloss %% prose` line must not have swallowed the def below it
        if ('900.0020', '1') not in inserts:
            failures.append("`%% note %% body` line opened a comment block: the "
                            "footnote definition under it was not harvested")

        if failures:
            print("SELFTEST FAILED (keys/blocks):")
            for f in failures:
                print("  - " + f)
            sys.exit(1)
        print("SELFTEST PASSED (keys/blocks): colliding [^1] reallocated to [^3]; "
              "two footnotes sharing original key [^1] reallocated to [^2]/[^3]; "
              "[^9] inside a multi-line %% block not harvested; "
              "`%% note %% body` did not open a block.")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _selftest_assert_med(records):
    """Assert the MED tier reproduces the human-placed proper-noun anchors in 063 and
    introduces no misattribution. Ground truth = the committed hand-placed positions."""
    # (file, pid, key) -> expected anchored MED term (case-sensitive). These 13 are the
    # MED placements the folded leading-segment + distinctive-token rule produces on 063,
    # each landing on the same entity/position the human hand-placed (the anchor token is
    # the last word of the matched term, so placement == the committed human position).
    expect_med = {
        ('1876-07-04-05.md', '063.0008', '2'): 'Paolo',
        ('1876-07-04-05.md', '063.0009', '3'): 'Bon Pasteur',
        ('1876-07-06.md', '063.0052', '3'): 'Bois',
        ('1876-07-06.md', '063.0056', '7'): 'Montpensier',
        ('1876-07-08.md', '063.0099', '4'): 'Jouvin',
        ('1876-07-09.md', '063.0118', '5'): 'Mme Rattazzi',
        ('1876-07-09.md', '063.0119', '7'): 'Bourbon',
        ('1876-07-09.md', '063.0123', '12'): 'Wittgenstein',
        ('1876-07-09.md', '063.0124', '14'): 'Paul de Cassagnac',
        ('1876-07-12.md', '063.0137', '1'): 'Caccia-Club',
        ('1876-07-12.md', '063.0141', '2'): 'Laferrière',
        ('1876-07-12.md', '063.0162', '13'): 'Psyché',
        ('1876-07-12.md', '063.0168', '16'): 'Méréville',
    }
    # The multi-gloss "Reboux — ... Caroline — ..." def MUST stay LOW (not MED-guessed):
    # leading segment "Reboux" is unique in the prose but the human attached the marker
    # to the second gloss (Caroline), so the multi-gloss guard must hold it LOW.
    expect_not_med = {('1876-07-06.md', '063.0052', '1')}

    med = {(r['file'], r['pid'], r['key']): r for r in records if r['confidence'] == 'MED'}
    failures = []
    for k, tok in expect_med.items():
        r = med.get(k)
        if r is None:
            failures.append(f"{k[0]} {k[1]} [^{k[2]}]: expected MED anchor on {tok!r}, "
                            f"was not MED")
            continue
        m = re.search(r'after "([^"]+)"', r['anchor'] or '')
        got = m.group(1) if m else None
        if got != tok:
            failures.append(f"{k[0]} {k[1]} [^{k[2]}]: MED anchored {got!r}, "
                            f"expected {tok!r}")
    for k in expect_not_med:
        if k in med:
            failures.append(f"{k[0]} {k[1]} [^{k[2]}]: multi-gloss def was MED-guessed "
                            f"(should stay LOW)")
    if len(med) != len(expect_med):
        failures.append(f"MED count {len(med)} != expected {len(expect_med)} "
                        f"(extra: {set(med) - set(expect_med)})")
    if failures:
        print("SELFTEST FAILED (MED tier):")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print(f"SELFTEST PASSED (MED tier): {len(expect_med)}/{len(expect_med)} proper-noun "
          f"anchors match the hand-placed 063 positions; multi-gloss def stays LOW.")


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

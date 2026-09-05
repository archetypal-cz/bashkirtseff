#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
glossary-resolve: REMAP candidate suggester (read-only).

Given a missing/broken glossary target — either a bare basename (e.g. NINA_BELLOTTI)
or a full target path (e.g. people/mentioned/NINA_BELLOTTI.md) — suggest existing
glossary entries that might be the SAME entity, to speed REMAP identity decisions.

Matching signals (combined into a score):
  - filename / id exact or substring
  - aliases: / name: frontmatter substring + token overlap
  - fuzzy ratio (difflib) on the normalized name tokens

Prints the top candidates with their category and a short Overview/Description
snippet so a human or agent can confirm the identity. READ-ONLY — never edits.

Examples:
  python3 src/scripts/glossary_resolve.py NINA_BELLOTTI       # -> MLLE_BELLOTTI
  python3 src/scripts/glossary_resolve.py HOWARD_CHILDREN     # -> HOWARD_FAMILY
  python3 src/scripts/glossary_resolve.py people/mentioned/M_GROS.md
"""
import glob
import os
import re
import sys
from difflib import SequenceMatcher

GLOSS_ROOT = "content/_original/_glossary"
TOP_N = 8

STOP = {"MR", "MME", "MLLE", "M", "MLE", "DE", "DU", "LA", "LE", "LES", "FAMILY",
        "CHILDREN", "GIRLS", "BOYS", "FAMILLE", "THE", "OF", "AND", "TWO"}

# Words signalling a family/group entity (used to nudge group queries toward
# *_FAMILY entries, e.g. HOWARD_CHILDREN -> HOWARD_FAMILY).
GROUP_WORDS = {"FAMILY", "CHILDREN", "GIRLS", "BOYS", "FAMILLE", "SISTERS",
               "BROTHERS", "TWO", "PARENTS"}


def has_group(s):
    return bool(GROUP_WORDS & set(re.split(r"[^A-Za-z0-9]+", s.upper())))


def norm(s):
    """Uppercase, split on non-alphanumeric, drop stopwords -> token set."""
    toks = re.split(r"[^A-Za-z0-9]+", s.upper())
    return {t for t in toks if t and t not in STOP}


def basename_of(query):
    q = query.strip()
    if q.endswith(".md"):
        q = q[:-3]
    return os.path.basename(q)


def parse_frontmatter(text):
    """Return dict with id, name, aliases (list), category."""
    fm = {"id": None, "name": None, "aliases": [], "category": None}
    if not text.startswith("---"):
        return fm
    end = text.find("\n---", 3)
    if end == -1:
        return fm
    block = text[3:end]
    cur_list = None
    for raw in block.split("\n"):
        line = raw.rstrip()
        if re.match(r"^\s*-\s+", line) and cur_list is not None:
            cur_list.append(line.split("-", 1)[1].strip().strip('"\''))
            continue
        cur_list = None
        m = re.match(r"^(\w+):\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip().strip('"\'')
        if key == "id":
            fm["id"] = val
        elif key == "name":
            fm["name"] = val
        elif key == "category":
            fm["category"] = val
        elif key == "aliases":
            fm["aliases"] = []
            cur_list = fm["aliases"]
            if val:  # inline list form
                fm["aliases"].append(val)
    return fm


def overview_snippet(text, limit=160):
    """First non-empty content line after an Overview/Description/Basic heading."""
    lines = text.split("\n")
    in_fm = text.startswith("---")
    fm_done = not in_fm
    capture = False
    for ln in lines:
        s = ln.strip()
        if in_fm and not fm_done:
            if s == "---" and capture is False:
                # second --- closes frontmatter
                if ln is not lines[0]:
                    fm_done = True
            continue
        if s.startswith("#"):
            h = s.lstrip("#").strip().lower()
            capture = any(k in h for k in ("overview", "description", "basic", "summary"))
            continue
        if capture and s and not s.startswith("[No description"):
            return s[:limit]
    # fallback: first prose line after frontmatter
    for ln in lines:
        s = ln.strip()
        if s and not s.startswith(("#", "-", "---")):
            return s[:limit]
    return ""


def load_entries():
    entries = []
    for f in glob.glob(f"{GLOSS_ROOT}/**/*.md", recursive=True):
        try:
            text = open(f, encoding="utf-8").read()
        except OSError:
            continue
        fm = parse_frontmatter(text)
        base = os.path.basename(f)[:-3]
        rel = os.path.relpath(f, GLOSS_ROOT)
        cat = fm["category"] or os.path.dirname(rel)
        names = [n for n in ([fm["name"]] + fm["aliases"] + [fm["id"], base]) if n]
        tokens = set()
        for n in names:
            tokens |= norm(n)
        entries.append({
            "path": rel, "base": base, "cat": cat,
            "names": names, "tokens": tokens, "text": text,
        })
    return entries


def score(qbase, qtokens, qstr, e):
    s = 0.0
    eb = e["base"]
    # exact basename
    if eb == qbase:
        s += 100
    # substring either direction on basename
    if qbase in eb or eb in qbase:
        s += 30
    # token overlap
    if qtokens and e["tokens"]:
        inter = qtokens & e["tokens"]
        if inter:
            s += 25 * len(inter) / max(1, len(qtokens))
            # full containment of query tokens
            if qtokens <= e["tokens"]:
                s += 20
    # alias/name substring
    qlow = qstr.lower().replace("_", " ")
    for n in e["names"]:
        nl = n.lower()
        if qlow and (qlow in nl or nl in qlow):
            s += 15
            break
    # fuzzy on joined tokens
    a = " ".join(sorted(qtokens)) or qbase.lower()
    b = " ".join(sorted(e["tokens"])) or eb.lower()
    s += 20 * SequenceMatcher(None, a, b).ratio()
    # group-query nudge: a group query (…_CHILDREN/_GIRLS) toward a *_FAMILY entry
    # that shares the surname token (HOWARD_CHILDREN -> HOWARD_FAMILY).
    if has_group(qstr) and has_group(eb) and (qtokens & e["tokens"]):
        s += 35
    return s


def main():
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        print("usage: glossary-resolve <NAME-or-target-path>", file=sys.stderr)
        return 2
    query = sys.argv[1]
    qbase = basename_of(query)
    qtokens = norm(qbase)
    print(f"Resolving: {qbase}  (tokens: {', '.join(sorted(qtokens)) or '—'})")
    entries = load_entries()
    # exact-path existence note
    exact = [e for e in entries if e["base"] == qbase]
    if exact:
        print(f"NOTE: an entry named {qbase} already exists at "
              f"{exact[0]['cat']}/{qbase}.md")
    ranked = sorted(entries, key=lambda e: score(qbase, qtokens, query, e), reverse=True)
    print(f"\nTop {TOP_N} candidate entries:\n")
    for e in ranked[:TOP_N]:
        sc = score(qbase, qtokens, query, e)
        if sc <= 0:
            continue
        snip = overview_snippet(e["text"])
        print(f"  [{sc:5.1f}]  {e['base']}  ({e['cat']})")
        if snip:
            print(f"            {snip}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

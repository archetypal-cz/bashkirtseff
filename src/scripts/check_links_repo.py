#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
Repo-wide broken glossary-link scanner across ALL five content trees.

Trees: content/_original/, content/cz/, content/en/, content/uk/, content/fr/

Each tree references the SINGLE canonical glossary at content/_original/_glossary/,
but at a different relative depth:
  - _original/<carnet>/<file>.md   ->  ../_glossary/<cat>/<ID>.md          (one ..)
  - <lang>/<carnet>/<file>.md      ->  ../../_original/_glossary/<cat>/<ID>.md (two ..)

A link is "broken" when its target path does not resolve to a real file on disk
(this also catches wrong-depth links: a translation that writes ../_glossary/...
will not resolve from its own directory and is correctly flagged broken).

The glossary ALSO cross-references itself: entries link to sibling entries by
relative path. Those links live inside content/_original/_glossary/ and are not
reachable by the per-tree scan above (which only walks content/<tree>/<NNN>/),
so they were never checked. scan_glossary() covers them: every markdown .md link
in every glossary file, resolved relative to the linking file's own directory.

Prints per-tree distinct + instance counts and the broken-target list, then the
glossary-internal section, then a grand total. Exits non-zero if ANY link
anywhere is broken (CI-usable).

Usage:
  python3 src/scripts/check_links_repo.py
  python3 src/scripts/check_links_repo.py --quiet   # totals only
"""
import glob
import os
import re
import sys
from collections import Counter

TREES = ["_original", "cz", "en", "uk", "fr", "es"]
SKIP = {"README.md", "PROGRESS.md"}
GLOSSARY = "content/_original/_glossary"

# Match ANY markdown link whose target is a .md path passing through _glossary/,
# whatever the prefix: relative (../), bare (_glossary/...), leading-slash
# (/_original/_glossary/...) or mixed (/../_glossary/...). Restricting this to
# targets starting with ".." once hid 93 leading-slash links that verify-carnet
# flagged but this scanner reported as clean.
#
# We resolve the literal target relative to the file's own directory, so a
# wrong-depth or leading-slash path simply fails to resolve and is reported
# broken. External URLs (http://, https://, ...) are skipped explicitly.
LINK_RE = re.compile(r"\]\(([^)#\s]*_glossary/[^)#\s]+\.md)\)")
SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")


def scan_tree(lang):
    """Return (instances, Counter{glossary-relative-target: count}, [unreadable paths])."""
    broken = Counter()
    unreadable = []
    instances = 0
    for f in glob.glob(f"content/{lang}/[0-9][0-9][0-9]/*.md"):
        if os.path.basename(f) in SKIP:
            continue
        d = os.path.dirname(f)
        try:
            text = open(f, encoding="utf-8").read()
        except OSError as e:
            unreadable.append(f"{f}: {e}")
            continue
        for m in LINK_RE.finditer(text):
            target = m.group(1)
            if SCHEME_RE.match(target):
                continue  # external URL, not a repo path
            # os.path.join() would discard `d` for an absolute target and silently
            # resolve /_original/... against the filesystem root; strip the leading
            # slash so it stays anchored to the entry's own directory (and fails).
            resolved = os.path.normpath(os.path.join(d, target.lstrip("/")))
            if not os.path.isfile(resolved):
                # key the report on the path after _glossary/ for readability
                key = target.split("_glossary/", 1)[1]
                broken[key] += 1
                instances += 1
    return instances, broken, unreadable


# Glossary-internal links are relative to the linking entry's own directory and
# need not mention _glossary/ at all: "MAMAN.md", "./MAMAN.md",
# "../family/MAMAN.md" are all valid shapes. Match any markdown link to a .md
# target (optional #anchor) and resolve it literally, applying the same
# external-URL and leading-slash handling as scan_tree().
GLOSSARY_LINK_RE = re.compile(r"\]\(([^)\s]+?\.md)(?:#[^)]*)?\)")


def scan_glossary():
    """Broken .md links *inside* the glossary tree itself.

    Returns (instances, Counter{"<linking file rel to glossary>  ->  <target>": n},
             [unreadable paths]).
    """
    broken = Counter()
    unreadable = []
    instances = 0
    for dirpath, _dirnames, filenames in os.walk(GLOSSARY):
        for name in sorted(filenames):
            if not name.endswith(".md"):
                continue
            f = os.path.join(dirpath, name)
            try:
                text = open(f, encoding="utf-8").read()
            except OSError as e:
                unreadable.append(f"{f}: {e}")
                continue
            for m in GLOSSARY_LINK_RE.finditer(text):
                target = m.group(1)
                if SCHEME_RE.match(target):
                    continue  # external URL, not a repo path
                resolved = os.path.normpath(
                    os.path.join(dirpath, target.lstrip("/")))
                if not os.path.isfile(resolved):
                    src = os.path.relpath(f, GLOSSARY)
                    broken[f"{src}  ->  {target}"] += 1
                    instances += 1
    return instances, broken, unreadable


def main():
    quiet = "--quiet" in sys.argv[1:]
    total_broken = 0
    total_distinct = 0
    unreadable = []
    print("=== check-links-repo: broken glossary links: all content trees + glossary-internal ===")
    for lang in TREES:
        instances, broken, tree_unreadable = scan_tree(lang)
        unreadable.extend(tree_unreadable)
        distinct = len(broken)
        total_broken += instances
        total_distinct += distinct
        if instances == 0:
            print(f"{lang:>10}: 0 broken")
        else:
            print(f"{lang:>10}: {instances} broken, {distinct} distinct")
            if not quiet:
                for k, v in sorted(broken.items()):
                    print(f"            {v:>3}  {k}")
    g_instances, g_broken, g_unreadable = scan_glossary()
    unreadable.extend(g_unreadable)
    total_broken += g_instances
    total_distinct += len(g_broken)
    if g_instances == 0:
        print(f"{'glossary':>10}: 0 broken (internal cross-references)")
    else:
        print(f"{'glossary':>10}: {g_instances} broken, {len(g_broken)} distinct"
              " (internal cross-references)")
        if not quiet:
            for k, v in sorted(g_broken.items()):
                print(f"            {v:>3}  {k}")

    print(f"{'TOTAL':>10}: {total_broken} broken, {total_distinct} distinct")
    if unreadable:
        print(f"\nUNREADABLE: {len(unreadable)} file(s) could not be scanned:")
        for u in unreadable:
            print(f"  {u}")
    if total_broken or unreadable:
        print("FAIL: broken glossary links present."
              if total_broken else "FAIL: unreadable files were skipped.")
        return 1
    print("OK: 0 broken glossary links in any tree or inside the glossary.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

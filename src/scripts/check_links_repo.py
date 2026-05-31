#!/usr/bin/env python3
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

Prints per-tree distinct + instance counts and the broken-target list, then a
grand total. Exits non-zero if ANY link in ANY tree is broken (CI-usable).

Usage:
  python3 src/scripts/check_links_repo.py
  python3 src/scripts/check_links_repo.py --quiet   # totals only
"""
import glob
import os
import re
import sys
from collections import Counter

TREES = ["_original", "cz", "en", "uk", "fr"]
SKIP = {"README.md", "PROGRESS.md"}

# Match any markdown link whose target is a .md path that passes through _glossary/
# (any number of ../). We resolve the literal target relative to the file's dir, so
# a wrong-depth path simply fails to resolve and is reported broken.
LINK_RE = re.compile(r"\]\((\.\.[^)#]*?_glossary/[^)#]+\.md)\)")


def scan_tree(lang):
    """Return (instances, Counter{glossary-relative-target: count})."""
    broken = Counter()
    instances = 0
    for f in glob.glob(f"content/{lang}/[0-9][0-9][0-9]/*.md"):
        if os.path.basename(f) in SKIP:
            continue
        d = os.path.dirname(f)
        try:
            text = open(f, encoding="utf-8").read()
        except OSError:
            continue
        for m in LINK_RE.finditer(text):
            target = m.group(1)
            resolved = os.path.normpath(os.path.join(d, target))
            if not os.path.isfile(resolved):
                # key the report on the path after _glossary/ for readability
                key = target.split("_glossary/", 1)[1]
                broken[key] += 1
                instances += 1
    return instances, broken


def main():
    quiet = "--quiet" in sys.argv[1:]
    total_broken = 0
    total_distinct = 0
    print("=== check-links-repo: broken glossary links across all five trees ===")
    for lang in TREES:
        instances, broken = scan_tree(lang)
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
    print(f"{'TOTAL':>10}: {total_broken} broken, {total_distinct} distinct")
    if total_broken:
        print("FAIL: broken glossary links present.")
        return 1
    print("OK: 0 broken glossary links in all five trees.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
Repo-wide broken glossary-link scanner across ALL six content trees.

Trees: content/_original/, content/cz/, content/en/, content/uk/, content/fr/, content/es/

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

Extension case: the link regex matches `.md` in ANY letter case so that a
`FOO.MD` link is *seen* (an earlier lowercase-only regex made such links
invisible to this scanner), and a target whose extension is not exactly
lowercase `.md` is reported broken even if a same-named file would resolve on a
case-insensitive filesystem -- the site builds and deploys on Linux, where
`FOO.MD` and `FOO.md` are different files. `.md#anchor` and `.md "title"`
targets are handled: the anchor/title is stripped before resolving.

Prints per-tree distinct + instance counts and the broken-target list, then the
glossary-internal section, then a grand total. Exits non-zero if ANY link
anywhere is broken (CI-usable).

Usage:
  python3 src/scripts/check_links_repo.py
  python3 src/scripts/check_links_repo.py --quiet     # totals only
  python3 src/scripts/check_links_repo.py --selftest  # run the inline fixtures
"""
import glob
import os
import re
import shutil
import sys
import tempfile
from collections import Counter

TREES = ["_original", "cz", "en", "uk", "fr", "es"]
SKIP = {"README.md", "PROGRESS.md"}
GLOSSARY = "content/_original/_glossary"

# Any markdown link whose target ends in `.md` in any letter case, optionally
# followed by a #anchor and/or a "title". Group 1 is the bare target path.
# The target itself cannot contain whitespace or ')'.
#
#   ](../_glossary/people/core/DINA.md)            -> ../_glossary/people/core/DINA.md
#   ](./MAMAN.md#p-GLO_MAMAN-0004)                 -> ./MAMAN.md
#   ](../family/MAMAN.md "Marie's mother")         -> ../family/MAMAN.md
#   ](../_glossary/people/core/DINA.MD)            -> ../_glossary/people/core/DINA.MD  (reported broken: case)
MD_LINK_RE = re.compile(
    r"\]\(\s*([^)\s]+?\.[mM][dD])(?:#[^)\s]*)?(?:\s+\"[^\"]*\")?\s*\)")

# Tree scan: only links that pass through _glossary/, whatever the prefix:
# relative (../), bare (_glossary/...), leading-slash (/_original/_glossary/...)
# or mixed (/../_glossary/...). Restricting this to targets starting with ".."
# once hid 93 leading-slash links that verify-carnet flagged but this scanner
# reported as clean. We resolve the literal target relative to the file's own
# directory, so a wrong-depth or leading-slash path simply fails to resolve and
# is reported broken. External URLs (http://, https://, ...) are skipped.
LINK_RE = MD_LINK_RE

# Glossary-internal links are relative to the linking entry's own directory and
# need not mention _glossary/ at all: "MAMAN.md", "./MAMAN.md",
# "../family/MAMAN.md" are all valid shapes. Same regex, no _glossary/ filter.
GLOSSARY_LINK_RE = MD_LINK_RE

SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")

CASE_SUFFIX = "  [extension not lowercase .md]"


def _check_target(base_dir, target):
    """Return None if the link resolves cleanly, else a short reason suffix ('' or CASE_SUFFIX)."""
    # os.path.join() would discard `base_dir` for an absolute target and silently
    # resolve /_original/... against the filesystem root; strip the leading
    # slash so it stays anchored to the entry's own directory (and fails).
    resolved = os.path.normpath(os.path.join(base_dir, target.lstrip("/")))
    if not target.endswith(".md"):
        # Linux is case-sensitive: FOO.MD is not FOO.md even if a file of the
        # right name exists. Flag regardless of whether the path resolves here.
        return CASE_SUFFIX
    if not os.path.isfile(resolved):
        return ""
    return None


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
            if "_glossary/" not in target:
                continue  # tree scan only covers glossary links
            reason = _check_target(d, target)
            if reason is not None:
                # key the report on the path after _glossary/ for readability
                key = target.split("_glossary/", 1)[1] + reason
                broken[key] += 1
                instances += 1
    return instances, broken, unreadable


def scan_glossary(glossary=GLOSSARY):
    """Broken .md links *inside* the glossary tree itself.

    Returns (instances, Counter{"<linking file rel to glossary>  ->  <target>": n},
             [unreadable paths]).
    """
    broken = Counter()
    unreadable = []
    instances = 0
    for dirpath, _dirnames, filenames in os.walk(glossary):
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
                reason = _check_target(dirpath, target)
                if reason is not None:
                    src = os.path.relpath(f, glossary)
                    broken[f"{src}  ->  {target}{reason}"] += 1
                    instances += 1
    return instances, broken, unreadable


def run(quiet=False):
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


# --- selftest -------------------------------------------------------------

def _write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def selftest():
    """Build a throwaway content tree and assert exactly the expected breakages."""
    tmp = tempfile.mkdtemp(prefix="check_links_selftest_")
    cwd = os.getcwd()
    failures = []
    try:
        os.chdir(tmp)
        core = f"{GLOSSARY}/people/core"
        _write(f"{core}/MAMAN.md", "---\nid: MAMAN\n---\n# Maman\n")
        _write(f"{core}/DINA.md", "\n".join([
            "---\nid: DINA\n---",
            "ok plain:        [#Maman](MAMAN.md)",
            "ok dot-slash:    [#Maman](./MAMAN.md)",
            "ok anchor:       [#Maman](../core/MAMAN.md#p-GLO_MAMAN-0004)",
            'ok title:        [#Maman](../core/MAMAN.md "Marie\'s mother")',
            "ok external:     [wiki](https://example.org/Some_Page.md)",
            "BROKEN case:     [#Maman](./MAMAN.MD)",
            "BROKEN missing:  [#Nope](./NOPE.md)",
            "BROKEN abs:      [#Maman](/people/core/MAMAN.md)",
            "",
        ]))
        _write("content/_original/001/1873-01-01.md", "\n".join([
            "---\ndate: 1873-01-01\n---",
            "%% [#Dina](../_glossary/people/core/DINA.md) %%",
            "%% [#Dina](../_glossary/people/core/DINA.md#p1) %%",
            "%% [#Dina](../_glossary/people/core/DINA.MD) %%",
            "%% [#Nope](../_glossary/people/core/NOPE.md) %%",
            "[not glossary](../README.md)",
            "",
        ]))
        _write("content/cz/001/1873-01-01.md", "\n".join([
            "---\ndate: 1873-01-01\n---",
            "%% [#Dina](../../_original/_glossary/people/core/DINA.md) %%",
            "%% [#Dina](../_glossary/people/core/DINA.md) %%",
            "",
        ]))

        def expect(label, got, want):
            if got != want:
                failures.append(f"{label}: got {got!r}, want {want!r}")

        n, broken, unreadable = scan_tree("_original")
        expect("_original instances", n, 2)
        expect("_original keys", sorted(broken),
               ["people/core/DINA.MD" + CASE_SUFFIX, "people/core/NOPE.md"])
        expect("_original unreadable", unreadable, [])

        n, broken, _ = scan_tree("cz")
        expect("cz instances", n, 1)
        expect("cz keys", sorted(broken), ["people/core/DINA.md"])  # wrong depth

        n, broken, _ = scan_tree("es")
        expect("es (absent tree) instances", n, 0)

        n, broken, _ = scan_glossary()
        expect("glossary instances", n, 3)
        expect("glossary keys", sorted(broken), [
            "people/core/DINA.md  ->  ./MAMAN.MD" + CASE_SUFFIX,
            "people/core/DINA.md  ->  ./NOPE.md",
            "people/core/DINA.md  ->  /people/core/MAMAN.md",
        ])

        # regex shapes in isolation
        shapes = {
            "](A.md)": "A.md",
            "](./A.MD)": "./A.MD",
            "](../x/A.Md#frag)": "../x/A.Md",
            '](A.md "title here")': "A.md",
            "]( A.md )": "A.md",
        }
        for src, want in shapes.items():
            m = MD_LINK_RE.search(src)
            expect(f"regex {src}", m.group(1) if m else None, want)
        expect("regex rejects non-md", MD_LINK_RE.search("](A.mdx)"), None)
        expect("regex rejects space in target", MD_LINK_RE.search("](a b.md)"), None)
    finally:
        os.chdir(cwd)
        shutil.rmtree(tmp, ignore_errors=True)

    for f in failures:
        print(f"selftest FAIL: {f}")
    total = 12
    print(f"selftest: {total - len(failures)}/{total} checks passed")
    return 1 if failures else 0


def main():
    args = sys.argv[1:]
    if "--selftest" in args:
        return selftest()
    return run(quiet="--quiet" in args)


if __name__ == "__main__":
    sys.exit(main())

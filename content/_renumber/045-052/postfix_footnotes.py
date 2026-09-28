"""After --write: remove footnote definitions that the cross-carnet move copied into a file where nothing
refers to them (orphans) or that duplicate a definition already in the file. Only the definition lines
(and one blank line directly before a removed run) are deleted. usage: postfix_footnotes.py FILE..."""
import re, sys
DEF = re.compile(r"^\[\^([^\]]+)\]:")
for f in sys.argv[1:]:
    lines = open(f).read().split("\n")
    refs = set()
    for l in lines:
        if not DEF.match(l):
            refs.update(re.findall(r"\[\^([^\]]+)\](?!:)", l))
    seen, drop = set(), set()
    for i, l in enumerate(lines):
        m = DEF.match(l)
        if m:
            lab = m.group(1)
            if lab not in refs or lab in seen:
                drop.add(i)
            else:
                seen.add(lab)
    # a blank line that only separated a fully removed run of definitions
    for i in sorted(drop):
        if i > 0 and lines[i - 1] == "" and (i - 1) not in drop:
            j = i
            while j in drop:
                j += 1
            if j >= len(lines) or lines[j] == "":
                drop.add(i - 1)
    out = [l for i, l in enumerate(lines) if i not in drop]
    open(f, "w").write("\n".join(out))
    print(f, "removed lines", len(drop))

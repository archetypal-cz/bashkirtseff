"""After --write: the tool's ED flag-reset comment names the moved pseudo-file «048/1875-11-07.md», which
renumber-check reads as a link to a removed entry. Reword it. usage: postfix_ed.py <repo root>"""
import sys, glob
R = sys.argv[1]
for f in glob.glob(f"{R}/content/*/049/1875-11-07.md"):
    s = open(f).read()
    t = s.replace("paragraphs from 048/1875-11-07.md", "paragraphs from carnet 048, file 1875-11-07.md")
    if t != s:
        open(f, "w").write(t); print("reworded", f)

"""Apply final/drawings-06.json + drawings-07.json to a repo root after the rebuild --write.
usage: apply_drawings.py <repo root> <date e.g. 2026-09-28>"""
import json, os, re, shutil, sys
W = os.path.dirname(os.path.abspath(__file__))
R, DATE = sys.argv[1], sys.argv[2]
items = json.load(open(f"{W}/final/drawings-06.json")) + json.load(open(f"{W}/final/drawings-07.json"))
maps = {}
def newid(old):
    c = old[:3]
    if c not in maps:
        maps[c] = json.load(open(f"{R}/content/_renumber/{c}-{DATE}.json"))["id_map"]
    return maps[c][old]
by_file = {}
for d in items:
    pid = newid(d["anchor"]["old"])
    f = f"{R}/content/_original/{d['carnet']}/{d['entry_file']}"
    assert os.path.exists(f), f
    body = open(f).read()
    assert f"%% {pid} %%" in body, (f, pid)
    by_file.setdefault(f, []).append((d, pid))
    dst = f"{R}/src/frontend/public{d['src']}"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(f"{W}/{d['file']}", dst)
def q(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'
for f, ds in by_file.items():
    lines = open(f).read().split("\n")
    assert lines[0] == "---"
    end = lines.index("---", 1)
    fm = lines[1:end]
    if any(l.startswith("drawings:") for l in fm):
        raise SystemExit(f"{f} already has drawings:")
    block = ["drawings:"]
    for d, pid in ds:
        block += [f"  - src: {d['src']}", f"    caption: {q(d['caption'])}", f"    alt: {q(d['alt'])}",
                  f"    source: {q(d['source'])}", f"    paragraph: {q(pid)}"]
    lines = ["---"] + fm + block + lines[end:]
    open(f, "w").write("\n".join(lines))
    print(f, [pid for _, pid in ds])

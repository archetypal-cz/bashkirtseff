"""fill_review.py WRITE_LOG GATES_TEXT_FILE OUT.md — REVIEW.md = make_review.py output with COUNTS / DRAWINGS / GATES / QUESTIONS filled."""
import json, re, sys, subprocess
from pathlib import Path
W = Path(__file__).parent
subprocess.run([sys.executable, str(W / 'make_review.py'), sys.argv[3]], check=True)
log = Path(sys.argv[1]).read_text()
rows = []
for m in re.finditer(r'--- carnet (\d{3}).*?\n\s+paragraphs: (\d+) \((\d+) carried, (\d+) moved in, (\d+) moved out, (\d+) new, (\d+) dropped\).*?\n\s+entries: (\d+); added (\d+), removed (\d+)', log):
    c, n, car, mi, mo, new, dr, ent, add, rem = m.groups()
    rows.append(f'| {c} | {n} | {car} | {mi} | {mo} | {new} | {dr} | {ent} (+{add} −{rem}) |')
dr = json.load(open(W / 'drawings-added.json'))
drw = '\n'.join(f'- {c}/{f}, after {nid}: `{name}` ({w}×{h}, {b // 1024 or 1} KB)' for c, f, nid, name, (w, h), b in dr)
out = Path(sys.argv[3]).read_text()
out = out.replace('COUNTS', '\n'.join(rows)).replace('DRAWINGS', drw)
out = out.replace('GATES', Path(sys.argv[2]).read_text().strip()).replace('QUESTIONS', (W / 'questions.md').read_text().strip())
Path(sys.argv[3]).write_text(out)
print('filled', sys.argv[3], len(rows), 'carnets')

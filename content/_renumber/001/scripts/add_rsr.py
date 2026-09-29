"""After --write: add an RSR note to every old paragraph whose French was set by set_french
(content/_original only), placed on its own line right before the cluster's first text line."""
import json, re, sys, glob, datetime
from pathlib import Path
R = Path(sys.argv[1])
W = '/home/coder/rebuild-state/plan-tome0102'
notes = json.load(open(f'{W}/final/decisions.json'))['rsr_notes']
idmap = {}
for f in glob.glob(str(R / 'content/_renumber/0[01][0-9]-2026-09-2*.json')):
    m = json.load(open(f))
    for k, v in (m.get('id_map') or {}).items():
        if int(k[:3]) <= 14: idmap[k] = v if isinstance(v, str) else v.get('new', v)
ts = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
done = 0
for old, note in notes.items():
    new = idmap[old]
    c = new[:3]
    for f in sorted((R / 'content/_original' / c).glob('1*.md')):
        lines = f.read_text().split('\n')
        try: k = lines.index(f'%% {new} %%')
        except ValueError: continue
        j = k + 1
        while j < len(lines) and lines[j].startswith('%%') and lines[j].rstrip().endswith('%%') and not re.match(r'%% \d{3}\.\d{4} %%', lines[j]):
            j += 1
        assert '%%' not in note
        lines.insert(j, f'%% {ts} RSR: {note} %%')
        f.write_text('\n'.join(lines)); done += 1
        break
    else:
        raise SystemExit(f'{old}->{new} not found')
print('RSR notes added:', done)

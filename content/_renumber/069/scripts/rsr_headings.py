"""RSR notes for the heading labels the tome-10 plans changed through set_french (post-0NN.json
`headings`). python3 rsr_headings.py <repo root> <date>"""
import json, re, sys
from datetime import datetime
from pathlib import Path
R = Path(sys.argv[1]); DATE = sys.argv[2]
B = Path(__file__).resolve().parent.parent
TS = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
ID = re.compile(r'^%% (\d{3}\.\d{4}) %%$')
idmap = {}
for c in ['069', '070', '071', '072', '073', '074']:
    idmap.update(json.load(open(R / f'content/_renumber/{c}-{DATE}.json'))['id_map'])
NOTES = {
 '069.0604': 'Heading completed to the printed label «Dimanche 1er avril 1877 - Pâques» (tome10.docx ¶924, Mon Journal t.10; tome-10 rebuild 2026-09-28).',
 '070.0037': 'Heading completed to the printed label «Dimanche 8 avril 1877 - Pâques» (tome10.docx ¶1588, Mon Journal t.10; tome-10 rebuild 2026-09-28).',
 '074.0256': 'Heading «Dimache» (an OCR slip copied into the extraction) corrected to «Dimanche 9 septembre 1877» as printed (tome-10 rebuild 2026-09-28).',
}
for h in json.load(open(B / 'final/post-073.json'))['headings']:
    NOTES[h['id']] = h['rsr'].replace(' Delete the heading line from this cluster in _original, and the translated heading + its embedded copy in every translation tree.', '')
for old, note in NOTES.items():
    nid = idmap.get(old, old)
    f = next(f for f in (R / 'content/_original' / nid[:3]).glob('*.md') if f'%% {nid} %%\n' in f.read_text())
    L = f.read_text().split('\n'); i = L.index(f'%% {nid} %%'); k = i + 1
    while k < len(L) and L[k].startswith('%%') and not ID.match(L[k]): k += 1
    L.insert(k, f'%% {TS} RSR: {note} %%'); f.write_text('\n'.join(L))
    print(old, '->', nid, f.name)

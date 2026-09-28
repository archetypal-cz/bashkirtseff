"""Write content/_renumber/CCC/REVIEW.md for the tome-10 rebuild (069–074) from the plans,
the rebuild maps, the planner notes and the owner decisions. python3 make_review.py <repo root> <date> <gates file>"""
import collections, json, re, sys
from pathlib import Path
R = Path(sys.argv[1]); DATE = sys.argv[2]; GATES = Path(sys.argv[3]).read_text()
B = Path(__file__).resolve().parent.parent
C = ['069', '070', '071', '072', '073', '074']
NOTES = {'069': 'notes-069-074.md', '070': 'notes-070.md', '071': 'notes-071.md', '072': 'notes-072-073.md', '073': 'notes-072-073.md', '074': 'notes-069-074.md'}
cov = (B / 'final2/withdrawn-covers.md').read_text()
covsec = {m.group(1): m.group(2).strip() for m in re.finditer(r'### (\d{3}) \([^)]*\)\n(.*?)(?=\n### |\Z)', cov, re.S)}
post = {c: json.load(open(B / f'final/post-{c}.json')) for c in C}
FAX = json.load(open(B / 'tools/facsimiles.json'))
OWNER = """## 1. Owner decisions applied (KRR, 2026-09-28)

These override anything the planner notes (§4) say to the contrary.

1. **No cover or title-page entries.** The 7 old title-page paragraphs (069.0650–0651, 070.0198–0199, 073.0037–0039) are dropped in their own carnets and no new cover text is added. Their text is kept below under «Withdrawn cover pages».
2. **Facsimiles shown as well as transcribed.** The printed programmes and the newspaper cutting are transcribed as kind `clipping` paragraphs, and their facsimiles are linked through `drawings:` in the entry frontmatter (captions in fr/cz/uk/en), anchored to the entry's last clipping paragraph.
3. **«Larderel».** Every «Larderei» in the French text of 069–074 (old and new paragraphs, headings) is set to «Larderel», the printed reading (the Larderel family of Livorno; «Larderei» is an OCR i/l slip). Other carnets, the glossary, entity names, comments and footnote definitions are untouched; the translations keep their wording, and each translated paragraph whose French changed gets the rebuild's «SOURCE CHANGED» ED note.
4. **Printed typesetting errors corrected** with an RSR note citing the page: «cettte», «priincesses», «acccompagné», «trliste», «diffférence», «réctifié». Marie's genuine spellings stay («sâle», «embarassée», «patisseries», «fânée»…).
5. **Drawings credited to Marie**, except printed p.109: its caption says «fait pour Marcuard» and that the authorship is uncertain.
6. **072.0094 + 072.0106 merged** (one sentence split by the page swap of printed pp.218–219). 0106 is dropped; its translation was carried into the merged paragraph by hand in cz, uk and en, with an ED note.
7. **072.0462** («Cette manière de parler ressemble à Alexandre…», foot of printed p.253) is kind `margin`.
8. **069.0285 / 069.0429** (day heading + «[N lignes cancellées]» in one cluster) stay without a kind, and the struck date «[Rayé: Lundi 21 mai 1877]» stays at the end of 20 May (071).
9. **Empty placeholder clusters** are kept where that lets an entry keep its translation approvals (`keep_empties.py`); the others are dropped.
"""
PREREQ = """## 2. Scripts (in this directory; run in this order)

1. `prereq_fix.py <root>` (before the run):
   - _original/070/1877-04-03.md: the legacy `[//]: # ( 10.8xx )` separators inside 070.0001 become blank lines;
   - fr/073/1877-07-24.md: the cluster labelled `%% 10.0126 %%` becomes 073.0126;
   - fr 069.0437, 069.0455, 069.0459, 070.0001: the multi-line `%%` block of embedded French becomes one `%% line %%` per line (the rebuild refuses `set_french` on a multi-line block).
   - Also, by hand: WALITSKY.md 071.1010 → 071.0241 (a citation that was already wrong).
2. `just rebuild-carnets plan-069.json … plan-074.json --write` (one multi-carnet run).
3. `post_apply.py <root> <date>`: translated heading labels; the «Samedi 11 août» heading moved in the translations; the 072.0094+0106 merge in cz/uk/en; RSR notes for typo corrections in old paragraphs; drawings and facsimiles (images + `drawings:` + captions); stale README ranges (071–073); fr/070 footnote markers without definitions.
4. `fix_fn_070.py <root>`: the footnote definitions left in 070.0001 by the 3 April split move to the clusters that now hold their markers.
5. `rsr_headings.py <root> <date>`: RSR notes for the heading labels changed through `set_french`.

Plan history: `owner_0928.py` applied the owner decisions to the plans (final2), `keep_empties.py` produced the final plans (final3 = the `plan-CCC.json` here).
"""
def kinds(ps):
    k = collections.Counter(q.get('kind') for q in ps if q.get('kind'))
    return ', '.join(f'{a}×{b}' for a, b in sorted(k.items()))
for c in C:
    p = json.load(open(B / f'final3/plan-{c}.json'))
    m = json.load(open(R / f'content/_renumber/{c}-{DATE}.json'))
    allps = [q for e in p['entries'] for q in e['paragraphs']]
    old = [q for q in allps if 'old' in q]
    movedin = [q for q in old if not q['old'].startswith(c)]
    new = [q for q in allps if 'new' in q]
    sf = [q for q in old if q.get('set_french')]
    out = [f'# Carnet {c} rebuild (tome 10): review ({DATE})', '',
           f'Plan: `plan-{c}.json`. It ran together with the other tome-10 plans: `just rebuild-carnets plan-069.json plan-070.json plan-071.json plan-072.json plan-073.json plan-074.json --write`. Map: `../{c}-{DATE}.json`; SQL for reader reports: `../069+070+071+072+073+074-{DATE}.sql`.',
           'Source: `content/_raw/tome10.docx` and the Tome 10 scan (Mon Journal, t.10), checked page by page where the notes say so.', '',
           '## Summary', '',
           f'- **Paragraphs:** {len(allps)} after the rebuild, numbered {c}.0001–{m["last_id"]}.',
           f'  - {len(old) - len(movedin)} old paragraphs carried, {len(movedin)} moved in from another carnet, {len(new)} new, {len(m["dropped"])} dropped.',
           f'  - {m["changed_ids"]} IDs change.',
           f'- **Entries:** {len(p["entries"])} ({len(m["files_added"])} added, {len(m["files_removed"])} removed).',
           f'- **set_french** on {len(sf)} old paragraphs.',
           f'- **Kinds:** {kinds(allps) or "none"} (new: {kinds(new) or "none"}; old: {kinds(old) or "none"}).',
           f'- **Approval flags reset** per tree: ' + ', '.join(f'{t} {len(v) if hasattr(v, "__len__") else v}' for t, v in m['flag_resets'].items()) + '.',
           '', OWNER, PREREQ, '## 3. Dropped paragraphs', '']
    for d in p.get('drop', []): out.append(f'- {d["id"]}: {d["reason"]}')
    if not p.get('drop'): out.append('None.')
    if movedin: out += ['', f'Moved in: {movedin[0]["old"]}–{movedin[-1]["old"][4:]} ({len(movedin)}).']
    items = [d for d in post[c].get('drawings', [])] + [{'src': k, 'caption': v[2], 'source': f'Mon Journal, t. 10, p. {v[6]} (fac-similé)', 'file': v[1]} for k, v in FAX.items() if v[0] == c]
    out += ['', '## Drawings and facsimiles', '']
    if items:
        out.append(f'Images in `src/frontend/public/images/marie/drawings/{c}/`, linked by `drawings:` in the entry frontmatter.')
        out.append('')
        for d in items: out.append(f'- `{Path(d["src"]).name}` ({d["file"]}): {d["caption"]} — {d["source"]}')
    else: out.append('None.')
    out += ['', '## 4. Planner notes (2026-09-27, superseded where §1 says so)', '']
    nt = (B / 'final' / NOTES[c]).read_text()
    out.append(re.sub(r'^#', '###', nt, flags=re.M))
    out += ['', '## 5. Gate results', '', '```']
    sec = None
    for l in GATES.split('\n'):
        if l.startswith('== '): sec = l
        if (sec and sec.endswith(f' {c}')) or f' {c} ' in l or l.startswith(f'{c}:') or l.startswith('check-comments'): out.append(l)
    out += ['```', '', '## Withdrawn cover pages (for when the manuscript is available)', '',
            'Owner decision KRR 2026-09-28: no cover entries or cover paragraphs until the manuscript is scanned. Texts as printed:', '',
            covsec.get(c, 'None.'), '', f'### New layout ({len(p["entries"])} entries)', '',
            '| New file | Heading | carried | moved in | new | set_french | kinds |', '|---|---|---|---|---|---|---|']
    for e in p['entries']:
        ps = e['paragraphs']; o = [q for q in ps if 'old' in q]
        out.append(f'| {e["file"]} | {e.get("heading") or ""} | {sum(1 for q in o if q["old"].startswith(c))} | {sum(1 for q in o if not q["old"].startswith(c))} | {sum(1 for q in ps if "new" in q)} | {sum(1 for q in o if q.get("set_french")) or ""} | {kinds(ps)} |')
    d = R / 'content/_renumber' / c; d.mkdir(exist_ok=True)
    (d / 'REVIEW.md').write_text('\n'.join(out) + '\n')
    print(c, len(allps), len(new), len(m['dropped']), len(p['entries']))

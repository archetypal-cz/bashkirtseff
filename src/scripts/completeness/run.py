"""Source completeness: every tome docx paragraph vs content/_original.

  just source-completeness            # whole corpus → .claude/reports/source-completeness-<date>.md
  just source-completeness 068 069    # same run, then print those carnets' rows

Steps (each script reads/writes the work files in .cache/source-completeness/):
dump.py → analyze.py → gaps.py → misplaced.py → fpcheck.py → report.py.
"""
import json
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from paths import REPORT, work  # noqa: E402

carnets = [c.zfill(3) for c in sys.argv[1:]]
sys.argv = sys.argv[:1]
for step in ('dump', 'analyze', 'gaps', 'misplaced', 'fpcheck', 'report'):
    print(f'== {step}', file=sys.stderr)
    runpy.run_path(str(HERE / f'{step}.py'), run_name='__main__')
print(f'report: {REPORT}')
if carnets:
    G = json.load(open(work('gaps.json')))
    for c in carnets:
        v = G['percarnet'].get(c, {})
        print(f"\n{c}: {v.get('tome_paras', 0)} tome paragraphs, {v.get('unmatched', 0)} unmatched ({v.get('unmatched_chars', 0):,} chars), {v.get('partial', 0)} partial")
        for g in sorted((g for g in G['gaps'] if g['carnet'] == c and g['region'] == 'body'), key=lambda g: g['docx_start']):
            if g['n_paras'] > 1 or g['chars'] > 300:
                print(f"  tome{g['tome']:02d} docx {g['docx_start']}–{g['docx_end']}: {g['n_paras']} paras, {g['chars']:,} chars, under «{(g['date_heading'] or '—')[:40]}» {' '.join(g['flags'])}")

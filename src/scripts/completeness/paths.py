"""Paths for the source-completeness scripts: work files in .cache/source-completeness/
(override with COMPLETENESS_WORK), report in .claude/reports/source-completeness-<date>.md
(override with COMPLETENESS_REPORT). Run the whole chain with `just source-completeness`."""
import datetime
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ORIGINAL = ROOT / 'content' / '_original'
WORK = Path(os.environ.get('COMPLETENESS_WORK') or ROOT / '.cache' / 'source-completeness')
WORK.mkdir(parents=True, exist_ok=True)
TODAY = datetime.date.today().isoformat()
REPORT = Path(os.environ.get('COMPLETENESS_REPORT') or ROOT / '.claude' / 'reports' / f'source-completeness-{TODAY}.md')
if not os.environ.get('COMPLETENESS_REPORT'):
    n = 2
    while REPORT.exists():  # never overwrite an earlier report of the same day
        REPORT = REPORT.with_name(f'source-completeness-{TODAY}-{n}.md')
        n += 1
sys.path.insert(0, str(ROOT / 'src' / 'scripts' / 'rebuild-plan'))  # common.dump_docx (cached docx dumps)


def work(name: str) -> str:
    return str(WORK / name)

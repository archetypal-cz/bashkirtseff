"""Paths for the source-completeness scripts: work files in .cache/source-completeness/
(override with COMPLETENESS_WORK), report in .claude/reports/source-completeness-<date>.md
(override with COMPLETENESS_REPORT; a same-day rerun overwrites it unless --keep). Run the whole chain with `just source-completeness`."""
import datetime
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ORIGINAL = ROOT / 'content' / '_original'
WORK = Path(os.environ.get('COMPLETENESS_WORK') or ROOT / '.cache' / 'source-completeness')
WORK.mkdir(parents=True, exist_ok=True)
TODAY = datetime.date.today().isoformat()


def report_path(reports: Path, today: str, keep: bool) -> Path:
    """A rerun on the same day replaces that day's report; keep (--keep,
    COMPLETENESS_KEEP=1) writes <date>-2.md, -3.md … instead."""
    path = reports / f'source-completeness-{today}.md'
    n = 2
    while keep and path.exists():
        path = reports / f'source-completeness-{today}-{n}.md'
        n += 1
    return path


REPORT = Path(os.environ.get('COMPLETENESS_REPORT') or report_path(ROOT / '.claude' / 'reports', TODAY, bool(os.environ.get('COMPLETENESS_KEEP'))))
sys.path.insert(0, str(ROOT / 'src' / 'scripts' / 'rebuild-plan'))  # common.dump_docx (cached docx dumps)


def work(name: str) -> str:
    return str(WORK / name)

"""PDF page → docx paragraph map for a tome scan, with printed «Mon Journal» page numbers.

  just scan-pagemap 9     # needs content/_raw/scans/Tome9.pdf (gitignored); cached in .cache/rebuild-plan/
"""
import json
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'rebuild-plan'))
from scanlib import pagemap  # noqa: E402

tome = int(sys.argv[1])
pm = pagemap(tome)
if pm is None:
    sys.exit(f'no content/_raw/scans/Tome{tome}.pdf')
mapped = [r for r in pm if 'docx_para_start' in r]
cov = [r['coverage'] for r in pm if r['words'] > 50] or [0]
print(f"Tome{tome}: pages={len(pm)} mapped={len(mapped)} with_printed_page={sum(1 for r in pm if 'printed_page' in r)} median_coverage={statistics.median(cov):.3f}")
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(json.dumps(pm, indent=1))
    print(f'written to {sys.argv[2]}')

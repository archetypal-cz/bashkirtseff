"""Figure candidates in a tome scan: ink regions outside the OCR text layer and ABBYY picture
regions, with the docx paragraphs and printed page of each page.

  just scan-figures 9
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'rebuild-plan'))
from scanlib import figure_candidates, pagemap  # noqa: E402

tome = int(sys.argv[1])
figs = figure_candidates(tome)
if figs is None:
    sys.exit(f'no content/_raw/scans/Tome{tome}.pdf')
pm = {r['pdf_page']: r for r in pagemap(tome) or []}
for f in figs:
    r = pm.get(f['pdf_page'], {})
    print(f"PDF p.{f['pdf_page']} (printed p.{r.get('printed_page', '?')}, docx ¶{r.get('docx_para_start', '?')}–{r.get('docx_para_end', '?')}): "
          f"{len(f['regions_pt'])} ink region(s), {len(f['abbyy_picture_regions'])} picture region(s)")

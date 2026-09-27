"""Survey of the tome scans (pages, text layer, page size, producer, image resolution).

  just scan-survey
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'rebuild-plan'))
from common import SCANS  # noqa: E402
import pymupdf as fitz
for n in range(1,17):
    if not (SCANS/f"Tome{n}.pdf").exists(): continue
    d = fitz.open(str(SCANS/f"Tome{n}.pdf"))
    npg = len(d); txtpages=0; imgs=[]; chars=0
    for p in d:
        t = p.get_text()
        if len(t.strip())>20: txtpages+=1
        chars+=len(t)
    p = d[len(d)//2]
    il = p.get_images(full=True)
    info=[]
    for im in il[:3]:
        xref=im[0]; w,h=im[2],im[3]
        bb = p.get_image_rects(xref)
        r = bb[0] if bb else None
        dpi = round(w/(r.width/72)) if r else None
        info.append((w,h,im[5],im[8] if len(im)>8 else '',dpi))
    print(f"Tome{n}: pages={npg} textpages={txtpages} chars={chars} pagesize={d[0].rect} meta={d.metadata.get('producer')}/{d.metadata.get('creator')} midpage_imgs={len(il)} {info}")

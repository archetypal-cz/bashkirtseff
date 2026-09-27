"""Keyword sweep of every tome scan for figures and pasted material: bracketed notes mentioning
dessin/croquis/coupure/journal/…, ABBYY picture regions on text pages, the most frequent bracket labels.

  just scan-figure-keywords      # → .cache/rebuild-plan/all_tomes_figure_candidates.json
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'rebuild-plan'))
from common import CACHE, SCANS  # noqa: E402
import pymupdf as fitz, re, collections, json
KW=re.compile(r"\[[^\]]{0,160}(dessin|croquis|coupure|collé|journal|article|image|gravure|portrait|photo|caricature|figure|esquisse|profil)[^\]]{0,160}\]",re.I)
allout={}
for T in range(1,17):
    if not (SCANS/f"Tome{T}.pdf").exists(): continue
    d=fitz.open(str(SCANS/f"Tome{T}.pdf"))
    pics=[];hits=[];brackets=collections.Counter()
    for i,p in enumerate(d):
        t=p.get_text()
        for m in re.finditer(r"\[([^\]\d][^\]]{2,40})",t): brackets[m.group(1).split(':')[0].strip().lower()[:25]]+=1
        for m in KW.finditer(t): hits.append((i+1,m.group(0)[:120].replace("\n"," ")))
        pr=[tuple(round(x) for x in r) for im in p.get_images(full=True) for r in p.get_image_rects(im[0]) if r.width<p.rect.width*0.9 and r.width*r.height>900]
        if pr and len(t.strip())>200: pics.append((i+1,pr))
    allout[T]={"picture_pages":pics,"kw_hits":hits,"top_brackets":brackets.most_common(12)}
    print(f"Tome{T}: abbyy-picture pages(with text)={[p for p,_ in pics]} kw_hits={len(hits)}")
    for h in hits[:6]: print("   ",h)
CACHE.mkdir(parents=True, exist_ok=True)
json.dump(allout,open(CACHE/"all_tomes_figure_candidates.json","w"),ensure_ascii=False,indent=1)
print("written to", CACHE/"all_tomes_figure_candidates.json")

# /// script
# dependencies = ["pymupdf"]
# ///
"""For each candidate pair, locate N's tail and N+1's head in the tome scan (word positions) and classify:
PAGEBREAK = tail is in the last text lines of page p and head starts the first body line of page p+1 flush-left (no indent);
SAMEPAGE-FLUSH = both on the same page, head at line start flush-left right after tail line (a split inside a page);
INDENT = head line indented (a real new paragraph in print); NOTFOUND otherwise."""
import sys,json,re,unicodedata,pymupdf
tome=int(sys.argv[1]); cands=json.load(open(sys.argv[2]))
doc=pymupdf.open(f'/home/coder/bashkirtseff/content/_raw/scans/Tome{tome}.pdf')
def norm(w):
    w=unicodedata.normalize('NFC',w).replace('’',"'").lower()
    return re.sub(r"[^\w']",'',w)
pages=[]
for p in doc:
    ws=p.get_text('words')  # x0,y0,x1,y1,word,block,line,wno
    ws=[w for w in ws if norm(w[4])]
    pages.append(ws)
def words(s): return [norm(x) for x in re.sub(r'\[\^[^\]]*\]|[*_]','',s).replace('’',"'").split() if norm(x)]
def find(seq):
    hits=[]
    n=len(seq)
    for pi,ws in enumerate(pages):
        toks=[norm(w[4]) for w in ws]
        for i in range(len(toks)-n+1):
            if toks[i:i+n]==seq: hits.append((pi,i))
    return hits
out=[]
for c in cands:
    tail=words(c['tail'])[-4:]; head=words(c['head'])[:4]
    th=find(tail); hh=find(head); res='NOTFOUND'; info=''
    for (tp,ti) in th:
        for (hp,hi) in hh:
            if hp==tp+1 or (hp==tp and hi>ti):
                ws=pages[hp]; first=ws[hi]
                lines={}
                for w in ws: lines.setdefault((w[5],w[6]),[]).append(w)
                x0s=sorted(min(v,key=lambda w:w[0])[0] for v in lines.values() if len(v)>3)
                margin=x0s[len(x0s)//10] if x0s else first[0]
                linestart=min(lines[(first[5],first[6])],key=lambda w:w[0])
                atstart=linestart is first
                indent=first[0]-margin
                above=len({(w[5],w[6]) for w in ws if w[3] < first[1]-2})
                if hp==tp+1:
                    res='PAGEBREAK' if atstart and indent<8 and above<=2 else ('INDENT' if atstart else 'MIDLINE')
                else:
                    res='SAMEPAGE-FLUSH' if atstart and indent<8 else ('INDENT' if atstart else 'MIDLINE')
                info=f'p{tp+1}->p{hp+1} indent={indent:.0f} above={above}'
                break
        if res!='NOTFOUND': break
    out.append(dict(c,scan=res,info=info))
json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False,indent=0)
import collections; print(collections.Counter(o['scan'] for o in out))

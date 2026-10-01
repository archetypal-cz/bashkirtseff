# /// script
# dependencies = ["python-docx"]
# ///
"""Tomes without scans: PAGEBREAK-DOCX if N's tail ends a docx paragraph and N+1's head starts the next Body paragraph with only header/footer/empty paragraphs between; SAMEPARA if both are in one docx paragraph."""
import sys,json,re,unicodedata,docx
tome=int(sys.argv[1]); cands=json.load(open(sys.argv[2]))
P=docx.Document(f'/home/coder/bashkirtseff/content/_raw/tome{tome:02d}.docx').paragraphs
def n(s): s=unicodedata.normalize('NFC',s).replace('’',"'").replace('‘',"'"); return re.sub(r'\s+',' ',re.sub(r'[*_★^]|\[\^[^\]]*\]','',s)).strip()
T=[n(p.text) for p in P]; S=[p.style.name for p in P]
out=[]
for c in cands:
    tail=n(c['tail'])[-25:]; head=n(c['head'])[:25]; res='NOTFOUND'
    ti=[i for i,t in enumerate(T) if tail and tail in t]; hi=[i for i,t in enumerate(T) if head and head in t]
    for a in ti:
        for b in hi:
            if a==b and T[a].find(tail)<T[a].find(head): res='SAMEPARA'; break
            if b>a and b-a<=4 and T[a].endswith(tail) and T[b].startswith(head) and all((not T[k]) or 'Header' in S[k] or re.fullmatch(r'\d{1,3}',T[k]) for k in range(a+1,b)):
                res='PAGEBREAK-DOCX' if b-a>1 else 'ADJACENT-DOCX'; break
        if res!='NOTFOUND': break
    out.append(dict(c,scan=res,info=f'tome{tome:02d}.docx'))
json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False,indent=0)
import collections; print(collections.Counter(o['scan'] for o in out))

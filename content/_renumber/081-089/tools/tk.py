"""Toolkit. python3 tk.py d TOME A B      -> docx paragraphs A..B (TOME 12|13)
           python3 tk.py o CCC A B       -> _original clusters CCC.A..B (4-digit strings)
           python3 tk.py f CCC FILE      -> clusters of one _original file
           python3 tk.py pg TOME PARA    -> pdf page(s) (printed = see pagemap) holding docx ¶PARA
           python3 tk.py g TOME REGEX    -> grep docx"""
import json,re,glob,os,sys
ROOT=os.environ.get("ROOT","/home/coder/bashkirtseff")
C=f"/home/coder/bashkirtseff/.cache/rebuild-plan"
def docx(t):
    f=sorted(glob.glob(f"{C}/tome{t}.docx.*.json"),key=os.path.getmtime)[-1]
    return json.load(open(f))
def pagemap(t):
    f=sorted(glob.glob(f"{C}/tome{t}.pagemap.*.json"),key=os.path.getmtime)[-1]
    return json.load(open(f))
def orig(c, root=ROOT):
    out={}
    for f in sorted(glob.glob(f"{root}/content/_original/{c}/*.md")):
        if f.endswith("README.md"): continue
        cur=None; inblock=False
        lines=open(f).read().split("\n")
        if lines and lines[0]=="---":
            j=lines.index("---",1); lines=lines[j+1:]
        for ln in lines:
            m=re.match(r"^%% (\d{3}\.\d{4}) %%$",ln)
            if m: cur=m.group(1); out[cur]=[os.path.basename(f),[]]; continue
            if cur is None: continue
            s=ln.strip()
            if inblock:
                if s.endswith("%%"): inblock=False
                continue
            if s.startswith("%%"):
                if not (s.endswith("%%") and len(s)>2): inblock=True
                continue
            if s.startswith("[^"): continue
            if s: out[cur][1].append(ln)
    return out
def pages_for(t,p):
    return [r['pdf_page'] for r in pagemap(t) if r.get('docx_para_start') is not None and r['docx_para_start']<=p<=r['docx_para_end']]
if __name__=="__main__":
    a=sys.argv; w=int(os.environ.get("W","400"))
    if a[1]=="d":
        d=docx(a[2])
        for p in d[int(a[3]):int(a[4])+1]: print(p["i"],f"[{p['s']}]{'[PIC]' if p['pic'] else ''}",p["t"][:w].replace("\n"," / "))
    elif a[1]=="o":
        o=orig(a[2])
        for i in sorted(o):
            if a[3]<=i[4:]<=a[4]: print(i,o[i][0],"|"," / ".join(o[i][1])[:w])
    elif a[1]=="f":
        o=orig(a[2])
        for i in sorted(o):
            if o[i][0]==a[3] or o[i][0]==a[3]+".md": print(i,"|"," / ".join(o[i][1])[:w])
    elif a[1]=="pg": print(pages_for(a[2],int(a[3])))
    elif a[1]=="g":
        for p in docx(a[2]):
            if re.search(a[3],p["t"]): print(p["i"],p["t"][:w].replace("\n"," / "))

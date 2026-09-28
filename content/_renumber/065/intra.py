import json,re,unicodedata,collections,difflib,sys
rows=json.load(open('stage.json'))
C=json.load(open('orig.json')); CB={c['id']:c for c in C}
def nw(s):
    s=s.replace('œ','oe').replace('æ','ae').replace('Œ','oe')
    s=unicodedata.normalize('NFKD',s); s=''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    return re.sub(r'[^a-z0-9]','',s)
TOK=re.compile(r"\[\^[^\]]*\]|\^\d+\^|<[^>]+>|[\w’'-]+",re.U)
def toks(s):
    out=[]
    for m in TOK.finditer(s):
        t=m.group(0)
        if t.startswith('[^') or t.startswith('^') or t.startswith('<'): continue
        for sub in re.finditer(r"[^\W_]+",t):
            n=nw(sub.group(0))
            if n: out.append((n,m.start()+sub.start(),m.start()+sub.end()))
    return out
byc=collections.defaultdict(list)
for r in rows:
    if r['best'] and not r['ishead']: byc[r['best']].append(r)
res={}
for k,rs in byc.items():
    ctext='\n'.join(CB[k]['vis']); dtext=' '.join(r['t'] for r in rs)
    a=toks(ctext); b=toks(dtext)
    sm=difflib.SequenceMatcher(None,[x[0] for x in a],[x[0] for x in b],autojunk=False)
    for op,i1,i2,j1,j2 in sm.get_opcodes():
        if op=='equal': continue
        if op=='insert' and j2-j1>=3 or op=='replace' and (j2-j1)-(i2-i1)>=3:
            res.setdefault(k,[]).append((op,i1,i2,j1,j2,dtext[b[j1][1]:b[j2-1][2]],ctext[a[i1][1]:a[i2-1][2]] if i2>i1 else ''))
n=0
for k,v in res.items():
    for op,i1,i2,j1,j2,dt,ct in v:
        n+=1; print(k,CB[k]['file'][:14],op,j2-j1,'| +',dt[:160],'| -',ct[:60])
print(n,len(res))

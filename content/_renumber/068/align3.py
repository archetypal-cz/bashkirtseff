import json,re,unicodedata,difflib
d=json.load(open('t09.json'))
C=json.load(open('orig.json'))
def norm(s):
    s=s.replace('œ','oe').replace('æ','ae').replace('Œ','oe').replace('Î','I').replace('î','i')
    s=unicodedata.normalize('NFKD',s)
    s=''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    s=re.sub(r'\[\^[^\]]*\]','',s)
    s=re.sub(r'(\d) (\d)',r'\1\2',s)
    return re.sub(r'[^a-z0-9]+',' ',s).strip()
def grams(s,n=4):
    w=s.split(); return set(tuple(w[i:i+n]) for i in range(len(w)-n+1))
pos={c['id']:k for k,c in enumerate(C)}
ids=[c['id'] for c in C]
cn={c['id']:norm(' '.join(c['vis'])) for c in C}
cg={k:grams(v) for k,v in cn.items()}
clines={c['id']:[norm(l) for l in c['vis']] for c in C}
WD=r'^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\b'
rows=[]; head=None
for p in d[3389:5131]:
    t=p['t'].strip()
    if not t: continue
    n=norm(t); ishead=bool(re.match(WD,t)) and len(t)<70
    if ishead: head=p['i']
    rows.append({'i':p['i'],'s':p['s'],'head':head,'ishead':ishead,'t':t,'n':n,'best':None,'sc':0})
# pass1 long
for r in rows:
    if r['ishead']: continue
    g=grams(r['n'])
    if len(r['n'].split())>=7 and g:
        sc=sorted(((len(g&cg[k])/len(g),k) for k in ids),reverse=True)
        if sc[0][0]>=0.5: r['best']=sc[0][1]; r['sc']=round(sc[0][0],2); r['how']='long'
# pass2 short/unmatched: window
for j,r in enumerate(rows):
    if r['ishead'] or r['best']: continue
    # neighbors
    pv=next((rows[k]['best'] for k in range(j-1,max(-1,j-15),-1) if rows[k]['best'] and rows[k].get('how')=='long'),None)
    nx=next((rows[k]['best'] for k in range(j+1,min(len(rows),j+15)) if rows[k]['best'] and rows[k].get('how')=='long'),None)
    lo=pos[pv]-2 if pv else 0; hi=pos[nx]+2 if nx else len(ids)-1
    if hi<lo: lo,hi=min(lo,hi),max(lo,hi)
    if hi-lo>40 and (pv or nx): lo,hi=(pos[pv]-3,pos[pv]+6) if pv else (pos[nx]-6,pos[nx]+3)
    elif hi-lo>40: continue
    best=None;bs=0
    n=r['n']
    if not n: continue
    for k in ids[max(0,lo):hi+1]:
        if (' '+n+' ') in (' '+cn[k]+' '):
            s=1.0
        else:
            s=max([difflib.SequenceMatcher(None,n,l).ratio() for l in clines[k] if l and abs(len(l)-len(n))<max(20,0.5*len(n))]+[0])
            if s<0.8: 
                # partial containment
                g=grams(n,3)
                if g: s=max(s,len(g&grams(cn[k],3))/len(g)*0.95)
        if s>bs: bs=s;best=k
    if bs>=0.75: r['best']=best; r['sc']=round(bs,2); r['how']='win'
json.dump(rows,open('align3.json','w'),ensure_ascii=False)
fm={c['id']:c['file'] for c in C}
for r in rows:
    print(r['i'],'H' if r['ishead'] else ' ',r['best'] or '--------',r['sc'],fm.get(r['best'],'')[:16],'|',r['t'][:70])

import json,re,unicodedata,difflib,sys
d=json.load(open('t09.json'))
C=json.load(open('orig.json'))
A,B=71,3381
def norm(s):
    s=s.replace('œ','oe').replace('æ','ae').replace('Œ','oe')
    s=unicodedata.normalize('NFKD',s)
    s=''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    s=re.sub(r'\[\^[^\]]*\]','',s)
    s=re.sub(r'(\d) (\d)',r'\1\2',s)
    return re.sub(r'[^a-z0-9]+',' ',s).strip()
def grams(s,n=4):
    w=s.split(); return set(tuple(w[i:i+n]) for i in range(len(w)-n+1))
pos={c['id']:k for k,c in enumerate(C)}
ids=[c['id'] for c in C]
cn={c['id']:' '+norm(' '.join(c['vis']))+' ' for c in C}
cg={k:grams(v) for k,v in cn.items()}
clines={c['id']:[norm(l) for l in c['vis']] for c in C}
WD=r'^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\b'
rows=[]; head=None
for p in d[A:B]:
    t=p['t'].strip()
    if not t: continue
    n=norm(t); ishead=bool(re.match(WD,t)) and len(t)<80
    if ishead: head=p['i']
    rows.append({'i':p['i'],'s':p['s'],'head':head,'ishead':ishead,'t':t,'n':n,'best':None,'sc':0})
lastp=0
for r in rows:
    if r['ishead']: continue
    g=grams(r['n'])
    if len(r['n'].split())>=7 and g:
        sc=[(len(g&cg[k])/len(g),k) for k in ids]
        m=max(s for s,_ in sc)
        if m>=(0.5 if len(r['n'].split())>=12 else 0.8):
            top=[k for s,k in sc if s>=m-0.05]
            k=min(top,key=lambda k:(0 if pos[k]>=lastp else 1,abs(pos[k]-lastp)))
            r['best']=k; r['sc']=round(m,2); r['how']='long'; lastp=pos[k]
        else:
            rc=[(len(g&cg[k])/max(1,len(cg[k])),k) for k in ids if len(cg[k])>=5]
            m2=max(rc)
            if m2[0]>=0.8: r['best']=m2[1]; r['sc']=round(m2[0],2); r['how']='long'; r['trunc']=True; lastp=pos[m2[1]]
cursor={}
def occ(k,n,start=0):
    return cn[k].find(' '+n+' ',start)
def score(k,n):
    if occ(k,n)>=0: return 1.0
    s=max([difflib.SequenceMatcher(None,n,l).ratio() for l in clines[k] if l and abs(len(l)-len(n))<max(20,0.5*len(n))]+[0])
    if s<0.8:
        g=grams(n,3)
        if g: s=max(s,len(g&grams(cn[k],3))/len(g)*0.95)
    return s
prevk=None
for j,r in enumerate(rows):
    if r['ishead']: continue
    n=r['n']
    if r['best']:
        k=r['best']; o=occ(k,n[:60] if len(n)>60 else n,cursor.get(k,0))
        cursor[k]=(o+len(n)) if o>=0 else cursor.get(k,0)
        prevk=k; continue
    if not n: continue
    adj=(j>0 and rows[j-1]['best']) or (j+1<len(rows) and rows[j+1].get('how')=='long') or (j>0 and rows[j-1]['ishead'] and j+1<len(rows) and rows[j+1]['best'])
    if not adj: continue
    nx=next((rows[q]['best'] for q in range(j+1,min(len(rows),j+25)) if rows[q].get('how')=='long'),None)
    lo=pos[prevk] if prevk else 0
    hi=pos[nx] if nx else lo+3
    if hi<lo or hi-lo>6: hi=lo+3
    choice=None
    # continuation of previous cluster
    if prevk and occ(prevk,n,cursor.get(prevk,0))>=0:
        choice=(prevk,1.0)
    else:
        for k in ids[lo+1:hi+1]:
            s=score(k,n)
            if s>=0.75: choice=(k,round(s,2)); break
        if not choice and prevk:
            s=score(prevk,n)
            if s>=0.9 and len(n.split())>=3: choice=(prevk,round(s,2))
    if choice:
        k=choice[0]; r['best']=k; r['sc']=choice[1]; r['how']='win'
        o=occ(k,n,cursor.get(k,0)); cursor[k]=(o+len(n)) if o>=0 else cursor.get(k,0)
        prevk=k
# absorb short unmatched runs sandwiched inside one cluster
j=0
while j<len(rows):
    if rows[j]['ishead'] or rows[j]['best']: j+=1; continue
    k=j
    while k<len(rows) and not rows[k]['ishead'] and not rows[k]['best']: k+=1
    if j>0 and k<len(rows) and rows[j-1]['best'] and rows[j-1]['best']==rows[k]['best'] and k-j<=5:
        for q in range(j,k): rows[q]['best']=rows[j-1]['best']; rows[q]['how']='sandwich'
    j=k
json.dump(rows,open('stage.json','w'),ensure_ascii=False)
# report non-monotonic
last=-1; lastr=None
for r in rows:
    if r['best']:
        p=pos[r['best']]
        if p<last: print('NONMONO',r['i'],r['best'],'after',lastr['i'],lastr['best'],'|',r['t'][:60])
        last=p; lastr=r

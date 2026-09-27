import json,collections,sys
from paths import work
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import norm_words, shingles
D=json.load(open(work('scored.json'))); orig=D['orig']
G=json.load(open(work('gaps.json')))
loc3=collections.defaultdict(set); locw=collections.defaultdict(set)
for c,f,p,t in orig:
    ws=norm_words(t)
    for sh in shingles(ws,3): loc3[c].add(sh)
T=json.load(open(work('tomes.json')))
res=[]
for g in G['gaps']:
    if g['region']!='body': continue
    c=g['carnet']
    try: ci=int(c)
    except: continue
    S=set()
    for x in (ci-1,ci,ci+1): S|=loc3.get(f'{x:03d}',set())
    for i in g['docx_indices']:
        t=T[str(g['tome'])][i]['t']
        ws=norm_words(t)
        if len(ws)<12: continue
        sh=shingles(ws,3)
        c3=sum(1 for s in sh if s in S)/len(sh)
        res.append((c3,g['tome'],i,c,t[:100]))
res.sort(reverse=True)
b=collections.Counter(round(r[0],1) for r in res)
print(sorted(b.items()))
for r in res[:40]: print(r)
json.dump(res,open(work('fp3.json'),'w'),ensure_ascii=False)

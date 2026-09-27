import json,sys,collections
from paths import work
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyze import norm_words, shingles
D=json.load(open(work('scored.json'))); orig=D['orig']
T=json.load(open(work('tomes.json')))
tn=sys.argv[1]; carnets=sys.argv[2].split(',')
idx={}
for p in T[tn]:
    for sh in shingles(norm_words(p['t'])):
        idx.setdefault(sh,p['i'])
last=None
for c,f,pid,t in orig:
    if c not in carnets: continue
    shs=shingles(norm_words(t))
    hits=[idx[s] for s in shs if s in idx]
    pos=collections.Counter(hits).most_common(1)[0][0] if hits else None
    cont=len(hits)/len(shs) if shs else 0
    if f!=last: print('##',c,f); last=f
    print('  ',pid,round(cont,2),pos,t[:50])

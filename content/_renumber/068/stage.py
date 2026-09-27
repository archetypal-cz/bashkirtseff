import json,collections
rows=json.load(open('align3.json'))
C=json.load(open('orig.json')); pos={c['id']:k for k,c in enumerate(C)}; fm={c['id']:c['file'] for c in C}
# home day per cluster from long matches
home={}
cnt=collections.defaultdict(collections.Counter)
for r in rows:
    if r['best'] and r.get('how')=='long': cnt[r['best']][r['head']]+=1
for k,v in cnt.items(): home[k]=set(v)
for r in rows:
    b=r['best']
    if b and r.get('how')=='win':
        if b in home and r['head'] not in home[b]: r['best']=None; r['why']='offday'
        elif b not in home:
            # cluster has no long match: accept only if sc==1 and neighbor rows near
            pass
json.dump(rows,open('stage.json','w'),ensure_ascii=False)
# runs of missing
prevc=None; run=[]
def flush(nextc):
    if run:
        print(f"MISS {run[0]['i']}-{run[-1]['i']} n={len(run)} after {prevc} before {nextc} | {run[0]['t'][:70]}")
        if len(run)<=3:
            for x in run: print('      ',x['i'],x['t'][:120])
for r in rows:
    if r['ishead']: continue
    if r['best']:
        flush(r['best']); run=[]; prevc=r['best']
    else: run.append(r)
flush(None)

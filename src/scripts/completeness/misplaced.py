import json,collections,re
from paths import work
D=json.load(open(work('scored.json'))); orig=D['orig']
RANGES = {1:(0,7),2:(8,14),3:(15,20),4:(21,30),5:(31,44),6:(45,52),7:(53,59),8:(60,64),9:(65,68),10:(69,74),11:(75,80),12:(81,84),13:(85,89),14:(90,94),15:(95,100),16:(101,106)}
out=[]
for tn in range(1,17):
    a,b=RANGES[tn]; ok={f'{x:03d}' for x in range(max(0,a-1),b+2)}
    rows=D['tomes'][str(tn)]
    run=[]
    def flush():
        if len(run)>=1:
            ch=sum(rows[k]['len'] for k in run)
            if len(run)>1 or ch>300:
                locs=[orig[rows[k]['loc']] for k in run]
                out.append({'tome':tn,'docx_start':rows[run[0]]['i'],'docx_end':rows[run[-1]]['i'],'n':len(run),'chars':ch,
                  'orig_carnet':locs[0][0],'orig_files':sorted({l[1] for l in locs}),'pids':[locs[0][2],locs[-1][2]],'first':rows[run[0]]['text'][:80]})
    for k,r in enumerate(rows):
        if r['cls']=='text' and r.get('cont',0)>=0.5 and r.get('nw',0)>=8 and r.get('loc') is not None and orig[r['loc']][0] not in ok and orig[r['loc2']][0] not in ok:
            if run and k-run[-1]>3: flush(); run=[]
            run.append(k)
    flush()
json.dump(out,open(work('misplaced.json'),'w'),ensure_ascii=False,indent=1)
for o in out: print(o['tome'],o['docx_start'],o['docx_end'],o['n'],o['chars'],o['orig_carnet'],o['orig_files'][:3],o['pids'],o['first'][:50])

"""Build rebuild plans merging confirmed page-break pairs. Usage: mkplans.py checked.json CCC... (writes plan-pb-CCC.json next to it)."""
import json,re,glob,subprocess,sys,os
B='/home/coder/bashkirtseff/content/_original/'
D=os.path.dirname(os.path.abspath(sys.argv[1]))
pairs=[o for o in json.load(open(sys.argv[1])) if o.get('ok',o['scan'] in ('PAGEBREAK','SAMEPAGE-FLUSH','VISUAL'))]
def french(pid):
    f=[x for x in glob.glob(B+pid[:3]+'/*.md') if f'%% {pid} %%' in open(x).read()][0]
    L=open(f).read().split('\n'); i=L.index(f'%% {pid} %%'); out=[]
    for l in L[i+1:]:
        if re.match(r'^%% \d{3}\.\d{4} %%$',l.strip()): break
        if l.startswith('%%') or l.startswith('[^') or l.startswith('[//]') or not l.strip(): continue
        out.append(l)
    return out
for c in sys.argv[2:]:
    plan=json.loads(subprocess.check_output(['just','rebuild-carnet-plan',c],cwd='/home/coder/bashkirtseff',stderr=subprocess.DEVNULL))
    plan['source']=plan.get('source') or 'tome scan'
    drops=[]
    for o in [p for p in pairs if p['n'][:3]==c]:
        a=french(o['n']); b=french(o['n1'])
        last=a[-1]
        if last.rstrip().endswith('-') and b[0][:1].islower(): joined=last.rstrip()[:-1]+b[0]
        else: joined=last.rstrip()+' '+b[0].lstrip()
        merged=a[:-1]+[joined]+b[1:]
        for e in plan['entries']:
            for x in e['paragraphs']:
                if x.get('old')==o['n']: x['set_french']='\n'.join(merged)
            e['paragraphs']=[x for x in e['paragraphs'] if x.get('old')!=o['n1']]
        drops.append({'id':o['n1'],'reason':f"joined to {o['n']}: one print paragraph split at a page break in the transcription ({o.get('info') or 'scan-checked'})"})
    plan['drop']=plan.get('drop',[])+drops
    json.dump(plan,open(f'{D}/plan-pb-{c}.json','w'),ensure_ascii=False,indent=1); print(c,len(drops))

"""List paragraph pairs (N, N+1) in _original where N's text ends without terminal punctuation and N+1 starts lowercase (same entry or next entry). Usage: candidates.py CCC... > out.json"""
import re,glob,json,sys
B='/home/coder/bashkirtseff/content/_original/'
def paras(c):
    out=[]
    for f in sorted(glob.glob(B+c+'/*.md')):
        L=open(f).read().split('\n'); cur=None
        for l in L:
            m=re.match(r'^%% (\d{3}\.\d{4}) %%$',l.strip())
            if m: cur={'id':m[1],'file':f.split('_original/')[1],'text':[],'kind':None}; out.append(cur); continue
            if cur is None: continue
            if l.startswith('%% kind:'): cur['kind']=l
            if l.startswith('%%') or l.startswith('[^') or l.startswith('[//]') or not l.strip(): continue
            cur['text'].append(l)
    return sorted(out,key=lambda p:p['id'])
res=[]
for c in sys.argv[1:]:
    P=paras(c)
    for a,b in zip(P,P[1:]):
        if not a['text'] or not b['text']: continue
        ta=re.sub(r'\[\^[^\]]*\]','',a['text'][-1]).rstrip(' *_»"\'')
        tb=b['text'][0].lstrip(' *_«"\'—-')
        if tb.startswith('#') or a['text'][-1].startswith('#'): continue
        if ta and ta[-1] not in '.!?…:;)]»' and tb[:1].islower():
            res.append({'n':a['id'],'n1':b['id'],'fn':a['file'],'fn1':b['file'],'tail':a['text'][-1][-60:],'head':b['text'][0][:60],'kinds':[a['kind'],b['kind']]})
json.dump(res,sys.stdout,ensure_ascii=False,indent=0)

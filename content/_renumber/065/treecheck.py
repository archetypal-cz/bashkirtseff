import re,glob,os,json,sys,unicodedata,difflib
from collections import Counter
sys.path.insert(0,'.')
from orig import load
root=sys.argv[1]; car=sys.argv[2]
def norm(s):
    s=unicodedata.normalize('NFKD',s); s=''.join(ch for ch in s if not unicodedata.combining(ch)).lower()
    s=re.sub(r'\[\^[^\]]*\]','',s)
    return re.sub(r'[^a-z0-9]+',' ',s).strip()
O={c['id']:norm(' '.join(c['vis'])) for c in load(f'{root}/content/_original/{car}')}
for lang in ['cz','uk','en','fr','es']:
    fs=sorted(glob.glob(f'{root}/content/{lang}/{car}/*.md'))
    if not fs: continue
    ids=[]; bad=0
    for f in fs:
        if f.endswith('README.md'): continue
        cur=None; emb={}
        for line in open(f):
            m=re.match(r'^%% ('+car+r'\.\d{4}) %%$',line.strip())
            if m: cur=m.group(1); ids.append(cur); emb.setdefault(cur,[]); continue
            if cur and line.startswith('%% ') and line.rstrip().endswith(' %%') and not line.startswith('%% [#') and not re.match(r'^%% (\d{4}-\d\d-\d\dT|kind:)',line):
                emb[cur].append(line.strip()[3:-3])
        for k,v in emb.items():
            e=norm(' '.join(v)); o=O.get(k)
            if o is None: print(lang,k,os.path.basename(f),'NOT IN ORIGINAL'); continue
            if not e: continue
            r=difflib.SequenceMatcher(None,e[:300],o[:300]).ratio()
            if r<0.6: bad+=1; print(' ',lang,k,os.path.basename(f),'ratio %.2f'%r,'| emb:',e[:45],'| orig:',o[:45])
    dup=[k for k,c in Counter(ids).items() if c>1]
    miss=sorted(set(O)-set(ids))
    print(lang,'count',len(ids),'dups',dup,'missing',miss[:20],'lowratio',bad)

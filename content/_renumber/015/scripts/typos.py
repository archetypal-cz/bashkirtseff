import json,glob,re,collections,sys
sys.path.insert(0,'/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from pathlib import Path
V=collections.Counter()
for f in glob.glob('/home/coder/bashkirtseff/content/_original/[0-9][0-9][0-9]/*.md'):
    t=re.sub(r'%%.*?%%','',Path(f).read_text(),flags=re.S)
    V.update(w.lower() for w in re.findall(r"[A-Za-zÀ-ÿœŒ]+",t))
def ed1(w):
    L='abcdefghijklmnopqrstuvwxyzàâäçéèêëîïôöùûüœ'
    s=[(w[:i],w[i:]) for i in range(len(w)+1)]
    return set([a+b[1:] for a,b in s if b]+[a+b[1]+b[0]+b[2:] for a,b in s if len(b)>1]+[a+c+b[1:] for a,b in s if b for c in L]+[a+c+b for a,b in s for c in L])
for f in sorted(glob.glob(f'{sys.argv[1]}/plan-0*.json')):
    p=json.load(open(f))
    for e in p['entries']:
        for q in e['paragraphs']:
            t=q.get('new',{}).get('french')
            if not t: continue
            for w in set(re.findall(r"[A-Za-zÀ-ÿœŒ]+",t)):
                lw=w.lower()
                if V[lw]>0 or len(lw)<4: continue
                cands=[(V[c],c) for c in ed1(lw) if V[c]>=3]
                if cands:
                    print(p['carnet'],'¶',q.get('_docx',['?'])[0],w,'->',max(cands)[1],max(cands)[0])

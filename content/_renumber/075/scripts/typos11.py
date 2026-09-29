import glob,re,json,sys,collections,unicodedata
sys.path.insert(0,'.')
from cl import load,vis
W=re.compile(r"[A-Za-zÀ-ÿœŒæ]+")
cnt=collections.Counter()
for f in glob.glob('/home/coder/bashkirtseff/content/_original/[0-9]*/*.md'):
    for l in open(f):
        if l.startswith('%%') or l.startswith('---'): continue
        for w in W.findall(l): cnt[w.lower()]+=1
def edits1(w):
    L='abcdefghijklmnopqrstuvwxyzéèêàâçîïôûùë'
    s=[(w[:i],w[i:]) for i in range(len(w)+1)]
    out=set()
    for a,b in s:
        if b: out.add(a+b[1:])
        if len(b)>1: out.add(a+b[1]+b[0]+b[2:])
        for c in L:
            if b: out.add(a+c+b[1:])
            out.add(a+c+b)
    return out
texts=[]
for c in ['075','076','077','078','079','080']:
    O=load('_original',c)
    for k,v in O.items(): texts.append((k,'\n'.join(vis(v['lines']))))
    p=json.load(open(f'plan-{c}.json'))
    for e in p['entries']:
        for x in e['paragraphs']:
            if 'new' in x: texts.append(('new:'+x['new']['rsr'][:40],x['new']['french']))
seen=set()
for k,t in texts:
    for w in W.findall(t):
        lw=w.lower()
        if len(lw)<4 or cnt[lw]>2 or lw in seen: continue
        trip=re.search(r'(.)\1\1',lw)
        best=max(((cnt[e],e) for e in edits1(lw) if cnt[e]>=15), default=None)
        if trip or best:
            seen.add(lw)
            i=t.find(w)
            print(f'{k}\t{w}\t{cnt[lw]}\t{best}\t…{t[max(0,i-40):i+40]!r}')

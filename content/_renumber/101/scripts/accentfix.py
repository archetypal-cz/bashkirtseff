"""old paragraph text whose words lost their accents (import artefact): restore the accents from the docx
(token alignment; only tokens that differ by diacritics alone change). Returns {old_id: new_text}."""
import json,glob,os,sys,re,unicodedata,difflib
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0,'/home/coder/bashkirtseff/src/scripts/rebuild-plan')
from cl import load,vis
from common import para_text
HERE=os.path.dirname(os.path.abspath(__file__))
P=json.load(open(max(glob.glob('/home/coder/bashkirtseff/.cache/rebuild-plan/tome16.docx.*.json'),key=os.path.getmtime)))
R=json.load(open(os.path.join(HERE,'cover16.json')))
def strip(s):
    s=unicodedata.normalize('NFKD',s); return ''.join(ch for ch in s if not unicodedata.combining(ch))
TOK=re.compile(r"[A-Za-zÀ-ÿœŒ]+")
def fix(text, docx_ids):
    d=' '.join(para_text(P[i]) for i in docx_ids).replace('’',"'")
    dt=TOK.findall(d)
    ot=[(m.start(),m.end(),m.group()) for m in TOK.finditer(text)]
    sm=difflib.SequenceMatcher(None,[strip(w).lower() for _,_,w in ot],[strip(w).lower() for w in dt],autojunk=False)
    out=text; changes=[]
    for tag,a1,a2,b1,b2 in reversed(sm.get_opcodes()):
        if tag!='equal': continue
        for k in range(a2-a1-1,-1,-1):
            s,e,w=ot[a1+k]; dw=dt[b1+k]
            if w!=dw and strip(w)==strip(dw) and len(w)==len(dw) and (w.lower()!=dw.lower()) and sum(1 for c in unicodedata.normalize('NFKD',w) if unicodedata.combining(c))<sum(1 for c in unicodedata.normalize('NFKD',dw) if unicodedata.combining(c)):
                # keep the old capitalisation pattern
                nw=''.join(dc.upper() if oc.isupper() else dc.lower() for oc,dc in zip(w,dw))
                out=out[:s]+nw+out[e:]; changes.append((w,nw))
    return out,changes
def run(skip=lambda k: False):
    O={}
    for c in ['101','102','103','104','105','106']: O.update(load('_original',c))
    res={}
    for k in sorted(O):
        if skip(k): continue
        r=R.get(k)
        if not r or not r['docx']: continue
        txt='\n'.join(vis(O[k]['lines']))
        new,ch=fix(txt,r['docx'])
        if ch: res[k]=(new,ch)
    return res
if __name__=='__main__':
    res=run(lambda k: k.startswith('106') and 143<=int(k[4:])<=418)
    import collections
    print(len(res), collections.Counter(k[:3] for k in res), sum(len(v[1]) for v in res.values()))
    for k,(n,ch) in list(res.items()):
        if not k.startswith('106'): print(k,ch)

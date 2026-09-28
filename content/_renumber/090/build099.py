import sys,json,re
sys.path.insert(0,'.')
from lib15 import *
C='099'
draft=json.load(open('dry-100/plan-099.orig.json'))
def O(n,**kw):
    x={'old':f'{C}.{n:04d}'}; x.update(kw); return x
def NEW(french,rsr,**kw):
    n={'french':french,'rsr':rsr}; n.update(kw); return {'new':n}
AUCUN='[Aucun texte - date seule mentionnée]'
WORD=re.compile(r"[\wÀ-ÿœŒ]+")
def add_markers(text,oldlines):
    """re-insert footnote markers found in old lines after the matching word in text"""
    for l in oldlines:
        for m in re.finditer(r'\[\^[^\]]+\]',l):
            before=common.norm(l[:m.start()]).split()[-3:]
            if not before: continue
            toks=[(common.norm(w.group(0)),w.end()) for w in WORD.finditer(text)]
            # compare normalized tokens (norm may split apostrophes: use flat list)
            flat=[]
            for w in WORD.finditer(text):
                for part in common.norm(w.group(0)).split(): flat.append((part,w.end()))
            pos=None
            for i in range(len(flat)-len(before)+1):
                if [x[0] for x in flat[i:i+len(before)]]==before: pos=flat[i+len(before)-1][1]
            if pos is None: raise SystemExit(f'marker {m.group(0)} not placed: {l[:80]}')
            text=text[:pos]+m.group(0)+text[pos:]
    return text
def dtext(a,b):
    out=[]
    for f,l,t in groups(a,b):
        t=re.sub(r'(?<=[a-zà-ÿA-Z])- (?=[a-zà-ÿA-Z])','-',t).replace('Et Cette année aussi','Et cette année aussi')
        out.append((f,l,t))
    return out
def diary(a,b,old):
    out=[]
    for f,l,t in dtext(a,b):
        t=add_markers(t,[x for x in old if x_in(x,f,l)])
        out.append(NEW(t,rsr_split(f,l)))
    return out
LOCS={}
def x_in(line,f,l):
    r=LOCS.get(line); return r is not None and f<=r[0]<=l
def rsr_split(a,b,src=None):
    return f'Split out of {SRC} (a whole day in one cluster, letters included): text from tome15.docx {rng(a,b)}, Mon Journal t.15 {pages(a,b)} ({TODAY} rebuild).'
def letter(a,b,source,old):
    gs=dtext(a,b)
    t='\n'.join(g[2] for g in gs)
    t=add_markers(t,[x for x in old if x_in(x,a,b)])
    return NEW(t,rsr_split(a,b),kind='letter',source=source)
def setup(cid):
    global SRC; SRC=cid
    LOCS.clear()
    for l,r in zip(CL[C][cid]['lines'],LOC[C][cid]):
        if r: LOCS[l]=r
    # lines with markers whose locate failed: attach to neighbour
    lines=CL[C][cid]['lines']
    for i,l in enumerate(lines):
        if l not in LOCS and not l.startswith('[^') and i>0 and lines[i-1] in LOCS:
            LOCS[l]=(LOCS[lines[i-1]][1],LOCS[lines[i-1]][1])
    return lines
E=[]
for e in draft['entries']:
    f=e['file']
    if f=='1883-08-08.md': continue
    if f=='1883-08-26.md':
        e=dict(e); e['file']='1883-04-28.md'; e['date']='1883-04-28'; e['heading']='Samedi 28 avril 1883'; e['frontmatter_from']='1883-04-27.md'
        e['paragraphs']=[json.loads(json.dumps(q)) for q in e['paragraphs']]
        e['paragraphs'][0]['new']['rsr']=e['paragraphs'][0]['new']['rsr'][:-1]+'; the date line (¶2839) is printed «Samedi 26 août 1883», a misprint: it stands between Friday 27 and Sunday 29 April 1883 in Livre 99, and the Easter-eve midnight mass (Orthodox Easter fell on 29 April 1883) fixes the day as Saturday 28 April.'
        E.insert([i for i,x in enumerate(E) if x['date']=='1883-04-27'][0]+1,e); continue
    ps=[]
    for q in e['paragraphs']:
        if 'old' in q:
            q={k:v for k,v in q.items() if not k.startswith('_')}
            if q['old'] in ('099.0091','099.0092','099.0093') and f=='1883-04-07.md': continue
            if q['old']=='099.0074': q.pop('kind',None)
            if q['old'] in ('099.0113','099.0115'): q['kind']='editorial'
            if q['old'] in ('099.0040','099.0132','099.0134'): q['set_french']=AUCUN
        else:
            if q['new']['french'].startswith('Lundi 1 4 mail'): continue
            if f=='1883-05-24.md': continue
        ps.append(q)
    e=dict(e); e['paragraphs']=ps
    if f=='1883-05-13.md':
        e['paragraphs']=[O(365),O(366)]
        E.append(e); E.append({'file':'1883-05-14.md','date':'1883-05-14','heading':'Lundi 14 mai 1883','paragraphs':[O(367),O(368)]}); continue
    if f=='1883-04-07.md':
        E.append(e)
        E.append({'file':'1883-04-08.md','date':'1883-04-08','heading':'Dimanche 8 avril 1883','paragraphs':[O(n) for n in range(91,98)]}); continue
    E.append(e)
# 0319: margin note split
for e in E:
    for k,q in enumerate(e['paragraphs']):
        if q.get('old')=='099.0319':
            l0=CL[C]['099.0319']['lines'][0]
            q['kind']='margin'; q['set_french']=l0
            t=common.para_text(P[2963]).replace('tombe I”','tombe !”')
            e['paragraphs'].insert(k+1,NEW(t,f'Split out of 099.0319, which held the marginal note «[En travers: …]» (tome15.docx ¶2962, small type) and this paragraph together: text from tome15.docx ¶2963, Mon Journal t.15 p.{page(2963)}; OCR «tombe I”» read «tombe !”» from the print ({TODAY} rebuild).'))
            break
# 24 May
lines=setup('099.0393')
head=[l for l in lines[1:13]]
assert head[-1].startswith('La meme chose ici'),head[-1]
p24=[O(393,set_french='\n'.join(head))]
p24.append(letter(3302,3310,'Lettre de Marie à Tony Robert-Fleury (copie), 24 mai 1883',lines))
p24+=diary(3311,3314,lines)
p24.append(letter(3315,3328,'Lettre de Tony Robert-Fleury à Marie, 24 mai 1883 (copie, avec les remarques de Marie au lecteur)',lines))
p24+=diary(3329,3330,lines)
p24.append(letter(3331,3334,'Lettre de Marie à Tony Robert-Fleury (copie), 24 mai 1883',lines))
p24+=diary(3335,3343,lines)
p24.append(letter(3344,3349,'Lettre de Marie à Jules Bastien-Lepage (copie), 24 mai 1883',lines))
p24+=diary(3350,3362,lines)
lines=setup('099.0394')
head=lines[1:10]; assert head[-1].startswith('Voici ce que je recois'),head[-1]
p25=[O(394,set_french='\n'.join(head))]
p25.append(letter(3375,3379,"Lettre d'Émile Bastien-Lepage à Marie, 25 mai 1883",lines))
p25+=diary(3380,3381,lines)
p25.append(letter(3382,3386,'Billet de Marie à Émile Bastien-Lepage (copie), 25 mai 1883',lines))
p25+=diary(3387,3389,lines)
lines=CL[C]['099.0395']['lines']
k=lines.index('Me calmer...')
own395='\n'.join(lines[1:k+1])
for e in E:
    if e['date']=='1883-05-24': e['paragraphs']=p24
    if e['date']=='1883-05-25': e['paragraphs']=p25
    if e['date']=='1883-05-26': e['paragraphs']=[O(395,set_french=own395)]
plan={'carnet':'099','source':'tome15.docx','drop':[],'entries':E}
json.dump(plan,open('work/plan-099.json','w'),ensure_ascii=False,indent=1)
ids=[p['old'] for e in E for p in e['paragraphs'] if 'old' in p]
print('missing',sorted(set(CL[C])-set(ids)),'dups',[x for x in ids if ids.count(x)>1],'foreign',[x for x in ids if not x.startswith('099')])
print([e['file'] for e in E][:12], len(E))
for e in E:
    for q in e['paragraphs']:
        t=(q.get('new') or {}).get('french') or q.get('set_french') or ''
        fl=common.ocr_flags(t)
        if fl or re.search(r'[a-zà-ÿ]- [a-zà-ÿ]',t) or 'I!' in t: print('FLAG',e['date'],fl,t[:100])

import json,re,collections
d=json.load(open('t09.json'))
rows=json.load(open('stage.json'))
C=json.load(open('orig.json')); cid=[c['id'] for c in C]; CB={c['id']:c for c in C}
R={r['i']:r for r in rows}
MONTHS={'janvier':1,'février':2,'fevrier':2,'décembre':12,'decembre':12,'Janvier':1}
# ---------- overrides
OVR={3799:'068.0153',3800:'068.0153',3802:'068.0155',3985:'068.0220',3751:'068.0110',
     4800:'068.0427',4801:'068.0427',4661:'068.0288',4558:None}
for i,v in OVR.items(): R[i]['best']=v
EXCLUDE={}
EXCLUDE_OLD={4630:'editorial note of the transcriber ([Marie est passée de la page 184 à 185 …])'}
# ---------- headings
HEADS={}
for r in rows:
    if not r['ishead']: continue
    t=r['t']
    m=re.match(r'^(\w+)\s+([\dI ]+?|Ier)\s*(janvier|février|décembre|Janvier)\s*([\dÎî ]+)',t)
    day=m.group(2).replace(' ','')
    day='1' if day in ('Ier','I') else day
    mon=MONTHS[m.group(3)]; yr=1876 if mon==12 else 1877
    wd=m.group(1)
    dstr=('1er' if day=='1' else day)
    txt=f"{wd} {dstr} {m.group(3).lower()} {yr}"
    if r['i']==4026: txt='Samedi 13 janvier / 1er janvier 1877'
    HEADS[r['i']]={'date':f"{yr}-{mon:02d}-{int(day):02d}",'heading':txt}
hidx=sorted(HEADS)
def dayof(k):
    h=[x for x in hidx if x<=k]; return h[-1]
# ---------- cluster keys
bycl=collections.defaultdict(list)
for r in rows:
    if r['best'] and not r['ishead']: bycl[r['best']].append(r['i'])
EMPTY=[c['id'] for c in C if not c['vis']]
HEADONLY={}
for c in C:
    v=c['vis']
    if v and v[0].startswith('#'):
        m=re.search(r'(\d+)(?:er)? (janvier|février|décembre)',v[0])
        dd=f"{1876 if m.group(2)=='décembre' else 1877}-{MONTHS[m.group(2)]:02d}-{int(m.group(1)):02d}"
        hi=[h for h in hidx if HEADS[h]['date']==dd][0]
        if len(v)==1 or c['id'] in ('068.0031','068.0121'):
            HEADONLY[c['id']]=hi
key={}
for c in C:
    k=c['id']
    if k in EMPTY: continue
    if k in HEADONLY: key[k]=HEADONLY[k]+ (0.5 if bycl.get(k) is None else 0)  ;
    if k in HEADONLY and bycl.get(k): key[k]=min(bycl[k])
    elif k in bycl: key[k]=min(bycl[k])
key['068.0046']=3658
key['068.0204']=3883.5
key['068.0121']=3762.5
# NODOCX non-heading clusters: follow predecessor
for j,c in enumerate(C):
    k=c['id']
    if k in EMPTY or k in key: continue
    p=j-1
    while cid[p] not in key: p-=1
    key[k]=key[cid[p]]+0.01*(j-p)
    print('NODOCX follow',k,'after',cid[p],key[k],c['vis'][:1])
# ---------- set_french (trailing headings, splits, completions)
SETF={}
for c in C:
    v=c['vis']
    if len(v)>=2 and v[-1].startswith('#') and c['id']!='068.0031':
        SETF[c['id']]='\n'.join(v[:-1])
SETF['068.0046']='\n'.join(CB['068.0046']['vis'][:2])
SPLIT46='\n'.join(CB['068.0046']['vis'][3:])
SETF_LATE={'068.0288':4661,'068.0427':(4800,4801)}
# ---------- new text from docx
def ptext(i):
    p=d[i]; out=''; buf=''; inI=False
    segs=[]
    for t,it,u,b in p['runs']:
        if segs and segs[-1][1]==it: segs[-1][0]+=t
        else: segs.append([t,it])
    for t,it in segs:
        if it and t.strip():
            lead=t[:len(t)-len(t.lstrip())]; trail=t[len(t.rstrip()):]
            out+=lead+'*'+t.strip()+'*'+trail
        else: out+=t
    if not p['runs']: out=p['t']
    s=out.strip()
    s=re.sub(r'\*\s*\*','',s)
    # OCR normalisation
    s=re.sub(r'(?<=\s)II!!',  '!!!!',s)
    s=re.sub(r'(?<=\s)II!',  '!!!',s)
    s=re.sub(r'(?<=\s)I!',   '!!',s)
    s=re.sub(r'(?<=\s)II$',  '!!',s)
    s=re.sub(r'\b1 8(\d)(\d)\b',r'18\1\2',s)
    s=re.sub(r'\b1 8 ?(\d) ?(\d)\b',r'18\1\2',s)
    if i==4630: s=s.replace('pagel 84','page 184')
    return s
FORCE={4224:4227,4228:4229}
FORCED={j for a,b in FORCE.items() for j in range(a,b+1)}
PM=json.load(open('/tmp/claude-1000/-home-krr-bashkirtseff/467edde8-50c6-480d-80c0-3a213d11ff10/scratchpad/scans/tome09_pagemap.json'))
def pages(a,b):
    ps=sorted({x['printed_page'] for x in PM if x.get('docx_para_end') and x.get('printed_page') and x['docx_para_start']<=b and x['docx_para_end']>=a})
    if not ps: return ''
    return f"p.{ps[0]}" if len(ps)==1 else f"pp.{ps[0]}–{ps[-1]}"
KINDS={4224:('letter','Lettre anonyme que Marie s’écrit à elle-même en lettres d’imprimerie, signée « Don Fortunato », 22 janvier 1877'),
       4228:('letter','Lettre anonyme que Marie s’écrit à elle-même en lettres d’imprimerie, signée « Turcan », 22 janvier 1877'),
       4293:('clipping','Le Sport, compte rendu des Courses de Nice par Robert Milton, janv. 1877'),
       4349:('clipping','Le Sport (Robert Milton), compte rendu du dernier jour des Courses de Nice, janv. 1877'),
       4626:('other','bracketed «[Elliminez.]» in the printed edition; meaning unclear'),
       4630:('editorial','note of the Cercle edition’s editors on the manuscript pagination')}
def kindof(first,text):
    if first in KINDS: return KINDS[first]
    t=text.strip()
    if (t.startswith('[') and t.endswith(']') and t.count('[')==1) or (t.startswith('(Rayé') and t.endswith(')')):
        if re.match(r'^\[(En travers|Dans la marge|En marge|En haut|Bas de page)',t): return ('margin',None)
        if re.search(r'Rayé|cancell|noirci|barré',t): return ('rayé',None)
        return ('other',None)
    return (None,None)
NEWROWS=[r['i'] for r in rows if not r['ishead'] and not r['best'] and r['i'] not in EXCLUDE]
items=[]  # (key, item)
groups=[]
for i in NEWROWS:
    t=ptext(i)
    if i in FORCED:
        if i in FORCE: groups.append({'first':i,'last':i,'text':t})
        else: groups[-1]['text']+='\n'+t; groups[-1]['last']=i
        continue
    if groups and groups[-1]['last']==i-1-sum(1 for x in range(groups[-1]['last']+1,i) if not d[x]['t'].strip()) and dayof(groups[-1]['first'])==dayof(i):
        prev=groups[-1]['text']
        if not re.search(r'[A-Za-zÀ-ÿ]',t):
            groups[-1]['text']=prev+'\n'+t; groups[-1]['last']=i; continue
        pl=prev.split('\n')[-1].rstrip('*').rstrip()
        if re.match(r'^[a-zà-ÿ]',t) or pl.endswith('-') or (pl.startswith('[') and pl.count('[')>pl.count(']')):
            groups[-1]['text']=prev+' '+t; groups[-1]['last']=i; continue
        if not re.search(r'[.!?…:;»"”\)\]]$',pl):
            groups[-1]['text']=prev+'\n'+t; groups[-1]['last']=i; continue
    groups.append({'first':i,'last':i,'text':t})
def rsr(g):
    rng=f"¶{g['first']}" if g['first']==g['last'] else f"¶{g['first']}–{g['last']}"
    pg=pages(g['first'],g['last'])
    return f"Restored from tome09.docx {rng}, Mon Journal t.9 {pg} (missing from original extraction, 2026-09-27 rebuild)."
for g in groups:
    k,src=kindof(g['first'],g['text'])
    nw={'french':g['text'],'rsr':rsr(g)}
    if k: nw['kind']=k
    if src: nw['source']=src
    items.append((g['first'],{'new':nw},g))
# special: 22 Feb heading carries "Il pleut."
items.append((5096.5,{'new':{'french':'Il pleut.','rsr':'Restored from tome09.docx ¶5096 (Mon Journal t.9 p.'+pages(5096,5096)[2:]+'), where it stands on the date line «Jeudi 22 février 1877 Il pleut.» (missing from original extraction, 2026-09-27 rebuild).'}},None))
# 46 split
items.append((3652,{'new':{'french':SPLIT46,'rsr':'Split off 068.0046 in the 2026-09-27 rebuild: these lines stand under «Mercredi 20 décembre 1876» in tome09.docx (¶3652–3655), not under 21 December.'}},None))
# empty days 6/7 Feb
for hi in (4447,4448):
    items.append((hi+0.5,{'new':{'french':'[Aucun texte - date seule mentionnée]','rsr':f'tome09.docx ¶{hi}: the date line is followed directly by the next date line; empty-day note as in 068.0031 and 068.0204 (2026-09-27 rebuild).'}},None))
for k,v in key.items():
    it={'old':k}
    if k in SETF: it['set_french']=SETF[k]
    items.append((v,it,None))
SETF['068.0288']=ptext(4661)
SETF['068.0181']='- '+ptext(3829)
SETF['068.0427']=ptext(4800)+' '+ptext(4801)
for _k,_v,_g in items:
    if 'old' in _v and _v['old'] in SETF: _v['set_french']=SETF[_v['old']]

items.append((3660,{'new':{'french':ptext(3660),'kind':'editorial','source':'note of the Cercle edition’s editors on the order of the passages','rsr':'Split off 068.0046 in the 2026-09-27 rebuild: tome09.docx ¶3660, Mon Journal t.9 p.'+pages(3660,3660)[2:]+'. The old text read «[En marge: Passages écrits au milieu du 21 décembre]»; the docx and the printed page read «[1876: …]». An editors’ note on the manuscript, kept as its own paragraph (KRR 2026-09-27).'}},None))
items.append((4015,{'new':{'french':CB['068.0238']['vis'][3],'kind':'editorial','source':'note of the Cercle edition’s editors on the manuscript pagination','rsr':'Split off 068.0238 in the 2026-09-27 rebuild: tome09.docx ¶4015, Mon Journal t.9 p.'+pages(4015,4015)[2:]+'. An editors’ note on the physical manuscript, kept as its own paragraph (KRR 2026-09-27).'}},None))
SETF['068.0238']='\n'.join(CB['068.0238']['vis'][:3])
def lab(k,label='En travers: '):
    v=list(CB[k]['vis']); assert v[0].startswith('[') and not v[0].startswith('[En travers'); v[0]='['+label+v[0][1:]; return '\n'.join(v)
for k in ('068.0322','068.0418','068.0472','068.0550','068.0638','068.0660'): SETF[k]=lab(k)
v=CB['068.0500']['vis'][0]; assert "l'premier soir quand" in v; SETF['068.0500']=v.replace("l'premier soir quand","l'premier soir [sic] quand")
assert CB['068.0226']['vis']==['Marie Bashkirtseff"']; SETF['068.0226']='Marie Bashkirseff"'
for _k,_v,_g in items:
    if 'old' in _v and _v['old'] in SETF: _v['set_french']=SETF[_v['old']]
OLDKIND={}
for n in range(184,188): OLDKIND['068.%04d'%n]=('letter','Lettre de Marie à un inconnu (copie), 7 janvier 1877')
for n in range(199,204): OLDKIND['068.%04d'%n]=('letter','Lettre de Marie à M. Pierret (copie), 7 janvier 1877')
for n in range(220,227): OLDKIND['068.%04d'%n]=('letter','Lettre de Marie à M. Pierret (copie, pas encore envoyée), 10 janvier 1877')
for n in range(641,644): OLDKIND['068.%04d'%n]=('other','Brouillon de télégramme à Larderei (une farce), 23 février 1877')
for k in ('068.0322','068.0418','068.0419','068.0472','068.0550','068.0638','068.0660','068.0661'): OLDKIND[k]=('margin',None)
OLDKIND['068.0091']=('rayé',None)
for _k,(_kind,_src) in OLDKIND.items():
    if _kind=='letter':
        base=SETF.get(_k,'\n'.join(CB[_k]['vis']))
        SETF[_k]='\n'.join(l if l.startswith('> ') else '> '+l for l in base.split('\n'))
for _k,_v,_g in items:
    if 'old' in _v and _v['old'] in SETF: _v['set_french']=SETF[_v['old']]
for _k,_v,_g in items:
    if 'old' in _v and _v['old'] in OLDKIND:
        _v['kind'],src=OLDKIND[_v['old']]
        if src: _v['source']=src
items.sort(key=lambda x:x[0])
# ---------- entries
entries=collections.OrderedDict()
for h in hidx:
    entries[h]={'file':HEADS[h]['date']+'.md','date':HEADS[h]['date'],'heading':HEADS[h]['heading'],'paragraphs':[]}
for k,it,g in items:
    entries[dayof(k)]['paragraphs'].append(it)
# frontmatter_from
oldfiles=sorted(set(c['file'] for c in C))
def fmfrom(date):
    cands=[f for f in oldfiles if f[:10]<=date]
    return cands[-1]
out=[]
for h,e in entries.items():
    if not any('old' in p for p in e['paragraphs']):
        e['frontmatter_from']= '1877-02-10-12.md' if e['date']>='1877-02-06' else '1877-01-10-18.md'
    out.append(e)
cover={'file':'1876-12-12-cover.md','date':'1876-12-12','frontmatter_from':'1876-12-12.md','paragraphs':[
  {'new':{'french':'\n'.join(ptext(i) for i in range(3381,3388)),'kind':'cover','source':'page de titre du Livre 68','rsr':'Restored from tome09.docx ¶3381–3387, Mon Journal t.9 p.'+pages(3381,3387)[2:]+': the title page Marie wrote for Livre 68 (motto, book number, dates, places). Not in the original extraction; cover entry per KRR 2026-09-27.'}},
  {'new':{'french':'[En travers: 23 mai 1875]','kind':'cover','source':'page de titre du Livre 68, écrit en travers','rsr':'Restored from tome09.docx ¶3388, Mon Journal t.9 p.'+pages(3388,3388)[2:]+'. The docx OCR reads «23 mail 875»; the printed page reads «23 mai1875». Written across the title page; cover entry per KRR 2026-09-27.'}}]}
out.insert(0,cover)
for e in out:
    if e['file']=='1877-02-22.md': e['redirect_from']=['1877-02-22-23.md']
drop=[{'id':k,'reason':'empty placeholder cluster (no text in _original or any translation); the paragraph it stood for is inserted as a new paragraph restored from tome09.docx (2026-09-27 rebuild)'} for k in EMPTY if k!='068.0271']
drop.append({'id':'068.0271','reason':'empty block left after the 2026-09-26 removal of an English placeholder; tome09.docx ¶4644 is followed directly by ¶4645 (2026-09-27 rebuild)'})
plan={'carnet':'068','source':'tome09.docx','drop':drop,'entries':out}
json.dump(plan,open('plan.json','w'),ensure_ascii=False,indent=1)
json.dump(groups,open('newgroups.json','w'),ensure_ascii=False,indent=1)
print('entries',len(out),'new groups',len(groups),'setf',len(SETF),'drops',len(drop))

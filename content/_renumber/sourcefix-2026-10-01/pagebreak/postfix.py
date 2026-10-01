"""Post-fix for page-break merges written by rebuild-carnet.
Usage: postfix.py ROOT MAPJSON CHECKED.json CCC
- joins old N+1's visible translation onto N in cz/uk/en/fr (and moves its non-embed comments, tags and missing footnote defs) in every tree incl. _original;
- replaces the tool's per-paragraph SOURCE CHANGED note with a seam note;
- restores approval flags and removes the tool's entry-level flag-reset ED note (pure joins).
Pre-state comes from git HEAD (the carnet must be clean before the write)."""
import sys,json,re,subprocess,glob,os
root,mapf,chk,c=sys.argv[1:5]
ts=subprocess.check_output(['date','+%Y-%m-%dT%H:%M:%S']).decode().strip()
idmap=json.load(open(mapf))['id_map']
pairs=sorted([o for o in json.load(open(chk)) if o['n'][:3]==c and o.get('ok',True)],key=lambda o:o['n'])
chainhead={}
for o in pairs: chainhead[o['n1']]=chainhead.get(o['n'],o['n'])
IDRE=re.compile(r'^%% (\d{3}\.\d{4}) %%$')
def head(path):
    try: return subprocess.check_output(['git','show','HEAD:'+path],cwd=root,stderr=subprocess.DEVNULL).decode().split('\n')
    except subprocess.CalledProcessError: return None
def cluster(L,pid):
    i=[k for k,l in enumerate(L) if l.strip()==f'%% {pid} %%']
    if not i: return None
    i=i[0]; j=i+1
    while j<len(L) and not IDRE.match(L[j].strip()): j+=1
    return i,j
def is_embed(l): return l.startswith('%% ') and not re.match(r'^%% (\d{4}-\d\d-\d\dT[\d:]+ [A-Z]+:|\[#|kind:)',l) and l.rstrip().endswith('%%')
def relabel(s):
    # footnote labels that embed paragraph numbers were rewritten by the tool; map them for moved lines
    def f(m):
        lab=m.group(1); mm=re.match(r'^(\d{1,3})\.(\d{1,4})(\..*)$',lab)
        if not mm: return m.group(0)
        old=f'{int(mm[1]):03d}.{int(mm[2]):04d}'; new=idmap.get(old)
        if not new or new==old: return m.group(0)
        w3=len(mm[1]); w4=len(mm[2])
        nn=f'{int(new[:3]):0{w3}d}.{int(new[4:]):0{w4}d}' if w4>=4 or True else ''
        return '[^'+nn+mm[3]+']'
    dropped={d['id'] for d in json.load(open(mapf)).get('dropped',[])}
    def g(m):
        old=m.group(0)
        if old in dropped: return old.replace('.','.DROPPED-')
        return idmap.get(old,old)
    parts=re.split(r'(\[\^[^\]]*\])',s)
    return ''.join(x if x.startswith('[^') else re.sub(r'(?<![\d.])\d{3}\.\d{4}(?![\d])',g,x) for x in parts)
report=[]
for t in ['_original','cz','uk','en','fr']:
    touched=set()
    for o in pairs:
        n_new=idmap[chainhead.get(o['n'],o['n'])]; fpath=f"content/{t}/{o['fn']}"
        pre=head(fpath); 
        if pre is None: continue
        cl1=cluster(pre,o['n1'])
        if not cl1: report.append(f'{t} {o["n1"]} absent pre'); continue
        old1=pre[cl1[0]+1:cl1[1]]
        L=open(os.path.join(root,fpath)).read().split('\n')
        cn=cluster(L,n_new)
        if not cn: report.append(f'{t} {n_new} absent post'); continue
        a,b=cn; block=L[a+1:b]
        vis1=[x for x in old1 if x.strip() and not x.startswith('%%') and not x.startswith('[^') and not x.startswith('[//]')]
        tags1=[x for x in old1 if x.startswith('%% [#')]
        notes1=[relabel(x) for x in old1 if x.startswith('%%') and not x.startswith('%% [#') and not is_embed(x) and not x.startswith('%% kind:') and not ('ED: rebuild-carnet' in x)]
        defs1=[x for x in old1 if x.startswith('[^')]
        # avoid footnote-label collisions: a moved label that the rewritten file already defines elsewhere gets an «m» suffix
        filetext='\n'.join(L)
        for lab in set(re.findall(r'\[\^([^\]]+)\]', '\n'.join(vis1))):
            post_d=re.search(r'(?m)^\[\^'+re.escape(lab)+r'\]:(.*)$',filetext); pre_d=re.search(r'(?m)^\[\^'+re.escape(lab)+r'\]:(.*)$','\n'.join(pre))
            if post_d and pre_d and post_d.group(1).strip()!=pre_d.group(1).strip():
                defs1=defs1+[x for x in [pre_d.group(0)] if x not in defs1]
                vis1=[x.replace('[^'+lab+']','[^'+lab+'m]') for x in vis1]
                defs1=[x.replace('[^'+lab+']:','[^'+lab+'m]:') for x in defs1]
        new=list(block)
        # 1 visible join (translations and fr visible); _original already has merged French
        if t!='_original' and vis1:
            vi=[k for k,x in enumerate(new) if x.strip() and not x.startswith('%%') and not x.startswith('[^') and not x.startswith('[//]')]
            if vi:
                k=vi[-1]
                if vis1==['TODO'] or vis1==['# TODO']:
                    notes1.append(f'%% {ts} ED: the second half of this paragraph ({o["n1"][:3]}.DROPPED-{o["n1"][4:]}) was untranslated (TODO) — translate the rest of the French above. %%')
                elif new[k].strip()=='TODO':
                    new[k]='\n'.join(vis1)
                else:
                    sep='\n' if o.get('mode')=='nl' else ('' if new[k].rstrip().endswith('-') else ' ')
                    base=new[k].rstrip()[:-1] if sep=='' else new[k].rstrip()
                    if sep=='\n': base=new[k].rstrip()
                    new[k]=base+sep+vis1[0].lstrip()
                    if len(vis1)>1: new[k]+='\n'+'\n'.join(vis1[1:])
            else:
                new.append('\n'.join(vis1))
        # 2 seam note replaces the tool's SOURCE CHANGED note
        seam=f'%% {ts} ED: paragraphs merged at a page break — check the seam ({o["n1"][:3]}.DROPPED-{o["n1"][4:]} joined to {n_new}; one paragraph in the print, {o.get("info","scan-checked")}). %%'
        sc=[k for k,x in enumerate(new) if 'ED: rebuild-carnet' in x and 'SOURCE CHANGED' in x]
        if sc: new[sc[0]]=seam; [new.__setitem__(k,None) for k in sc[1:]]
        elif t!='_original': new.append(seam)
        new=[x for x in new if x is not None]
        # 3 tags after last tag line (dedupe)
        have=set(new)
        tags1=[x for x in tags1 if x not in have]
        if tags1:
            ti=[k for k,x in enumerate(new) if x.startswith('%% [#')]
            pos=(ti[-1]+1) if ti else 0
            new[pos:pos]=tags1
        # 4 other notes after the last non-empty line (before trailing blanks)
        notes1=[x for x in notes1 if x not in have]
        if notes1:
            k=len(new)
            while k>0 and not new[k-1].strip(): k-=1
            new[k:k]=notes1
        L[a+1:b]=new
        # 5 footnote defs missing anywhere in the file
        text='\n'.join(L)
        miss=[d for d in defs1 if d.split(':')[0]+':' not in text]
        if miss:
            while L and not L[-1].strip(): L.pop()
            L+= ['']+miss+['']
        open(os.path.join(root,fpath),'w').write('\n'.join(L)); touched.add(fpath)
    # 6 flags + entry-level reset notes
    if t=='_original': continue
    for fpath in touched:
        pre=head(fpath); L=open(os.path.join(root,fpath)).read().split('\n')
        pre_fm={m.group(1):l for l in pre[:40] for m in [re.match(r'^(\s*(?:translation_complete|editor_approved|conductor_approved|opus_reviewed|edition_complete|review_complete)):',l)] if m}
        for k,l in enumerate(L[:40]):
            m=re.match(r'^(\s*(?:translation_complete|editor_approved|conductor_approved|opus_reviewed|edition_complete|review_complete)):',l)
            if m and m.group(1) in pre_fm: L[k]=pre_fm[m.group(1)]
        L=[l for l in L if not ('ED: rebuild-carnet' in l and 'approval flags reset' in l)]
        open(os.path.join(root,fpath),'w').write('\n'.join(L))
print('\n'.join(report) or 'no issues')

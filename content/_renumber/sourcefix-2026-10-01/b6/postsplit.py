# postsplit.py ROOT RUN_TS CARNET...
# After rebuild-carnet split plans (set_french on the head + `new` paragraphs whose RSR note reads
# «Split: … they shared one ID (CCC.NNNN)» / «Split: paragraph k of n … (CCC.NNNN)»): distribute the head's
# existing translation over the new clusters, replace the tool's SOURCE CHANGED / flags-reset notes
# with a split note, restore approval flags from HEAD. Anything it cannot split cleanly stays TODO (reported).
import sys,os,re,subprocess,glob
root,ts=sys.argv[1],sys.argv[2]; carnets=sys.argv[3:]
IDL=re.compile(r'^%% (\d{3}\.\d{4}) %%$')
FLAGS=r'^(\s*(?:translation_complete|editor_approved|conductor_approved|opus_reviewed|edition_complete|review_complete)):'
def head(p):
    try: return subprocess.check_output(['git','show','HEAD:'+p],cwd=root,stderr=subprocess.DEVNULL).decode().split('\n')
    except subprocess.CalledProcessError: return None
def clusters(L):
    ids=[(k,IDL.match(l).group(1)) for k,l in enumerate(L) if IDL.match(l)]
    out={}
    for n,(k,pid) in enumerate(ids):
        e=ids[n+1][0] if n+1<len(ids) else len(L)
        # stop before footnote definitions / entry-level notes (blank line followed by only comments/defs)
        out[pid]=(k,e)
    return out
def visible(L,a,b):
    return [k for k in range(a+1,b) if L[k].strip() and not L[k].startswith('%%') and not L[k].startswith('[^') and not L[k].startswith('[//]:')]
def split_special(v,n,pid):
    if n==4 and len(v)==2:   # 081.0488-type: [label] + text / two sentences + rest
        m=re.match(r'^(\[[^\]]*\])\s*(.+)$',v[0])
        s=re.search(r'(Walitsk\w*|Вал[іи]цьк\w*|Валицк\w*)\.\s*',v[1])
        if m and s: return [m.group(1),m.group(2),v[1][:s.end()].rstrip(),v[1][s.end():].strip()]
    if n==2 and len(v)==1:
        k=v[0].find(' [')
        if k>0: return [v[0][:k].rstrip(),v[0][k:].strip()]
    if n==15 and len(v)==16:  # 082.0444 letter: lines 8+9 are one print paragraph
        j=v[7].rstrip().rstrip('*').rstrip()+' '+re.sub(r'^>\s*\*?','',v[8]).lstrip()
        return v[:7]+[j]+v[9:]
    return None
report=[]
for c in carnets:
    O={}
    for f in glob.glob(f'{root}/content/_original/{c}/*.md'):
        L=open(f).read().split('\n')
        for l_i,l in enumerate(L):
            m=re.search(r'RSR: Split: .*\((\d{3}\.\d{4})\)\. %%$',l)
            if m and l.startswith(f'%% {ts[:16]}'):
                pid=[IDL.match(L[k]).group(1) for k in range(l_i,-1,-1) if IDL.match(L[k])][0]
                O.setdefault(m.group(1),[]).append(pid)
    for t in ['cz','uk','en','fr']:
        for f in sorted(glob.glob(f'{root}/content/{t}/{c}/*.md')):
            L=open(f).read().split('\n'); C=clusters(L); changed=False
            for hid,news in O.items():
                if hid not in C: continue
                n=1+len(news); a,b=C[hid]; vi=visible(L,a,b)
                v=[L[k] for k in vi]
                if t=='fr' and not v:
                    pieces=None
                elif len(v)==n: pieces=v
                else: pieces=split_special(v,n,hid)
                if not pieces or len(pieces)!=n:
                    report.append(f'{t} {hid}: {len(v)} visible lines for {n} pieces — left TODO'); continue
                # new clusters (may be in this file only)
                ok=all(x in C for x in news)
                if not ok: report.append(f'{t} {hid}: new clusters not in same file'); continue
                for x,p in zip(news,pieces[1:]):
                    xa,xb=C[x]; tv=[k for k in visible(L,xa,xb) if L[k].strip() in('TODO','# TODO')]
                    if tv: L[tv[0]]=p
                    elif t=='fr' and visible(L,xa,xb):
                        xv=visible(L,xa,xb); L[xv[0]]=p
                        for k in xv[1:]: L[k]=None
                    else: report.append(f'{t} {x}: no TODO line — piece not placed')
                L[vi[0]]=pieces[0]
                for k in vi[1:]: L[k]=None
                note=f'%% {ts} ED: paragraph split into {hid}…{news[-1]} as printed (one ID held {n} print paragraphs); the existing translation was distributed over them unchanged — check the split points. %%'
                sc=[k for k in range(a+1,b) if L[k] and 'ED: rebuild-carnet' in L[k] and 'SOURCE CHANGED' in L[k] and ts[:16] in L[k]]
                if sc: L[sc[0]]=note
                elif t!='fr': L.insert(vi[0],note)
                L=[x for x in L if x is not None]; C=clusters(L); changed=True
            if changed and any(l.strip() in ('TODO','# TODO') for l in L):
                open(f,'w').write('\n'.join(L)); report.append(f'{os.path.relpath(f,root)}: TODO left, flags not restored'); continue
            if changed:
                rel=os.path.relpath(f,root); pre=head(rel)
                pre_fm={m.group(1):l for l in (pre or [])[:40] for m in [re.match(FLAGS,l)] if m}
                for k,l in enumerate(L[:40]):
                    m=re.match(FLAGS,l)
                    if m and m.group(1) in pre_fm: L[k]=pre_fm[m.group(1)]
                L=[l for l in L if not ('ED: rebuild-carnet' in l and ts[:16] in l and ('approval flags reset' in l or 'paragraph set changed' in l))]
                open(f,'w').write('\n'.join(L)); print('fixed',rel)
print('\n'.join(report) or 'no issues')

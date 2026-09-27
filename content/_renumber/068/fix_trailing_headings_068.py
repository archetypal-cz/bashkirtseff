"""Second pass after the 068 rebuild (run after move_headings_068.py): a translation heading that
still sits as the last visible line of an entry (it belongs to the next day) moves to the next entry,
replacing its '# TODO' or filling its empty first paragraph. Only moves when the heading's day number
equals the next entry's day. Usage: python3 fix_trailing_headings_068.py <repo root> [langs…]"""
import re,sys,glob,os
root=sys.argv[1]; langs=sys.argv[2:] or ['cz','uk','en']
IDL=re.compile(r'^%% 068\.\d{4} %%$')
def clusters(L):
    ids=[k for k,l in enumerate(L) if IDL.match(l)]
    return ids
def visible(l): return l.strip() and not l.startswith('%%') and not l.startswith('[^') and not l.startswith('[//]')
out=[]
for lang in langs:
    fs=sorted(f for f in glob.glob(f'{root}/content/{lang}/068/*.md') if not f.endswith('cover.md'))
    data={f:open(f).read().split('\n') for f in fs}
    for a,b in reversed(list(zip(fs,fs[1:]))):
        A=data[a]; B=data[b]
        ids=clusters(A)
        last=ids[-1]
        vis=[k for k in range(last,len(A)) if visible(A[k])]
        if not vis or not re.match(r'^#{1,3} ',A[vis[-1]]): continue
        h=A[vis[-1]]
        bh=[k for k,l in enumerate(B) if re.match(r'^#{1,3} ',l)]
        if bh and not (len(bh)==1 and B[bh[0]].strip()=='# TODO'): continue
        day=int(os.path.basename(b)[8:10]); nums=[int(x) for x in re.findall(r'\d+',h) if int(x)<32]
        if not nums or nums[0]!=day: out.append(f'SKIP {lang} {os.path.basename(a)} → {os.path.basename(b)}: {h}'); continue
        del A[vis[-1]]
        if vis[-1]-1>=0 and not A[vis[-1]-1].strip() and vis[-1]<len(A) and not A[vis[-1]].strip(): del A[vis[-1]-1]
        if bh: B[bh[0]]=h
        else:
            bids=clusters(B); f0=bids[0]; f1=bids[1] if len(bids)>1 else len(B)
            pos=next((k for k in range(f0+1,f1) if visible(B[k])),None)
            if pos is None:
                pos=f0+1
                while pos<f1 and B[pos].startswith('%%'): pos+=1
            B.insert(pos,h)
        out.append(f'{lang} {os.path.basename(a)} → {os.path.basename(b)}: {h.strip()}')
    for f,L in data.items(): open(f,'w').write('\n'.join(L))
print('\n'.join(out))

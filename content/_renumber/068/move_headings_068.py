"""After `just rebuild-carnet 068 plan.json --write`: move each translated day heading that the
rebuild left at the end of a stripped paragraph (plan set_french removed the trailing French
heading) into the entry of that day, replacing the scaffold heading there (# TODO; fr: the French
copy). Also drops the stale embedded heading comment and the ED SOURCE CHANGED note of those
paragraphs, whose only source change was losing the heading.
Usage: python3 move_headings_068.py <repo root>"""
import json,re,sys,glob,os
root=sys.argv[1]
here=os.path.dirname(os.path.abspath(__file__))
C={c['id']:c for c in json.load(open(os.path.join(here,'orig.json')))}
m=json.load(open(f'{root}/content/_renumber/068-2026-09-27.json'))
im=m['id_map']
MON={'janvier':1,'février':2,'décembre':12}
def hdate(h):
    x=re.search(r'(\d+)(?:er)? (janvier|février|décembre)',h); y=re.findall(r'\d{4}',h)[-1]
    return f"{y}-{MON[x.group(2)]:02d}-{int(x.group(1)):02d}"
STALE={'068.0204','068.0234','068.0246','068.0249','068.0252','068.0256'}  # tool re-inserted embedded French; visible text still a placeholder: keep the ED note
STRIP=[k for k,c in C.items() if len(c['vis'])>=2 and c['vis'][-1].startswith('#') and k!='068.0031']
report=[]
for lang in ('cz','uk','en','fr'):
    D=f'{root}/content/{lang}/068'
    files={os.path.basename(f):open(f).read().split('\n') for f in glob.glob(D+'/*.md')}
    for old in STRIP:
        new=im[old]; frh=C[old]['vis'][-1].lstrip('#').strip(); date=hdate(frh)
        src=[f for f,L in files.items() if f'%% {new} %%' in L]
        assert len(src)==1,(lang,new,src)
        L=files[src[0]]; i=L.index(f'%% {new} %%')
        j=i+1
        while j<len(L) and not re.fullmatch(r'%% 068\.\d{4} %%',L[j]) and L[j]!='---': j+=1
        # cluster = L[i:j]; find visible heading lines (not comments) and the embedded heading comment
        heads=[k for k in range(i+1,j) if re.match(r'^#{1,3} ',L[k])]
        emb=[k for k in range(i+1,j) if L[k].strip()==f'%% {frh} %%']
        edc=[k for k in range(i+1,j) if 'SOURCE CHANGED' in L[k] and L[k].startswith('%% ') and ' ED: rebuild-carnet 068' in L[k]]
        if old in STALE: edc=[]
        if lang=='uk' or not heads:
            # uk already carries each day heading at the start of the next day's first paragraph
            if lang!='uk': report.append(f'{lang} {new} ({old}): no translated heading found — left as is')
            files[src[0]]=[l for k,l in enumerate(L) if k not in set(emb+edc)]
            continue
            report.append(f'{lang} {new} ({old}): no translated heading found — left as is'); continue
        h=L[heads[-1]]
        dels=set([heads[-1]]+emb+edc)
        # also drop one blank line directly before the heading if the line after it is blank too
        if heads[-1]-1>i and not L[heads[-1]-1].strip() and heads[-1]+1<len(L) and not L[heads[-1]+1].strip(): dels.add(heads[-1]-1)
        files[src[0]]=[l for k,l in enumerate(L) if k not in dels]
        # target entry: file named <date>.md, its first cluster
        tgt=f'{date}.md'; T=files[tgt]
        fi=next(k for k,l in enumerate(T) if re.fullmatch(r'%% 068\.\d{4} %%',l))
        fj=fi+1
        while fj<len(T) and not re.fullmatch(r'%% 068\.\d{4} %%',T[fj]): fj+=1
        todo=[k for k in range(fi,fj) if re.match(r'^# ',T[k])]
        if not todo:
            report.append(f'{lang} {new}: target {tgt} has no scaffold heading — heading inserted after embedded heading')
            pos=next(k for k in range(fi+1,fj) if T[k].strip() and not T[k].startswith('%%'))
            T.insert(pos,'# '+h.lstrip('#').strip())
        else:
            T[todo[0]]='# '+h.lstrip('#').strip()
        report.append(f'{lang} {old}->{new}: «{h.strip()}» → {tgt}')
    for f,L in files.items(): open(f'{D}/{f}','w').write('\n'.join(L))
print('\n'.join(report)); print(len([r for r in report if '→' in r]),'moved')

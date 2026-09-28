"""_original/068/1877-01-05.md: the footnote backfill (harvested from the ID-drifted en file) put six
footnote markers two paragraphs late. Move each marker to the word it glosses and its definition into
that paragraph; update the embedded French copies in cz/uk/en/fr to match. Usage: <root>"""
import re,sys
root=sys.argv[1]
MOVES=[('acrostiche','Font remuer la tour','En voilà un four ?','En voilà un four ?'),
       ('giaour','**Acte 1er**','Rends-nous nos cœurs, affreux Giaour','Rends-nous nos cœurs, affreux Giaour'),
       ('girofla',"(Il s'arrête",'Girofla en robe de chambre','Girofla'),
       ('culpamea','Je trouve une lettre de Berthe','Culpa mea.','Culpa mea.'),
       ('latin',"Il n'y a que Nice pour m'être utile",'Dubium, illusio, deceptio oppressio.','Dubium, illusio, deceptio oppressio.'),
       ('cabinet','Et vous attribuez cela',"Et alors... vient un désir fou","cabinet d'études")]
f=f'{root}/content/_original/068/1877-01-05.md'
L=open(f).read().split('\n')
IDL=re.compile(r'^%% 068\.\d{4} %%$')
def cluster_end(k):
    j=k+1
    while j<len(L) and not IDL.match(L[j]): j+=1
    return j
changed={}
for lab,wrong,tgt,anchor in MOVES:
    ref=f'[^{lab}]'
    w=[k for k,l in enumerate(L) if l.startswith(wrong) and ref in l]; assert len(w)==1,(lab,w)
    old_w=L[w[0]]; L[w[0]]=old_w.replace(ref,'',1); changed[old_w]=L[w[0]]
    t=[k for k,l in enumerate(L) if l.startswith(tgt) and not l.startswith('%%')]; assert len(t)==1,(lab,t)
    old_t=L[t[0]]; i=old_t.index(anchor)+len(anchor); L[t[0]]=old_t[:i]+ref+old_t[i:]; changed[old_t]=L[t[0]]
    d=[k for k,l in enumerate(L) if l.startswith(ref+':')]; assert len(d)==1
    dl=L.pop(d[0])
    if d[0]<len(L) and d[0]>0 and not L[d[0]-1].strip() and not L[d[0]].strip(): L.pop(d[0])
    t=[k for k,l in enumerate(L) if l==changed[old_t]][0]
    # insert after the last text line of the target cluster (before the blank line ending it)
    e=cluster_end(t)-1
    while not L[e].strip(): e-=1
    L[e+1:e+1]=['',dl]
open(f,'w').write('\n'.join(L))
n=0
for lang in ('cz','uk','en','fr'):
    g=f'{root}/content/{lang}/068/1877-01-05.md'; T=open(g).read().split('\n')
    for k,l in enumerate(T):
        if l.startswith('%% ') and l.endswith(' %%') and l[3:-3] in changed:
            T[k]='%% '+changed[l[3:-3]]+' %%'; n+=1
    open(g,'w').write('\n'.join(T))
print('ok, embedded lines updated:',n)

"""Realign content/en/068/1877-01-02-06.md with _original IDs (removes duplicate 068.0182-0184).
en carries three extra heading-only clusters (0145 Thursday 4 Jan, 0149 Friday 5 Jan, 0180 Saturday 6 Jan)
that push every later ID up by 2, then 3. _original keeps these headings as the last line of the preceding
paragraph (0144, 0147, 0177). Fix: drop those three ID lines (and their embedded-French line), so each
heading joins the preceding cluster, then relabel the shifted IDs. Also moves the Wednesday 3 Jan heading
and the stray 0142 translation back where _original has them. No English text is lost.
Usage: python3 fix_en_068.py <repo root>"""
import re,sys
root=sys.argv[1] if len(sys.argv)>1 else '.'
f=f'{root}/content/en/068/1877-01-02-06.md'
L=open(f).read().split('\n')
def idx(id_):
    r=[i for i,l in enumerate(L) if l.strip()==f'%% 068.{id_} %%']
    assert len(r)==1,(id_,r); return r[0]
# 1. 0141/0142/0143: put "## Wednesday, 3 January 1877" at end of 0141, move "I am back from Rome" line to 0142
i142=idx('0142'); i143=idx('0143')
h3=[i for i in range(i142,i143) if L[i].startswith('## Wednesday, 3 January 1877')]
back=[i for i in range(i143,len(L)) if L[i].startswith('I am back from Rome')]
assert len(h3)==1 and len(back)==1
backline=L[back[0]]; del L[back[0]]
hline=L[h3[0]]; L[h3[0]]=backline
# insert heading after last non-blank line of 0141
i141=idx('0141'); j=idx('0142')-1
while not L[j].strip(): j-=1
L.insert(j+1,hline)
# 2. drop extra heading clusters: ID line + following embedded line
for id_,emb in (('0145','%% ## Jeudi 4 janvier 1877 %%'),('0149','%% ## Vendredi 5 janvier 1877 %%'),('0180',"%% Et je lui racontai tout cela. %%")):
    i=idx(id_)
    j=i+1
    while L[j].startswith('%% '): j+=1
    assert L[j].startswith('## ') and emb in L[i+1:j],(id_,L[i:j+1])
    # remove the ID line and its comment lines (embedded French, a duplicated Kernberger tag),
    # then the blank line(s) separating the heading from the previous cluster
    del L[i:j]
    k=i-1
    while k>=0 and not L[k].strip(): del L[k]; k-=1
    if id_=='0180': L.insert(k+1,'%% Samedi 6 janvier 1877 %%')
# 3. relabel
m={}
for n in (146,147,148): m[n]=n-1
for n in range(150,180): m[n]=n-2
for n in range(181,185): m[n]=n-3
out=[]
for l in L:
    mm=re.fullmatch(r'%% 068\.(\d{4}) %%',l.strip())
    if mm and int(mm.group(1)) in m: l=f'%% 068.{m[int(mm.group(1))]:04d} %%'
    out.append(l)
open(f,'w').write('\n'.join(out))
print('ok')

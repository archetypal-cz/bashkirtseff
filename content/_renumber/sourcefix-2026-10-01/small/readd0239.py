import json,re,subprocess,sys
root=sys.argv[1]
m=json.load(open(f'{root}/content/_renumber/079-2026-10-01-2.json'))['id_map']; n=m['079.0238']
pre=subprocess.check_output(['git','show','HEAD:content/_original/079/1878-04-05.md'],cwd=root).decode().split('\n')
i=pre.index('%% 079.0239 %%'); notes=[]
for l in pre[i+1:]:
    if re.match(r'^%% \d{3}\.\d{4} %%$',l.strip()): break
    if re.match(r'^%% \d{4}-',l): notes.append(re.sub(r'079\.0239','079.DROPPED-0239',l))
f=f'{root}/content/_original/079/1878-04-05.md'; L=open(f).read().split('\n'); k=L.index(f'%% {n} %%')+1
while L[k].startswith('%% [#'): k+=1
L[k:k]=notes; open(f,'w').write('\n'.join(L)); print(n,len(notes))

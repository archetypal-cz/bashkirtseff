"""After the 085.0416+0417 join: translations already carried the signature as the letter's last quoted line, so drop the appended duplicate."""
import sys,glob,re
root=sys.argv[1]
for t in ['cz','uk','en','fr']:
    for f in glob.glob(f'{root}/content/{t}/085/*.md'):
        L=open(f).read().split('\n')
        if '%% 085.0416 %%' not in L: continue
        i=L.index('%% 085.0416 %%'); j=i+1
        while j<len(L) and not re.match(r'^%% \d{3}\.\d{4} %%$',L[j].strip()): j+=1
        for k in range(i+1,j-1):
            a=L[k]; b=L[k+1]
            if a.startswith('> ') and b and not b.startswith(('%%','>')):
                na=re.sub(r'[*_\s]','',a[2:]); nb=re.sub(r'[*_\s]','',b)
                if na==nb:
                    del L[k+1]; open(f,'w').write('\n'.join(L)); print('fixed',t); break

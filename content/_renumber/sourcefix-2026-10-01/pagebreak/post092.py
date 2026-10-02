"""RSR note on the new 1881-07-03 entry (092.0162), source-side only; carry with: just sync 092 <lang> --notes-since <ts>."""
import sys,re,subprocess
root=sys.argv[1]; ts=subprocess.check_output(['date','+%Y-%m-%dT%H:%M:%S']).decode().strip()
f=f'{root}/content/_original/092/1881-07-03.md'; L=open(f).read().split('\n')
i=L.index('%% 092.0162 %%'); j=i+1
while L[j].startswith('%% [#') or L[j].startswith('%% kind:'): j+=1
L.insert(j,f"%% {ts} RSR: New entry restored from the volume's ERRATA page (Mon Journal t.14, errata: «p. 153-154 : Dimanche 3 juillet 1881. / et priez Dieu. J'ai deux projets. D'abord je veux guérir par miracle, je veux prier Dieu»; tome14.docx ¶4329–4330). The print lost these lines at the p.153/154 break; the text before «et priez Dieu» is given nowhere, so it is marked […] and not reconstructed. The rest of this entry («prier Dieu et avant de partir…», p.154) was filed under 2 July. %%")
open(f,'w').write('\n'.join(L)); print(ts)

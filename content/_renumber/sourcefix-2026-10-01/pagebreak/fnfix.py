"""Footnote reconciliation after rebuild+postfix. Usage: fnfix.py ROOT MAPJSON CCC
For every tree file of the carnet: a reference without definition is renamed to its tool-relabelled form if that definition exists unreferenced,
else its definition is restored from the HEAD version of the file; a definition without reference whose pre-relabel label is referenced is renamed back."""
import sys,json,re,subprocess,glob,os
root,mapf,c=sys.argv[1:4]
idmap=json.load(open(mapf))['id_map']
def f(lab):
    mm=re.match(r'^(\d{1,3})\.(\d{1,4})(\..*)$',lab)
    if not mm: return lab
    old=f'{int(mm[1]):03d}.{int(mm[2]):04d}'; new=idmap.get(old)
    if not new: return lab
    return f'{int(new[:3]):0{len(mm[1])}d}.{int(new[4:]):0{len(mm[2])}d}{mm[3]}'
fixed=0
for t in ['_original','cz','uk','en','fr']:
    for p in glob.glob(f'{root}/content/{t}/{c}/*.md'):
        s=open(p).read()
        refs=set(re.findall(r'\[\^([^\]]+)\](?!:)',s)); defs=set(re.findall(r'(?m)^\[\^([^\]]+)\]:',s))
        for r in sorted(refs-defs):
            if f(r)!=r and f(r) in defs and f(r) not in refs:
                s=s.replace(f'[^{r}]',f'[^{f(r)}]'); fixed+=1; continue
            try: pre=subprocess.check_output(['git','show','HEAD:'+os.path.relpath(p,root)],cwd=root).decode()
            except subprocess.CalledProcessError: continue
            m=re.search(r'(?m)^\[\^'+re.escape(r)+r'\]:.*$',pre)
            if m: s=s.rstrip('\n')+'\n'+m.group(0)+'\n'; fixed+=1
        refs=set(re.findall(r'\[\^([^\]]+)\](?!:)',s)); defs=set(re.findall(r'(?m)^\[\^([^\]]+)\]:',s))
        for d in sorted(defs-refs):
            if f(d)!=d and f(d) in defs:
                s=re.sub(r'(?m)^\[\^'+re.escape(d)+r'\]:.*\n?','',s); fixed+=1
        open(p,'w').write(s)
print(c,'footnotes fixed',fixed)

"""Visible text per tree×carnet must be unchanged except whitespace (joins) and the removed hyphen at hyphenated joins."""
import sys,subprocess,re,glob,os
root=sys.argv[1]
def vis(lines):
    out=[];inb=False
    for l in lines:
        n=l.count('%%')
        if l.startswith('%%') or inb:
            if n%2==1: inb=not inb
            continue
        if l.startswith('---') or l.startswith('[^') or l.startswith('[//]') or re.match(r'^[a-z_]+:|^  ',l): continue
        out.append(l)
    s=' '.join(out)
    s=re.sub(r'\[\^[^\]]*\]','',s); s=re.sub(r'-\s+',  '-',s)
    return re.sub(r'\s+','',s)
for c in sys.argv[2:]:
    for t in ['cz','uk','en','fr','_original']:
        pre=''.join(vis(subprocess.check_output(['git','show','HEAD:'+f],cwd=root).decode().split('\n')) for f in sorted(subprocess.check_output(['git','ls-tree','--name-only','HEAD',f'content/{t}/{c}/'],cwd=root).decode().split()) if f.endswith('.md') and not f.endswith('README.md'))
        post=''.join(vis(open(f).read().split('\n')) for f in sorted(glob.glob(f'{root}/content/{t}/{c}/*.md')) if not f.endswith('README.md'))
        d=len(pre)-len(post)
        print(c,t,'SAME' if pre.replace('-','')==post.replace('-','') else f'DIFF len {d}')

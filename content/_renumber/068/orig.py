import re,os,json,glob
D='/home/krr/bashkirtseff/content/_original/068'
def load(D=D):
    clusters=[]  # dict id,file,lines(raw),text(list visible lines)
    for f in sorted(glob.glob(D+'/*.md')):
        if f.endswith('README.md'): continue
        s=open(f).read()
        m=re.match(r'---\n.*?\n---\n',s,re.S)
        body=s[m.end():]
        # strip multi-line comments carefully: split into lines, track open %% blocks
        cur=None
        inblock=False
        for line in body.split('\n'):
            mm=re.match(r'^%% (\d{3}\.\d{4}) %%$',line.strip())
            if mm:
                cur={'id':mm.group(1),'file':os.path.basename(f),'vis':[]}
                clusters.append(cur); continue
            if cur is None: continue
            # remove inline comments
            l=line
            if inblock:
                if '%%' in l:
                    l=l.split('%%',1)[1]; inblock=False
                else: continue
            l=re.sub(r'%%.*?%%','',l)
            if '%%' in l:
                l=l.split('%%',1)[0]; inblock=True
            if re.match(r'^\[\^[^\]]+\]:',l): continue
            if l.startswith('[//]: #'): continue
            if l.strip(): cur['vis'].append(l.strip())
    return clusters
if __name__=='__main__':
    c=load()
    json.dump(c,open('orig.json','w'),ensure_ascii=False,indent=0)
    print(len(c), c[0]['id'], c[-1]['id'])
    for x in c:
        if not x['vis']: print('EMPTY',x['id'],x['file'])

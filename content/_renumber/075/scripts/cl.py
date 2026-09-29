import re,glob,os,json,sys
ROOT='/home/coder/bashkirtseff/content'
RID=re.compile(r'^%%\s*(\d{3}\.\d{4})\s*%%\s*$')
def load(tree,c):
    out={}
    for f in sorted(glob.glob(f'{ROOT}/{tree}/{c}/*.md')):
        if f.endswith('README.md'): continue
        cur=None
        for l in open(f).read().split('\n'):
            m=RID.match(l)
            if m: cur=m.group(1); out[cur]={'file':os.path.basename(f),'lines':[]}; continue
            if cur: out[cur]['lines'].append(l)
    return out
def vis(lines):
    r=[];inc=False
    for l in lines:
        s=l.strip()
        if inc:
            if s.endswith('%%'): inc=False
            continue
        if s.startswith('%%'):
            if not (s.endswith('%%') and len(s)>=4): inc=True
            continue
        if not s or s.startswith('[//]') or re.match(r'^\[\^[^\]]+\]:',s): continue
        r.append(l)
    return r

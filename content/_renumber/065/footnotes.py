import pymupdf as f, json, collections
d=f.open('/home/krr/bashkirtseff/content/_raw/scans/Tome9.pdf')
out=[]
for pn in range(7,230):
    p=d[pn-1]; dd=p.get_text('dict'); H=p.rect.height
    lines=[]
    for b in dd['blocks']:
        for l in b.get('lines',[]):
            t=''.join(s['text'] for s in l['spans']).strip()
            if not t: continue
            sz=max(s['size'] for s in l['spans'])
            lines.append((l['bbox'][1],sz,t))
    if not lines: continue
    sizes=collections.Counter(round(s) for _,s,t in lines for _ in [0] if len(t)>20)
    if not sizes: continue
    body=sizes.most_common(1)[0][0]
    fn=[(y,s,t) for y,s,t in lines if y>H*0.6 and s<body-1.2 and not t.isdigit()]
    if fn and any(t[:1].isdigit() for _,_,t in fn):
        out.append({'pdf':pn,'lines':[t for _,_,t in sorted(fn)]})
json.dump(out,open('footnotes.json','w'),ensure_ascii=False,indent=1)
for o in out: print(o['pdf'],' | '.join(o['lines'])[:200])

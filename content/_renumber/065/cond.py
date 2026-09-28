import json,sys
rows=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'stage.json'))
C=json.load(open('orig.json')); fm={c['id']:c['file'] for c in C}
cur=None
def fl():
    global cur
    if cur: print(f"   {cur[1]}-{cur[2]} {cur[0]} {fm.get(cur[0],'')[:13]} | {cur[3][:60]}")
    cur=None
for r in rows:
    if r['ishead']:
        fl(); print(f"H {r['i']} {r['t'][:60]}"); continue
    tag=r['best'] or '----'
    if cur and cur[0]==tag and r['i']==cur[2]+1: cur[2]=r['i']; continue
    fl(); cur=[tag,r['i'],r['i'],r['t']]
fl()

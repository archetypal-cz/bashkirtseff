# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
import re,glob,sys
CARNETS=sys.argv[1].split() if len(sys.argv)>1 else "000 001 002 003 004 005 006 007 008 016 017 018 019 020 021 022 023 024 025 026 027 028 029 030 031 032 033 050 051".split()
def nsent(t):
    t=re.sub(r'\[\^[^\]]+\]','',t)
    t=re.sub(r'(M|Mme|Mlle|St|cf|etc|env|např|tzv)\.','X',t)
    return len([x for x in re.split(r'(?<=[.!?…])\s+',t.strip()) if len(x.strip())>1])
rows=[]
for c in CARNETS:
    for f in sorted(glob.glob(f"content/cz/{c}/[0-9]*.md")):
        lines=open(f,encoding="utf-8").read().split("\n")
        pid=None;fr=[];cz=[];fns=[]
        def flush():
            global pid,fr,cz,fns
            if pid and fr and fns:
                F=nsent(" ".join(fr));Z=nsent(" ".join(cz))
                if F-Z>=2: rows.append((f,pid,F,Z,F-Z,",".join(fns)))
            pid=None;fr=[];cz=[];fns=[]
        for ln in lines:
            s=ln.strip()
            m=re.match(r'^%%\s*(\d{3}\.\d{4})\s*%%$',s)
            if m: flush();pid=m.group(1);continue
            if s.startswith('%%') and s.endswith('%%'):
                inner=s[2:-2].strip()
                if re.match(r'^\d{4}-\d{2}-\d{2}[T ]',inner) or inner.startswith('[#') or re.match(r'^(RSR|LAN|TR|OPS|RED|CON|ED|FAB|VOX|GEM|PPX|KRR)\b',inner): continue
                fr.append(inner);continue
            if s.startswith('[^') and re.match(r'^\[\^[^\]]+\]:',s): continue
            if s.startswith('%%') or not s or s.startswith('#'): continue
            cz.append(s);fns+=re.findall(r'\[\^([^\]]+)\]',s)
        flush()
for r in sorted(rows,key=lambda x:-x[4]): print("\t".join(map(str,r)))
print("TOTAL",len(rows),file=sys.stderr)

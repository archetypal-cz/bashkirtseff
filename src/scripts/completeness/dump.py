import json, sys
from paths import work
from common import dump_docx
out={}
for t in range(1,17):
    paras=[{'i':p['i'],'t':p['t'],'s':p['s']} for p in dump_docx(t)]
    out[t]=paras
    print(t,len(paras),file=sys.stderr)
json.dump(out,open(work('tomes.json'),'w'),ensure_ascii=False)

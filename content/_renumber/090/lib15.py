import json,re,sys,datetime
sys.path.insert(0,'/home/krr/bashkirtseff/src/scripts/rebuild-plan')
import common
W='/tmp/claude-1000/-home-krr-bashkirtseff/467edde8-50c6-480d-80c0-3a213d11ff10/scratchpad/plan-tome1415'
P=common.dump_docx(15)
PM=json.load(open(W+'/pagemap15.json'))
TODAY='2026-09-28'
def page(i):
    for x in PM:
        if x.get('docx_para_start',10**9)<=i<=x.get('docx_para_end',-1): return x.get('printed_page')
    # between pages: next page start
    best=None
    for x in PM:
        if x.get('docx_para_start',10**9)>i:
            return x.get('printed_page')
    return None
def pages(a,b):
    pa,pb=page(a),page(b)
    if pa==pb: return f'p.{pa}'
    return f'pp.{pa}–{pb}'
def isfurn(i):
    p=P[i]; return p['s'].startswith('Header') or not p['t'].strip()
def fix(t):
    t=common.para_text({'runs':None,'t':t}) if False else t
    return t
def groups(a,b):
    """manuscript paragraphs from docx ¶a..¶b; returns list of (first,last,text)"""
    out=[]
    for i in range(a,b+1):
        if isfurn(i): continue
        t=common.para_text(P[i])
        t=re.sub(r'^I!(?= )','Il',t)  # never used blindly; flagged below
        if out:
            f,l,prev=out[-1]
            between=[x for x in range(l+1,i) if not isfurn(x)]
            pl=prev.split('\n')[-1].rstrip('*').rstrip()
            join=None
            if not between and P[i]['s']==P[l]['s']:
                if re.match(r'^[a-zà-ÿ]',t) or pl.endswith('-') or (pl.startswith('[') and pl.count('[')>pl.count(']')):
                    join=' '
            if join:
                if pl.endswith('-') and not pl.endswith(' -'):
                    out[-1]=(f,i,prev+t) if False else (f,i,prev+join+t)
                else:
                    out[-1]=(f,i,prev+join+t)
                continue
        out.append((i,i,t))
    return out
def rng(a,b): return f'¶{a}' if a==b else f'¶{a}–{b}'
def rsr_restored(a,b):
    return f'Restored from tome15.docx {rng(a,b)}, Mon Journal t.15 {pages(a,b)} (missing from original extraction, {TODAY} rebuild).'
def rsr_moved(a,b,src):
    return f'Moved out of {src}, which ran several manuscript days together: this day\'s text from tome15.docx {rng(a,b)}, Mon Journal t.15 {pages(a,b)} ({TODAY} rebuild).'
def rsr_empty(i):
    return f'tome15.docx ¶{i}: the date line «{P[i]["t"].strip()}» has no text under it ({TODAY} rebuild).'
MOIS=['','janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
JOURS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
def heading_of(i):
    t=P[i]['t'].strip()
    t=re.sub(r'(?<=\d) (?=\d)','',t); t=t.replace('juinl','juin ').replace('mail','mai ')
    t=re.sub(r'(?<=\d) (?=\d)','',t); t=re.sub(r'\s+',' ',t); t=re.sub(r'1 er','1er',t)
    return t
MONTHS={'janvier':1,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'aout':8}
MONTHNAME={1:'janvier',2:'février',3:'mars',4:'avril',5:'mai',6:'juin',7:'juillet',8:'août'}
DRX=re.compile(r'^#?\s*(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+((?:\d\s?)+)(?:er)?\s*(janvier|f.vrier|mars|avril|mai|juin|juillet|ao.t)\w?\s*(1\s?8\s?8\s?3|l?\s?883)?(.*)$')
def parse_dateline(t):
    m=DRX.match(t.strip())
    if not m: return None
    d=int(re.sub(r'\D','',m.group(2))); mo=MONTHS[common.norm(m.group(3))]
    return m.group(1),d,mo,m.group(5).strip()
def heading_of(i,override_date=None):
    wd,d,mo,rest=parse_dateline(P[i]['t'])
    if override_date: d,mo=override_date
    s=f"{wd} {d}{'er' if d==1 else ''} {MONTHNAME[mo]} 1883"
    if rest: s+=' '+rest
    return s
def is_dateline(t):
    t=t.strip()
    return bool(parse_dateline(t)) and len(t)<60
sys.path.insert(0,W)
from align import day as DAY
CL={c:json.load(open(f'{W}/cl-{c}.json')) for c in ('099','100')}
LOC={c:json.load(open(f'{W}/loc-{c}.json')) for c in ('099','100')}
def line_days(cid):
    c=cid[:3]; lines=CL[c][cid]['lines']; loc=LOC[c][cid]
    out=[];prev=None
    for l,r in zip(lines,loc):
        pd=parse_dateline(l) if is_dateline(l.lstrip('# ')) or is_dateline(l) else None
        if pd:
            dd=f'1883-{pd[2]:02d}-{pd[1]:02d}'
        elif r: dd=DAY.get(r[0])
        else: dd=None
        if dd is None: dd=prev
        out.append((l,dd,bool(pd),l.startswith('#')))
        prev=dd
    # leading None -> first known
    first=next((x[1] for x in out if x[1]),None)
    return [(l,d or first,isd,ish) for l,d,isd,ish in out]
def own_text(cid,home):
    """old text lines of cid on day `home`, without headings or plain date lines"""
    return [l for l,d,isd,ish in line_days(cid) if d==home and not isd and not ish]

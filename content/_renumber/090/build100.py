import sys,json,re,datetime
sys.path.insert(0,'.')
from lib15 import *
C='100'
draft=json.load(open('dry-100/plan-100.orig.json'))
# date line index per day in Livre 100
DL={}
for i in range(3415,4168):
    if not isfurn(i) and is_dateline(P[i]['t']):
        wd,d,mo,rest=parse_dateline(P[i]['t'])
        dd=f'1883-{mo:02d}-{d:02d}'
        DL[dd]=i
days=sorted(DL)
def nextdl(dd):
    k=days.index(dd); return DL[days[k+1]] if k+1<len(days) else 4167
def dayrange(dd): return DL[dd]+1, nextdl(dd)-1
def O(n,**kw):
    x={'old':f'{C}.{n:04d}'}; x.update(kw); return x
def NEW(french,rsr,**kw):
    n={'french':french,'rsr':rsr}; n.update(kw); return {'new':n}
def own(n,home):
    return '\n'.join(own_text(f'{C}.{n:04d}',home))
FLAGS=[];OCRFIX=[]
def fill(dd,src,stub=None,insert_after=None):
    a,b=dayrange(dd); gs=groups(a,b); out=[]
    for k,(f,l,t) in enumerate(gs):
        t0=t
        t=t.replace('cris- talisations','cristalisations').replace('dìrma','d’Irma').replace('Rollinat1','Rollinat¹').replace('*mor.*','*moi.*').replace('*mor. *','*moi.* ')
        t=re.sub(r'(?<=[a-zà-ÿA-Z])- (?=[a-zà-ÿA-Z])','-',t)
        if t!=t0: OCRFIX.append(f'{dd} ¶{f}: «{t0[:0]}» OCR fixes applied')
        for fl in common.ocr_flags(t)+(['hyphen split'] if re.search(r'[a-zà-ÿ]- [a-zà-ÿ]',t) else [])+(['I! at start'] if t.startswith('I!') else []):
            FLAGS.append(f'{dd} ¶{f}: {fl} — «{t[:70]}»')
        if src: r=rsr_moved(f,l,src)
        else: r=rsr_restored(f,l)
        if k==0 and stub:
            out.append(O(stub,set_french=t,_note=f'pointer stub filled: tome15.docx {rng(f,l)}'))
        else:
            out.append(NEW(t,r))
        if insert_after and insert_after[0] in range(f,l+1):
            out.append(insert_after[1])
    return out
def empty(dd):
    i=DL[dd]; return [NEW('[Aucun texte - date seule mentionnée]',rsr_empty(i))]
AUCUN='[Aucun texte - date seule mentionnée]'
E=[]
def entry(dd,paras,**kw):
    e={'file':kw.pop('file',dd+'.md'),'date':dd}
    if dd in DL: e['heading']=kw.pop('heading',heading_of(DL[dd]))
    e.update(kw); e['paragraphs']=paras; E.append(e)
entry('1883-05-27',[O(1)])
entry('1883-05-28',[O(2,set_french='\n'.join(own_text('100.0002','1883-05-28')).replace('[Raye:','[Rayé:'))])
entry('1883-05-29',[O(3)]); entry('1883-05-30',[O(4)]); entry('1883-05-31',[O(5)])
entry('1883-06-01',fill('1883-06-01',None),frontmatter_from='1883-06-01.md')
entry('1883-06-02',[O(6),O(7)])
a,b=dayrange('1883-06-03')
entry('1883-06-03',fill('1883-06-03',None),frontmatter_from='1883-06-02.md')
entry('1883-06-04',fill('1883-06-04',None),frontmatter_from='1883-06-04.md')
entry('1883-06-05',[O(8)])
entry('1883-06-06',[O(9,set_french=own(9,'1883-06-06'))])
entry('1883-06-07',fill('1883-06-07','100.0009'),frontmatter_from='1883-06-06.md')
entry('1883-06-08',empty('1883-06-08'),frontmatter_from='1883-06-06.md')
entry('1883-06-09',fill('1883-06-09','100.0009'),frontmatter_from='1883-06-06.md')
entry('1883-06-10',[O(10,set_french=own(10,'1883-06-10'))])
entry('1883-06-11',fill('1883-06-11','100.0010'),frontmatter_from='1883-06-10.md')
entry('1883-06-12',fill('1883-06-12','100.0010'),frontmatter_from='1883-06-10.md')
entry('1883-06-13',[O(11)]+fill('1883-06-13','100.0010',stub=12))
entry('1883-06-14',empty('1883-06-14'),frontmatter_from='1883-06-10.md')
entry('1883-06-15',fill('1883-06-15','100.0010'),frontmatter_from='1883-06-10.md')
entry('1883-06-16',fill('1883-06-16','100.0010'),frontmatter_from='1883-06-10.md')
entry('1883-06-17',[O(13),O(14,set_french=own(14,'1883-06-17'))])
entry('1883-06-18',[O(15),O(16),O(17),O(18,set_french=own(18,'1883-06-18'))],frontmatter_from='1883-06-17.md')
entry('1883-06-19',empty('1883-06-19'),frontmatter_from='1883-06-17.md')
entry('1883-06-20',[O(19,set_french=AUCUN)])
entry('1883-06-21',[O(20),O(21)])
entry('1883-06-22',[O(n) for n in range(22,35)]+[O(35,set_french=own(35,'1883-06-22'))])
entry('1883-06-23',[O(n) for n in range(36,40)])
entry('1883-06-24',[O(n) for n in range(40,51)]+[O(51,set_french=own(51,'1883-06-24'))])
entry('1883-06-25',[O(n) for n in range(52,55)]+[O(55,set_french=own(55,'1883-06-25'))])
entry('1883-06-26',empty('1883-06-26'),frontmatter_from='1883-06-24.md')
entry('1883-06-27',[O(56),O(57),O(58,kind='letter',source="Lettre de Marie à Alice (passage copié de sa réponse), 27 juin 1883",
      set_french='\n'.join('> '+l for l in own_text('100.0058','1883-06-27'))),O(59),O(60,set_french=own(60,'1883-06-27'))])
entry('1883-06-28',[O(n) for n in range(61,77)])
entry('1883-06-29',[O(n) for n in range(77,81)]+[O(81,set_french=own(81,'1883-06-29'))])
entry('1883-06-30',[O(82),O(83)])
entry('1883-07-01',[O(84,set_french=own(84,'1883-07-01'))])
entry('1883-07-02',empty('1883-07-02'),frontmatter_from='1883-07-01.md')
roll=NEW('1- Rollinat poète macabre, fantastique, épileptique, névrosiaque et moderne ! moderne !',
   f"Marie's own note to «Rollinat¹» (tome15.docx ¶3799), printed at the foot of Mon Journal t.15 p.298 (tome15.docx ¶3810); it was filed under 4 July (100.0085) because it falls on that printed page; moved to the day it annotates ({TODAY} rebuild).",kind='margin')
entry('1883-07-03',fill('1883-07-03','100.0084',insert_after=(3799,roll)),frontmatter_from='1883-07-01.md')
own85=[l for l in own_text('100.0085','1883-07-04') if not l.startswith('1- Rollinat')]
entry('1883-07-04',[O(85,set_french='\n'.join(own85))])
entry('1883-07-05',[O(86)]); entry('1883-07-06',[O(87)]); entry('1883-07-07',[O(88)])
entry('1883-07-08',[O(89,set_french=own(89,'1883-07-08'))])
entry('1883-07-09',fill('1883-07-09','100.0089'),frontmatter_from='1883-07-08.md')
entry('1883-07-10',fill('1883-07-10','100.0089',stub=90))
entry('1883-07-11',[O(91,set_french=own(91,'1883-07-11'))])
entry('1883-07-12',fill('1883-07-12','100.0091'),frontmatter_from='1883-07-11.md')
entry('1883-07-13',[O(92)]); entry('1883-07-14',[O(93)])
entry('1883-07-15',[O(94,set_french=own(94,'1883-07-15'))])
entry('1883-07-16',fill('1883-07-16','100.0094',stub=95))
entry('1883-07-17',fill('1883-07-17','100.0094',stub=96))
entry('1883-07-18',[O(97,set_french=AUCUN)])
entry('1883-07-19',fill('1883-07-19','100.0097',stub=98))
entry('1883-07-20',[O(99)]); entry('1883-07-21',[O(100)])
entry('1883-07-22',[O(101,set_french=own(101,'1883-07-22'))])
entry('1883-07-23',fill('1883-07-23','100.0101',stub=102))
entry('1883-07-24',fill('1883-07-24','100.0101',stub=103))
for n,dd in ((104,'1883-07-25'),(105,'1883-07-26'),(106,'1883-07-27'),(107,'1883-07-28')): entry(dd,[O(n)])
entry('1883-07-29',[O(108,set_french=AUCUN)])
entry('1883-07-30',fill('1883-07-30','100.0108',stub=109))
entry('1883-07-31',[O(110)])
entry('1883-08-01',[O(111)])
entry('1883-08-02',[O(113),O(114),O(115)],frontmatter_from='1883-08-02.md')
e3=[O(n) for n in range(117,132)]
for p in e3:
    if p['old'] in ('100.0126','100.0127','100.0128','100.0129','100.0130','100.0131','100.0117','100.0118','100.0119','100.0120','100.0121','100.0122','100.0123','100.0124','100.0125'):
        lines=CL['100'][p['old']]['lines']
        if any('[Raye:' in l for l in lines):
            p['set_french']='\n'.join(l.replace('[Raye:','[Rayé:') for l in lines if not l.startswith('#'))
entry('1883-08-03',e3)
entry('1883-08-04',[O(133)])
entry('1883-08-05',[O(n) for n in range(134,177)])
entry('1883-08-06',[O(207)])
entry('1883-08-07',[O(n) for n in range(179,207)],frontmatter_from='1883-08-07.md')
drop=[{'id':'100.0112','reason':'plain-text duplicate of the date line «Jeudi 2 août 1883», left at the end of the 1 August file (extraction artefact); the 1883-08-02 entry gets the heading'},
      {'id':'100.0116','reason':'pointer stub «[Le texte de cette date figure dans l\'entrée du 1er août…]»: the day\'s own paragraphs 100.0113–0115 now move into the 1883-08-02 entry, which gets the heading (tome15.docx ¶4060)'},
      {'id':'100.0132','reason':'plain-text duplicate of the date line «Samedi 4 août 1883» at the end of 3 August; 100.0133 carries that day (extraction artefact)'},
      {'id':'100.0177','reason':'plain-text duplicate of the date line «Lundi 6 août 1883» at the end of 5 August; 100.0207 carries that day (extraction artefact)'},
      {'id':'100.0178','reason':'plain-text duplicate of the date line «Mardi 7 août 1883» at the end of 5 August; the 1883-08-07 entry gets the heading (extraction artefact)'},
      {'id':'100.0208','reason':'pointer stub «[Le texte de cette date figure dans l\'entrée du 5 août…]»: the day\'s own paragraphs 100.0179–0206 now move into the 1883-08-07 entry, which gets the heading (tome15.docx ¶4133)'}]
dupof={209:91,210:92,211:93,212:94,213:94,214:95,215:96,216:97,217:97}
for n,m in dupof.items():
    drop.append({'id':f'100.{n:04d}','reason':f'accent-stripped duplicate of 099.{m:04d} (Sunday 8 April 1883, tome15.docx ¶2667–2673, Livre 99; the edition misprints the date line «Dimanche 8 août 1883»): the text is kept once, in 099/1883-04-08.md'})
plan={'carnet':'100','source':'tome15.docx','drop':drop,
      'drop_files':[{'file':'1883-06-01.md','reason':'ID-less heading stub; the 1883-06-01 entry is rebuilt with the day\'s restored text (tome15.docx ¶3479–3481)'},
                    {'file':'1883-06-04.md','reason':'ID-less heading stub; the 1883-06-04 entry is rebuilt with the day\'s restored text (tome15.docx ¶3503–3506)'}],
      'entries':E}
json.dump(plan,open('work/plan-100.json','w'),ensure_ascii=False,indent=1)
print('\n'.join(FLAGS));print('\n'.join(OCRFIX))
# checks
ids=[p['old'] for e in E for p in e['paragraphs'] if 'old' in p]+[d['id'] for d in drop]
allids=sorted(CL['100'])
print('missing',sorted(set(allids)-set(ids)),'dups',[x for x in ids if ids.count(x)>1][:5])

"""every set_french paragraph: its rebuilt _original cluster's # lines == the set_french # lines; also no entry with two consecutive/duplicate headings"""
import json, glob, re, sys, os
root = sys.argv[1]
IDMAP = {}
for c in ['101','102','103','104','105','106']:
    IDMAP.update(json.load(open(max(glob.glob(f'{root}/content/_renumber/{c}-2026-09-2*.json'))))['id_map'])
cl = {}
for f in glob.glob(f'{root}/content/_original/10[1-6]/*.md'):
    cur = None
    for l in open(f).read().split('\n'):
        m = re.match(r'^%% (\d{3}\.\d{4}) %%$', l)
        if m: cur = m.group(1); cl[cur] = (os.path.basename(f), []); continue
        if cur and re.match(r'^#{1,6} ', l): cl[cur][1].append(l.strip())
bad = n = 0
for c in ['101','102','103','104','105','106']:
    for e in json.load(open(f'plan-{c}.json'))['entries']:
        for x in e['paragraphs']:
            if 'old' in x and 'set_french' in x:
                n += 1
                want = [l.strip() for l in x['set_french'].split('\n') if re.match(r'^#{1,6} ', l)]
                got = cl[IDMAP[x['old']]][1]
                if want != got:
                    bad += 1; print('MISMATCH', x['old'], IDMAP[x['old']], want, got)
for f in glob.glob(f'{root}/content/_original/10[1-6]/*.md'):
    hs = [l.strip() for l in open(f) if re.match(r'^# ', l)]
    if len(hs) != len(set(hs)): bad += 1; print('DUP heading', f, hs)
print(f'{n} set_french paragraphs checked, {bad} problems')

import json, sys, collections
G = json.load(open('gold-opus.json')); gold = {int(k): v for k, v in G['gold'].items()}
key, amb = set(G['key']), set(G['ambiguous'])
CHANGE = {'RESTORE', 'FIX_ORIGINAL'}
for name in sys.argv[1:]:
    out = {o['item']: o for o in json.load(open(f'out-{name}.json'))}
    ok = wrong = unsure = 0; harmful = []; missed = []; wrongs = []
    for i, acc in gold.items():
        o = out.get(i); v = o['verdict'] if o else 'MISSING'
        if i in amb: continue
        if v in acc: ok += 1
        elif v == 'UNSURE': unsure += 1
        else:
            wrong += 1; wrongs.append((i, v, acc))
            if v in CHANGE and not (set(acc) & CHANGE): harmful.append((i, v, acc, (o or {}).get('fix')))
        if i in key and v not in acc: missed.append((i, v, acc))
    n = len(gold) - len(amb)
    print(f"== {name}: correct {ok}/{n} ({ok/n:.0%}), wrong {wrong}, unsure {unsure}; "
          f"key fixes caught {len(key)-len(missed)}/{len(key)}; harmful changes {len(harmful)}")
    for h in harmful: print('   HARMFUL', h)
    for m in missed: print('   MISSED-KEY', m)
    for w in wrongs: print('   wrong', w)

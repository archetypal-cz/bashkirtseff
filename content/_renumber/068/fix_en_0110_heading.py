"""en/068/1877-01-10.md: the first paragraph (old 068.0219, «## Mercredi 10 janvier 1877» in _original)
still carries the stale English placeholder «[Letter to Pierret, not sent:]» (english-placeholders
report 2026-09-26). Replace it with the day heading. Usage: python3 fix_en_0110_heading.py <root>"""
import sys,re
f=f'{sys.argv[1]}/content/en/068/1877-01-10.md'
L=open(f).read().split('\n')
i=next(k for k,l in enumerate(L) if re.fullmatch(r'%% 068\.\d{4} %%',l))
assert L[i+1]=='%% [Letter to Pierret, not sent:] %%' and L[i+2]=='[Letter to Pierret, not sent:]',L[i:i+3]
L[i+1:i+3]=['## Wednesday, 10 January 1877']
open(f,'w').write('\n'.join(L)); print('ok')

"""Prerequisites before --write (idempotent): python3 prereq_1213.py REPO"""
import sys
R = sys.argv[1]
f = f'{R}/content/uk/082/1878-09-23.md'
s = open(f, encoding='utf-8').read()
if 'Para 082.0702 - footnote' in s:
    s = s.replace('Para 082.0702 - footnote', 'Para 082.0369 - footnote'); open(f, 'w', encoding='utf-8').write(s)
    print('prereq_1213: uk/082 stale RED citation 0702 -> 0369')

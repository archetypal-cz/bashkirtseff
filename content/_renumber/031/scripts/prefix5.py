"""prefix5.py REPO — before --write: a stale RSR reference «044.3803-3812» in 045/1875-10-02 (_original, fr) points
beyond carnet 044; the Gericke passage it means starts at 044.0212 (pre-rebuild ID; the rebuild rewrites it)."""
import sys
from pathlib import Path
R = Path(sys.argv[1])
for t in ('_original', 'fr', 'cz', 'uk', 'en'):
    f = R / 'content' / t / '045/1875-10-02.md'
    s = f.read_text()
    if '044.3803-3812' in s:
        f.write_text(s.replace('(see 044.3803-3812)', '(see 044.0212 ff.)').replace('044.3803-3812', '044.0212 ff.'))
        print('fixed', f.relative_to(R))

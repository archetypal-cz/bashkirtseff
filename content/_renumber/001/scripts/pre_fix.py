"""Before --write (repo root = argv[1]): split fr/013 013.0001's two-line embedded block into one
comment per line (the tool refuses set_french on a cluster with a multi-line block)."""
import sys
from pathlib import Path
f = Path(sys.argv[1]) / 'content/fr/013/1873-11-21.md'
s = f.read_text()
old = '%% # Vendredi 21 novembre 1873\nCarnet N° 13 %%\n'
new = '%% # Vendredi 21 novembre 1873 %%\n%% Carnet N° 13 %%\n'
assert s.count(old) == 1, 'fr/013 block not found'
f.write_text(s.replace(old, new)); print('fr/013 013.0001 block split')

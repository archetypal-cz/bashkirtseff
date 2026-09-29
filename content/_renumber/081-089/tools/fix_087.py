"""087 final plan: kind markers + (garbled double headings fixed post-apply). No new text, no renumbering."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fixlib_d import *
p = load('087')
kind(p, ['087.0104', '087.0105', '087.0106'], 'letter', 'Lettre de Marie Bashkirtseff à Alexandrine Pachtenko, 31 décembre 1879')
kind(p, ['087.0144', '087.0174', '087.0454', '087.0507', '087.0551'], 'rayé')
kind(p, ['087.0217', '087.0218', '087.0306'], 'margin')
# the garbled second heading lines (0393 0499 0618 0788) are removed by post_apply_d.py (no flag reset)
save(p, '087')

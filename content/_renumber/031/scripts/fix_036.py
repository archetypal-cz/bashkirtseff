"""Carnet 036 (Livre 36, 9–14 July 1875) — reviewer B. _original is complete; only a page-break fragment to drop."""
from fixlib5 import *

C = '036'


def fix(X):
    X.drop_new(C, 2833, "page-break fragment «sieur, voilà !» (¶2831 «Mon-» / ¶2833 «sieur»): 036.0059 already holds "
               "the whole sentence «… je suis fatiguée Monsieur, voilà !»")

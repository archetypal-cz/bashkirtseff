"""Carnet 033 (Livre 33, 16 May – 6 June 1875) — reviewer A decisions."""
from fixlib5 import *  # noqa: F401,F403

C = '033'


def _rep(X, d, old, new, why):
    n = X.get_new(C, d)['french']
    assert old in n, (d, old)
    X.edit_new(C, d, why, french=n.replace(old, new))


def _placeholder_order(X, c):
    """keep_placeholders() re-inserts consecutive text-less placeholder clusters after the same predecessor, which
    reverses their order (033.0301…0294). Restore ascending ID order within each run."""
    for e in X.P[c]['entries']:
        ps = e['paragraphs']
        i = 0
        while i < len(ps):
            j = i
            while j < len(ps) and 'old' in ps[j] and not ORIG[c].get(ps[j]['old'], {}).get('vis', ['x']):
                j += 1
            if j - i > 1:
                run = sorted(ps[i:j], key=lambda q: q['old'])
                if run != ps[i:j]:
                    ps[i:j] = run
                    log(c, 'kept', f"{e['file']}: placeholder clusters {run[0]['old']}–{run[-1]['old'][4:]} put back in ID order")
            i = max(j, i + 1)


def fix(X):
    _placeholder_order(X, C)

    # --- 18 May (docx ¶1124–1153, missing from _original) -----------------------------------
    t = X.get_new(C, 1124)['french']
    for a, b in [('prète pour', 'prête pour'), ('et qui donc 1 Ma propre tante', 'et qui donc ! Ma propre tante'),
                 ('soi-mème', 'soi-même')]:
        assert a in t, a
        t = t.replace(a, b)
    X.edit_new(C, 1124, 'OCR: «prète»→«prête», «1»→«!», «soi-mème»→«soi-même»', french=t)
    _rep(X, 1135, '*bestes.*', '*bestes*.', 'italic marker moved off the period')
    _rep(X, 1146, 'C est que', "C'est que", 'missing apostrophe (OCR)')

    # --- 31 May (docx ¶1522–1535, missing from _original) -----------------------------------
    _rep(X, 1523, 'a vue d œil', "à vue d'œil", 'OCR: lost accent and apostrophe')
    _rep(X, 1531, 'Giroflla', 'Girofla', 'OCR doubled letter')
    X.split_new(C, 1532, [('Bonsoir Mademoiselle', 1532), ('Bonsoir Monsieur.', 1533)],
                'two dialogue lines (two docx paragraphs)')

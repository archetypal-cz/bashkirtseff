"""Unit tests for the rebuild-plan drafting helpers. Run: just test-rebuild-plan"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import entry_order_key, grams, livre_number, norm, ocr_flags, para_text, parse_heading, visible_lines  # noqa: E402
from draft import guess_kind, typo_kind  # noqa: E402


def test_headings():
    h = parse_heading('Jeudi 1 1 Janvier 1 877', None)
    assert (h['date'], h['heading'], h['rest']) == ('1877-01-11', 'Jeudi 11 janvier 1877', '')
    h = parse_heading('Samedi 1 3 janvier Ier janvier 1877', (1877, 1, 12))
    assert (h['date'], h['heading']) == ('1877-01-13', 'Samedi 13 janvier 1877 (1er janvier)')
    h = parse_heading('Dimanche 3 septembre 1876 (22 août)', None)
    assert h['heading'] == 'Dimanche 3 septembre 1876 (22 août)' and h['rest'] == ''
    h = parse_heading('Jeudi 22 février 1877 Il pleut.', None)
    assert (h['date'], h['rest']) == ('1877-02-22', 'Il pleut.')
    h = parse_heading('Mardi 9 janvier î 877', None)
    assert h['date'] == '1877-01-09'
    h = parse_heading('Lundi 1 5 janvier', (1877, 1, 14))
    assert h['date'] == '1877-01-15' and 'year' in h['guessed']
    h = parse_heading('Jeudi 3 janvier 1877', None)  # 3 Jan 1877 was a Wednesday
    assert any(g.startswith('weekday') for g in h['guessed'])
    assert parse_heading("Mardi j'ai vu Visconti qui m'a dit que le 12 janvier il partirait pour Naples et que", None) is None
    assert parse_heading('Il fait beau.', None) is None


def test_livre_and_order():
    assert livre_number('Livre 68ème') == 68
    assert livre_number('Livre 6 8ème') == 68
    assert livre_number('Livre 4Qème') == 40
    assert livre_number('Livre Quatre') is None
    assert livre_number('Gloriae Cupiditas\n[Livre] 101') == 101
    assert livre_number('[Cahier n°] 102\ndepuis le …') == 102
    assert livre_number('Gloria Cupditas\n[Livre] 1 04') == 104
    assert livre_number('Gloriae Cupiditas\n[Livre ]105') == 105
    assert livre_number('[Livre 1 06]\ndepuis le 1er octobre') == 106
    assert livre_number('Gloriae [Rayé: Cupididate] Cupiditas\nLivre 75ème') == 75
    assert livre_number("Livre que j'ai lu hier chez Julian et qui m'a beaucoup plu, surtout la fin où il parle de 1880 et de l'avenir") is None
    assert livre_number('Je livre mes pensées') is None
    names = ['1878-10-04-evening.md', '1878-10-05.md', '1878-10-04.md', '1878-10-04-cover.md', '1878-10-04-05.md']
    assert sorted(names, key=entry_order_key) == ['1878-10-04-cover.md', '1878-10-04.md', '1878-10-04-05.md', '1878-10-04-evening.md', '1878-10-05.md']


def test_text():
    assert norm("L'Été 1 876, œuvre[^3]") == 'l ete 1876 oeuvre'
    assert len(grams('a b c d e')) == 2
    p = {'t': 'Il dit ça II!', 'runs': [['Il ', False], ['dit', True], [' ça II!', False]]}
    assert para_text(p) == 'Il *dit* ça !!!'
    assert 'letters and digits mixed' in ocr_flags('pagel 84 et 1ndemniser')
    lines = ['%% [#Nice](../_glossary/places/cities/NICE.md) %%', '# Lundi', 'Texte[^1].', '', '[^1]: Note.', '    suite', '%% 2026-01-01T10:00:00 RSR: x %%']
    assert visible_lines(lines) == ['# Lundi', 'Texte[^1].']


def test_kinds():
    assert guess_kind('[En travers: Avec des griffes !]')[0] == 'margin'
    assert guess_kind('[Rayé: tout ceci]')[0] == 'rayé'
    assert guess_kind('[Marie est passée de la page 184 à 185 mais rien ne semble manquer]')[0] == 'editorial'
    assert guess_kind('[page cancellée : p. 182 du manuscrit]')[0] == 'editorial'
    assert guess_kind('"Monsieur,')[0] == 'letter'
    assert guess_kind('[Elliminez.]')[0] == 'other'
    assert guess_kind('Il pleut.')[0] is None


def test_typography_kinds():
    class FakeTome:
        R = {1: {'caption': False}, 2: {'caption': True}, 3: {'caption': False}, 4: {'caption': False}}
        typo = {1: {'inset': {'page': 285, 'printed_page': 281, 'left': 19, 'right': 21, 'lines': 5}},
                3: {'in_picture': {'page': 80, 'printed_page': 79, 'frac': 1.0}}}
    k, why = typo_kind(FakeTome, [1], '«L’équipage à sensation a été celui de deux petites dames»')
    assert k == 'clipping' and 'both margins on printed p.281' in why
    assert typo_kind(FakeTome, [1], '"Monsieur,\nJe vous écris')[0] == 'letter'
    assert typo_kind(FakeTome, [2], 'PROGRAMMA')[1].startswith('set as a picture caption')
    assert 'picture region' in typo_kind(FakeTome, [3], 'Corsa')[1]
    assert typo_kind(FakeTome, [4], 'Il pleut.') == (None, '')


if __name__ == '__main__':
    n = 0
    for name, fn in list(globals().items()):
        if name.startswith('test_'):
            fn()
            n += 1
    print(f'{n} tests passed')

"""After --write: the 059 name list (new 059.0004) reuses the translations of old 059.0004-0011 (dropped 2026-09-28,
6b3ffd5c3^), minus the extraction's «- N» numbering. Replaces the tool's TODO in cz/uk/en; run from the repo root."""
from pathlib import Path
NAMES = {'cz': 'Belmonte Pandola Odescalchi Pizzardi Zucchini Cesaro Antonelli Angelini',
         'en': 'Belmonte Pandola Odescalchi Pizzardi Zucchini Cesaro Antonelli Angelini',
         'uk': 'Бельмонте Пандола Одескальки Піццарді Зуккіні Чезаро Антонеллі Анджеліні'}
for t, names in NAMES.items():
    f = Path(f'content/{t}/059/1876-04-20.md'); s = f.read_text()
    a = s.index('%% 059.0004 %%\n'); b = s.index('%% 059.0005 %%', a)
    blk = s[a:b]; assert blk.count('\nTODO\n') == 1, t
    f.write_text(s[:a] + blk.replace('\nTODO\n', '\n' + '\n'.join(names.split()) + '\n') + s[b:])
    print(t, 'filled')

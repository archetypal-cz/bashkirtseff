"""add_drawings.py REPO — after the 015–030 rebuild has been written into REPO:
cut the docx facsimile images to WebP and list them under `drawings:` in the _original entry frontmatter.
Anchors are computed from the final plans (new IDs = position in the plan's reading order)."""
import json, re, sys
from pathlib import Path
from PIL import Image, ImageOps

W = Path('/home/coder/rebuild-state/plan-tome0304')
REPO = Path(sys.argv[1])
PLANS = {p.stem[-3:]: json.load(open(p)) for p in sorted((W / 'final').glob('plan-0*.json'))}

# (tome, image n, docx ¶ of the picture, carnet, anchor override (old id / 'docx:N') or None, crop box or 'auto'/'full', caption, alt)
D = [
    ('03', 1, 250, '015', None, 'auto', "Croquis de Marie : une tête, le haut couvert de hachures",
     "Petit dessin à la plume : une tête dont le haut est rayé de hachures obliques, un trait horizontal à gauche"),
    ('03', 4, 1096, '017', '017.0030', (0, 0, 30, 51), "Croquis du terrain de la villa Carlone",
     "Petit rectangle tracé à la plume : la forme du terrain sans le lot cédé"),
    ('03', 5, 1111, '017', None, 'auto', "Petit plan tracé à la plume",
     "Deux rectangles accolés tracés à la plume, un trait oblique dans celui de droite"),
    ('03', 7, 1910, '018', None, 'auto', "Quatre têtes esquissées à la plume",
     "Quatre têtes griffonnées à la plume : deux de face, une de profil coiffée d'un bandeau, une coiffée d'un chapeau"),
    ('03', 9, 2354, '019', '019.0073', 'auto', "Visage rond dessiné à la plume",
     "Un cercle figurant un visage aux yeux mi-clos ; le nez et la bouche en quelques traits"),
    ('03', 19, 3069, '020', None, 'full', "Page de dessins : deux silhouettes, dont un homme coiffé d'un chapeau",
     "Page du carnet couverte d'un dessin à la plume : deux figures de profil, un homme en chapeau et une tête de femme, sur les lignes de la page"),
    ('03', 20, 3072, '020', None, 'full', "Page de dessins : une femme en robe, un diadème dans les cheveux, dans un ovale",
     "Page du carnet : une femme debout vue de profil, cheveux longs et diadème, en robe drapée, entourée d'un grand ovale tracé à la plume"),
    ('04', 9, 1873, '023', None, 'auto', "Plan griffonné : « le fragment de Bas. », « Basilewsky », « notre maison »",
     "Quelques traits de plume formant un plan des maisons voisines, annotés à la main : le fragment de Bas., Basilewsky, notre maison"),
    ('04', 17, 2592, '024', None, 'auto', "Tête griffonnée à la plume",
     "Une tête de face griffonnée à grands traits de plume"),
    ('04', 18, 2750, '024', '024.0418', 'auto', "Tête coiffée d'un chapeau, griffonnée à la plume",
     "Une tête coiffée d'un chapeau, le visage noirci de traits de plume"),
    ('04', 26, 3818, '024', 'docx:2533', 'full', "Page du manuscrit du 3 octobre 1874, barrée en travers",
     "Page manuscrite de Marie, écriture penchée barrée de longs traits obliques ; on lit notamment « duc de Hamilton », « Mon Dieu », « pardonnez-moi »"),
    ('04', 25, 3493, '027', '027.0233', 'auto', "Deux têtes coiffées de chapeaux",
     "Deux petites têtes dessinées à la plume : à gauche un profil coiffé d'un chapeau haut, à droite une tête griffonnée sous un chapeau"),
    ('04', 27, 3822, '028', '028.0110', 'auto', "Jeune femme en robe, de profil",
     "Dessin à la plume d'une jeune femme debout, de profil, cheveux relevés, en robe à corsage ajusté et jupe drapée, un ruban à la main"),
    ('04', 31, 4869, '030', None, 'auto', "Tête de femme au chapeau à plumes, de profil",
     "Dessin à la plume : profil de femme sous un grand chapeau garni de plumes, les cheveux en boucles"),
]


def new_ids(c):
    out = {}
    k = 0
    for e in PLANS[c]['entries']:
        for q in e['paragraphs']:
            k += 1
            nid = f'{c}.{k:04d}'
            out[nid] = (e['file'], q)
    return out


def anchor(c, tome, pic, ov):
    ids = new_ids(c)
    if ov and not ov.startswith('docx:'):
        for nid, (f, q) in ids.items():
            if q.get('old') == ov:
                return nid, f
        raise KeyError(ov)
    lim = int(ov[5:]) if ov else pic
    best = None
    for nid, (f, q) in ids.items():
        d = q.get('_docx')
        d = d[0] if isinstance(d, list) else d
        if d is not None and d != '?' and float(d) <= lim:
            best = (nid, f)
    return best


def cut(tome, n, box, out):
    im = Image.open(W / f'media{tome}' / f'image{n}.jpeg')
    if isinstance(box, tuple):
        im = im.crop(box)
    elif box == 'auto':
        g = ImageOps.grayscale(im)
        px = list(g.get_flattened_data()) if hasattr(g, 'get_flattened_data') else list(g.getdata())
        bg = sorted(px)[int(len(px) * 0.6)]
        mask = g.point(lambda v: 255 if v < bg - 60 else 0)
        bb = mask.getbbox()
        if bb:
            pad = 3
            im = im.crop((max(bb[0] - pad, 0), max(bb[1] - pad, 0), min(bb[2] + pad, im.width), min(bb[3] + pad, im.height)))
    im.thumbnail((1600, 1600))
    out.parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(out, 'WEBP', quality=88)
    return im.size, out.stat().st_size


def yaml_q(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


added = []
for tome, n, pic, c, ov, box, cap, alt in D:
    nid, f = anchor(c, tome, pic, ov)
    name = f'tome{tome}-img{n:02d}.webp'
    out = REPO / 'src/frontend/public/images/marie/drawings' / c / name
    size, nbytes = cut(tome, n, box, out)
    md = REPO / 'content/_original' / c / f
    s = md.read_text()
    m = re.match(r'---\n(.*?)\n---\n', s, re.S)
    fm = m.group(1)
    item = (f"  - src: /images/marie/drawings/{c}/{name}\n"
            f"    caption: {yaml_q(cap)}\n"
            f"    alt: {yaml_q(alt)}\n"
            f"    source: {yaml_q(f'Mon Journal, t. {int(tome)} (fac-similé) — tome{tome}.docx image {n} (après ¶{pic})')}\n"
            f"    paragraph: \"{nid}\"")
    if re.search(r'^drawings:', fm, re.M):
        fm = re.sub(r'^(drawings:\n(?:  .*\n?)*)', lambda mm: mm.group(1).rstrip('\n') + '\n' + item + '\n', fm + '\n', count=1, flags=re.M).rstrip('\n')
    else:
        fm = fm + '\ndrawings:\n' + item
    md.write_text('---\n' + fm + '\n---\n' + s[m.end():])
    added.append((c, f, nid, name, size, nbytes))
    print(f'{c}/{f} after {nid}: {name} {size[0]}x{size[1]} {nbytes // 1024} KB')
json.dump(added, open(W / 'drawings-added.json', 'w'), indent=1)

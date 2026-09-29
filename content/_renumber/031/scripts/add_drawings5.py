"""add_drawings.py REPO — after the 031–044 rebuild has been written into REPO:
cut the docx facsimile images to WebP and list them under `drawings:` in the _original entry frontmatter.
Anchors are computed from the final plans (new IDs = position in the plan's reading order)."""
import json, re, sys
from pathlib import Path
from PIL import Image, ImageOps

W = Path('/home/coder/rebuild-state/plan-tome05')
REPO = Path(sys.argv[1])
PLANS = {p.stem[-3:]: json.load(open(p)) for p in sorted((W / 'final').glob('plan-0*.json'))}

# (tome, image n, docx ¶ of the picture, carnet, anchor override (old id / 'docx:N') or None, crop box or 'auto'/'full', caption, alt)
D = [
    ('05', 1, 704, '032', None, 'auto', "Les armes de Marie, reçues de Russie, dessinées à la plume",
     "Petit écu dessiné à la plume : couronne et casque grillagé entre des lambrequins, une épée en fasce et une tour crénelée"),
    ('05', 2, 707, '032', None, 'auto', "Les armes de Marie avec ses ajouts : cinq étoiles et épis de blé",
     "Grand écu à la plume : casque grillagé sous une couronne et un panache, lambrequins, une épée en chef ; en pointe une tour crénelée entourée d'étoiles et d'épis"),
    ('05', 3, 2384, '035', 'docx:2382', 'auto', "Plan de la maison Gioia rêvée par Marie, avec ses légendes",
     "Plan griffonné à la plume : pièces rectangulaires annotées « salon Pompadour », « salon de satin rouge et cuir de Russie », « nord », « midi »"),
    ('05', 5, 2464, '035', None, 'auto', "Buste de femme en casaque à fraise de dentelle",
     "Dessin à la plume d'une jeune femme de face, cheveux relevés, une fraise de dentelle autour du cou, casaque ouverte devant"),
    ('05', 6, 2762, '035', None, 'auto', "Scène de promenade : une voiture, des passants en chapeau, un chien",
     "Dessin à la plume : à gauche une voiture couverte où sont assises deux personnes, un homme en chapeau debout, au centre un gros chien coiffé d'un chapeau, au fond des passants, à droite un homme portant une roue"),
    ('05', 7, 3585, '037', None, 'auto', "Page de la fin du Livre 37 : lignes barrées, une fleur et un profil",
     "Page griffonnée : plusieurs lignes d'écriture rayées de traits en chevrons, une petite fleur et un profil d'homme à droite"),
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

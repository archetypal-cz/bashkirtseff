"""Run after build16.py. (1) Livre 102 title-page reading notes (owner policy, handoff 2026-09-28 / APPLIER_BRIEF addenda:
Marie's own notes on title pages go in as `margin` paragraphs at the Livre's first entry). tome16.docx ¶741–749
(p.59: «Revue des deux Mondes / Conscience 15 octobre 1883 / … C'est Hobbes. / Tout homme comme moi…») become one
margin paragraph at the start of 102/1883-10-16.md, before the day's heading paragraph (they precede «Mardi 16 octobre
1883» on the page). The title formula (¶738–740: Gloriae Cupiditas / [Cahier n°] 102 / dates / address) stays
withdrawn. Straight quotes as in _original 101–106. Idempotent. Run after build16.py."""
import json, os
import lib16
HERE = os.path.dirname(os.path.abspath(__file__))
f = os.path.join(HERE, 'plan-102.json')
p = json.load(open(f))
e = p['entries'][0]
assert e['file'] == '1883-10-16.md'
if not any('Revue des deux Mondes' in json.dumps(x, ensure_ascii=False) for x in e['paragraphs']):
    t = '\n'.join(lib16.dtext(i) for i in range(741, 750))
    t = t.replace('’', "'").replace('“ ', '"').replace(' ”', '"').replace('“', '"').replace('”', '"')
    rsr = ("Marie's reading notes on the title page of Livre 102 (Revue des deux Mondes, 15 October 1883: «Conscience», "
           "Hartmann, Hobbes), tome16.docx ¶741–749, Mon Journal t.16 " + lib16.page(741, 749) + ". Restored in the "
           "2026-09-28 rebuild as a margin paragraph before the first entry's heading (owner policy: Marie's own "
           "title-page notes go in; the title formula ¶738–740 stays withdrawn).")
    e['paragraphs'].insert(0, {'new': {'kind': 'margin', 'source': 'notes de lecture de Marie sur la page de titre du Livre 102',
                                       'french': t, 'rsr': rsr}})
    json.dump(p, open(f, 'w'), ensure_ascii=False, indent=1)
    print('titlenotes16: 102 reading notes inserted')
else:
    print('titlenotes16: already present')
# The rebuild gives the new first paragraph the day's heading, so the heading leaves old 102.0001 (as 080.0001
# «Femme nue» carries 4 May's heading); postfix16.py moves the translated heading (headmoves, heading_only).
x1 = e['paragraphs'][1]
assert x1.get('old') == '102.0001'
if 'set_french' not in x1:
    t1 = lib16.old_text('102.0001').split('\n')
    assert t1[0] == '# Mardi 16 octobre 1883', t1[0]
    x1['set_french'] = '\n'.join(t1[1:])
    json.dump(p, open(f, 'w'), ensure_ascii=False, indent=1)
    print('titlenotes16: heading removed from 102.0001')
HM = os.path.join(HERE, 'headmoves.json')
hm = json.load(open(HM))
if not any(m['old'] == '102.0001' for m in hm['headmoves']):
    hm['headmoves'].append({'old': '102.0001', 'heading': 'Mardi 16 octobre 1883', 'heading_date': '1883-10-16',
                            'entry': '102/1883-10-16.md', 'first': False, 'heading_only': True})
    json.dump(hm, open(HM, 'w'), ensure_ascii=False, indent=1)
    print('titlenotes16: headmove 102.0001 added')

# (2) accentfix false positives: in 104.0210 and 105.0184 the only «accent lost» was a footnote label
# ([^felibres], [^declasse]); the words themselves carry their accents. Accenting the reference broke the
# label↔definition pair (verify-carnet footnotes FAIL). Drop the set_french and the RSR note.
import lib16 as L
NOTES = os.path.join(HERE, 'rsrnotes.json')
notes = json.load(open(NOTES))
for c, oid, a, b in (('104', '104.0210', '[^félibres]', '[^felibres]'), ('105', '105.0184', '[^déclassé]', '[^declasse]')):
    f = os.path.join(HERE, f'plan-{c}.json')
    p = json.load(open(f))
    for e in p['entries']:
        for x in e['paragraphs']:
            if x.get('old') == oid and 'set_french' in x:
                assert x['set_french'].replace(a, b) == L.old_text(oid), oid
                x.pop('set_french')
                json.dump(p, open(f, 'w'), ensure_ascii=False, indent=1)
                print(f'planfix16: {oid} label-only accent change dropped')
    notes.pop(oid, None)
json.dump(notes, open(NOTES, 'w'), ensure_ascii=False, indent=1)

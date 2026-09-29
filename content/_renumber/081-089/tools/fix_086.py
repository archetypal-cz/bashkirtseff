"""common/plan-086.json -> final/plan-086.json (worker C). See final/REVIEW-086.md."""
import re
from fixlib_c import Plan, newpara, WITHDRAW, EMPTY, DX, dtext

P = Plan('086')
ART = 'extraction artefact: no such text in the manuscript (tome13.docx)'

# --- Livre 86 title page: place lines ¶969–970 withdrawn; Livre 87 title-page index lines ¶1971–1973 withdrawn
P.remove_new(969, withdraw=True, why='Livre 86 title page: «Mardi 12 août 1879 à Dieppe / hôtel Bristol»')
P.remove_new(970, withdraw=True, why='Livre 86 title page: «Jeudi 4 septembre 1879 Paris»')
P.remove_new(1971, withdraw=True, why='Livre 87 title-page index lines (Dessin / peinture / médaille / prédiction)')

# --- 086.0089 back to 16 Aug (it is docx ¶1074, complete)
P.put('1879-08-16.md', {'old': '086.0089'}, after='086.0088')

# --- 8–9 Aug: the note «[Note: Ce contenu peut chevaucher…]» is not Marie's; 9 Aug has text (old 0035–0040)
P.drop('086.0026', ART + ' (an editor\'s note of the transcription)')
P.drop('086.0033', 'extraction artefact: 9 August has text in the manuscript (¶1007–1015, old 086.0035–0040)')
P.set_french('086.0047', P.old_text('086.0047').replace('[Nous rencontrons les Gavini, et nous]', '[Mots noircis: Nous rencontrons les Gavini, et nous]', 1), 'label as printed (¶1026)')

# --- 4/5 Sept: «Jeudi 4 septembre 1879» is a bare date line, then «Vendredi 5 septembre 1879»
P.set_french('086.0211', '# Vendredi 5 septembre 1879', 'merged 4/5 Sept heading split: 4 Sept is a bare date line (¶1234)')
P.move_old('086.0211', '1879-09-05.md', pos=0)

# --- 29 Sept / 30 Sept / 1 Oct: three date lines (printed p.102); text under 1 Oct
e = P.entry('1879-09-29.md')
P.replace_new(1403, newpara(1403, text=EMPTY, note='Date line «Lundi 29 septembre 1879» (three consecutive date lines, printed p.102).'))
P.add_entry('1879-09-30.md', '1879-09-30', 'Mardi 30 septembre 1879', [newpara(1403, text=EMPTY, note='Date line «Mardi 30 septembre 1879».')], frontmatter_from='1879-10-01.md')
P.add_entry('1879-10-01.md', '1879-10-01', 'Mercredi 1er octobre 1879')
P.set_french('086.0268', '# Mercredi 1er octobre 1879', 'heading-only cluster moved to its day (was stranded in 13 Sept)')
P.move_old('086.0268', '1879-10-01.md')
for i in ('086.0269', '086.0270', '086.0271', '086.0272', '086.0273'):
    P.move_old(i, '1879-10-01.md')
e['frontmatter_from'] = '1879-10-01.md'

# --- 1 Nov: «- Toussaint» is part of the date line (old 0400 has it)
P.remove_new(1565, why='«- Toussaint» belongs to the date line, already in old 086.0400')

# --- 19 Nov: «Mercredi19 novembre 1879» (¶1669) was not parsed as a date line
P.add_entry('1879-11-19.md', '1879-11-19', 'Mercredi 19 novembre 1879', frontmatter_from='1879-11-18.md')
P.set_french('086.0486', '# Mercredi 19 novembre 1879', 'label as printed (¶1669)')
P.move_old('086.0486', '1879-11-19.md')
P.move_old('086.0487', '1879-11-19.md')
x = P.take_new(1669)
P.put('1879-11-19.md', newpara(1670))
for para in (1671, 1675):
    P.put('1879-11-19.md', P.take_new(para))

# --- 13/14 Dec: «Dimanche 14 décembe 1879» (¶1820, printed misprint) was not parsed
x = P.take_new(1820)
P.put('1879-12-13.md', newpara(1819, text=EMPTY, note='Bare date line «Samedi 13 décembre 1879».'), pos=0)
e14 = P.add_entry('1879-12-14.md', '1879-12-14', 'Dimanche 14 décembre 1879', frontmatter_from='1879-12-03.md')
e14['paragraphs'].append(newpara(1821, 1824, note='The printed date line reads «Dimanche 14 décembe 1879» (misprint).'))
e13 = P.entry('1879-12-13.md')
for y in list(e13['paragraphs'][1:]):
    e13['paragraphs'].remove(y); e14['paragraphs'].append(y)

# --- placeholders «[Pas d'entrée…]» / «[Aucune entrée…]»
P.placeholders()

# --- kinds
P.kind_old('086.0173', 'margin')       # «[Annotation: 4 décembre 1879. …]»: Marie's own later note
P.kind_new(1369, 'editorial')
P.kind_new(1370, None)
P.kind_new(1895, None)                 # «- Mon cher Arnaud, permettez-moi…»: spoken at the fête (dialogue)

# --- OCR in new text
P.edit_new(1317, lambda s: re.sub(r'errare 96$', 'errare', s), 'page number 96 glued to the line')
P.edit_new(1292, lambda s: s.replace('découragée II Rien', 'découragée !! Rien'), 'OCR «II» = «!!»')
P.edit_new(1865, lambda s: re.sub(r'^_ ', '- ', s), 'OCR «_» = dialogue dash')

# --- accentless old clusters (11 files typed without accents)
for i in sorted(P.O):
    if not i.startswith('086.'): continue
    t = ' '.join(l for l in P.O[i][1] if not l.startswith('#'))
    if len(t) > 40 and not re.search('[éèêàâùûôîçÉÀ]', t):
        e, k = P.where_old(i)
        if e is not None and 'set_french' not in e['paragraphs'][k]:
            P.restore_accents(i, 966, 1974)

P.restore_labels(966, 1974)
P.set_french('086.0004', P.old_text('086.0004').replace("[qu'on est enmpoigné.]", "[Mots noircis: qu'on est enmpoigné.]"), 'label as printed (¶976)')
# accentless month in headings
for e in P.p['entries']:
    for x in e['paragraphs']:
        if 'old' not in x: continue
        t = x.get('set_french', P.old_text(x['old']))
        t2 = '\n'.join(re.sub(r'\bdecembre\b', 'décembre', l) if l.startswith('#') else l for l in t.split('\n'))
        if t2 != t: P.set_french(x['old'], t2, 'heading: décembre')

P.edit_new(1335, lambda s: s.replace("*Bombe à /'Amnistie*", "*Bombe à l'Amnistie*"), "OCR «/'Amnistie»")
P.edit_new(1865, lambda s: s.replace('rien, 139 vous', 'rien, vous'), 'page number 139 glued')
P.restore_inline_labels(966, 1974)
P.ocr_hyphens()
P.set_french('086.0441', next(x for e in P.p['entries'] for x in e['paragraphs'] if x.get('old') == '086.0441')['set_french'].replace('peignais corne je', 'peignais comme je'), 'OCR «corne» = «comme»')
P.typos([('bon gôut', 'bon goût'), ('étonnament', 'étonnamment'), ('présnet', 'présent'), ('faili la', 'failli la'),
         ('abslument', 'absolument'), ('deséspère', 'désespère'), ('plus suvie', 'plus suivie'), ('sa taile', 'sa taille'),
         ('apès avoir', 'après avoir'), ('moité par', 'moitié par'), ('huissieurs', 'huissiers'), ('très dôle', 'très drôle'),
         ("enmpoigné", "empoigné"), ('lui et et des', 'lui et des')], 966, 1974)
e14 = P.entry('1879-12-14.md')
e14['paragraphs'][0]['new']['rsr'] += " Printer's typo corrected: «décembe» → «décembre» in the date line (Mon Journal t.13 p.135)."
P.typo_list.append(('1879-12-14 heading', 'décembe', 'décembre', 'p.135'))
P.join_breaks()
P.save()

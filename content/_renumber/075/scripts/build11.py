"""Final rebuild plans for tome 11 (carnets 075–080), from the drafts in ../draft11.

Run: python3 build11.py  → plan-075.json … plan-080.json + build.log here.
Every edit below is a judgement recorded in REVIEW.md.
"""
from lib11 import *

CIT = 'printed-edition footnote (source citation of the 2005 transcription, «Ibid. p. N» / L\'Age d\'Homme edition), not in the manuscript; the printed edition\'s footnotes stay out (owner policy 2026-09-28)'
COVER = 'title page of the notebook (Livre heading, dates, address): cover pages are withdrawn (owner policy 2026-09-28); text kept in REVIEW.md «withdrawn cover pages»'

# ---------------------------------------------------------------- covers (all carnets)
for c in CARNETS:
    for e in list(plans[c]['entries']):
        if e['file'].endswith('-cover.md'):
            plans[c]['entries'].remove(e)
            for x in e['paragraphs']:
                note(f'{c} withdrawn cover: {x["new"]["rsr"][:60]} «{x["new"]["french"]}»')

def split_entry(c, first_key, fname, date, heading, frontmatter_from=None):
    """move first_key and everything after it in its entry into a new entry (inserted after it)."""
    cc, ei, pi = loc_old(first_key) if isinstance(first_key, str) else loc_new(first_key)
    assert cc == c
    e = plans[c]['entries'][ei]
    ne = {'file': fname, 'date': date, 'heading': heading, 'paragraphs': e['paragraphs'][pi:]}
    if frontmatter_from:
        ne['frontmatter_from'] = frontmatter_from
    e['paragraphs'] = e['paragraphs'][:pi]
    plans[c]['entries'].insert(ei + 1, ne)


# ================================================================ 075
drop_new(151, 'printed-edition footnote (source of the letter: Le Roy, L\'Age d\'Homme, p.10-12)')
drop_new(169, 'OCR artefact «O» (style Other) at a page break')
drop_new(233, 'continuation «se blague !» of the hyphenated «mauvai-/se» already complete in 075.0134')
# spurious cross-carnet short matches: the draft pulled 076.0146 / 077.0460 / 077.0498 / 077.0501 into 075
insert(mk_new(dtext(405), 405), after='076.0146')
replace_new_with_old(976, '076.0146')
insert(mk_new(dtext(717), 717), before='077.0501')
insert(mk_new(dtext(718), 718), after='077.0498')
insert(mk_new(dtext(735), 735), after='077.0460')
set_old('077.0460', set_french=None)
replace_new_with_old(1953, '077.0460')
move_old('077.0498', after='077.0497')
replace_new_with_old(1999, '077.0501')
drop_new(1955, 'same line as 077.0462 «— Oui.»')
# letters
letter(ids_range('075.0059', '075.0075'), 'Lettre de Paul de Cassagnac, [mercredi 19 septembre 1877]',
       fix={'075.0059': '> [Mercredi 19 septembre 1877]', '075.0075': '> 10^bis^ rue de Boulogne'})
letter(ids_range('075.0077', '075.0080'), 'Lettre de Marie à Paul de Cassagnac (copie), Wiesbaden, septembre 1877')
set_old('075.0081', kind='margin')
letter(['075.0448'], 'Billet de Marie à Marcuard, 28 octobre 1877')
letter(ids_range('075.0456', '075.0458'), 'Billet de Marcuard, 29 octobre 1877')
set_old('075.0293', kind=None)
set_old('075.0377', kind=None)
set_old('075.0261', kind='margin')
set_old('075.0318', kind='margin')
set_new(740, kind='margin')

# ================================================================ 076
def straight(s):
    return s.replace('’', "'")

move_old('076.0051', after='076.0050')
GORDI = 'Lettre de Michel Gordigiani, Florence, [automne 1877]'
insert(mk_new('Mademoiselle,', 831, extra='The docx reads «1 Mademoiselle,» (footnote mark).'), before=832)
set_new(834, french=dtext(834) + ' me rappeler au bon souvenir de Madame votre mère, et agréée [sic] Mademoiselle l’assurance de ma profonde considération.',
        rsr=rsr_for(834, extra='The end of the letter («me rappeler … considération.», «Votre dévoué,», «Michel Gordigiani») is printed at the top of p.51 but missing from the docx, where a library stamp on the scan was read as a picture (¶838); transcribed from the scan. The docx ¶835 «Ibid. p. 66» is a printed-edition footnote and is left out.'))
insert(mk_new('Votre dévoué,', 834, rsr='Restored from Mon Journal t.11 p.51 (scan only: missing from tome11.docx, masked by a library stamp; 2026-09-28 rebuild).'), after=834)
insert(mk_new('Michel Gordigiani', 834, rsr='Restored from Mon Journal t.11 p.51 (scan only: missing from tome11.docx, masked by a library stamp; 2026-09-28 rebuild). '), after=834)
# the two scan-only paragraphs were inserted after 834 in reverse order: fix the order
_c, _ei, _pi = loc_new(834)
_ps = plans[_c]['entries'][_ei]['paragraphs']
_ps[_pi + 1], _ps[_pi + 2] = _ps[_pi + 2], _ps[_pi + 1]
for _k in (_pi - 3, _pi - 2, _pi - 1, _pi, _pi + 1, _pi + 2):
    _x = _ps[_k]['new']
    _x['kind'] = 'letter'
    _x['source'] = GORDI
set_old('076.0098', kind=None)
set_old('076.0437', kind=None)
set_old('076.0439', kind=None)
set_new(936, kind='margin')
letter(ids_range('076.0391', '076.0398'), 'Lettre de F. de Marcuard, 12 décembre 1877', fix={'076.0391': '> Mercredi 12 décembre 1877'})
letter(['076.0431'], 'Billet de Marie à Blanc, 17 décembre 1877')
drop_old('076.0406', CIT)
set_old('076.0418', set_french=old_text('076.0418') + ' ' + straight(dtext(1312)))
drop_new(1312, 'continuation of 076.0418 across the page break (076.0418 completed with set_french)')
set_old('076.0478', kind='margin')
drop_new(1217, 'date line «Vendredi) 7 décembre 1877» (OCR «)»), already the heading of 076.0339')
split_entry('076', '076.0339', '1877-12-07.md', '1877-12-07', 'Vendredi 7 décembre 1877')
drop_old('077.0002', COVER)
drop_old('077.0003', COVER)

set_new(840, french=dtext(840).replace('Mots noiricis', 'Mots noircis'), rsr=rsr_for(840, extra='OCR «noiricis» corrected to «noircis» (printed p.51).'))
# 075 ¶406–407 are two paragraphs in the docx: the draft joined them because ¶406 has no final stop
set_new(406, french=dtext(406), rsr=rsr_for(406))
insert(mk_new(dtext(407), 407), after=406)

# ================================================================ 077
def joinlines(n):
    x = get(n)['new']
    x['french'] = x['french'].replace('\n', ' ')

drop_old('077.0001', CIT + '; its heading «Dimanche 23 décembre 1877» is 077.0005')
set_old('077.0005', set_french='# Dimanche 23 décembre 1877')
set_old('077.0006', set_french='Je lui répondrai un de ces jours.')
drop_new(1411, 'same line as 077.0006 (a «###### » heading in _original)')
for n in (1414, 1416, 1418, 1420, 1421, 1422):
    joinlines(n)
insert(mk_new(dtext(1417), 1417), after=1416)
insert(mk_new(dtext(1419), 1419), after=1418)
letter(['077.0007', '077.0008', 1414, 1415, 1416, 1417, 1418, 1419], 'Lettre de F. de Marcuard, Berne, 22 décembre 1877',
       fix={'077.0007': 'Berne 22 décembre 1877'})
set_new(1423, french=dtext(1423) + ' ' + dtext(1427), rsr=rsr_for(1423, 1427, extra='One sentence across a page break; ¶1424 «Ibid, p.112» is a printed-edition footnote and is left out.'))
drop_new(1424, 'printed-edition footnote')
drop_new(1427, 'second half of ¶1423 (joined)')
drop_new(1436, '«- Noël» belongs to the date line «Mardi 25 décembre 1877 - Noël» (heading restored in full)')
set_old(entry('077', '1877-12-25.md')['paragraphs'][0]['old'],
        set_french=old_text(entry('077', '1877-12-25.md')['paragraphs'][0]['old']).replace('# Mardi 25 décembre 1877', '# Mardi 25 décembre 1877 - Noël', 1))
entry('077', '1877-12-25.md')['heading'] = 'Mardi 25 décembre 1877 - Noël'
drop_new(1508, 'printed-edition footnote')
for i in ('077.0084', '077.0169', '077.0191', '077.0240', '077.0288', '077.0332', '077.0464'):
    drop_old(i, CIT)
set_old('077.0241', set_french="Cassagnac n'a pas répondu par le Figaro. Voici ce que nous lui récrivons:")
set_old('077.0243', set_french="J'ai répondu à Marcuard")
drop_new(1706, 'same line as 077.0241 (a «###### » heading in _original)')
drop_new(1708, 'same line as 077.0243 (a «###### » heading in _original)')
set_old('077.0105', kind=None)
letter(['077.0011', '077.0012'], 'Télégramme de Marie aux Suissesses, 24 décembre 1877')
letter(ids_range('077.0061', '077.0068'), 'Lettre de F. de Marcuard, Berne, 30 décembre 1877',
       fix={'077.0061': '> Berne 30 Décembre 1877 Chère Mademoiselle Marie'})
letter(ids_range('077.0088', '077.0090'), 'Lettre de Marie à F. de Marcuard, 2 janvier 1878')
letter(ids_range('077.0156', '077.0161'), 'Lettre de Paul de Cassagnac, [mercredi 9 janvier 1878]', fix={'077.0156': '> Mercredi [9 janvier 1878]'})
letter(ids_range('077.0163', '077.0167'), 'Lettre de Marie à Paul de Cassagnac, 10 janvier 1878')
letter(['077.0175'], 'Lettre anonyme des « cinq femmes » (Marie et ses amies) à Paul de Cassagnac, janvier 1878')
letter(ids_range('077.0182', '077.0185'), 'Billet de Paul de Cassagnac, samedi 12 janvier 1878',
       fix={'077.0182': 'Samedi 12 janvier 1878 Voici cinq billets Mademoiselle despote !'})
letter(ids_range('077.0227', '077.0237'), 'Lettre de F. de Marcuard, Menton, 12 janvier 1878', fix={'077.0228': '> Chère Mademoiselle'})
letter(['077.0242'], 'Lettre anonyme des « cinq femmes » à Paul de Cassagnac, 16 janvier 1878')
letter(ids_range('077.0244', '077.0252'), 'Lettre de Marie à F. de Marcuard, 16 janvier 1878',
       fix={'077.0244': "> Paris, avenue de l'Alma n° 67 A Monsieur de M..."})
letter(ids_range('077.0277', '077.0279'), 'Billet de Marie à Paul de Cassagnac, 18 janvier 1878')
letter(ids_range('077.0282', '077.0286'), 'Lettre de Paul de Cassagnac, [samedi 19 janvier 1878]', fix={'077.0282': '> [Samedi 19 jénvier 1878]'})
letter(['077.0289', '077.0290'], 'Dépêche de Marie à Paul de Cassagnac, 20 janvier 1878')
letter(['077.0318'], 'Lettre anonyme des « cinq femmes » à Paul de Cassagnac, 20 janvier 1878')
letter(ids_range('077.0323', '077.0331') + ids_range('077.0333', '077.0346'), 'Lettre de Paul de Cassagnac aux « cinq femmes », [jeudi 17 janvier 1878]',
       fix={'077.0323': 'Jeudi [17 Janvier 1878]'})
letter(ids_range('077.0359', '077.0363'), 'Lettre de Paul de Cassagnac aux « cinq femmes », janvier 1878')
letter(ids_range('077.0366', '077.0369'), 'Lettre anonyme des « cinq femmes » à Paul de Cassagnac, 23 janvier 1878')
set_old('077.0370', kind='other', source='annotation de Marie sur la copie de la lettre')
letter(ids_range('077.0394', '077.0397'), 'Lettre de Marie à Paul de Cassagnac, 24 janvier 1878')
letter(ids_range('077.0444', '077.0453'), 'Lettre de Paul de Cassagnac aux « cinq femmes », [vendredi 25 janvier 1878]',
       fix={'077.0444': "> [Vendredi 25 janvier 1878] C'est entendu ! à dimanche."})
letter(['077.0455', '077.0456'], 'Dépêche des « cinq femmes » à Paul de Cassagnac, 27 janvier 1878')
letter(ids_range('077.0569', '077.0572'), 'Lettre de Marie à Paul de Cassagnac, [vendredi 1er février 1878]')
for i in ('077.0004', '077.0613', '077.0614', '077.0615'):
    drop_old(i, COVER)
drop_old('077.0616', 'Bibliothèque nationale annotation on the title page of Livre 78 («les pages 63 à 68 ont été enlevées. Déficit constaté le 13 avril 1938»): not Marie\'s, withdrawn with the cover page; the gap itself stays marked by the editorial note 078.0283')

# ================================================================ 078
drop_new(2248, 'date line «Diamnche 10 février 1878» (OCR), not recognised by the draft: it opens the entry 1878-02-10 restored below')
split_entry('078', '078.0063', '1878-02-10.md', '1878-02-10', 'Dimanche 10 février 1878')
set_old('077.0617', set_french='# Dimanche 3 février 1878 - suite')
entry('078', '1878-02-03.md')['heading'] = 'Dimanche 3 février 1878 - suite'
set_old('077.0642', kind='margin')
for i in ('078.0023', '078.0027', '078.0037'):
    set_old(i, kind=None)
letter(['078.0074', '078.0075'], 'Lettre de Marie à Coulommiers (non envoyée), 10 février 1878')
drop_old('078.0202', CIT)
letter(ids_range('078.0197', '078.0201') + ids_range('078.0203', '078.0206'), 'Lettre de F. de Marcuard, Florence, 24 janvier 1878',
       fix={'078.0197': '> Florence 24 Janvier 1878 Chère Demoiselle,'})
set_old('078.0212', kind='margin')  # printed p.145 also lacks the opening bracket: kept as printed
letter(['078.0245', '078.0246'], 'Télégramme de F. de Marcuard, Florence, 20 février 1878',
       fix={'078.0245': '[Florence, Mercredi 20 février 1878, 6 h 45 mn. du soir] A Naples pas de carnaval public venez tout de suite écrirai.'})
for i in ('078.0248', '078.0262', '078.0275', '078.0350', '078.0388', '078.0447', '078.0561'):
    drop_old(i, CIT)
letter(ids_range('078.0255', '078.0259'), 'Lettre de F. de Marcuard, Florence, 20 février 1878',
       fix={'078.0255': '# Vendredi 22 février 1878\nFlorence, 20 février 1878 Chère Demoiselle,'})
letter(ids_range('078.0268', '078.0273'), 'Lettre de Marie à F. de Marcuard, [samedi 23 février 1878]',
       fix={'078.0268': '> [Samedi 23 février 1878]'})
# 078.0280 «# Dimanche 24 février 1878»: no such date line in the manuscript (printed pp.149–150); the heading goes (generic pass below)
letter(ids_range('078.0353', '078.0359'), 'Coupure de presse (Le Figaro ?), début mars 1878 : « Pourquoi M. de Cassagnac avait demandé le huis clos »',
       kind='clipping', fix={'078.0353': 'Pourquoi M. de Cassagnac avait demandé le huis clos'})
set_old('078.0360', set_french='> Voici le document en question :')
letter(['078.0360'] + ids_range('078.0361', '078.0372') + ids_range('078.0374', '078.0380'),
       'Coupure de presse (Le Figaro ?), début mars 1878 : « Pourquoi M. de Cassagnac avait demandé le huis clos »', kind='clipping',
       fix={'078.0360': 'Voici le document en question :'})
drop_new(2585, 'same line as 078.0360 (a «###### » heading in _original)')
set_old('078.0382', set_french="Marcuard m'écrit.")
drop_new(2611, 'same line as 078.0382 (a «###### » heading in _original)')
letter(ids_range('078.0383', '078.0387') + ids_range('078.0389', '078.0395'), 'Lettre de F. de Marcuard, Florence, [jeudi] 28 février 1878',
       fix={'078.0383': '> Florence [jeudi] 28 fév[rier] 1878 Chère demoiselle'})
letter(ids_range('078.0434', '078.0439'), 'Lettre de Marie à F. de Marcuard, [mars 1878]',
       fix={'078.0434': "> [sans date] [à M. F. de Marcuard] On vient de me voler mon chien blanc, Pincio, celui que vous avez vu chez nous. C'est horrible. Je crois qu'on l'a emmené de Paris; j'écris de tous côtés dans le cas où ces misérables viendraient à être attrapés par les âmes charitables auxquelles je m'adresse."})
letter(['078.0475', '078.0476'], 'Billet de Marie (à Paul de Cassagnac ?), 8 mars 1878')
letter(['078.0515', '078.0516'], 'Billet de Marie à une camarade d\'atelier («Cigale»), 12 mars 1878')
letter(['078.0559'], 'Billet de Marie à Paul de Cassagnac, [samedi 16 mars 1878]',
       fix={'078.0559': "> [Samedi 16 mars 1878] Traître, que dira Victorine ? Je cours la décommander mais je doute qu'elle se conserve jusqu'à samedi prochain."})
drop_old('078.0575', COVER)
drop_old('078.0576', COVER)

# ================================================================ 079
set_old('079.0052', kind='margin')
for i in ('079.0088', '079.0089', '079.0090'):
    set_old(i, kind='margin')
letter(ids_range('079.0106', '079.0109'), 'Billet de Paul de Cassagnac, [lundi 25 mars 1878]',
       fix={'079.0106': "> [Lundi 25 mars 1878] Voici, Chère Mademoiselle, les billets que vous m'avez demandés"})
letter(ids_range('079.0117', '079.0120'), 'Lettre de Marie à Paul de Cassagnac, 26 mars 1878')
drop_old('079.0130', CIT)
letter(ids_range('079.0124', '079.0129') + ids_range('079.0131', '079.0135'), 'Lettre de F. de Marcuard, Florence, [dimanche 24 mars 1878]',
       fix={'079.0124': '> Florence'})
letter(ids_range('079.0139', '079.0141'), 'Le Pays, fin mars 1878 (lignes non signées, attribuées par Marie à Cassagnac)', kind='clipping',
       fix={'079.0139': old_text('079.0139').replace("> ' La Chambre", '> La Chambre', 1)})
set_old('079.0153', kind='rayé')
letter(['079.0172', '079.0173'], 'Dépêche de Marie à F. de Marcuard (poisson d\'avril), 31 mars 1878')
letter(['079.0175', '079.0176'], 'Dépêche de F. de Marcuard, 31 mars 1878')
letter(['079.0177', '079.0178'], 'Dépêche de Marie à F. de Marcuard (poisson d\'avril), 31 mars 1878')
letter(['079.0219', '079.0220'], 'Dépêche de Marie à F. de Marcuard (poisson d\'avril), 1er avril 1878',
       fix={'079.0219': "Les quatre voyageuses sont quatre poissons d'avril."})
set_old('079.0225', kind='margin', set_french=old_text('079.0225').replace("[Entravers: j'oublie", "[En travers : J'oublie", 1))
letter(['079.0230', '079.0231'], 'Billet envoyé par Marie (écrit par sa tante) à Multedo, 3 avril 1878')
letter(ids_range('079.0233', '079.0235'), 'Billet anonyme des « cinq femmes » (écrit par la tante de Marie), 3 avril 1878')
letter(ids_range('079.0252', '079.0260'), 'Lettre d\'A. Multedo, Paris, 5 avril 1878', fix={'079.0252': '> Paris 36 rue du Colisée'})
set_old('079.0293', kind=None)
set_old('079.0299', kind=None)
set_old('079.0317', set_french="Voici l'article de Cassagnac :")
insert(mk_new("Je n'étais pas à Paris hier, et il m'était difficile de répondre à cette question de la France.", 3200,
              extra='Split off 079.0317 (Marie\'s «Voici l\'article de Cassagnac :» stays there); the docx reads «5 Voici…» (footnote mark).'), after='079.0317')
_c, _ei, _pi = loc_old('079.0317')
_newart = plans[_c]['entries'][_ei]['paragraphs'][_pi + 1]['new']
_newart['kind'] = 'clipping'; _newart['source'] = 'Le Pays, [avril 1878], article de Paul de Cassagnac'
letter(ids_range('079.0318', '079.0339'), 'Le Pays, [avril 1878], article de Paul de Cassagnac', kind='clipping')
drop_old('079.0341', CIT)
drop_old('079.0443', CIT)
letter(ids_range('079.0429', '079.0431'), 'Billet de Marie à A. Multedo, [15 avril 1878]')
letter(ids_range('079.0433', '079.0440'), 'Lettre d\'A. Multedo, lundi [15 avril 1878]', fix={'079.0433': '> Lundi [15 avril 1878] Mademoiselle,'})
letter(['079.0479', '079.0480'], 'Lettre anonyme de Marie au Pays (écriture déguisée), 17 avril 1878')
set_old('079.0491', kind='margin')
set_old('079.0529', kind='margin')
set_old('079.0604', kind='margin')
set_old('079.0605', kind='margin')
set_new(3440, kind='margin')
set_new(3502, kind='margin')
set_new(3469, kind=None, source=None)
set_new(3481, kind=None, source=None)
# 079.0519: its text («… en priant. C'est le vendredi saint des catholiques … aux Carmes … leitmotiv.») is in neither the tome
# nor the raw carnet nor the 1887 edition — an artefact of the first import (the RSR note of 2026-02-10 removed two more
# such paragraphs here). It takes the manuscript's first paragraph of 19 April (docx ¶3436) instead.
set_old('079.0519', set_french='# Vendredi 19 avril 1878\n' + straight(dtext(3436)))
drop_new(3436, 'now the text of 079.0519 (which held an unsourced paragraph)')
set_new(3477, french=dtext(3478), rsr=rsr_for(3478, extra='The date line reads «Dimanche 21 avril 1878 - Pâques».'))
entry('079', '1878-04-21.md')['heading'] = 'Dimanche 21 avril 1878 - Pâques'

# ================================================================ 080
for i in ('080.0006', '080.0007', '080.0008'):
    drop_old(i, COVER)
# owner decision 2026-09-28: Marie's «Annotation» on the Livre 80 title page (docx ¶3691–3692, p.233) stays, as a margin
# paragraph opening 4 May; the RSR note citing it is added to _original by postfix_headings_t11.py (plan paragraphs
# of kind old cannot carry one)
drop_old('080.0009', 'joined into 080.0010 (Marie\'s annotation on the Livre 80 title page, one margin paragraph; owner decision 2026-09-28)')
move_old('080.0010', before='080.0011')
set_old('080.0010', kind='margin', source='annotation de Marie sur la page de titre du Livre 80',
        set_french="Annotation :\nFemme nue, tête dans l'ombre cela en lumière pour Florence, loin d'une école de garçons vue de la mer, le pont.")
for i in ('080.0044', '080.0360', '080.0648', '080.0665'):
    set_old(i, kind=None)
set_old('080.0066', kind='editorial')
letter(ids_range('080.0203', '080.0207'), 'Lettre de Jeanne Suermondt, Halfweg, 14 mai 1878', fix={'080.0203': 'Halfweg 14 mai 1878 Ma chère Marie'})
for n in (3929, 4046, 4317):
    drop_new(n, 'printed-edition footnote')
letter(ids_range('080.0220', '080.0225'), 'Lettre anonyme de Marie à Paul de Cassagnac, [dimanche 19 mai 1878]')
set_old('080.0250', kind='margin')
letter(['080.0257', '080.0258'], 'Billet de Marie à Mme Yorke, 20 mai 1878')
letter(['080.0296', '080.0297'], 'Billet de Marie, 23 mai 1878')
for i in ids_range('080.0307', '080.0312'):
    set_old(i, kind='other', source="passage d'Alphonse Daudet, Le Nabab (1877), recopié par Marie")
set_old('080.0307', set_french=old_text('080.0307').replace('^2^ ', '', 1))
letter(ids_range('080.0484', '080.0486'), 'Le Figaro, [juin 1878], note sur la séance de la Chambre', kind='clipping',
       fix={'080.0484': '> M. Paul de Cassagnac prend la parole et demande à la Chambre de vouloir'})
letter(ids_range('080.0535', '080.0540'), 'Lettre d\'A. Multedo, Paris, samedi [8 juin 1878]',
       fix={'080.0535': '> Paris 36 rue du Colisée Samedi [8 juin 1878] Mademoiselle,'})
letter(ids_range('080.0541', '080.0546'), 'Lettre d\'A. de Valon, Chambre des députés, Versailles, 7 juin 1878')
letter(ids_range('080.0547', '080.0552') + ['080.0554'], 'Lettre du baron Haussmann, Paris, 7 juin 1878', fix={'080.0554': '> G.E. Haussmann'})
set_old('080.0562', kind='margin')
set_old('080.0585', kind='margin')
drop_new(4398, 'same line as 080.0618 «Seront pour toi.»')
letter(['080.0636', '080.0637'], 'Billet de Marie à Paul de Cassagnac (avec des dragées roses), 10 juin 1878')
letter(['080.0676', '080.0677'], 'Lettre de Marie à Paul de Cassagnac (projet), 13 juin 1878')
letter(['080.0716', '080.0717'], 'Carte anonyme de Marie à Paul de Cassagnac (lettres découpées dans un livre et collées), 16 juin 1878')
drop_old('080.0765', CIT)
letter(ids_range('080.0759', '080.0764') + ['080.0766'], 'Brouillons de lettres anonymes de Marie à Paul de Cassagnac, 19 juin 1878',
       fix={'080.0759': "S'il est vrai que vous ne faites qu'un marche vulgaire bourgeois indigne de vous."})
letter(['080.0768', '080.0769'], 'Lettre anonyme de Marie à Paul de Cassagnac, [mercredi 19 juin 1878]')
letter(ids_range('080.0781', '080.0784'), 'Lettre anonyme de Marie à Paul de Cassagnac, [jeudi 20 juin 1878]')
drop_old('080.0800', CIT)
letter(['080.0799'] + ids_range('080.0801', '080.0804'), 'Lettre anonyme de Marie à Paul de Cassagnac, signée « Suzanne au masque », juin 1878',
       fix={'080.0799': old_text('080.0799').replace('> ^7^ ', '> ', 1)})

# ================================================================ ID-less stubs of empty days → «[Aucun texte…]» entries of the same name
for c, f in (('077', '1878-01-19.md'), ('077', '1878-01-26.md'), ('078', '1878-02-25.md'), ('079', '1878-03-28.md'),
             ('079', '1878-04-27.md'), ('080', '1878-05-17.md'), ('080', '1878-05-22.md')):
    plans[c].setdefault('drop_files', []).append({'file': f, 'reason': 'empty stub (heading only, no paragraph IDs); the day is rebuilt from tome11.docx as a new entry of the same name with «[Aucun texte - date seule mentionnée]» (2026-09-28 rebuild)'})
    try:
        entry(c, f)['frontmatter_from'] = f
    except SystemExit:
        note(f'WARN {c}/{f}: no entry of that name in the plan')

# ================================================================ OCR: line-end hyphens left with a space in new text
for c in CARNETS:
    for e in plans[c]['entries']:
        for x in e['paragraphs']:
            if 'new' in x:
                t = x['new']['french']
                t2 = re.sub(r'\b(salon|peut|demi|après)- (supplément|être|teintes|midi)\b', r'\1-\2', t)
                if t2 != t:
                    x['new']['french'] = t2
                    note(f'OCR: hyphen-space joined in new {x["new"]["rsr"][23:40]}')

# ================================================================ typesetting typos of the printed edition and OCR slips in new text
# (owner 2026-09-28: correct print typos, citing the page; Marie's own oddities stay). Each checked on the scan.
TYPOS = [
    (715, 'par suprise', 'par surprise', 'print'), (830, 'Si cétait', 'Si c’était', 'print'),
    (1320, 'en môme]', 'en même]', 'ocr'), (1414, 'maintemant', 'maintenant', 'print'),
    (3440, 'cet homme I Dina', 'cet homme ! Dina', 'ocr'), (3440, 'confiance II Et', 'confiance !! Et', 'ocr'),
    (3440, 'e ncore.j', 'encore.]', 'print'), (3440, 'afrfeux', 'affreux', 'print'),
    (3445, 'Dieu II me', 'Dieu Il me', 'ocr'), (3446, 'pareil II ne', 'pareil Il ne', 'ocr'), (3508, 'Jl a', 'Il a', 'ocr'),
]
for n, a, b, why in TYPOS:
    x = get(n)['new']
    assert a in x['french'], (n, a)
    x['french'] = x['french'].replace(a, b, 1)
    what = 'Typesetting typo of the printed edition' if why == 'print' else 'OCR slip'
    x['rsr'] += f' {what} «{a}» corrected to «{b}» (Mon Journal t.11 {page(n)}).'
    note(f'{why} ¶{n}: «{a}» → «{b}»')

# ================================================================ generic: date headings inside old paragraphs
from common import parse_heading
HEADMOVES = []
for c in CARNETS:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'old' not in x:
                continue
            txt = x.get('set_french') or old_text(x['old'])
            lines = txt.split('\n')
            hl = [l for l in lines if l.startswith('#')]
            if not hl:
                continue
            h = hl[0].lstrip('#').strip()
            ph = parse_heading(h, None)
            ymd = '%04d-%02d-%02d' % tuple(ph['ymd']) if ph else None
            if k == 0 and ymd == e['date']:
                continue
            rest = '\n'.join(l for l in lines if not l.startswith('#'))
            if not rest.strip():
                note(f'WARN heading-only paragraph {x["old"]} «{h}» inside {c}/{e["file"]} (kept)')
                continue
            x['set_french'] = rest
            HEADMOVES.append({'old': x['old'], 'heading': h, 'heading_date': ymd, 'entry': f'{c}/{e["file"]}', 'first': k == 0})
            note(f'heading «{h}» removed from {x["old"]} (now in {c}/{e["file"]}, position {k})')
for c in CARNETS:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'old' in x and 'set_french' in x:
                oh = [l for l in old_text(x['old']).split('\n') if l.startswith('#')]
                nh = [l for l in x['set_french'].split('\n') if l.startswith('#')]
                if oh and not nh and not any(m['old'] == x['old'] for m in HEADMOVES):
                    h = oh[0].lstrip('#').strip(); ph = parse_heading(h, None)
                    HEADMOVES.append({'old': x['old'], 'heading': h, 'heading_date': '%04d-%02d-%02d' % tuple(ph['ymd']) if ph else None,
                                      'entry': f'{c}/{e["file"]}', 'first': k == 0})
                    note(f'heading «{h}» removed from {x["old"]} by a fix (now in {c}/{e["file"]}, position {k})')
for m in HEADMOVES:
    x = get(m['old'])
    m['heading_only'] = '\n'.join(l for l in old_text(m['old']).split('\n') if not l.startswith('#')) == x.get('set_french')
json.dump(HEADMOVES, open(os.path.join(HERE, 'headmoves.json'), 'w'), ensure_ascii=False, indent=1)

# ================================================================ headings: since d08a2fb03 set_french is the paragraph's WHOLE French,
# «#» lines included (a heading it leaves out is removed, one it repeats is not doubled). Normalise every
# set_french to exactly the lines wanted; HEADFIX only documents the heading changes (for the translations).
HEADFIX = []
for c in CARNETS:
    for e in plans[c]['entries']:
        for k, x in enumerate(e['paragraphs']):
            if 'old' not in x or 'set_french' not in x:
                continue
            ol = old_text(x['old']).split('\n')
            oh = [l for l in ol if l.startswith('#')]
            nl = x['set_french'].split('\n')
            nh = [l for l in nl if l.startswith('#')]
            body = [l for l in nl if not l.startswith('#')]
            if not oh:
                continue  # 077.0617: a plain date line that becomes the heading
            assert len(oh) == 1, x['old']
            if oh[0].startswith('###### '):
                want = nh + body if nh else body            # «###### X» → «# X» or the plain line X
            elif nh:
                want = nh + body                             # kept (same) or changed heading
            elif k == 0 and e.get('heading') and x['old'] not in [m['old'] for m in HEADMOVES if not m.get('first')]:
                want = ['# ' + e['heading']] + body          # the entry's own date replaces a moved-away heading
            else:
                want = body                                  # heading removed (its day is elsewhere)
            wh = [l for l in want if l.startswith('#')]
            if wh != oh:
                HEADFIX.append({'old': x['old'], 'from': oh[0], 'to': (wh or [None])[0] if not oh[0].startswith('###### ') else want[0]})
                note(f'HEADFIX {x["old"]}: «{oh[0]}» → «{HEADFIX[-1]["to"]}»')
            if want == ol:
                x.pop('set_french')
            else:
                x['set_french'] = '\n'.join(want)
json.dump({'headmoves': HEADMOVES, 'headfix': HEADFIX}, open(os.path.join(HERE, 'headmoves.json'), 'w'), ensure_ascii=False, indent=1)

# ================================================================ old text: printed typesetting typos and accents lost at import
# (owner 2026-09-28: the printed edition's obvious typesetting typos are corrected, citing the page; Marie's own
# spellings stay). Candidates from typos11.py (words found once in _original, one edit from a common word), each
# checked against tome11.docx (the same misprint must be there, i.e. printed so). Kept as possibly the writer's own:
# single/double-consonant and accent variants (jouisances, poura, adrese, ravisante, défence …), names (Francheschi,
# Lancastre [sic], Dinaa), grammar (recevrons), and forms with an unclear reading («por hini», «ches nous»).
from common import para_text as _pt
TYPOS_OLD = [('075.0226', 'propes', 'propres'), ('075.0443', '[Mot noiric:', '[Mot noirci:'), ('076.0001', 'auxqelles', 'auxquelles'),
             ('076.0164', 'avàis', 'avais'), ('076.0414', 'abominale', 'abominable'), ('077.0175', 'vore détestable', 'votre détestable'),
             ('077.0246', 'vendrdi', 'vendredi'), ('077.0249', 'diit-on', 'dit-on'), ('077.0282', 'jénvier', 'janvier'),
             ('077.0393', 'contine', 'continue'), ('077.0487', 'pemière', 'première'), ('078.0168', 'viendait', 'viendrait'),
             ('078.0200', 'Torionia', 'Torlonia'), ('078.0203', 'existence teme', 'existence terne'), ('078.0363', "l'avient", "l'avaient"),
             ('078.0380', 'prevue', 'preuve'), ('078.0474', 'simplements', 'simplement'), ('079.0059', 'assité', 'assisté'),
             ('079.0076', 'aumusant', 'amusant'), ('079.0127', "l'orignal", "l'original"), ('079.0146', 'commmencent', 'commencent'),
             ('079.0342', 'cinquane', 'cinquante'), ('079.0480', 'Failtes', 'Faites'), ('079.0552', 'apppuyerai', 'appuyerai'),
             ('080.0043', 'aves Schaeppi', 'avec Schaeppi'), ('080.0167', 'seulemet', 'seulement'), ('080.0307', 'visà-vis', 'vis-à-vis'),
             ('080.0353', 'pendans', 'pendant'), ('080.0540', 'Multdo', 'Multedo'), ('080.0588', 'étànt', 'étant')]
COV11 = json.load(open(os.path.join(HERE, 'cover11.json')))
RSRNOTES = {}
for oid, a, b in TYPOS_OLD:
    try:
        x = get(oid)
    except SystemExit:
        note(f'WARN typo {oid}: paragraph not in the plans (dropped)'); continue
    cur = x.get('set_french') or old_text(oid)
    docx = COV11.get(oid, {}).get('docx') or []
    dt = ' '.join(_pt(P[i]) for i in docx)
    if a not in cur or a.split()[-1].replace('[', '') not in dt.replace('’', "'"):
        note(f'WARN typo {oid}: «{a}» not in the text or not in the docx {docx} — left'); continue
    x['set_french'] = cur.replace(a, b, 1)
    pg = page(docx[0], docx[-1])
    RSRNOTES.setdefault(oid, []).append(f'typesetting typo of the printed edition «{a}» corrected to «{b}» (tome11.docx ¶{docx[0]}' + (f', Mon Journal t.11 {pg}' if pg else '') + ')')
    note(f'typo {oid}: «{a}» → «{b}»')
import accentfix11
for c in CARNETS:
    for e in plans[c]['entries']:
        for x in e['paragraphs']:
            if 'old' not in x or x['old'] in {'076.0164', '080.0588'}:   # the docx has the misprints «avàis», «étànt» corrected above
                continue
            r = accentfix11.R.get(x['old'])
            if not r or not r['docx']:
                continue
            cur = x.get('set_french') or old_text(x['old'])
            new, ch = accentfix11.fix(cur, r['docx'])
            if ch:
                x['set_french'] = new
                pg = page(r['docx'][0], r['docx'][-1])
                RSRNOTES.setdefault(x['old'], []).append('accents lost at import restored from the printed text (' + ', '.join(f'«{a}» → «{b}»' for a, b in ch) + f'; tome11.docx ¶{r["docx"][0]}' + (f', Mon Journal t.11 {pg}' if pg else '') + ')')
                note(f'accents {x["old"]}: {ch}')

if __name__ == '__main__':
    json.dump(RSRNOTES, open(os.path.join(HERE, 'rsrnotes.json'), 'w'), ensure_ascii=False, indent=1)
    write(HERE)
